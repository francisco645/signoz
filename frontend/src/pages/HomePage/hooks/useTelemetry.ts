import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useGetMetricsOnboardingStatus } from 'api/generated/services/metrics';
import { queryRangeV5 } from 'api/generated/services/querier';

import type { TelemetrySnapshot } from '../types/home';
import type { Source } from '../types/sources';
import { telemetryRequest, TELEMETRY_QUERIES } from '../utils/queries';
import { QuerySeries, toSignalSnapshot } from '../utils/telemetry';
import type { HomeClock } from './useHomeClock';
import { toSource } from './toSource';

const resultsOf = (data: unknown): QuerySeries[] =>
	((data as { data?: { data?: { results?: QuerySeries[] } } })?.data?.data
		?.results ?? []) as QuerySeries[];

export const useTelemetry = (
	clock: HomeClock,
	environments: readonly string[],
): { source: Source<TelemetrySnapshot>; retry: () => void } => {
	const { startMs, endMs, refreshMs } = clock;
	const query = useQuery({
		queryKey: ['home', 'telemetry', environments.join(','), startMs, endMs],
		queryFn: ({ signal }) =>
			queryRangeV5(telemetryRequest(startMs, endMs, environments), signal),
		keepPreviousData: true,
		cacheTime: 2 * refreshMs,
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const metrics = useGetMetricsOnboardingStatus({
		query: { staleTime: 10 * refreshMs },
	});
	const value = useMemo((): TelemetrySnapshot | undefined => {
		if (!query.data) {
			return undefined;
		}
		const byName = new Map(
			resultsOf(query.data).map((result) => [result.queryName, result]),
		);
		return {
			traces: toSignalSnapshot(
				'traces',
				byName.get(TELEMETRY_QUERIES.traces),
				byName.get(TELEMETRY_QUERIES.tracesWeekAgo),
			),
			logs: toSignalSnapshot(
				'logs',
				byName.get(TELEMETRY_QUERIES.logs),
				byName.get(TELEMETRY_QUERIES.logsWeekAgo),
			),
			metrics: {
				signal: 'metrics',
				isReceiving: metrics.data?.data?.hasMetrics,
			},
		};
	}, [metrics.data, query.data]);
	return {
		source: toSource(query, value, 3 * refreshMs),
		retry: (): void => void query.refetch(),
	};
};
