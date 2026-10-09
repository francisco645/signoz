import { MINUTE_MS, TELEMETRY } from '../constants';
import type { SignalSnapshot, TelemetrySignal } from '../types/home';

export interface SeriesPoint {
	timestamp?: number;
	value?: number;
}

export interface QuerySeries {
	queryName?: string;
	aggregations?:
		| { series?: { values?: SeriesPoint[] | null }[] | null }[]
		| null;
}

const pointsOf = (result?: QuerySeries): SeriesPoint[] =>
	(result?.aggregations ?? []).flatMap((aggregation) =>
		(aggregation.series ?? []).flatMap((series) => series.values ?? []),
	);

export const sumSeries = (result?: QuerySeries): number | undefined =>
	result
		? pointsOf(result).reduce((sum, point) => sum + (point.value ?? 0), 0)
		: undefined;

/** End of the last bucket with data; buckets are a minute wide. */
export const lastSeenMs = (result?: QuerySeries): number | undefined => {
	const timestamps = pointsOf(result)
		.filter((point) => (point.value ?? 0) > 0 && point.timestamp !== undefined)
		.map((point) => point.timestamp as number);
	return timestamps.length ? Math.max(...timestamps) + MINUTE_MS : undefined;
};

/** A ratio only when last week had enough to compare against. */
export const volumeRatio = (
	count?: number,
	weekAgoCount?: number,
): number | undefined =>
	count === undefined ||
	weekAgoCount === undefined ||
	weekAgoCount < TELEMETRY.minBaseline
		? undefined
		: count / weekAgoCount;

export const toSignalSnapshot = (
	signal: TelemetrySignal,
	now?: QuerySeries,
	weekAgo?: QuerySeries,
): SignalSnapshot => {
	const count = sumSeries(now);
	const weekAgoCount = sumSeries(weekAgo);
	return {
		signal,
		count,
		weekAgoCount,
		ratio: volumeRatio(count, weekAgoCount),
		lastSeenMs: lastSeenMs(now),
	};
};

export const isLow = (snapshot: SignalSnapshot): boolean =>
	snapshot.ratio !== undefined && snapshot.ratio < TELEMETRY.lowRatio;

/** No traces in the window although last week had them: the Home cannot judge health. */
export const isSilent = (snapshot: SignalSnapshot): boolean =>
	snapshot.count === 0 && (snapshot.weekAgoCount ?? 0) > 0;
