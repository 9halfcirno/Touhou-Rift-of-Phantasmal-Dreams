import { StorageBackend } from "./Backend";
import { LocalStorage } from "./LocalStorageBackend";
import { MemoryStorage } from "./MemoryBackend";
import { NeuFileSystemBackend } from "./NeuStorageBackend";

let backends = [
	NeuFileSystemBackend,
	LocalStorage,
	MemoryStorage
]

export class Storage extends EventTarget {
	backend: StorageBackend | null = null;
	constructor() {
		super();
	}

	async init() {
		let usable: ({ new(): StorageBackend; available(): boolean }) | null = null;
		for (let b of backends) {
			if (b.available() === true) {
				usable = b;
				break;
			}
		}
		if (!usable) {
			throw new Error("No available storage backend found.");
		}
		this.backend = new usable();
	}

	private ensureBackend(): StorageBackend {
		if (!this.backend) {
			throw new Error("Storage backend is not initialized.");
		}
		return this.backend;
	}

	/**
	 * 
	 * @param key 读取的键名
	 */
	async read(key: string) {
		return await this.ensureBackend().read(key);
	}

	/**
	 * 
	 * @param key 写入的键名
	 * @param content 写入内容
	 */
	async write(key: string, content: string) {
		return await this.ensureBackend().write(key, content);
	}

	async delete(key: string) {
		return await this.ensureBackend().delete(key);
	}

	async exists(key: string) {
		return await this.ensureBackend().exists(key);
	}

	async list(key: string) {
		return await this.ensureBackend().list(key);
	}
}