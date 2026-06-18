import { CONFIG } from './config.js';

// ---------- 辅助函数 ----------
function getBaseDate() {
  const d = CONFIG.baseDate;
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

function dateToCode(year, month, day) {
  const target = new Date(Date.UTC(year, month - 1, day));
  const base = getBaseDate();
  const diff = Math.floor((target - base) / (24 * 60 * 60 * 1000));
  if (diff < 0 || diff >= 32768) {
    throw new Error("日期超出范围（基准日期 ± 32767 天）");
  }
  const chars = CONFIG.base32Chars;
  const base32 = chars.length;
  let n = diff;
  let code = '';
  for (let i = 0; i < 3; i++) {
    const idx = n % base32;
    code = chars[idx] + code;
    n = Math.floor(n / base32);
  }
  return code;
}

function codeToDate(code) {
  if (code.length !== 3) throw new Error("日期编码必须为3位");
  const chars = CONFIG.base32Chars;
  const base32 = chars.length;
  let days = 0;
  for (const ch of code) {
    const idx = chars.indexOf(ch.toUpperCase());
    if (idx === -1) throw new Error("无效日期编码字符: " + ch);
    days = days * base32 + idx;
  }
  const base = getBaseDate();
  const target = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    year: target.getUTCFullYear(),
    month: target.getUTCMonth() + 1,
    day: target.getUTCDate()
  };
}

function dramSizeToCode(sizeMB) {
  if (sizeMB === -1) return 'X';
  const map = CONFIG.dramSizes;
  for (const [code, val] of Object.entries(map)) {
    if (val === sizeMB) return code;
  }
  throw new Error("不支持的 DRAM 大小: " + sizeMB);
}

function chipCountToChar(count) {
  if (count < 1 || count > 16) throw new Error("颗粒个数超出范围 (1-16)");
  if (count <= 9) return String.fromCharCode(0x30 + count);
  if (count <= 15) return String.fromCharCode(0x41 + (count - 10));
  return 'G'; // 16
}

function charToChipCount(ch) {
  const c = ch.toUpperCase();
  if (c >= '1' && c <= '9') return c.charCodeAt(0) - 0x30;
  if (c >= 'A' && c <= 'F') return 10 + (c.charCodeAt(0) - 0x41);
  if (c === 'G') return 16;
  throw new Error("无效的颗粒个数代码");
}

// ---------- 生成固件版本号 ----------
export function generateFirmwareCode(year, month, day, pcbSize, dramSizeMB, packageCode, chipCount) {
  // 校验
  if (year < 2010 || year > 2099) throw new Error("年份必须在2010-2099之间");
  if (month < 1 || month > 12) throw new Error("月份必须在1-12之间");
  if (day < 1 || day > 31) throw new Error("日期必须在1-31之间");
  if (!(pcbSize in CONFIG.pcbSizes)) throw new Error("无效的PCB尺寸代码");
  if (chipCount < CONFIG.chipCount.min || chipCount > CONFIG.chipCount.max)
    throw new Error("颗粒个数超出范围");
  if (!(packageCode.toUpperCase() in CONFIG.packages))
    throw new Error("无效的封装代码");

  const dateCode = dateToCode(year, month, day);
  const dramCode = dramSizeToCode(dramSizeMB);
  const chipChar = chipCountToChar(chipCount);
  return 'S' + dateCode + String(pcbSize) + dramCode + packageCode.toUpperCase() + chipChar;
}

// ---------- 解析固件版本号 ----------
export function parseFirmwareCode(code) {
  if (code.length !== 8 || code[0] !== 'S')
    throw new Error("无效的固件版本号格式 (应为 S + 7位)");

  const parts = code.split('');
  const dateCode = parts.slice(1, 4).join('');
  const pcbSize = parseInt(parts[4], 10);
  const dramCode = parts[5];
  const packageCode = parts[6];
  const chipChar = parts[7];

  // 校验
  if (!(pcbSize in CONFIG.pcbSizes)) throw new Error("无效的PCB尺寸代码");
  if (!(dramCode.toUpperCase() in CONFIG.dramSizes)) throw new Error("无效的DRAM大小代码");
  if (!(packageCode.toUpperCase() in CONFIG.packages)) throw new Error("无效的封装代码");

  const date = codeToDate(dateCode);
  const dramSizeMB = CONFIG.dramSizes[dramCode.toUpperCase()];
  const chipCount = charToChipCount(chipChar);
  if (chipCount < CONFIG.chipCount.min || chipCount > CONFIG.chipCount.max)
    throw new Error("无效的颗粒个数");

  return {
    year: date.year,
    month: date.month,
    day: date.day,
    pcbSize: pcbSize,
    dramSizeMB: dramSizeMB,
    packageCode: packageCode.toUpperCase(),
    chipCount: chipCount
  };
}