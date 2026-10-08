import {
	CRITICAL_ERROR_RATE,
	DEGRADED_ERROR_RATE,
	MIN_CALLS,
} from '../constants';
import type { HealthBand } from '../types';

interface ErrorSample {
	callCount: number;
	errorRate: number;
}

export const getHealthBand = (sample?: ErrorSample): HealthBand => {
	if (!sample) {
		return 'noData';
	}
	if (sample.callCount < MIN_CALLS) {
		return 'lowTraffic';
	}
	if (sample.errorRate >= CRITICAL_ERROR_RATE) {
		return 'critical';
	}
	if (sample.errorRate >= DEGRADED_ERROR_RATE) {
		return 'degraded';
	}
	return 'healthy';
};

export const isAlerting = (band: HealthBand): boolean =>
	band === 'degraded' || band === 'critical';

/** Most pressing first, for sorting. */
export const BAND_SEVERITY: Record<HealthBand, number> = {
	critical: 0,
	degraded: 1,
	healthy: 2,
	lowTraffic: 3,
	noData: 4,
};
