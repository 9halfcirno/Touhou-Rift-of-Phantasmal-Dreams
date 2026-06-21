// src/neutralino.d.ts
import * as Neutralinojs from '@neutralinojs/lib';

declare global {
	interface Window {
		Neutralino: typeof Neutralinojs;
	}
	const Neutralino: typeof Neutralinojs;
}