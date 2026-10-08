import { useEffect, useState } from 'react';

const LABEL_FONTS = [
	'500 22px "Geist Mono"',
	'600 24px Inter',
	'400 18px Inter',
];
/** Labels draw with the fallback font rather than wait longer than this. */
const FONT_TIMEOUT_MS = 2500;

/** Labels are painted once onto textures: wait for their fonts, or they stay in the fallback. */
export const useLabelFonts = (): boolean => {
	const [isReady, setIsReady] = useState(false);
	useEffect(() => {
		let isActive = true;
		const loaded = document.fonts
			? Promise.all(LABEL_FONTS.map((font) => document.fonts.load(font)))
			: Promise.resolve();
		const timeout = new Promise((resolve) => {
			setTimeout(resolve, FONT_TIMEOUT_MS);
		});
		void Promise.race([loaded, timeout])
			.catch(() => undefined)
			.then(() => {
				if (isActive) {
					setIsReady(true);
				}
				return undefined;
			});
		return (): void => {
			isActive = false;
		};
	}, []);
	return isReady;
};
