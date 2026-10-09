import { useMemo } from 'react';
import { useQuery } from 'react-query';
import getService from 'api/metrics/getService';
import { convertRawQueriesToTraceSelectedTags } from 'hooks/useResourceAttribute/utils';
import type { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import type { ServicesList } from 'types/api/metrics/getService';

import { WEEK_MS } from '../constants';
import type { ServiceComparison, ServiceSample } from '../types/home';
import type { Source } from '../types/sources';
import { compareServices } from '../utils/outsideRange';
import type { HomeClock } from './useHomeClock';
import { toSource } from './toSource';

const toSample = (service: ServicesList): ServiceSample => ({
	name: service.serviceName,
	calls: service.numCalls,
	errors: service.numErrors,
	errorRate: service.errorRate,
	p99Ns: service.p99,
});

const MS_TO_NS = 1e6;

/** RED per service in the window and in the same window a week ago. */
export const useServiceComparison = (
	clock: HomeClock,
	queries: IResourceAttribute[],
	enabled: boolean,
): { source: Source<ServiceComparison[]>; retry: () => void } => {
	const { startMs, endMs, refreshMs } = clock;
	const tags = useMemo(
		() => convertRawQueriesToTraceSelectedTags(queries),
		[queries],
	);
	const scope = JSON.stringify(tags);
	const options = {
		enabled,
		keepPreviousData: true,
		cacheTime: 2 * refreshMs,
		refetchOnWindowFocus: false,
		retry: 1,
	};
	const fetchWindow = (shiftMs: number) => (): ReturnType<typeof getService> =>
		getService({
			start: (startMs - shiftMs) * MS_TO_NS,
			end: (endMs - shiftMs) * MS_TO_NS,
			selectedTags: tags,
		});
	const now = useQuery({
		...options,
		queryKey: ['home', 'services', scope, startMs, endMs],
		queryFn: fetchWindow(0),
	});
	const weekAgo = useQuery({
		...options,
		queryKey: ['home', 'services', scope, startMs - WEEK_MS, endMs - WEEK_MS],
		queryFn: fetchWindow(WEEK_MS),
	});
	const value = useMemo(
		() =>
			now.data && weekAgo.data
				? compareServices(
						now.data.map(toSample),
						weekAgo.data.map(toSample),
						(endMs - startMs) / 1000,
					)
				: undefined,
		[endMs, now.data, startMs, weekAgo.data],
	);
	const failed = now.status === 'error' ? now : weekAgo;
	return {
		source: toSource(failed, value, 3 * refreshMs),
		retry: (): void => {
			void now.refetch();
			void weekAgo.refetch();
		},
	};
};
