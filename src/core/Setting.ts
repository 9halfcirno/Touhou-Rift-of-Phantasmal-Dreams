import { defaultSetting } from "@/configs/defaultSetting";
import { Storage } from "@/storage";

export type SettingValue = string | number | boolean | null;
export type SettingChangeObject = {
	key: string,
	oldValue: SettingValue,
	value: SettingValue
}

export class Setting {
	private storage: Storage;
	private kv: Map<string, SettingValue> = new Map(Object.entries(defaultSetting));

	private onChangeCB: Map<string, Array<(change: SettingChangeObject) => void>> = new Map();

	constructor(storage: Storage) {
		this.storage = storage;
	}

	set(key: string, value: SettingValue) {
		let old = this.get(key);
		this.kv.set(key, value);
		if (old !== value) this._handleChange(key, old || null, this.get(key)!);
	}

	get(key: string): SettingValue | undefined {
		return this.kv.get(key) || defaultSetting[key];
	}

	onChange(key: string, callback: (change: SettingChangeObject) => void) {
		if (!this.onChangeCB.has(key)) {
			this.onChangeCB.set(key, []);
		}
		let arr = this.onChangeCB.get(key)!;
		arr.push(callback);
	}

	private _handleChange(k: string, old: SettingValue, value: SettingValue) {
		let arr = this.onChangeCB.get(k);
		if (!arr) return;
		for (let cb of arr) {
			try {
				cb({
					key: k,
					oldValue: old,
					value: value
				})
			} catch (e) {
				console.error(`[Setting] "${k}" Callback error:`, e);
			}
		}
	}

	async load() {
		let file = await this.storage.read(`setting.main`);
		if (!file) return;

		try {
			let obj = JSON.parse(file);

			this.kv = new Map(Object.entries(obj));
		} catch (e) {
			console.error("解析 setting.json 失败:", e);
		}
	}

	async save() {
		let obj = Object.fromEntries(this.kv.entries());

		let file = JSON.stringify(obj, null, 4);

		let suc = await this.storage.write("setting.json", file);

		if (suc) {
			// 保存成功
		} else {
			// 失败
		}
	}
}