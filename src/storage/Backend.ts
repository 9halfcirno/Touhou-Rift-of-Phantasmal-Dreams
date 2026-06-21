export interface StorageListOptions {
	/** * 是否递归获取所有叶节点（文件）喵？
	 * - false: 仅列出当前层级的目录和文件（默认）
	 * - true: 递归遍历，返回所有底层文件的完整键名
	 */
	recursive?: boolean;
}

export abstract class StorageBackend {
	static available(): boolean { return false; };

	abstract read(key: string): Promise<string | null> | string | null;
	abstract write(key: string, content: string): Promise<boolean> | boolean;
	abstract exists(key: string): Promise<boolean> | boolean;

	/**
	 * 获取指定键名下的存在键名
	 * @param key 要列举的键名
	 * @param options 额外的列举选项喵~
	 */
	abstract list(key: string, options?: StorageListOptions): Promise<Array<string>> | Array<string>;

	abstract delete(key: string): Promise<boolean> | boolean;
}