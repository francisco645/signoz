import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { URL_PARAMS } from '../constants';

export const MAP_VIEWS = ['2d', '3d'] as const;

export type MapView = (typeof MAP_VIEWS)[number];

/** 2D map or 3D panorama, in the URL so a shared link opens the same view. */
export const useMapView = (): [MapView, (view: MapView) => void] => {
	const [view, setView] = useQueryState(
		URL_PARAMS.view,
		parseAsStringLiteral(MAP_VIEWS)
			.withDefault('2d')
			.withOptions({ history: 'replace' }),
	);
	return [view, (next): void => void setView(next === '2d' ? null : next)];
};
