import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { queryRangeV5 } from 'api/generated/services/querier';
import { getResourceDeploymentKeys } from 'hooks/useResourceAttribute/utils';
import useResourceAttribute from 'hooks/useResourceAttribute';
import type { IResourceAttribute } from 'hooks/useResourceAttribute/types';

import { environmentsRequest } from '../utils/queries';
import type { HomeClock } from './useHomeClock';

export interface HomeScope {
	queries: IResourceAttribute[];
	environments: string[];
	/** Environments with traces in the window, busiest first. */
	options: string[];
	setEnvironment: (environment: string) => void;
}

const rowsOf = (data: unknown): unknown[][] =>
	(data as { data?: { data?: { results?: { data?: unknown[][] }[] } } })?.data
		?.data?.results?.[0]?.data ?? [];

/** The environment filter shared with the Service Map; empty opens on the busiest. */
export const useHomeScope = (clock: HomeClock): HomeScope => {
	const { queries, handleEnvironmentChange } = useResourceAttribute();
	const environments = useMemo(
		() =>
			queries.find((query) => query.tagKey === getResourceDeploymentKeys())
				?.tagValue ?? [],
		[queries],
	);
	const { data } = useQuery({
		queryKey: ['home', 'environments', clock.startMs, clock.endMs],
		queryFn: ({ signal }) =>
			queryRangeV5(environmentsRequest(clock.startMs, clock.endMs), signal),
		keepPreviousData: true,
		refetchOnWindowFocus: false,
		staleTime: clock.refreshMs * 5,
	});
	const options = useMemo(
		() =>
			rowsOf(data)
				.map((row) => row[0])
				.filter((value): value is string => typeof value === 'string' && !!value),
		[data],
	);

	useEffect(() => {
		if (environments.length === 0 && options.length > 0) {
			handleEnvironmentChange([options[0]]);
		}
	}, [environments.length, handleEnvironmentChange, options]);

	return {
		queries,
		environments,
		options,
		setEnvironment: (environment): void => handleEnvironmentChange([environment]),
	};
};
