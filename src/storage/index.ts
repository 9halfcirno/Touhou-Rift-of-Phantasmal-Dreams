// index.ts

// 导出基础抽象类和选项接口
export { StorageBackend, type StorageListOptions } from "./Backend";

// 导出各个具体的后端存储实现类
export { MemoryStorage } from "./MemoryBackend";
export { LocalStorage } from "./LocalStorageBackend";
export { NeuFileSystemBackend } from "./NeuStorageBackend";

export { Storage } from "./Storage.ts"