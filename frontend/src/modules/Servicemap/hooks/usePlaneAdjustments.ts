import { useCallback, useState } from 'react';
import getLocalStorage from 'api/browser/localstorage/get';
import setLocalStorage from 'api/browser/localstorage/set';
import { LOCALSTORAGE } from 'constants/localStorage';

import { isPanoramaTier, PanoramaTier } from '../utils/tiers';

export interface PlaneAdjustments {
	adjusted: ReadonlyMap<string, PanoramaTier>;
	/** `undefined` goes back to the declared or inferred plane. */
	setPlane: (id: string, tier: PanoramaTier | undefined) => void;
	/** Replaces every adjustment, to reset or to undo a reset. */
	replaceAll: (next: ReadonlyMap<string, PanoramaTier>) => void;
}

const read = (): Map<string, PanoramaTier> => {
	try {
		const stored = JSON.parse(
			getLocalStorage(LOCALSTORAGE.SERVICE_MAP_PLANE_ADJUSTMENTS) ?? '{}',
		) as Record<string, unknown>;
		return new Map(
			Object.entries(stored).filter((entry): entry is [string, PanoramaTier] =>
				isPanoramaTier(entry[1]),
			),
		);
	} catch {
		return new Map();
	}
};

/** Planes you moved services to, kept in this browser only. */
export const usePlaneAdjustments = (): PlaneAdjustments => {
	const [adjusted, setAdjusted] = useState(read);

	const replaceAll = useCallback(
		(next: ReadonlyMap<string, PanoramaTier>): void => {
			setAdjusted(new Map(next));
			setLocalStorage(
				LOCALSTORAGE.SERVICE_MAP_PLANE_ADJUSTMENTS,
				JSON.stringify(Object.fromEntries(next)),
			);
		},
		[],
	);

	const setPlane = useCallback(
		(id: string, tier: PanoramaTier | undefined): void => {
			const next = new Map(read());
			if (tier) {
				next.set(id, tier);
			} else {
				next.delete(id);
			}
			replaceAll(next);
		},
		[replaceAll],
	);

	return { adjusted, setPlane, replaceAll };
};
