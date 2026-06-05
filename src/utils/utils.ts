/**
 * 通用工具函数
 *
 * 迁移自 code/utils.js
 */

export const util = {
  /**
   * 安全 JSON 解析，失败返回 undefined
   */
  parseJSON<T = unknown>(str: string): T | undefined {
    try {
      return JSON.parse(str) as T;
    } catch {
      return undefined;
    }
  },

  /**
   * 检查字符串是否为合法 JSON
   */
  isJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 生成 UUID
   */
  uuid(len?: number, radix?: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    const uuid: string[] = [];
    radix = radix ?? chars.length;

    if (len) {
      for (let i = 0; i < len; i++) {
        uuid[i] = chars[0 | (Math.random() * radix)]!;
      }
    } else {
      // 标准 UUID 格式
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';
      for (let i = 0; i < 36; i++) {
        if (!uuid[i]) {
          const r = 0 | (Math.random() * 16);
          uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]!;
        }
      }
    }
    return uuid.join('');
  },
} as const;
