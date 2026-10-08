import { useState } from 'react';
import getLocalStorage from 'api/browser/localstorage/get';
import setLocalStorage from 'api/browser/localstorage/set';
import { LOCALSTORAGE } from 'constants/localStorage';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface AnimateDirection {
	/** Edge motion is on: the viewer wants it and the system does not ask for less motion. */
	isEnabled: boolean;
	/** The viewer's own choice, kept even while reduced motion forces motion off. */
	isPreferred: boolean;
	isBlockedByReducedMotion: boolean;
	setPreferred: (value: boolean) => void;
}

/** On by default; reduced motion always wins over the saved choice. */
export const useAnimateDirection = (): AnimateDirection => {
	const prefersReducedMotion = usePrefersReducedMotion();
	const [isPreferred, setIsPreferred] = useState(
		() => getLocalStorage(LOCALSTORAGE.SERVICE_MAP_ANIMATE_DIRECTION) !== 'false',
	);

	return {
		isEnabled: isPreferred && !prefersReducedMotion,
		isPreferred,
		isBlockedByReducedMotion: prefersReducedMotion,
		setPreferred: (value): void => {
			setIsPreferred(value);
			setLocalStorage(LOCALSTORAGE.SERVICE_MAP_ANIMATE_DIRECTION, String(value));
		},
	};
};
