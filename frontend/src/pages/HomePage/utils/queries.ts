import {
	Querybuildertypesv5QueryBuilderQueryGithubComSigNozSignozPkgTypesQuerybuildertypesQuerybuildertypesv5TraceAggregationDTOSignal as TraceSignal,
	Querybuildertypesv5QueryEnvelopeBuilderDTOType,
	Querybuildertypesv5BuilderQuerySpecDTO,
	Querybuildertypesv5QueryEnvelopeDTO,
	Querybuildertypesv5QueryRangeRequestDTO,
	Querybuildertypesv5RequestTypeDTO,
	TelemetrytypesFieldContextDTO,
} from 'api/generated/services/sigNoz.schemas';

import { WEEK_MS } from '../constants';

type CountSignal = 'traces' | 'logs';

const quote = (value: string): string => `'${value.replace(/'/g, "\\'")}'`;

/** `deployment.environment IN (...)`, or nothing for every environment. */
export const environmentFilter = (environments: readonly string[]): string =>
	environments.length
		? `deployment.environment IN (${environments.map(quote).join(', ')})`
		: '';

const countQuery = (
	name: string,
	signal: CountSignal,
	filter: string,
	shiftSec?: number,
	stepSec = 60,
): Querybuildertypesv5QueryEnvelopeDTO => ({
	type: Querybuildertypesv5QueryEnvelopeBuilderDTOType.builder_query,
	// The generated union types `signal` per variant; logs and traces share this shape.
	spec: {
		name,
		signal: signal as TraceSignal,
		stepInterval: stepSec,
		aggregations: [{ expression: 'count()' }],
		...(filter ? { filter: { expression: filter } } : {}),
		...(shiftSec
			? { functions: [{ name: 'timeShift', args: [{ value: shiftSec }] }] }
			: {}),
	} as Querybuildertypesv5BuilderQuerySpecDTO,
});

export const TELEMETRY_QUERIES = {
	traces: 'A',
	logs: 'B',
	tracesWeekAgo: 'C',
	logsWeekAgo: 'D',
} as const;

/** Traces and logs per minute, now and a week ago, in one request. */
export const telemetryRequest = (
	startMs: number,
	endMs: number,
	environments: readonly string[],
): Querybuildertypesv5QueryRangeRequestDTO => {
	const filter = environmentFilter(environments);
	const week = WEEK_MS / 1000;
	return {
		schemaVersion: 'v1',
		start: startMs,
		end: endMs,
		requestType: Querybuildertypesv5RequestTypeDTO.time_series,
		compositeQuery: {
			queries: [
				countQuery(TELEMETRY_QUERIES.traces, 'traces', filter),
				countQuery(TELEMETRY_QUERIES.logs, 'logs', filter),
				countQuery(TELEMETRY_QUERIES.tracesWeekAgo, 'traces', filter, week),
				countQuery(TELEMETRY_QUERIES.logsWeekAgo, 'logs', filter, week),
			],
		},
	};
};

/** Traces per five minutes over the last hours, to find when they stopped. */
export const lastTracesRequest = (
	startMs: number,
	endMs: number,
	environments: readonly string[],
): Querybuildertypesv5QueryRangeRequestDTO => ({
	schemaVersion: 'v1',
	start: startMs,
	end: endMs,
	requestType: Querybuildertypesv5RequestTypeDTO.time_series,
	compositeQuery: {
		queries: [
			countQuery('A', 'traces', environmentFilter(environments), undefined, 300),
		],
	},
});

const resourceKey = (
	name: string,
): { name: string; fieldContext: TelemetrytypesFieldContextDTO } => ({
	name,
	fieldContext: TelemetrytypesFieldContextDTO.resource,
});

/** Spans per environment, to open the Home on the busiest one. */
export const environmentsRequest = (
	startMs: number,
	endMs: number,
): Querybuildertypesv5QueryRangeRequestDTO => ({
	schemaVersion: 'v1',
	start: startMs,
	end: endMs,
	requestType: Querybuildertypesv5RequestTypeDTO.scalar,
	compositeQuery: {
		queries: [
			{
				type: Querybuildertypesv5QueryEnvelopeBuilderDTOType.builder_query,
				spec: {
					name: 'A',
					signal: TraceSignal.traces,
					aggregations: [{ expression: 'count()' }],
					groupBy: [resourceKey('deployment.environment')],
					order: [{ key: { name: 'count()' }, direction: 'desc' }],
					limit: 10,
				} as Querybuildertypesv5BuilderQuerySpecDTO,
			},
		],
	},
});

/** Whether the install ever sent traces or logs in the last week. */
export const hasTelemetryRequest = (
	startMs: number,
	endMs: number,
): Querybuildertypesv5QueryRangeRequestDTO => ({
	schemaVersion: 'v1',
	start: startMs,
	end: endMs,
	requestType: Querybuildertypesv5RequestTypeDTO.scalar,
	compositeQuery: {
		queries: [countQuery('A', 'traces', ''), countQuery('B', 'logs', '')],
	},
});
