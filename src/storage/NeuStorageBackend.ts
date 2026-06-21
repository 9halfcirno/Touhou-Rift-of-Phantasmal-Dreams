import { StorageBackend, StorageListOptions } from "./Backend";

declare const Neutralino: any;

export class NeuFileSystemBackend extends StorageBackend {
	private basePath: string;

	constructor(basePath: string = './storage') {
		super();
		this.basePath = basePath;
	}

	static override available(): boolean {
		return typeof Neutralino !== 'undefined' && typeof Neutralino.filesystem !== 'undefined';
	}

	private resolvePath(key: string): { dirPath: string; filePath: string } {
		if (!key) return { dirPath: this.basePath, filePath: '' };

		const parts = key.split('.');
		const fileName = parts.pop() || '';

		const dirParts = parts.map(part => `${part}@dir`);
		const dirPath = [this.basePath, ...dirParts].join('/');

		return {
			dirPath,
			filePath: fileName ? `${dirPath}/${fileName}` : dirPath
		};
	}

	private async ensureDir(dirPath: string): Promise<void> {
		const parts = dirPath.split('/');
		let currentPath = '';

		for (const part of parts) {
			if (!part) continue;
			currentPath += (currentPath ? '/' : '') + part;
			try {
				await Neutralino.filesystem.getStats(currentPath);
			} catch (e) {
				try {
					await Neutralino.filesystem.createDirectory(currentPath);
				} catch (err) {
					// 忽略并发写入冲突
				}
			}
		}
	}

	async read(key: string): Promise<string | null> {
		const { filePath } = this.resolvePath(key);
		try {
			return await Neutralino.filesystem.readFile(filePath);
		} catch (e) {
			return null;
		}
	}

	async write(key: string, content: string): Promise<boolean> {
		const { dirPath, filePath } = this.resolvePath(key);
		try {
			await this.ensureDir(dirPath);
			await Neutralino.filesystem.writeFile(filePath, content);
			return true;
		} catch (e) {
			return false;
		}
	}

	async exists(key: string): Promise<boolean> {
		const { filePath } = this.resolvePath(key);
		try {
			const stats = await Neutralino.filesystem.getStats(filePath);
			return stats.isFile;
		} catch (e) {
			return false;
		}
	}

	async list(key: string, options?: StorageListOptions): Promise<Array<string>> {
		const isRecursive = options?.recursive || false;

		const parts = key ? key.split('.') : [];
		const dirParts = parts.map(part => `${part}@dir`);
		const targetDir = [this.basePath, ...dirParts].join('/');

		if (!isRecursive) {
			try {
				const entries = await Neutralino.filesystem.readDirectory(targetDir);
				const result: string[] = [];

				for (const entry of entries) {
					if (entry.entry === '.' || entry.entry === '..') continue;

					// 仅收集实际为文件的节点，忽略纯目录节点
					if (entry.type === 'FILE') {
						result.push(entry.entry);
					}
				}
				return result;
			} catch (e) {
				return [];
			}
		} else {
			const results: string[] = [];
			await this.readDirRecursive(targetDir, key, results);
			return results;
		}
	}

	private async readDirRecursive(currentPath: string, currentKeyPrefix: string, results: string[]): Promise<void> {
		try {
			const entries = await Neutralino.filesystem.readDirectory(currentPath);
			for (const entry of entries) {
				if (entry.entry === '.' || entry.entry === '..') continue;

				if (entry.type === 'DIRECTORY' && entry.entry.endsWith('@dir')) {
					const dirLogicalName = entry.entry.slice(0, -4);
					const nextKeyPrefix = currentKeyPrefix
						? `${currentKeyPrefix}.${dirLogicalName}`
						: dirLogicalName;

					await this.readDirRecursive(`${currentPath}/${entry.entry}`, nextKeyPrefix, results);
				} else if (entry.type === 'FILE') {
					const fullKey = currentKeyPrefix
						? `${currentKeyPrefix}.${entry.entry}`
						: entry.entry;
					results.push(fullKey);
				}
			}
		} catch (e) {
			// 忽略权限或读取错误
		}
	}

	async delete(key: string): Promise<boolean> {
		const { filePath } = this.resolvePath(key);
		try {
			await Neutralino.filesystem.remove(filePath);
			return true;
		} catch (e) {
			return false;
		}
	}
}