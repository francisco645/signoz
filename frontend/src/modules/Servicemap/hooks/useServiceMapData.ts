import { useMemo } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useSelector } from 'react-redux';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { filterServiceMapSupportedQueries } from 'hooks/useResourceAttribute/utils';
import { AppState } from 'store/reducers';
import APIError from 'types/api/error';
import { GlobalReducer } from 'types/reducer/globalTime';

import type { ServiceMapGraph } from '../types';
import { useDependencyGraph } from './useDependencyGraph';
import { useServiceMapGraph } from './useServiceMapGraph';
import { useServiceMetrics } from './useServiceMetrics';

interface ServiceMapData {
	graph?: ServiceMapGraph;
	error: APIError | null;
	isLoading: boolean;
	isFetching: boolean;
	hasRefreshFailed: boolean;
	hasServicesFailed: boolean;
	refetch: () => void;
}

export const useServiceMapData = (
	queries: IResourceAttribute[],
	enabled: boolean,
): ServiceMapData => {
	const { minTime, maxTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);
	const supportedQueries = useMemo(
		() => filterServiceMapSupportedQueries(queries),
		[queries],
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

	return {
		graph,
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
