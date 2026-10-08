import { useMemo } from 'react';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import type { ServicesList } from 'types/api/metrics/getService';

import { useServiceMetrics } from './useServiceMetrics';

const DAY_NS = 24 * 60 * 60 * 1e9;

/** Same window a day earlier, fetched only while the panel is open. */
export const useYesterdayServices = (
	minTime: number,
	maxTime: number,
	queries: IResourceAttribute[],
	enabled: boolean,
): ReadonlyMap<string, ServicesList> => {
	const { data } = useServiceMetrics({
		minTime: minTime - DAY_NS,
		maxTime: maxTime - DAY_NS,
		queries,
		enabled,
	});

	return useMemo(
		() => new Map((data ?? []).map((service) => [service.serviceName, service])),
		[data],
	);
};
