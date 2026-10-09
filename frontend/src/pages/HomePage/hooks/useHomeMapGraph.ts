import { useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import getService from 'api/metrics/getService';
import { convertRawQueriesToTraceSelectedTags } from 'hooks/useResourceAttribute/utils';
import type { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { useDependencyGraph } from 'modules/Servicemap/hooks/useDependencyGraph';
import { useServiceMapGraph } from 'modules/Servicemap/hooks/useServiceMapGraph';
import type { ServiceMapGraph } from 'modules/Servicemap/types';
import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

const MS_TO_NS = 1e6;

const structureOf = (dependencies: ServiceMapDependency[]): string =>
	dependencies
		.map(({ parent, child }) => `${parent}>${child}`)
		.sort()
		.join('|');

export interface HomeMapGraph {
	graph?: ServiceMapGraph;
	isLoading: boolean;
	isError: boolean;
	retry: () => void;
}

/**
 * The topology of the window; rebuilt only when edges come or go, so the
 * nodes and the camera stay still on every refresh.
 */
export const useHomeMapGraph = (
	startMs: number,
	endMs: number,
	queries: IResourceAttribute[],
	services: ServicesList[] | undefined,
	enabled: boolean,
): HomeMapGraph => {
	const query = useDependencyGraph({
		minTime: startMs * MS_TO_NS,
		maxTime: endMs * MS_TO_NS,
		queries,
		enabled,
	});
	// The blind state has no live service metrics: fetch them for its own window.
	const tags = useMemo(
		() => convertRawQueriesToTraceSelectedTags(queries),
		[queries],
	);
	const ownServices = useQuery({
		queryKey: ['home', 'map-services', JSON.stringify(tags), startMs, endMs],
		queryFn: () =>
			getService({
				start: startMs * MS_TO_NS,
				end: endMs * MS_TO_NS,
				selectedTags: tags,
			}),
		enabled: enabled && !services,
		refetchOnWindowFocus: false,
	});
	const stable = useRef<{ key: string; value: ServiceMapDependency[] }>();
	const dependencies = useMemo(() => {
		if (!query.data) {
			return undefined;
		}
		const key = structureOf(query.data);
		if (stable.current?.key !== key) {
			stable.current = { key, value: query.data };
		}
		return stable.current.value;
	}, [query.data]);
	const graph = useServiceMapGraph(dependencies, services ?? ownServices.data);
	return {
		graph,
		isLoading: enabled && query.isLoading,
		isError: query.isError,
		retry: (): void => void query.refetch(),
	};
};
