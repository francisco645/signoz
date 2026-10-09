import type { HealthBand } from 'modules/Servicemap/types';

export const MINUTE_MS = 60_000;
export const WEEK_MS = 7 * 24 * 60 * MINUTE_MS;

export const HOME_WINDOWS = [
	{
		key: '15m',
		label: 'Last 15 min',
		windowMs: 15 * MINUTE_MS,
		refreshMs: MINUTE_MS,
	},
	{
		key: '1h',
		label: 'Last 1 hour',
		windowMs: 60 * MINUTE_MS,
		refreshMs: 2 * MINUTE_MS,
	},
	{
		key: '6h',
		label: 'Last 6 hours',
		windowMs: 360 * MINUTE_MS,
		refreshMs: 5 * MINUTE_MS,
	},
] as const;

export type HomeWindowKey = (typeof HOME_WINDOWS)[number]['key'];

export const OUTSIDE_RANGE = {
	/** Fewer calls than this, now or a week ago, are not compared. */
	minCalls: 20,
	minErrors: 5,
	errorFactor: 2,
	/** Percentage points above last week. */
	minErrorRiseP: 1,
	latencyFactor: 2,
	minLatencyRiseNs: 100_000_000,
} as const;

export const TELEMETRY = {
	/** Below this share of last week a signal counts as low. */
	lowRatio: 0.5,
	/** Events in the window a week ago needed to compare at all. */
	minBaseline: 1_000,
} as const;

/** Labels alert rules carry for the environment and the service, in the order tried. */
export const ENV_LABEL_KEYS = [
	'deployment.environment',
	'deployment_environment',
	'env',
	'environment',
] as const;

export const SERVICE_LABEL_KEYS = [
	'service.name',
	'service_name',
	'serviceName',
] as const;

/** The map takes the Home's status, not the error thresholds of the Service Map page. */
export const HOME_HEALTH_LABELS: Partial<Record<HealthBand, string>> = {
	critical: 'Critical alert firing',
	degraded: 'Outside usual range',
	healthy: 'Within usual range',
};
