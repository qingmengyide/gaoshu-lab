import unittest
import sympy as s
from engine import InputError, SYMBOLS, calculate, parse
from server import run_calculation


class CalculusTests(unittest.TestCase):
    def calc(self, mode, expression, **params):
        return calculate({'mode': mode, 'expression': expression, **params})

    def test_derivative(self):
        x = SYMBOLS['x']
        result = self.calc('derivative', 'x^3-3*x+sin(x)')
        self.assertEqual(result['text'], str(3*x**2+s.cos(x)-3))
        self.assertEqual(len(result['plot']), 601)
        self.assertEqual(len(result['overlay']), 601)

    def test_partial_derivative(self):
        result = self.calc('derivative', 'sin(x*y)', variable='y')
        self.assertEqual(result['text'], 'x*cos(x*y)')
        self.assertEqual(result['plot'], [])

    def test_second_derivative(self):
        self.assertEqual(self.calc('derivative', 'x^4', order=2)['text'], '12*x**2')

    def test_antiderivative(self):
        self.assertEqual(self.calc('integral', 'x^2')['text'], 'x**3/3 + C')

    def test_definite_integral(self):
        self.assertEqual(self.calc('integral', 'sin(x)', definite=True, lower='0', upper='pi')['text'], '2')

    def test_convergent_improper_integral(self):
        self.assertEqual(self.calc('integral', 'exp(-x)', definite=True, lower='0', upper='oo')['text'], '1')

    def test_internal_pole_not_principal_value(self):
        with self.assertRaises(InputError):
            self.calc('integral', '1/x^2', definite=True, lower='-1', upper='1')

    def test_limit_and_infinity(self):
        self.assertEqual(self.calc('limit', 'sin(x)/x')['text'], '1')
        self.assertEqual(self.calc('limit', '(1+1/x)^x', point='oo')['text'], 'E')

    def test_two_sided_limit(self):
        result = self.calc('limit', '1/x', point='0')
        self.assertEqual(result['text'], '双侧极限不存在')
        self.assertEqual(self.calc('limit', '1/x', point='0', direction='+')['text'], 'oo')

    def test_series(self):
        self.assertEqual(self.calc('series', 'sin(x)', order=6)['text'], 'x - x**3/6 + x**5/120 + O(x**6)')

    def test_roots_and_empty_set(self):
        self.assertEqual(self.calc('solve', 'x^3-6*x^2+11*x-6')['text'], '{1, 2, 3}')
        self.assertEqual(self.calc('solve', 'x^2+1')['text'], 'EmptySet')

    def test_matrix(self):
        self.assertEqual(self.calc('matrix', '1,2;3,4')['text'], '-2')
        self.assertEqual(self.calc('matrix', '1,2;3,4', matrixOperation='inverse')['text'], 'Matrix([[-2, 1], [3/2, -1/2]])')
        self.assertEqual(self.calc('matrix', '1,2;2,4', matrixOperation='rank')['text'], '1')
        with self.assertRaises(InputError):
            self.calc('matrix', '1,2;2,4', matrixOperation='inverse')

    def test_plot_discontinuity_and_domain(self):
        result = self.calc('plot', '1/x')
        self.assertIsNone(result['plot'][300][1])
        result = self.calc('plot', 'sqrt(x)')
        self.assertIsNone(result['plot'][0][1])
        self.assertEqual(result['plot'][-1][1], 5**.5)

    def test_exact_decimals(self):
        self.assertEqual(parse('0.1+0.2'), s.Rational(3, 10))

    def test_block_code_and_resource_abuse(self):
        attacks = ["__import__('os').system('echo unsafe')", 'x.__class__',
                   '[x for x in range(5)]', 'open(1)', 'lambda:1', '9^9999',
                   '2^(2^100)', '1/0', 'sin(x, y)', 'True', 'x[0]', '10^1000',
                   '1e100', 'f(x)', 'a+1']
        for attack in attacks:
            with self.subTest(attack=attack), self.assertRaises(InputError):
                parse(attack)

    def test_invalid_parameters(self):
        for params in ({'order': 0}, {'order': 1.5}, {'order': 99}, {'variable': '__class__'}, {'plotMin': '6', 'plotMax': '5'}):
            with self.subTest(params=params), self.assertRaises(InputError):
                self.calc('derivative', 'x^2', **params)

    def test_worker_roundtrip_and_validation(self):
        code, result = run_calculation({'mode': 'limit', 'expression': 'sin(x)/x'})
        self.assertEqual(code, 200)
        self.assertEqual(result['text'], '1')
        code, result = run_calculation({'expression': 'x.__class__'})
        self.assertEqual(code, 400)
        self.assertIn('error', result)

    def test_worker_timeout(self):
        code, result = run_calculation({'expression': 'x'}, timeout=.001)
        self.assertEqual(code, 408)


if __name__ == '__main__':
    unittest.main()
