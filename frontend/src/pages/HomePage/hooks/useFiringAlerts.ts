import { useMemo } from 'react';
import { useGetAlerts } from 'api/generated/services/alerts';

import { MINUTE_MS } from '../constants';
import type { AlertSummary } from '../types/home';
import type { Source } from '../types/sources';
import { summarizeAlerts } from '../utils/alerts';
import { toSource } from './toSource';

/** Shares the bottom strip's query, so the Home makes one alerts request. */
export const useFiringAlerts = (
	environments: readonly string[],
): { source: Source<AlertSummary>; retry: () => void } => {
	const query = useGetAlerts({
		query: { refetchInterval: MINUTE_MS, retry: 1 },
	});
	const value = useMemo(
		() =>
			query.data?.data
				? summarizeAlerts(query.data.data, environments)
				: undefined,
		[environments, query.data],
	);
	return {
		source: toSource(query, value, 3 * MINUTE_MS),
		retry: (): void => void query.refetch(),
	};
};
