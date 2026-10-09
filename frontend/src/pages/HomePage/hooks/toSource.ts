import type { UseQueryResult } from 'react-query';

import type { Source } from '../types/sources';

/** A failed refresh keeps the last value as stale until it is too old to trust. */
export const toSource = <T, R = unknown>(
	query: Pick<
		UseQueryResult<R>,
		'status' | 'error' | 'dataUpdatedAt' | 'isFetching'
	>,
	value: T | undefined,
	maxAgeMs: number,
	nowMs = Date.now(),
): Source<T> => {
	if (value === undefined) {
		return query.status === 'error'
			? { status: 'failed', error: query.error }
			: { status: 'loading' };
	}
	if (query.status === 'error') {
		return nowMs - query.dataUpdatedAt > maxAgeMs
			? { status: 'failed', error: query.error }
			: {
					status: 'stale',
					value,
					updatedAt: query.dataUpdatedAt,
					error: query.error,
				};
	}
	return { status: 'ready', value, updatedAt: query.dataUpdatedAt };
};
