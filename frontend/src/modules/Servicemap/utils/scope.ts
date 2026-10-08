import { whilelistedKeys } from 'hooks/useResourceAttribute/config';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { convertMetricKeyToTrace } from 'hooks/useResourceAttribute/utils';

import type { ServiceMapScope } from '../types';

const IN_OPERATOR = 'IN';

const ENVIRONMENT_ATTRIBUTE = 'deployment.environment';
const CLUSTER_ATTRIBUTE = 'k8s.cluster.name';

const attributeOf = (query: IResourceAttribute): string =>
	convertMetricKeyToTrace(query.tagKey);

const isNarrowing = (query: IResourceAttribute): boolean =>
	query.operator === IN_OPERATOR && query.tagValue.length > 0;

export const formatFilter = (query: IResourceAttribute): string =>
	`${attributeOf(query)} ${query.operator} ${query.tagValue.join(', ')}`;

/**
 * The backend sums every environment, cluster and namespace that a filter leaves
 * in, so the map is only accurate once an environment or a cluster narrows it.
 */
export const getServiceMapScope = (
	queries: IResourceAttribute[],
): ServiceMapScope => {
	const environmentQueries = queries.filter(
		(query) => attributeOf(query) === ENVIRONMENT_ATTRIBUTE,
	);
	const environments = [
		...new Set(environmentQueries.filter(isNarrowing).flatMap((q) => q.tagValue)),
	];
	const excludesEnvironments = environmentQueries.some(
		(query) => query.operator !== IN_OPERATOR,
	);

	return {
		environments,
		hasScope: queries.some(
			(query) =>
				isNarrowing(query) &&
				[ENVIRONMENT_ATTRIBUTE, CLUSTER_ATTRIBUTE].includes(attributeOf(query)),
		),
		isMixedEnvironments:
			environments.length > 1 ||
			(excludesEnvironments && environments.length === 0),
		ignoredFilters: queries
			.filter((query) => !whilelistedKeys.includes(query.tagKey))
			.map(formatFilter),
	};
};
