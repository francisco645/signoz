import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import getLocalStorage from 'api/browser/localstorage/get';
import setLocalStorage from 'api/browser/localstorage/set';
import { useGetMetricsOnboardingStatus } from 'api/generated/services/metrics';
import { queryRangeV5 } from 'api/generated/services/querier';
import { LOCALSTORAGE } from 'constants/localStorage';

import { MINUTE_MS, WEEK_MS } from '../constants';
import { hasTelemetryRequest } from '../utils/queries';

export type HomeMode = 'pending' | 'overview' | 'onboarding';

const readRemembered = (): boolean => {
	try {
		return getLocalStorage(LOCALSTORAGE.HOME_HAS_TELEMETRY) === 'true';
	} catch {
		return false;
	}
};

const hasRows = (data: unknown): boolean =>
	(
		(data as { data?: { data?: { results?: { data?: unknown[][] }[] } } })?.data
			?.data?.results ?? []
	).some((result) =>
		(result.data ?? []).some((row) => Number(row[row.length - 1]) > 0),
	);

/**
 * The overview once the install has sent data in the last week, so a quiet
 * blind spot stays on the overview. Remembered, so it shows at once next time;
 * only a successful "no data" brings onboarding back, never an error.
 */
export const useHomeMode = (): HomeMode => {
	const [remembered] = useState(readRemembered);
	const [range] = useState(() => {
		const endMs = Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
		return { startMs: endMs - WEEK_MS, endMs };
	});
	const telemetry = useQuery({
		queryKey: ['home', 'has-telemetry', range.endMs],
		queryFn: ({ signal }) =>
			queryRangeV5(hasTelemetryRequest(range.startMs, range.endMs), signal),
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const metrics = useGetMetricsOnboardingStatus();

	const decided = useMemo((): HomeMode | undefined => {
		if (telemetry.data && hasRows(telemetry.data)) {
			return 'overview';
		}
		if (metrics.data?.data?.hasMetrics) {
			return 'overview';
		}
		if (telemetry.isError && metrics.isError) {
			return 'overview';
		}
		if (telemetry.isSuccess && metrics.isSuccess) {
			return 'onboarding';
		}
		return undefined;
	}, [
		metrics.data,
		metrics.isError,
		metrics.isSuccess,
		telemetry.data,
		telemetry.isError,
		telemetry.isSuccess,
	]);

	useEffect(() => {
		if (decided) {
			setLocalStorage(
				LOCALSTORAGE.HOME_HAS_TELEMETRY,
				String(decided === 'overview'),
			);
		}
	}, [decided]);

	if (decided) {
		return decided;
	}
	return remembered ? 'overview' : 'pending';
};
