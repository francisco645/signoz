import { useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSelector } from 'react-redux';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { AppState } from 'store/reducers';
import APIError from 'types/api/error';
import type { ServicesList } from 'types/api/metrics/getService';
import { GlobalReducer } from 'types/reducer/globalTime';

import type { ServiceMapGraph } from '../types';
import { useDependencyGraph } from './useDependencyGraph';
import { useServiceMapGraph } from './useServiceMapGraph';
import { useServiceMetrics } from './useServiceMetrics';

interface ServiceMapData {
	graph?: ServiceMapGraph;
	services: ReadonlyMap<string, ServicesList>;
	minTime: number;
	maxTime: number;
	error: APIError | null;
	isLoading: boolean;
	isFetching: boolean;
	hasRefreshFailed: boolean;
	hasServicesFailed: boolean;
	refetch: () => void;
}

/** `queries` are the filters the service map API applies. */
export const useServiceMapData = (
	supportedQueries: IResourceAttribute[],
	enabled: boolean,
): ServiceMapData => {
	const { minTime, maxTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	const dependencies = useDependencyGraph({
		minTime,
		maxTime,
		queries: supportedQueries,
		enabled,
	});
	const services = useServiceMetrics({
		minTime,
		maxTime,
		queries: supportedQueries,
		enabled,
	});

	const graph = useServiceMapGraph(dependencies.data, services.data);
	const servicesByName = useMemo(
		() =>
			new Map(
				(services.data ?? []).map((service) => [service.serviceName, service]),
			),
		[services.data],
	);

	return {
		graph,
		services: servicesByName,
		minTime,
		maxTime,
		error: dependencies.error,
		isLoading: dependencies.isLoading,
		isFetching: dependencies.isFetching || services.isFetching,
		hasRefreshFailed: dependencies.isError && !!dependencies.data,
		hasServicesFailed: services.isError,
		refetch: (): void => {
			void dependencies.refetch();
			void services.refetch();
		},
	};
};
