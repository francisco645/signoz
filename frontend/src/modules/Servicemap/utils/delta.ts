import type { ServicesList } from 'types/api/metrics/getService';

import { MIN_CALLS } from '../constants';

export interface ServiceDeltas {
	/** Relative change in calls per second, in percent. */
	callRate?: number;
	/** Change in error rate, in percentage points. */
	errorRate?: number;
	/** Relative change in p99, in percent. */
	p99?: number;
}

const relativeChange = (now: number, before: number): number | undefined =>
	before > 0 ? ((now - before) / before) * 100 : undefined;

/**
 * Change against the same window yesterday. Too few calls yesterday make any
 * change noise, so nothing is reported then.
 */
export const getServiceDeltas = (
	now: ServicesList | undefined,
	yesterday: ServicesList | undefined,
): ServiceDeltas => {
	if (!now || !yesterday || yesterday.numCalls < MIN_CALLS) {
		return {};
	}
	return {
		callRate: relativeChange(now.callRate, yesterday.callRate),
		errorRate: now.errorRate - yesterday.errorRate,
		p99: relativeChange(now.p99, yesterday.p99),
	};
};

export const formatDelta = (value: number, unit: 'pct' | 'pp'): string => {
	const sign = value > 0 ? '+' : '';
	return unit === 'pp'
		? `${sign}${value.toFixed(1)} pp`
		: `${sign}${Math.round(value)}%`;
};
