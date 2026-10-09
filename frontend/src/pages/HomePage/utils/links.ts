import { QueryParams } from 'constants/query';
import ROUTES from 'constants/routes';
import type { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { encode } from 'js-base64';

/** The Service Map with the Home's environment and window, optionally on one service. */
export const serviceMapLink = (
	queries: IResourceAttribute[],
	startMs: number,
	endMs: number,
	selected?: string,
): string => {
	const params = new URLSearchParams({
		[QueryParams.startTime]: String(startMs),
		[QueryParams.endTime]: String(endMs),
	});
	if (queries.length) {
		params.set(QueryParams.resourceAttributes, encode(JSON.stringify(queries)));
	}
	if (selected) {
		params.set('selected', selected);
	}
	return `${ROUTES.SERVICE_MAP}?${params.toString()}`;
};

export const serviceLink = (name: string): string =>
	ROUTES.SERVICE_METRICS.replace(':servicename', encodeURIComponent(name));
