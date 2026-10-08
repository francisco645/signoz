import { useEffect, useMemo, useRef } from 'react';
import type { ServicesList } from 'types/api/metrics/getService';
import type { ServiceMapDependency } from 'types/api/serviceMap/getDependencyGraph';

import type { ServiceMapGraph } from '../types';
import { buildGraph, getNodePositions } from '../utils/buildGraph';

/** Rebuilds the graph when the data changes, keeping the nodes where they were. */
export const useServiceMapGraph = (
	dependencies: ServiceMapDependency[] | undefined,
	services: ServicesList[] | undefined,
): ServiceMapGraph | undefined => {
	const previousRef = useRef<ServiceMapGraph>();

	const graph = useMemo(
		() =>
			dependencies
				? buildGraph(
						dependencies,
						services,
						getNodePositions(previousRef.current?.nodes ?? []),
					)
				: undefined,
		[dependencies, services],
	);

	useEffect(() => {
		previousRef.current = graph;
	}, [graph]);

	return graph;
};
