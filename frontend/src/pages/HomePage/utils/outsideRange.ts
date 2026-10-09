import { OUTSIDE_RANGE } from '../constants';
import type {
	OutsideReason,
	ServiceComparison,
	ServiceSample,
} from '../types/home';

const reasonsFor = (
	now: ServiceSample,
	weekAgo: ServiceSample,
): OutsideReason[] => {
	const reasons: OutsideReason[] = [];
	const errorsUp =
		now.errors >= OUTSIDE_RANGE.minErrors &&
		now.errorRate >= weekAgo.errorRate * OUTSIDE_RANGE.errorFactor &&
		now.errorRate >= weekAgo.errorRate + OUTSIDE_RANGE.minErrorRiseP;
	// Client-only services report no server p99.
	const latencyUp =
		now.p99Ns > 0 &&
		weekAgo.p99Ns > 0 &&
		now.p99Ns >= weekAgo.p99Ns * OUTSIDE_RANGE.latencyFactor &&
		now.p99Ns - weekAgo.p99Ns >= OUTSIDE_RANGE.minLatencyRiseNs;
	if (errorsUp) {
		reasons.push('errors');
	}
	if (latencyUp) {
		reasons.push('latency');
	}
	return reasons;
};

/**
 * Each service now against the same window a week ago. Only rises count: a bad
 * week ago can hide a problem, never invent one.
 */
export const compareServices = (
	now: readonly ServiceSample[],
	weekAgo: readonly ServiceSample[],
	windowSec: number,
): ServiceComparison[] => {
	const before = new Map(weekAgo.map((sample) => [sample.name, sample]));
	return now
		.map((sample): ServiceComparison => {
			const baseline = before.get(sample.name);
			const isLowVolume = sample.calls < OUTSIDE_RANGE.minCalls;
			const isNew = !baseline || baseline.calls < OUTSIDE_RANGE.minCalls;
			return {
				name: sample.name,
				now: sample,
				weekAgo: baseline,
				deltaErrorsPerSec:
					(sample.errors - (baseline?.errors ?? 0)) / Math.max(windowSec, 1),
				reasons:
					isLowVolume || isNew || !baseline ? [] : reasonsFor(sample, baseline),
				isLowVolume,
				isNew,
			};
		})
		.sort(
			(a, b) =>
				b.deltaErrorsPerSec - a.deltaErrorsPerSec || a.name.localeCompare(b.name),
		);
};

export const isOutsideUsualRange = (comparison: ServiceComparison): boolean =>
	comparison.reasons.length > 0;
