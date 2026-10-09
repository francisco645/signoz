import { useCallback, useEffect, useState } from 'react';

import { HOME_WINDOWS, HomeWindowKey } from '../constants';
import { alignWindow, HomeWindow } from '../utils/window';
import { useDocumentVisible } from './useDocumentVisible';

export interface HomeClock extends HomeWindow {
	windowMs: number;
	refreshMs: number;
	/** When the window last moved, for the "updated at" stamp. */
	tickedAt: number;
	refresh: () => void;
}

/**
 * Moves the window forward every refresh while the tab is visible. A new
 * window is a new query key, so every source reads fresh minutes.
 */
export const useHomeClock = (key: HomeWindowKey): HomeClock => {
	const { windowMs, refreshMs } =
		HOME_WINDOWS.find((option) => option.key === key) ?? HOME_WINDOWS[0];
	const isVisible = useDocumentVisible();
	const [tickedAt, setTickedAt] = useState(() => Date.now());
	const refresh = useCallback(() => setTickedAt(Date.now()), []);

	useEffect(() => {
		if (!isVisible) {
			return undefined;
		}
		if (Date.now() - tickedAt >= refreshMs) {
			refresh();
		}
		const timer = setInterval(refresh, refreshMs);
		return (): void => clearInterval(timer);
	}, [isVisible, refresh, refreshMs, tickedAt]);

	return {
		...alignWindow(tickedAt, windowMs),
		windowMs,
		refreshMs,
		tickedAt,
		refresh,
	};
};
