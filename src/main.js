import katex from 'katex';
import 'katex/dist/katex.min.css';
import { createIcons, Spline, Sigma, MoveRight, ListOrdered, Equal, Grid2x2,
  WandSparkles, ChartSpline, History, BookOpen, ArrowUpRight, Github,
  CircleHelp, Sparkles, ArrowUpLeft, Download, Plus, Minus, ArrowRight,
  MousePointer2, X, Trash2, LoaderCircle, Copy, Braces, Info, ChevronDown,
  CircleAlert } from 'lucide';
import './style.css';

const icons = { Spline, Sigma, MoveRight, ListOrdered, Equal, Grid2x2,
  WandSparkles, ChartSpline, History, BookOpen, ArrowUpRight, Github,
  CircleHelp, Sparkles, ArrowUpLeft, Download, Plus, Minus, ArrowRight,
  MousePointer2, X, Trash2, LoaderCircle, Copy, Braces, Info, ChevronDown,
  CircleAlert };

const modes = [
  { id: 'derivative', name: '导数与微分', icon: 'Spline', mark: 'd/dx', en: 'DERIVATIVE', desc: '从变化率出发，看懂函数的每一次变化。', expr: 'x^3 - 3*x + sin(x)', examples: ['x^3 - 3*x + sin(x)', 'exp(x)*cos(x)', 'log(x^2 + 1)', 'sin(x*y)'] },
  { id: 'integral', name: '积分计算', icon: 'Sigma', mark: '∫', en: 'INTEGRAL', desc: '把微小变化累积起来，探索曲线之下的世界。', expr: 'x^2', examples: ['x^2', 'sin(x)', 'exp(-x^2)', '1/(1+x^2)'] },
  { id: 'limit', name: '极限探索', icon: 'MoveRight', mark: 'lim', en: 'LIMIT', desc: '无限靠近一个点，发现函数真正的去向。', expr: 'sin(x)/x', examples: ['sin(x)/x', '(1+1/x)^x', '(exp(x)-1)/x', '1/x'] },
  { id: 'series', name: '泰勒级数', icon: 'ListOrdered', mark: 'Σ', en: 'SERIES', desc: '用熟悉的多项式，描绘复杂函数的局部模样。', expr: 'exp(x)', examples: ['exp(x)', 'sin(x)', 'log(1+x)', 'cos(x)'] },
  { id: 'solve', name: '方程求解', icon: 'Equal', mark: '=', en: 'EQUATION', desc: '寻找使表达式等于零的所有实数解。', expr: 'x^3 - 6*x^2 + 11*x - 6', examples: ['x^3 - 6*x^2 + 11*x - 6', 'x^2 - 2', 'sin(x)', 'exp(x) - 1'] },
  { id: 'matrix', name: '矩阵运算', icon: 'Grid2x2', mark: '▦', en: 'MATRIX', desc: '从行列式到逆矩阵，让线性代数清晰可见。', expr: '1,2;3,4', examples: ['1,2;3,4', '1,2,3;0,1,4;5,6,0', '2,0;0,3'] },
  { id: 'simplify', name: '表达式化简', icon: 'WandSparkles', mark: '≈', en: 'SIMPLIFY', desc: '整理复杂表达式，回到简洁的数学语言。', expr: '(x^2-1)/(x-1)', examples: ['(x^2-1)/(x-1)', 'sin(x)^2+cos(x)^2', 'exp(log(x))'] },
  { id: 'plot', name: '函数绘图', icon: 'ChartSpline', mark: 'ƒ', en: 'FUNCTION', desc: '让抽象的表达式，变成看得见的函数轨迹。', expr: 'sin(x)', examples: ['sin(x)', 'x^2', 'exp(-x^2)', 'tan(x)'] },
];
const $ = (id) => document.getElementById(id);
const escape = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') => `<i data-lucide="${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}" class="${cls}" aria-hidden="true"></i>`;
const math = (latex, display = false) => katex.renderToString(latex, { throwOnError: false, trust: false, displayMode: display, strict: 'ignore' });
let current = modes[0];
let result = null;
let requestId = 0;
let controller;
let showOverlay = true;
let history = [];
try { history = JSON.parse(localStorage.getItem('gaoshu-history') || '[]'); if (!Array.isArray(history)) history = []; history = history.filter(h => h && typeof h.expression === 'string' && modes.some(m => m.id === h.mode)).slice(0, 30); } catch { history = []; }

$('app').innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="高数实验室首页"><span class="brand-symbol">∫</span><span>高数实验室<small>GAOSHU LAB</small></span></a>
    <div class="workspace-label">工作空间 <span>01</span></div>
    <nav aria-label="计算工具">${modes.map((m, i) => `<button class="nav-item ${i === 0 ? 'active' : ''}" data-mode="${m.id}">${icon(m.icon)}<span>${m.name}</span>${i === 0 ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav>
    <div class="sidebar-rule"></div>
    <button class="nav-item secondary" id="history-open">${icon('History')}<span>计算历史</span><span id="history-count">${history.length}</span></button>
    <button class="nav-item secondary" id="help-open">${icon('BookOpen')}<span>输入指南</span>${icon('ArrowUpRight', 'tiny')}</button>
    <div class="sidebar-bottom"><div class="open-label"><span class="status-dot"></span> 为好奇心，保持开源</div><p>每一道难题，<br>都从一个好问题开始。</p><a href="https://github.com/qingmengyide/gaoshu-lab" target="_blank" rel="noreferrer">${icon('Github')} GitHub <span>↗</span></a><small>v1.0.0 · MIT License</small></div>
  </aside>
  <div class="workspace">
    <header class="topbar"><div class="breadcrumb">工作空间 <span>/</span> <strong id="breadcrumb">导数与微分</strong></div><div class="topbar-right"><span class="engine-status"><span class="status-dot"></span> SymPy 计算引擎</span><button id="quick-history" class="icon-button" aria-label="查看计算历史">${icon('History')}</button><a href="https://github.com/qingmengyide/gaoshu-lab" target="_blank" rel="noreferrer" class="icon-button" aria-label="查看 GitHub 源码">${icon('Github')}</a></div></header>
    <main>
      <div class="page-heading"><div><div class="eyebrow"><span></span> MATH, MADE CLEAR.</div><h1>让数学，<span>有迹可循。</span></h1><p>计算一个答案，也看见答案背后的数学。</p></div><div class="heading-note"><span>f′(x)</span><small>探索 · 计算 · 理解</small></div></div>
      <section class="workbench" aria-label="计算工作台">
        <div class="editor-card card"><div class="card-heading"><div class="section-title"><span class="section-number">01</span><h2>定义你的问题</h2></div><span class="small-tag" id="mode-en">DERIVATIVE</span></div>
          <form id="calculator"><div class="field-label"><label for="expression" id="expression-label">函数表达式</label><button type="button" class="text-button" id="syntax-help">输入语法 ${icon('CircleHelp')}</button></div>
            <div class="expression-editor"><span id="expression-prefix">f(x) =</span><textarea id="expression" rows="2" maxlength="240" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="syntax-hint">${current.expr}</textarea></div>
            <p id="syntax-hint" class="input-hint">乘法使用 *，幂使用 ^；支持 sin、cos、log、exp 等函数</p>
            <div id="parameters" class="parameters"></div>
            <div class="symbol-keyboard" aria-label="数学符号快捷输入">${['x', '^', '(', ')', 'sin(', 'cos(', 'log(', 'sqrt(', 'pi'].map(k => `<button type="button" data-insert="${k}" aria-label="输入 ${k}">${k === 'sqrt(' ? '√' : k === 'pi' ? 'π' : k.replace('(', '')}</button>`).join('')}</div>
            <button type="submit" id="calculate" class="calculate-button"><span>${icon('Sparkles')} 开始计算</span><kbd>Ctrl ↵</kbd></button>
          </form>
          <div class="examples"><span>试试这些例子</span><div id="examples-list"></div></div>
        </div>
        <div class="result-card card"><div class="card-heading"><div class="section-title"><span class="section-number">02</span><h2>看见答案</h2></div><span class="result-status" id="result-status">准备就绪</span></div>
          <div id="result-content" aria-live="polite" aria-busy="false"><div class="empty-result"><span>∂</span><p>一个表达式，无限种可能。</p><small>输入函数，开始你的数学探索。</small></div></div>
        </div>
      </section>
      <section class="plot-card card" id="plot-card" aria-label="函数图像"><div class="card-heading"><div class="section-title"><span class="section-number">03</span><h2>让函数有形</h2><span class="plot-subtitle">交互图像</span></div><div class="plot-actions"><button id="export-svg" class="icon-button" title="下载 SVG 图像" aria-label="下载 SVG 图像">${icon('Download')}</button><button id="zoom-in" class="icon-button" title="放大" aria-label="放大图像">${icon('Plus')}</button><button id="zoom-out" class="icon-button" title="缩小" aria-label="缩小图像">${icon('Minus')}</button></div></div>
        <div class="plot-toolbar"><div class="legend"><span><b class="line-swatch"></b> 原函数 <i>f(x)</i></span><button id="toggle-overlay" class="legend-toggle" aria-pressed="true"><b class="line-swatch green"></b><span id="overlay-name">导函数 f′(x)</span></button></div><div class="plot-range"><label for="plot-min">x ∈</label><input id="plot-min" value="-5" type="number" min="-1000" max="1000" step="0.5" aria-label="绘图左端点"><span>至</span><input id="plot-max" value="5" type="number" min="-1000" max="1000" step="0.5" aria-label="绘图右端点"><button class="text-button" id="update-plot">更新 ${icon('ArrowRight')}</button></div></div>
        <div class="chart-wrap" id="chart-wrap"><svg id="chart" viewBox="0 0 1000 310" role="img" aria-label="函数曲线图"></svg><div id="chart-tooltip" class="chart-tooltip" hidden></div><div id="chart-empty" class="chart-empty">完成计算后，函数图像将在这里呈现。</div></div>
        <div class="plot-footer"><span>${icon('MousePointer2')} 移动光标查看坐标</span><span>图像为数值采样，断点附近仅供参考</span></div>
      </section>
      <footer class="page-footer"><span>少一点计算负担，多一点数学直觉。</span><span>BUILT FOR THE JOY OF UNDERSTANDING <span class="footer-star">✳</span></span></footer>
    </main>
  </div>
  <dialog id="help-dialog"><div class="dialog-heading"><h2>从这里开始</h2><button class="icon-button" data-close="help-dialog" aria-label="关闭输入指南">${icon('X')}</button></div><p>像写数学一样输入，用明确的符号连接每一步。</p><div class="help-grid"><span>乘法 / 幂</span><code>2*x · x^2</code><span>三角函数（弧度制）</span><code>sin(x) · cos(x) · tan(x)</code><span>指数 / 对数</span><code>exp(x) · log(x) · ln(x)</code><span>平方根 / 绝对值</span><code>sqrt(x) · abs(x)</code><span>常数 / 无穷大</span><code>pi · e · oo · -oo</code><span>多元表达式 / 偏导</span><code>sin(x*y) · x,y,z,t</code><span>矩阵（逗号分列，分号分行）</span><code>1,2;3,4</code></div><p>方程模式请输入移项后的表达式（右侧默认为 0）。泰勒阶数 n 表示保留到 n−1 次幂。其余变量视为常量时，图像不会显示。</p><p>结果由 SymPy 生成；步骤展示运算与中间结果，不是完整的教学推导。历史仅保存在当前浏览器。</p><button class="calculate-button" data-close="help-dialog">开始探索 ${icon('ArrowRight')}</button></dialog>
  <dialog id="history-dialog"><div class="dialog-heading"><h2>计算历史 <span id="dialog-count"></span></h2><button class="icon-button" data-close="history-dialog" aria-label="关闭计算历史">${icon('X')}</button></div><p>留住每一次探索。点击记录，重新计算。</p><div id="history-list"></div><button id="clear-history" class="text-button danger">${icon('Trash2')} 清空本地历史</button></dialog>
  <div id="toast" role="status" hidden></div>`;

function refreshIcons() { createIcons({ icons }); }
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { $('toast').hidden = true; }, 2400); }
function field(label, id, value, type = 'text', extra = '') { return `<div class="parameter"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${value}" ${extra}></div>`; }
function renderParameters() {
  const variable = `<div class="parameter"><label for="variable">计算变量</label><select id="variable">${['x', 'y', 'z', 't'].map(v => `<option>${v}</option>`).join('')}</select></div>`;
  let fields = variable;
  if (current.id === 'derivative') fields += field('求导阶数', 'order', 1, 'number', 'min="1" max="8" step="1"');
  if (current.id === 'integral') fields += `<div class="parameter"><label for="integral-kind">积分类型</label><select id="integral-kind"><option value="indefinite">不定积分</option><option value="definite">定积分</option></select></div><div id="bounds" class="bounds" hidden>${field('下限', 'lower', 0)}${field('上限', 'upper', 1)}</div>`;
  if (current.id === 'limit') fields += field('趋近于', 'point', 0) + `<div class="parameter"><label for="direction">极限方向</label><select id="direction"><option value="both">双侧极限</option><option value="-">左极限 −</option><option value="+">右极限 +</option></select></div>`;
  if (current.id === 'series') fields += field('展开点', 'point', 0) + field('展开阶数', 'order', 6, 'number', 'min="1" max="12" step="1"');
  if (current.id === 'matrix') fields = `<div class="parameter full"><label for="matrix-operation">矩阵运算</label><select id="matrix-operation"><option value="det">行列式 det(A)</option><option value="inverse">逆矩阵 A⁻¹</option><option value="rref">行最简形 RREF</option><option value="rank">矩阵的秩 rank(A)</option></select></div>`;
  $('parameters').innerHTML = fields;
  $('integral-kind')?.addEventListener('change', () => { $('bounds').hidden = $('integral-kind').value !== 'definite'; });
  $('variable')?.addEventListener('change', () => { $('expression-prefix').textContent = `f(${$('variable').value}) =`; });
  $('examples-list').innerHTML = current.examples.map(e => `<button type="button" class="example-chip" data-example="${escape(e)}">${escape(e)} ${icon('ArrowUpLeft')}</button>`).join('');
  $('expression-label').textContent = current.id === 'matrix' ? '输入矩阵' : current.id === 'solve' ? '方程左侧表达式（= 0）' : '函数表达式';
  $('expression-prefix').textContent = current.id === 'matrix' ? 'A =' : 'f(x) =';
  $('expression').maxLength = current.id === 'matrix' ? 600 : 240;
  $('syntax-hint').textContent = current.id === 'matrix' ? '逗号分列，分号分行。例如 1,2;3,4（最多 5×5）' : '乘法使用 *，幂使用 ^；支持 sin、cos、log、exp 等函数';
  $('plot-card').hidden = current.id === 'matrix';
  $('toggle-overlay').hidden = !['derivative', 'series'].includes(current.id);
  $('overlay-name').textContent = current.id === 'series' ? '级数近似' : '导函数 f′(x)';
  refreshIcons();
}

function getPayload() {
  return { mode: current.id, expression: $('expression').value.trim(), variable: $('variable')?.value || 'x',
    order: $('order')?.value || 1, point: $('point')?.value || '0', direction: $('direction')?.value || 'both',
    definite: $('integral-kind')?.value === 'definite', lower: $('lower')?.value || '0', upper: $('upper')?.value || '1',
    matrixOperation: $('matrix-operation')?.value || 'det', plotMin: $('plot-min').value, plotMax: $('plot-max').value };
}

async function calculate(saveHistory = true) {
  if (!$('calculator').reportValidity()) return;
  const payload = getPayload();
  if (!payload.expression) { toast('先输入一个表达式吧。'); $('expression').focus(); return; }
  controller?.abort(); controller = new AbortController();
  const id = ++requestId;
  $('calculate').disabled = true; $('calculate').querySelector('span').innerHTML = `${icon('LoaderCircle', 'spin')} 正在计算`;
  $('result-status').textContent = '计算中'; $('result-content').setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    const data = await response.json();
    if (id !== requestId) return;
    if (!response.ok || data.error) throw new Error(data.error || '计算服务暂不可用。');
    result = data;
    $('result-status').textContent = '计算完成';
    $('result-content').innerHTML = `<div class="result-label">${current.id === 'solve' ? '实数解集' : current.id === 'integral' && !payload.definite ? '原函数' : '精确结果'}<span>SYMBOLIC RESULT</span></div><div class="result-math">${math(data.latex, true)}</div>${data.approx ? `<div class="approx-result">≈ ${escape(data.approx)}</div>` : ''}<div class="result-tools"><button class="text-button" id="copy-result">${icon('Copy')} 复制结果</button><button class="text-button" id="copy-latex">${icon('Braces')} LaTeX</button></div>${data.notes.length ? `<div class="result-notes">${data.notes.map(n => `<p>${icon('Info')}<span>${escape(n)}</span></p>`).join('')}</div>` : ''}<details class="steps" open><summary>运算步骤 <span>${data.steps.length} STEPS ${icon('ChevronDown')}</span></summary><ol>${data.steps.map((step, i) => `<li><span class="step-dot">${i + 1}</span><div><p>${escape(step.label)}</p><div class="step-math">${math(step.latex)}</div></div></li>`).join('')}</ol></details>`;
    $('copy-result').onclick = () => copy(data.text);
    $('copy-latex').onclick = () => copy(data.latex);
    drawChart();
    if (saveHistory) {
      history.unshift({ ...payload, text: data.text, time: Date.now() });
      history = history.slice(0, 30);
      persistHistory();
    }
  } catch (error) {
    if (error.name === 'AbortError' || id !== requestId) return;
    result = null;
    $('result-status').textContent = '需要调整';
    const message = error instanceof TypeError ? '无法连接计算服务。请启动 Python 服务后重试。' : error.message;
    $('result-content').innerHTML = `<div class="error-result">${icon('CircleAlert')}<h3>再检查一下问题</h3><p>${escape(message)}</p><button class="text-button" id="error-help">查看输入指南 ${icon('ArrowRight')}</button></div>`;
    $('error-help').onclick = () => $('help-dialog').showModal();
    drawChart();
  } finally {
    if (id === requestId) {
      $('calculate').disabled = false; $('calculate').querySelector('span').innerHTML = `${icon('Sparkles')} 开始计算`;
      $('result-content').setAttribute('aria-busy', 'false'); refreshIcons();
    }
  }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('已复制到剪贴板'); }
  catch { toast('复制受浏览器限制，请选中结果手动复制。'); }
}
function persistHistory() {
  try { localStorage.setItem('gaoshu-history', JSON.stringify(history)); } catch { toast('浏览器未允许保存历史记录。'); }
  $('history-count').textContent = history.length;
}
function selectMode(id, expression) {
  current = modes.find(m => m.id === id) || modes[0];
  document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('active', b.dataset.mode === current.id); b.setAttribute('aria-current', b.dataset.mode === current.id ? 'page' : 'false'); });
  $('breadcrumb').textContent = current.name; $('mode-en').textContent = current.en;
  $('expression').value = expression || current.expr;
  renderParameters();
}
function renderHistory() {
  $('dialog-count').textContent = `${history.length} 条`;
  $('history-list').innerHTML = history.length ? history.map((h, i) => `<button class="history-entry" data-history="${i}"><span><small>${escape(modes.find(m => m.id === h.mode).name)} · ${new Date(h.time).toLocaleString('zh-CN')}</small><code>${escape(h.expression)}</code><em>= ${escape(h.text)}</em></span>${icon('ArrowUpRight')}</button>`).join('') : '<div class="history-empty">还没有计算记录。<br>你的下一个好问题，从这里开始。</div>';
  refreshIcons();
}

let chartBounds;
function drawChart() {
  const svg = $('chart');
  const width = 1000, height = 310, left = 55, right = 25, top = 20, bottom = 35;
  const low = Number($('plot-min').value), high = Number($('plot-max').value);
  const points = result?.plot || [];
  const overlay = showOverlay ? result?.overlay || [] : [];
  const ys = [...points, ...overlay].map(p => p[1]).filter(y => y !== null && Number.isFinite(y)).sort((a, b) => a - b);
  $('chart-empty').hidden = points.some(p => p[1] !== null);
  $('chart-empty').textContent = result ? '当前表达式无法绘制实数曲线（请检查变量或定义域）。' : '完成计算后，函数图像将在这里呈现。';
  let yLow = -2, yHigh = 2;
  if (ys.length) {
    yLow = Math.min(0, ys[Math.floor(ys.length * .04)]);
    yHigh = Math.max(0, ys[Math.min(ys.length - 1, Math.floor(ys.length * .96))]);
    if (yHigh - yLow < .1) { yLow -= 1; yHigh += 1; }
    const pad = (yHigh - yLow) * .15; yLow -= pad; yHigh += pad;
  }
  const X = x => left + (x - low) / (high - low) * (width - left - right);
  const Y = y => height - bottom - (y - yLow) / (yHigh - yLow) * (height - top - bottom);
  chartBounds = { low, high, yLow, yHigh, X, Y, left, right, top, bottom, width, height };
  let content = `<defs><clipPath id="chart-clip"><rect x="${left}" y="${top}" width="${width - left - right}" height="${height - top - bottom}"/></clipPath></defs>`;
  const number = n => Number.isInteger(n) ? String(n) : Math.abs(n) >= 10000 || (Math.abs(n) > 0 && Math.abs(n) < .01) ? n.toExponential(1) : Number(n.toPrecision(3)).toString();
  for (let i = 0; i <= 8; i++) {
    const x = low + (high - low) * i / 8, px = X(x);
    content += `<line x1="${px}" y1="${top}" x2="${px}" y2="${height - bottom}" stroke="#e7e9e5"/><text x="${px}" y="${height - 12}" text-anchor="middle" fill="#94998f" font-size="11" font-family="monospace">${number(x)}</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    const y = yLow + (yHigh - yLow) * i / 4, py = Y(y);
    content += `<line x1="${left}" y1="${py}" x2="${width - right}" y2="${py}" stroke="#e7e9e5"/><text x="${left - 10}" y="${py + 4}" text-anchor="end" fill="#94998f" font-size="11" font-family="monospace">${number(y)}</text>`;
  }
  if (low <= 0 && high >= 0) content += `<line x1="${X(0)}" y1="${top}" x2="${X(0)}" y2="${height - bottom}" stroke="#c2c8bd"/>`;
  if (yLow <= 0 && yHigh >= 0) content += `<line x1="${left}" y1="${Y(0)}" x2="${width - right}" y2="${Y(0)}" stroke="#c2c8bd"/>`;
  function path(data) {
    let drawing = false, previousY = null;
    return data.map(([x, y]) => {
      if (y === null || !Number.isFinite(y) || y < yLow - (yHigh-yLow) || y > yHigh + (yHigh-yLow)) { drawing = false; previousY = null; return ''; }
      const px = X(x), py = Y(y);
      if (previousY !== null && Math.abs(py - previousY) > (height - top - bottom) * .6) drawing = false;
      const command = `${drawing ? 'L' : 'M'}${px.toFixed(2)},${py.toFixed(2)}`;
      drawing = true; previousY = py; return command;
    }).join(' ');
  }
  content += `<g clip-path="url(#chart-clip)"><path d="${path(overlay)}" fill="none" stroke="#528a73" stroke-width="2.2" stroke-dasharray="6 5"/><path d="${path(points)}" fill="none" stroke="#e7683e" stroke-width="2.8" stroke-linecap="round"/></g><g id="chart-crosshair" visibility="hidden"><line id="hover-line" y1="${top}" y2="${height - bottom}" stroke="#777e72" stroke-dasharray="3 4"/><circle id="hover-dot" r="4.5" fill="#e7683e" stroke="white" stroke-width="2"/></g><text x="${width - 12}" y="${height - 12}" fill="#858b80" font-size="12" font-style="italic">x</text>`;
  svg.innerHTML = content;
}
$('chart').addEventListener('pointermove', event => {
  if (!result?.plot?.length || !chartBounds) return;
  const rect = $('chart').getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width * 1000;
  const b = chartBounds;
  if (px < b.left || px > 1000 - b.right) return;
  const index = Math.max(0, Math.min(result.plot.length - 1, Math.round((px - b.left) / (1000 - b.left - b.right) * (result.plot.length - 1))));
  const [x, y] = result.plot[index];
  if (y === null || y < b.yLow || y > b.yHigh) { $('chart-crosshair').setAttribute('visibility', 'hidden'); $('chart-tooltip').hidden = true; return; }
  $('chart-crosshair').setAttribute('visibility', 'visible');
  $('hover-line').setAttribute('x1', b.X(x)); $('hover-line').setAttribute('x2', b.X(x));
  $('hover-dot').setAttribute('cx', b.X(x)); $('hover-dot').setAttribute('cy', b.Y(y));
  const tip = $('chart-tooltip'); tip.hidden = false; tip.textContent = `x = ${x.toFixed(3)}   f(x) = ${y.toPrecision(6)}`;
  tip.style.left = `${Math.min(rect.width - 200, Math.max(8, event.clientX - rect.left + 12))}px`; tip.style.top = '12px';
});
$('chart').addEventListener('pointerleave', () => { $('chart-crosshair')?.setAttribute('visibility', 'hidden'); $('chart-tooltip').hidden = true; });

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { selectMode(button.dataset.mode); calculate(false); }));
$('calculator').addEventListener('submit', event => { event.preventDefault(); calculate(); });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); calculate(); } });
$('examples-list').addEventListener('click', event => { const button = event.target.closest('[data-example]'); if (button) { $('expression').value = button.dataset.example; calculate(); } });
document.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => { const input = $('expression'); const start = input.selectionStart, end = input.selectionEnd; input.setRangeText(button.dataset.insert, start, end, 'end'); input.focus(); }));
for (const id of ['help-open', 'syntax-help']) $(id).onclick = () => $('help-dialog').showModal();
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close());
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
$('history-open').onclick = () => { renderHistory(); $('history-dialog').showModal(); };
$('quick-history').onclick = () => { renderHistory(); $('history-dialog').showModal(); };
$('history-list').addEventListener('click', event => {
  const button = event.target.closest('[data-history]'); if (!button) return;
  const h = history[Number(button.dataset.history)]; selectMode(h.mode, h.expression);
  for (const key of ['variable', 'order', 'point', 'direction', 'lower', 'upper']) if ($(key) && h[key] != null) $(key).value = h[key];
  if ($('integral-kind')) { $('integral-kind').value = h.definite ? 'definite' : 'indefinite'; $('bounds').hidden = !h.definite; }
  if ($('matrix-operation')) $('matrix-operation').value = h.matrixOperation;
  $('plot-min').value = h.plotMin ?? -5; $('plot-max').value = h.plotMax ?? 5;
  $('history-dialog').close(); calculate(false);
});
$('clear-history').onclick = () => { history = []; persistHistory(); renderHistory(); toast('已清空本地计算历史'); };
$('toggle-overlay').onclick = () => { showOverlay = !showOverlay; $('toggle-overlay').setAttribute('aria-pressed', String(showOverlay)); drawChart(); };
$('update-plot').onclick = () => calculate(false);
for (const [id, factor] of [['zoom-in', .5], ['zoom-out', 2]]) $(id).onclick = () => { const low = Number($('plot-min').value), high = Number($('plot-max').value), mid = (low + high) / 2, half = (high - low) / 2 * factor; if (!Number.isFinite(half) || half < .005 || mid - half < -1000 || mid + half > 1000) { toast('已到达缩放范围'); return; } $('plot-min').value = (mid - half).toFixed(4); $('plot-max').value = (mid + half).toFixed(4); calculate(false); };
$('export-svg').onclick = () => {
  if (!result?.plot?.some(p => p[1] !== null)) { toast('请先绘制一个函数'); return; }
  const clone = $('chart').cloneNode(true); clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', '1000'); clone.setAttribute('height', '310'); clone.querySelector('#chart-crosshair')?.remove();
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  const link = document.createElement('a'); link.href = url; link.download = 'gaoshu-function.svg'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('函数图像已导出');
};
renderParameters(); drawChart(); refreshIcons(); calculate(false);
