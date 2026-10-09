import { useMemo } from 'react';
import {
	Querybuildertypesv5QueryBuilderQueryGithubComSigNozSignozPkgTypesQuerybuildertypesQuerybuildertypesv5TraceAggregationDTOSignal as TraceSignal,
	Querybuildertypesv5QueryEnvelopeBuilderDTOType,
	Querybuildertypesv5QueryRangeRequestDTO,
	Querybuildertypesv5RequestTypeDTO,
	TelemetrytypesFieldContextDTO,
} from 'api/generated/services/sigNoz.schemas';
import { useGetQueryRangeV5 } from 'pages/DashboardPage/DashboardContainer/hooks/useGetQueryRangeV5';

import { PLANE_ATTRIBUTE } from '../utils/planes';

interface ScalarResult {
	columns?: { name: string }[] | null;
	data?: unknown[][] | null;
}

/** One row per service and declared value; the value with most spans wins. */
export const readDeclaredPlanes = (
	result: ScalarResult | undefined,
): Map<string, string> => {
	const columns = result?.columns ?? [];
	const serviceAt = columns.findIndex(
		(column) => column.name === 'service.name',
	);
	const valueAt = columns.findIndex((column) => column.name === PLANE_ATTRIBUTE);
	const countAt = columns.length - 1;
	const best = new Map<string, { value: string; count: number }>();
	if (serviceAt < 0 || valueAt < 0) {
		return new Map();
	}
	(result?.data ?? []).forEach((row) => {
		const service = typeof row[serviceAt] === 'string' ? row[serviceAt] : '';
		const value = typeof row[valueAt] === 'string' ? row[valueAt] : '';
		const count = Number(row[countAt] ?? 0);
		const current = best.get(service);
		if (service && value && (!current || count > current.count)) {
			best.set(service, { value, count });
		}
	});
	return new Map([...best].map(([service, { value }]) => [service, value]));
};

const resourceKey = (
	name: string,
): { name: string; fieldContext: TelemetrytypesFieldContextDTO } => ({
	name,
	fieldContext: TelemetrytypesFieldContextDTO.resource,
});

/**
 * The plane each service declares through its `signoz.service_map.layer`
 * resource attribute, over the map's own window. The map does not wait for it.
 */
export const useDeclaredPlanes = (
	minTime: number,
	maxTime: number,
	enabled: boolean,
): Map<string, string> => {
	const start = Math.floor(minTime / 1e6);
	const end = Math.floor(maxTime / 1e6);
	const requestPayload = useMemo(
		(): Querybuildertypesv5QueryRangeRequestDTO => ({
			schemaVersion: 'v1',
			start,
			end,
			requestType: Querybuildertypesv5RequestTypeDTO.scalar,
			compositeQuery: {
				queries: [
					{
						type: Querybuildertypesv5QueryEnvelopeBuilderDTOType.builder_query,
						spec: {
							name: 'A',
							signal: TraceSignal.traces,
							filter: { expression: `${PLANE_ATTRIBUTE} EXISTS` },
							aggregations: [{ expression: 'count()' }],
							groupBy: [resourceKey('service.name'), resourceKey(PLANE_ATTRIBUTE)],
							limit: 1000,
						},
					},
				],
			},
		}),
		[start, end],
	);
	const { data } = useGetQueryRangeV5({
		requestPayload,
		queryKey: ['service-map-declared-planes', start, end],
		enabled,
	});
	return useMemo(() => {
		const results = (data?.data?.data as { results?: unknown[] } | undefined)
			?.results;
		return readDeclaredPlanes(results?.[0] as ScalarResult | undefined);
	}, [data]);
};
