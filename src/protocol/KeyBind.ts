export type KeyBindInfo = {
	type: "key" | "mouse";
	id: Array<string>;
}

const KEYBIND_REGEX = /^(key|mouse):([a-z0-9]+(\|[a-z0-9]+)*)$/;

const KeyBind = {
	parse(k: string): KeyBindInfo {
		const match = k.match(KEYBIND_REGEX);
		if (!match) {
			throw new Error(`无法解析的keybind: "${k}"`);
		}
		return {
			type: match[1] as "key" | "mouse",
			id: match[2].split("|"),
		};
	},
}

export { KeyBind }