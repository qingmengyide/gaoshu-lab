"""A bounded symbolic calculator. User strings are never passed to eval/sympify."""
import ast
import math
import operator
import sympy as s

SYMBOLS = {name: s.Symbol(name, real=True) for name in ('x', 'y', 'z', 't')}
NAMES = {**SYMBOLS, 'pi': s.pi, 'e': s.E, 'E': s.E, 'oo': s.oo}
FUNCTIONS = {name: getattr(s, name) for name in (
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
    'exp', 'log', 'sqrt', 'Abs')}
FUNCTIONS.update(ln=s.log, abs=s.Abs)
OPS = {ast.Add: operator.add, ast.Sub: operator.sub,
       ast.Mult: operator.mul, ast.Div: operator.truediv}


class InputError(ValueError):
    pass


def parse(text):
    if not isinstance(text, str) or not text.strip() or len(text) > 240:
        raise InputError('请输入 1–240 个字符的数学表达式。')
    text = text.replace('^', '**').replace('π', 'pi').replace('∞', 'oo').replace('−', '-')
    try:
        tree = ast.parse(text.strip(), mode='eval')
    except (SyntaxError, RecursionError):
        raise InputError('表达式格式有误；乘法请写 *，例如 2*x。') from None
    if len(list(ast.walk(tree))) > 120:
        raise InputError('表达式过于复杂，请拆分计算。')

    def visit(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            if not math.isfinite(node.value) or abs(node.value) > 10**12:
                raise InputError('数字必须有限且绝对值不超过 10^12。')
            return s.Rational(str(node.value))
        if isinstance(node, ast.Name) and node.id in NAMES:
            return NAMES[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = visit(node.operand)
            return -value if isinstance(node.op, ast.USub) else value
        if isinstance(node, ast.BinOp):
            left, right = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Pow):
                if right.is_number:
                    if right.is_real is not True or abs(right) > 1000:
                        raise InputError('指数绝对值不能超过 1000。')
                    if left.is_number and (abs(right) > 100 or abs(left) > 10**12):
                        raise InputError('数值乘方过大，请缩小指数或底数。')
                return left ** right
            if type(node.op) in OPS:
                if isinstance(node.op, ast.Div) and right == 0:
                    raise InputError('除数不能为零。')
                return OPS[type(node.op)](left, right)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            if node.func.id in FUNCTIONS and len(node.args) == 1 and not node.keywords:
                return FUNCTIONS[node.func.id](visit(node.args[0]))
        raise InputError('仅支持数学运算、x/y/z/t 和常用函数；不支持代码或属性访问。')

    try:
        value = visit(tree.body)
    except (TypeError, ZeroDivisionError, OverflowError):
        raise InputError('表达式在实数或符号范围内无效。') from None
    if value.has(s.zoo, s.nan):
        raise InputError('表达式未定义，请检查分母和函数定义域。')
    return value


def integer(data, key, default, low, high):
    value = data.get(key, default)
    if isinstance(value, bool):
        raise InputError('阶数必须为整数。')
    try:
        number = int(value)
        if float(value) != number or not low <= number <= high:
            raise ValueError
        return number
    except (TypeError, ValueError, OverflowError):
        raise InputError(f'{key} 必须为 {low}–{high} 之间的整数。') from None


def constant(text, finite=False):
    value = parse(text)
    if value.free_symbols or value.is_extended_real is not True:
        raise InputError('此处需要实数常量，可使用 pi、e、oo。')
    if finite and value.is_finite is not True:
        raise InputError('此处需要有限实数。')
    return value


def plot_points(expr, variable, low, high):
    if expr.free_symbols - {variable} or expr.has(s.Integral, s.Derivative, s.Order):
        return []
    try:
        fn = s.lambdify(variable, expr, modules='math', cse=True)
    except Exception:
        return []
    points = []
    for i in range(601):
        x = low + (high - low) * i / 600
        try:
            y = float(fn(x))
            if not math.isfinite(y) or abs(y) > 1e6:
                y = None
        except (ValueError, TypeError, ZeroDivisionError, OverflowError, NameError):
            y = None
        points.append([round(x, 9), y])
    return points


def calculate(data):
    if not isinstance(data, dict):
        raise InputError('请求必须是 JSON 对象。')
    mode = data.get('mode', 'derivative')
    var_name = data.get('variable', 'x')
    if var_name not in SYMBOLS:
        raise InputError('变量仅支持 x、y、z、t。')
    x = SYMBOLS[var_name]
    notes, steps = [], []
    if mode == 'matrix':
        raw = data.get('expression', '')
        if not isinstance(raw, str) or len(raw) > 600:
            raise InputError('矩阵输入过长。')
        rows = [row.strip() for row in raw.strip().split(';')]
        cells = [row.split(',') for row in rows]
        if not 1 <= len(cells) <= 5 or not 1 <= len(cells[0]) <= 5 or any(len(r) != len(cells[0]) for r in cells):
            raise InputError('矩阵最多 5×5；同一行用逗号分隔，各行用分号分隔。')
        matrix = s.Matrix([[parse(v) for v in row] for row in cells])
        operation = data.get('matrixOperation', 'det')
        if operation in ('det', 'inverse') and matrix.rows != matrix.cols:
            raise InputError('行列式和逆矩阵需要方阵。')
        if operation == 'det':
            result = matrix.det()
        elif operation == 'inverse':
            if matrix.det() == 0:
                raise InputError('此矩阵为奇异矩阵，不存在逆矩阵。')
            result = matrix.inv()
        elif operation == 'rref':
            result, pivots = matrix.rref()
            notes.append('主元列（从 1 开始）：' + ', '.join(str(i + 1) for i in pivots))
        elif operation == 'rank':
            result = s.Integer(matrix.rank())
        else:
            raise InputError('不支持的矩阵运算。')
        return {'inputLatex': s.latex(matrix), 'latex': s.latex(result),
                'text': str(result), 'approx': '', 'notes': notes,
                'steps': [{'label': '输入矩阵', 'latex': s.latex(matrix)},
                          {'label': '精确计算结果', 'latex': s.latex(result)}],
                'plot': [], 'overlay': [], 'mode': mode}
    expr = parse(data.get('expression', ''))
    steps.append({'label': '识别表达式', 'latex': s.latex(expr)})
    display_suffix = ''
    overlay = None
    if mode == 'derivative':
        order = integer(data, 'order', 1, 1, 8)
        result = s.diff(expr, x, order)
        steps.append({'label': f'对 {var_name} 求 {order} 阶导数（其余变量视为常量）',
                      'latex': s.latex(s.Derivative(expr, (x, order), evaluate=False))})
        overlay = result
    elif mode == 'integral':
        if data.get('definite', False):
            a, b = constant(data.get('lower', '0')), constant(data.get('upper', '1'))
            # Standard improper integrals cannot cross a pole. SymPy may otherwise
            # return a Cauchy principal value, e.g. integrate(1/x, (-1, 1)) == nan.
            from sympy.calculus.singularities import singularities
            if a != b:
                poles = singularities(expr, x, domain=s.S.Reals)
                inside = poles.intersect(s.Interval.open(s.Min(a, b), s.Max(a, b)))
                if inside.is_empty is not True:
                    raise InputError('积分区间内部可能存在奇点，请在奇点处拆分为单侧反常积分。')
            result = s.integrate(expr, (x, a, b))
            steps.append({'label': '按积分上下限计算（反常积分按收敛性处理）',
                          'latex': s.latex(s.Integral(expr, (x, a, b)))})
        else:
            result = s.integrate(expr, x)
            display_suffix = ' + C'
            notes.append('C 为任意常数；原函数适用于相应连续定义区间。')
            steps.append({'label': '求原函数', 'latex': s.latex(s.Integral(expr, x))})
        if result.has(s.Integral):
            notes.append('未求得闭式原函数，保留未计算的积分表达式。')
    elif mode == 'limit':
        point = constant(data.get('point', '0'))
        direction = data.get('direction', 'both')
        if direction not in ('both', '+', '-'):
            raise InputError('请选择双侧、左侧或右侧极限。')
        if direction == 'both' and point.is_finite:
            left, right = s.limit(expr, x, point, dir='-'), s.limit(expr, x, point, dir='+')
            steps.extend([{'label': '左极限', 'latex': s.latex(left)},
                          {'label': '右极限', 'latex': s.latex(right)}])
            if left != right:
                return {'inputLatex': s.latex(expr), 'latex': r'\text{双侧极限不存在}',
                        'text': '双侧极限不存在', 'approx': '', 'steps': steps,
                        'notes': ['左、右极限不相等。'], 'plot': [], 'overlay': [], 'mode': mode}
            result = right
        else:
            result = s.limit(expr, x, point, dir='+' if direction == 'both' else direction)
        if result.has(s.Limit):
            notes.append('未能确定此极限，保留极限表达式。')
    elif mode == 'series':
        point = constant(data.get('point', '0'), finite=True)
        order = integer(data, 'order', 6, 1, 12)
        result = s.series(expr, x, point, order)
        overlay = result.removeO()
        steps.append({'label': f'在 {var_name} = {point} 处展开，保留到 {order - 1} 次幂',
                      'latex': s.latex(result)})
        notes.append('级数展开可能为 Laurent 级数；图像中的多项式近似仅在展开点附近有效。')
    elif mode == 'solve':
        result = s.solveset(expr, x, domain=s.S.Reals)
        steps.append({'label': '求实数域上的解集', 'latex': s.latex(s.Eq(expr, 0, evaluate=False))})
        if result.has(s.ConditionSet):
            notes.append('未获得显式解集，以下为条件解集。')
    elif mode == 'simplify':
        result = s.simplify(expr)
    elif mode == 'plot':
        result = expr
    else:
        raise InputError('不支持的计算类型。')
    if result.has(s.nan, s.zoo):
        raise InputError('结果未定义，或反常积分不收敛。请检查定义域。')
    if result.has(s.oo, -s.oo):
        notes.append('结果包含无穷大；若为积分，表示未收敛为有限值。')
    latex = s.latex(result) + display_suffix
    steps.append({'label': '得到结果', 'latex': latex})
    approx = ''
    if getattr(result, 'is_number', False) and result.is_finite and not result.is_Integer:
        approx = str(s.N(result, 12))
    low = float(constant(str(data.get('plotMin', '-5')), finite=True))
    high = float(constant(str(data.get('plotMax', '5')), finite=True))
    if not -1000 <= low < high <= 1000 or high - low < 0.01:
        raise InputError('绘图区间需要满足 -1000 ≤ 左端 < 右端 ≤ 1000，宽度至少 0.01。')
    points = plot_points(expr, x, low, high)
    return {'inputLatex': s.latex(expr), 'latex': latex,
            'text': str(result) + display_suffix, 'approx': approx,
            'notes': notes, 'steps': steps, 'plot': points,
            'overlay': plot_points(overlay, x, low, high) if overlay is not None else [],
            'mode': mode}
