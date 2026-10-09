import { useMemo } from 'react';
import { useListRules } from 'api/generated/services/rules';

import { MINUTE_MS, SERVICE_LABEL_KEYS } from '../constants';
import type { RuleSummary } from '../types/home';
import type { Source } from '../types/sources';
import { toSource } from './toSource';

const REFRESH_MS = 2 * MINUTE_MS;

export const useRuleStates = (): {
	source: Source<RuleSummary[]>;
	retry: () => void;
} => {
	const query = useListRules({
		query: { refetchInterval: REFRESH_MS, retry: 1 },
	});
	const value = useMemo(
		() =>
			query.data?.data?.map(
				(rule): RuleSummary => ({
					id: String(rule.id ?? ''),
					name: rule.alert ?? 'Unnamed rule',
					state: String(rule.state ?? ''),
					service: SERVICE_LABEL_KEYS.map((key) => rule.labels?.[key]).find(Boolean),
					updatedAtMs: rule.updatedAt
						? Date.parse(String(rule.updatedAt))
						: undefined,
				}),
			),
		[query.data],
	);
	return {
		source: toSource(query, value, 3 * REFRESH_MS),
		retry: (): void => void query.refetch(),
	};
};
