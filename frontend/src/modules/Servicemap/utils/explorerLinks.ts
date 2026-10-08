import { QueryParams } from 'constants/query';
import {
	initialQueryBuilderFormValuesMap,
	initialQueryState,
} from 'constants/queryBuilder';
import ROUTES from 'constants/routes';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';
import { convertMetricKeyToTrace } from 'hooks/useResourceAttribute/utils';
import { encode } from 'js-base64';
import {
	LogsAggregatorOperator,
	TracesAggregatorOperator,
} from 'types/common/queryBuilder';

interface TimeWindow {
	/** Nanoseconds. */
	minTime: number;
	/** Nanoseconds. */
	maxTime: number;
}

const quote = (value: string): string => `'${value.replace(/'/g, "\\'")}'`;

export const buildScopeExpression = (queries: IResourceAttribute[]): string =>
	queries
		.filter((query) => query.tagValue.length > 0)
		.map((query) => {
			const operator = query.operator === 'IN' ? 'IN' : 'NOT IN';
			const values = query.tagValue.map(quote).join(', ');
			return `${convertMetricKeyToTrace(query.tagKey)} ${operator} (${values})`;
		})
		.join(' AND ');

/** Services have spans of their own; databases and queues only appear on their callers' spans. */
export const buildNodeExpression = (
	id: string,
	hasSpans: boolean,
	scopeExpression: string,
): string => {
	const node = hasSpans
		? `service.name = ${quote(id)}`
		: `(db.system = ${quote(id)} OR messaging.system = ${quote(id)})`;
	return scopeExpression ? `${node} AND ${scopeExpression}` : node;
};

const timeParams = ({ minTime, maxTime }: TimeWindow): URLSearchParams =>
	new URLSearchParams({
		[QueryParams.startTime]: String(Math.floor(minTime / 1e6)),
		[QueryParams.endTime]: String(Math.floor(maxTime / 1e6)),
	});

const explorerLink = (
	route: string,
	dataSource: 'traces' | 'logs',
	expression: string,
	window: TimeWindow,
): string => {
	const params = timeParams(window);
	params.set(
		QueryParams.compositeQuery,
		JSON.stringify({
			...initialQueryState,
			queryType: 'builder',
			builder: {
				...initialQueryState.builder,
				queryData: [
					{
						...initialQueryBuilderFormValuesMap[dataSource],
						aggregateOperator:
							dataSource === 'traces'
								? TracesAggregatorOperator.NOOP
								: LogsAggregatorOperator.NOOP,
						expression,
						filter: { expression },
					},
				],
			},
		}),
	);
	return `${route}?${params.toString()}`;
};

export const getTracesLink = (expression: string, window: TimeWindow): string =>
	explorerLink(ROUTES.TRACES_EXPLORER, 'traces', expression, window);

export const getErrorTracesLink = (
	expression: string,
	window: TimeWindow,
): string =>
	explorerLink(
		ROUTES.TRACES_EXPLORER,
		'traces',
		`${expression} AND has_error = true`,
		window,
	);

export const getLogsLink = (expression: string, window: TimeWindow): string =>
	explorerLink(ROUTES.LOGS_EXPLORER, 'logs', expression, window);

export const getServicePageLink = (
	id: string,
	queries: IResourceAttribute[],
	window: TimeWindow,
): string => {
	const params = timeParams(window);
	params.set(QueryParams.resourceAttributes, encode(JSON.stringify(queries)));
	return `${ROUTES.SERVICE_METRICS.replace(
		':servicename',
		encodeURIComponent(id),
	)}?${params.toString()}`;
};
