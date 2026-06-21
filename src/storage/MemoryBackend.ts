import { StorageBackend, StorageListOptions } from "./Backend";

export class MemoryStorage extends StorageBackend {
	private data: Map<string, string> = new Map();

	static override available() {
		return true;
	}

	override read(key: string): string | null {
		return this.data.get(key) || null;
	}

	override write(key: string, content: string): boolean {
		this.data.set(key, content);
		return true;
	}

	override exists(key: string): boolean {
		return this.data.has(key);
	}

	override list(key: string, options?: StorageListOptions): Array<string> {
		const isRecursive = options?.recursive || false;
		const arr: string[] = [];
		const prefix = key ? `${key}.` : "";

		for (const k of this.data.keys()) {
			if (key === "" || k.startsWith(prefix)) {
				const rest = key === "" ? k : k.slice(prefix.length);

				if (!isRecursive) {
					// 仅返回当前层级，且过滤掉不包含实际数据的路径
					if (!rest.includes(".")) {
						arr.push(rest);
					}
				} else {
					// 递归模式返回具有数据的子节点完整键名
					arr.push(k);
				}
			}
		}
		return arr;
	}

	override delete(key: string): boolean {
		return this.data.delete(key);
	}
}