import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { queryRangeV5 } from 'api/generated/services/querier';

import { MINUTE_MS } from '../constants';
import { lastTracesRequest } from '../utils/queries';
import { lastSeenMs, QuerySeries } from '../utils/telemetry';

const LOOKBACK_MS = 6 * 60 * MINUTE_MS;
const BUCKET_MS = 5 * MINUTE_MS;

export interface LastTraceAt {
	isLoading: boolean;
	/** End of the last five minutes with traces, within the last six hours. */
	lastTraceMs?: number;
}

/** Only for the blind state: when traces stopped, to draw the last known map. */
export const useLastTraceAt = (
	endMs: number,
	environments: readonly string[],
	enabled: boolean,
): LastTraceAt => {
	const query = useQuery({
		queryKey: ['home', 'last-trace', environments.join(','), endMs],
		queryFn: ({ signal }) =>
			queryRangeV5(
				lastTracesRequest(endMs - LOOKBACK_MS, endMs, environments),
				signal,
			),
		enabled,
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const lastTraceMs = useMemo(() => {
		const result = (
			query.data as { data?: { data?: { results?: QuerySeries[] } } } | undefined
		)?.data?.data?.results?.[0];
		const end = lastSeenMs(result);
		// Buckets are five minutes wide, not one.
		return end === undefined ? undefined : end - MINUTE_MS + BUCKET_MS;
	}, [query.data]);
	return { isLoading: enabled && query.isLoading, lastTraceMs };
};
