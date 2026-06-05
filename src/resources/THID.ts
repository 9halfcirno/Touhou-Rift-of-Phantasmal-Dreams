import type { ParsedTHID } from '../core/types.js';

/**
 * thid 解析器
 *
 * 格式: namespace:type=id
 * 游戏主命名空间保留为 "th"
 *
 * 迁移自 code/parser_thid.js
 */

const ID_REGEX = /^([a-zA-Z0-9_$]+):([a-zA-Z0-9_$]+)=(.+)$/;

export const THID = {
  /**
   * 解析 thid 字符串
   *
   * @example
   *   THID.parse("th:entity=character/reimu")
   *   // => { namespace: "th", type: "entity", id: "character/reimu" }
   */
  parse(str: string): ParsedTHID {
    const match = str.match(ID_REGEX);
    if (!match) {
      throw new Error(`无法解析的thid: "${str}"`);
    }
    return {
      namespace: match[1]!,
      type: match[2]!,
      id: match[3]!,
    };
  },

  /**
   * 检查字符串是否为合法的 thid
   */
  isValid(str: string): boolean {
    return ID_REGEX.test(str);
  },
} as const;

export type { ParsedTHID };
