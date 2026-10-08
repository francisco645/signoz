import { useState } from 'react';
import getLocalStorage from 'api/browser/localstorage/get';
import setLocalStorage from 'api/browser/localstorage/set';
import { LOCALSTORAGE } from 'constants/localStorage';

/** Per-viewer convenience: falls back to expanded when storage is unavailable. */
export const useLegendCollapsed = (): [boolean, () => void] => {
	const [isCollapsed, setIsCollapsed] = useState(
		() => getLocalStorage(LOCALSTORAGE.SERVICE_MAP_LEGEND_COLLAPSED) === 'true',
	);
	const toggle = (): void => {
		setIsCollapsed((current) => {
			setLocalStorage(LOCALSTORAGE.SERVICE_MAP_LEGEND_COLLAPSED, String(!current));
			return !current;
		});
	};
	return [isCollapsed, toggle];
};
