import { useMemo } from 'react';
import { useQuery, UseQueryResult } from 'react-query';
import getDependencyGraph from 'api/serviceMap/getDependencyGraph';
import { REACT_QUERY_KEY } from 'constants/reactQueryKeys';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { convertRawQueriesToTraceSelectedTags } from 'hooks/useResourceAttribute/utils';
import APIError from 'types/api/error';
import { PayloadProps } from 'types/api/serviceMap/getDependencyGraph';

interface UseDependencyGraphProps {
	minTime: number;
	maxTime: number;
	queries: IResourceAttribute[];
	enabled?: boolean;
}

export const useDependencyGraph = ({
	minTime,
	maxTime,
	queries,
	enabled = true,
}: UseDependencyGraphProps): UseQueryResult<PayloadProps, APIError> => {
	const tags = useMemo(
		() => convertRawQueriesToTraceSelectedTags(queries),
		[queries],
	);

	return useQuery<PayloadProps, APIError>({
		queryKey: [
			REACT_QUERY_KEY.AUTO_REFRESH_QUERY,
			REACT_QUERY_KEY.GET_SERVICE_MAP_DEPENDENCIES,
			minTime,
			maxTime,
			tags,
		],
		queryFn: ({ signal }) =>
			getDependencyGraph({ start: minTime, end: maxTime, tags }, signal),
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		enabled,
	});
};
