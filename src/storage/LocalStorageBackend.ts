import { StorageBackend, StorageListOptions } from "./Backend";

const Storage_Key = "THGame";

export class LocalStorage extends StorageBackend {
	constructor() {
		super();
	}

	static override available() {
		return typeof window !== 'undefined' && !!window.localStorage;
	}

	override read(key: string) {
		return window.localStorage.getItem(`${Storage_Key}:${key}`);
	}

	override write(key: string, content: string): boolean {
		try {
			window.localStorage.setItem(`${Storage_Key}:${key}`, content);
			return true;
		} catch (e) {
			return false;
		}
	}

	override exists(key: string): boolean {
		return window.localStorage.getItem(`${Storage_Key}:${key}`) !== null;
	}

	override list(key: string, options?: StorageListOptions): Array<string> {
		const isRecursive = options?.recursive || false;
		const arr: string[] = [];
		const prefix = key ? `${key}.` : "";
		const basePrefix = `${Storage_Key}:`;

		const l = window.localStorage.length;
		for (let i = 0; i < l; i++) {
			const k = window.localStorage.key(i);
			if (k && k.startsWith(basePrefix)) {
				const actualKey = k.replace(basePrefix, "");

				if (key === "" || actualKey.startsWith(prefix)) {
					const rest = key === "" ? actualKey : actualKey.slice(prefix.length);

					if (!isRecursive) {
						// 确保非递归模式下只返回存在实际数据的直接子节点
						if (!rest.includes(".")) {
							arr.push(rest);
						}
					} else {
						// 递归模式返回完整的实际键名
						arr.push(actualKey);
					}
				}
			}
		}
		return arr;
	}

	override delete(key: string): boolean {
		window.localStorage.removeItem(`${Storage_Key}:${key}`);
		return true;
	}
}