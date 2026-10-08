import { QueryParams } from 'constants/query';

/**
 * The current page with the time range pinned: a relative range would show
 * another window to whoever opens the link later.
 */
export const buildShareLink = (
	href: string,
	minTime: number,
	maxTime: number,
): string => {
	const url = new URL(href);
	url.searchParams.delete(QueryParams.relativeTime);
	url.searchParams.set(QueryParams.startTime, String(Math.floor(minTime / 1e6)));
	url.searchParams.set(QueryParams.endTime, String(Math.floor(maxTime / 1e6)));
	return url.toString();
};
