/**
 * 中国发票编号生成工具
 *
 * 遵循中国真实发票编码规则：
 * - 数电发票（2024.12 起全国推行）：20 位发票号码，无独立发票代码
 * - 传统电子专票：12 位发票代码 + 8 位发票号码
 *
 * 参考：国家税务总局公告 2024 年第 11 号
 */

import { randomBytes } from "crypto";

// ---- 配置常量 ----

/** 省级税务局区域代码（默认广东 "44"） */
const DEFAULT_PROVINCE = "44";
/** 开具渠道（默认 "0"） */
const DEFAULT_CHANNEL = "0";

// ---- 内部工具 ----

/** 生成 n 位随机数字字符串 */
function randomDigits(n: number): string {
  const bytes = randomBytes(Math.ceil(n * 0.75));
  let result = "";
  for (let i = 0; i < n; i++) {
    result += String(Math.floor((bytes[i % bytes.length] ?? 0) / 256 * 10));
  }
  return result;
}

/** 当前年份后两位 */
function year2(): string {
  return String(new Date().getFullYear()).slice(2);
}

/** 当前日期 YYYYMMDD */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** 时间戳后 6 位 */
function ts6(): string {
  return String(Date.now()).slice(-6);
}

// ---- 公开发票编号 API ----

/**
 * 生成数电发票号码（20 位）
 * 格式: YY(2) + Province(2) + Channel(1) + Sequence(15)
 *
 * @param province 省级代码，默认 "44"（广东）
 * @param channel  开具渠道，默认 "0"
 */
export function generateInvoiceNo(province = DEFAULT_PROVINCE, channel = DEFAULT_CHANNEL): string {
  const yy = year2();
  const seq = randomDigits(15);
  return `${yy}${province}${channel}${seq}`;
}

/**
 * 生成传统增值税发票代码（12 位）
 * 格式: "0" + Province(4) + Year(2) + Batch(3) + "13"
 *
 * @param province 省级代码（4 位），默认 "4400"
 * @param batch    批次号（3 位），默认 "001"
 */
export function generateInvoiceCode(province = "4400", batch = "001"): string {
  const yy = year2();
  return `0${province}${yy}${batch}13`;
}

/**
 * 生成传统发票号码（8 位数字）
 * 按年度、分批次编制
 */
export function generateLegacyInvoiceNo(): string {
  return randomDigits(8);
}

// ---- 业务编号 API ----

/** 生成开票申请号: APP-YYYYMMDD-XXXXXX */
export function generateApplicationNo(): string {
  return `APP-${today()}-${ts6()}`;
}

/** 生成预制发票号: PI-YYYYMMDD-XXXXXX */
export function generatePreInvoiceNo(): string {
  return `PI-${today()}-${ts6()}`;
}

/** 生成红冲申请号: RF-YYYYMMDD-XXXXXX */
export function generateRedFlushNo(): string {
  return `RF-${today()}-${ts6()}`;
}

/** 生成作废申请号: VD-YYYYMMDD-XXXXXX */
export function generateVoidNo(): string {
  return `VD-${today()}-${ts6()}`;
}

/** 生成成本录入号: CE-YYYYMMDD-XXXXXX */
export function generateEntryNo(): string {
  return `CE-${today()}-${ts6()}`;
}

/** 生成税局流水号: TAX-YYYYMMDD-XXXXXX */
export function generateTaxFlowNo(): string {
  return `TAX-${today()}-${ts6()}`;
}
