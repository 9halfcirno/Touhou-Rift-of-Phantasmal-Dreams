import { KeyBind } from "@/protocol/KeyBind";
import { InputLayer } from "./InputLayer";
import { KeyState } from "./InputLayer";

export class KeyBindManager {
	/** 回调 -> 完整keybind id */
	private _bindKey: WeakMap<(key: KeyState) => void, string> = new WeakMap();
	/** 单个键 -> 回调列表 */
	private _bind: Map<string, Array<(key: KeyState) => void>> = new Map();

	private inputLayer: InputLayer | null = null;

	connect(input: InputLayer) {
		this.inputLayer = input;
		input.keyboard.onKey("all", this._handleKeyboard);
	}

	disconnect() {
		if (!this.inputLayer) return;
		this.inputLayer.keyboard.offKey("all", this._handleKeyboard);
		this.inputLayer = null;
	}

	bind(keybind: string, callback: (key: KeyState) => void) {
		if (this._bindKey.has(callback)) {
			this.unbind(callback); // 解绑旧的绑定
		}
		let keybindObj = KeyBind.parse(keybind).id;
		for (let key of keybindObj) {
			if (!this._bind.has(key)) {
				this._bind.set(key, []);
			}
			this._bind.get(key)?.push(callback);
		}
		this._bindKey.set(callback, keybind);
	}

	unbind(callback: (key: KeyState) => void) {
		const keybind = this._bindKey.get(callback);
		if (!keybind) return;
		let keybindObj = KeyBind.parse(keybind).id;
		for (let key of keybindObj) {
			const callbacks = this._bind.get(key);
			if (!callbacks) continue;
			const index = callbacks.indexOf(callback);
			if (index !== -1) {
				callbacks.splice(index, 1);
			}
		}
		this._bindKey.delete(callback);
	
	}

	private _handleKeyboard = (key: KeyState) => {
		const callbacks = this._bind.get(key.name);
		if (!callbacks) return;
		callbacks.forEach(callback => {
			let keubind = this._bindKey.get(callback);
			if (!keubind) return;
			let keybindArr = KeyBind.parse(keubind).id;
			if (keybindArr.every(k => this.inputLayer!.keyboard.key(k).down)) {
				callback(key);
			}
		});
	
	}
}