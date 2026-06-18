import { CONFIG } from './config.js';
import { generateFirmwareCode, parseFirmwareCode } from './firmware.js';

console.log('✅ CONFIG 加载成功:', CONFIG);

// ---------- DOM 引用（带空值检查） ----------
const $ = id => {
  const el = document.getElementById(id);
  if (!el) console.warn(`⚠️ 元素 #${id} 未找到`);
  return el;
};

const genPanel = $('panel-generate');
const parsePanel = $('panel-parse');
const tabs = document.querySelectorAll('.tab-btn');
const msgEl = $('message');

const genDate = $('gen-date');
const genPcb = $('gen-pcb');
const genDram = $('gen-dram');
const genPackage = $('gen-package');
const genChips = $('gen-chips');
const genBtn = $('generate-btn');
const genResult = $('gen-result');
const genCode = $('gen-code');
const copyGenBtn = $('copy-gen-btn');

const parseInput = $('parse-input');
const parseBtn = $('parse-btn');
const parseResult = $('parse-result');
const parseTableBody = document.querySelector('#parse-table tbody');

// ---------- 初始化下拉框 ----------
function populateSelect(select, obj) {
  if (!select) {
    console.error('❌ select 元素不存在');
    return;
  }
  if (!obj) {
    console.error('❌ 配置对象为空');
    return;
  }
  select.innerHTML = '';
  for (const [key, label] of Object.entries(obj)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label; 
    select.appendChild(opt);
  }
  console.log(`✅ 下拉框已填充，共 ${Object.keys(obj).length} 项`);
}

// 执行填充
populateSelect(genPcb, CONFIG.pcbSizes);
populateSelect(genPackage, CONFIG.packages);

// ---------- 选项卡切换 ----------
if (tabs.length === 0) console.warn('⚠️ 没有找到 .tab-btn 元素');
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (genPanel && parsePanel) {
      genPanel.classList.toggle('active', tab === 'generate');
      parsePanel.classList.toggle('active', tab === 'parse');
    }
    hideMessage();
  });
});

// ---------- 消息 ----------
function showMessage(type, text) {
  if (!msgEl) return;
  msgEl.className = 'message ' + type;
  msgEl.textContent = text;
  msgEl.style.display = 'block';
}
function hideMessage() {
  if (!msgEl) return;
  msgEl.className = 'message';
  msgEl.style.display = 'none';
}

// ---------- 生成 ----------
if (genBtn) {
  genBtn.addEventListener('click', () => {
    hideMessage();
    if (genResult) genResult.style.display = 'none';

    try {
      const dateVal = genDate.value;
      if (!dateVal) throw new Error("请选择或输入有效日期");
      const parts = dateVal.split('-');
      if (parts.length !== 3) throw new Error("日期格式应为 YYYY-MM-DD");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error("无效日期");

      const pcbSize = parseInt(genPcb.value);
      const dramSize = parseInt(genDram.value);
      const packageCode = genPackage.value;
      const chipCount = parseInt(genChips.value);

      if (isNaN(pcbSize) || isNaN(dramSize) || isNaN(chipCount)) {
        showMessage('error', '请填写完整的数值');
        return;
      }

      const result = generateFirmwareCode(year, month, day, pcbSize, dramSize, packageCode, chipCount);
      genCode.textContent = result;
      genResult.style.display = 'block';
      showMessage('success', '✅ 生成成功！');
    } catch (err) {
      showMessage('error', '❌ ' + err.message);
    }
  });
} else {
  console.error('❌ 生成按钮未找到');
}

// DRAMLess 按钮
const dramlessBtn = document.getElementById('dramless-btn');
if (dramlessBtn) {
  dramlessBtn.addEventListener('click', () => {
    genDram.value = '-1';
  });
} else {
  console.warn('⚠️ DRAMLess 按钮未找到');
}

// 复制
if (copyGenBtn) {
  copyGenBtn.addEventListener('click', () => {
    const code = genCode.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        showMessage('success', '📋 已复制到剪贴板！');
        setTimeout(hideMessage, 2000);
      }).catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  });
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  showMessage('success', '📋 已复制！');
  setTimeout(hideMessage, 2000);
}

// ---------- 解析 ----------
if (parseBtn) {
  parseBtn.addEventListener('click', () => {
    hideMessage();
    if (parseResult) parseResult.style.display = 'none';
    const code = parseInput.value.trim();
    if (!code) {
      showMessage('error', '请输入固件版本号');
      return;
    }
    try {
      const parsed = parseFirmwareCode(code);
      parseTableBody.innerHTML = `
        <tr><td>生产日期</td><td>${parsed.year}-${String(parsed.month).padStart(2,'0')}-${String(parsed.day).padStart(2,'0')}</td></tr>
        <tr><td>PCB 尺寸</td><td>${parsed.pcbSize} (${CONFIG.pcbSizes[parsed.pcbSize] || '未知'})</td></tr>
        <tr><td>DRAM 大小</td><td>${parsed.dramSizeMB === -1 ? 'DRAMLess' : parsed.dramSizeMB + ' MB'}</td></tr>
        <tr><td>封装类型</td><td>${parsed.packageCode} (${CONFIG.packages[parsed.packageCode] || '未知'})</td></tr>
        <tr><td>颗粒数量</td><td>${parsed.chipCount}</td></tr>
      `;
      parseResult.style.display = 'block';
      showMessage('success', '✅ 解析成功！');
    } catch (err) {
      showMessage('error', '❌ ' + err.message);
    }
  });
} else {
  console.error('❌ 解析按钮未找到');
}

// 回车触发解析
if (parseInput) {
  parseInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') parseBtn.click();
  });
}

// 初始隐藏结果
if (genResult) genResult.style.display = 'none';
if (parseResult) parseResult.style.display = 'none';

console.log('✅ app.js 初始化完成');