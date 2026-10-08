import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
// eslint-disable-next-line no-restricted-imports
import { useSelector } from 'react-redux';
import { AxiosError } from 'axios';
import { useQueryService } from 'hooks/useQueryService';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { convertRawQueriesToTraceSelectedTags } from 'hooks/useResourceAttribute/utils';
import { AppState } from 'store/reducers';
import { PayloadProps } from 'types/api/metrics/getService';
import { GlobalReducer } from 'types/reducer/globalTime';

interface UseServiceMetricsProps {
	minTime: number;
	maxTime: number;
	queries: IResourceAttribute[];
	enabled: boolean;
}

/** RED per service from `/api/v2/services`, the source of the Services page. */
export const useServiceMetrics = ({
	minTime,
	maxTime,
	queries,
	enabled,
}: UseServiceMetricsProps): UseQueryResult<PayloadProps, AxiosError> => {
	const { selectedTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);
	const selectedTags = useMemo(
		() => convertRawQueriesToTraceSelectedTags(queries),
		[queries],
	);

	return useQueryService({
		minTime,
		maxTime,
		selectedTime,
		selectedTags,
		options: { enabled, keepPreviousData: true, refetchOnWindowFocus: false },
	});
};
