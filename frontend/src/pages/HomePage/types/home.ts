export type AlertSeverity =
	| 'critical'
	| 'error'
	| 'warning'
	| 'info'
	| 'unknown';

export interface FiringAlert {
	fingerprint: string;
	name: string;
	ruleId?: string;
	service?: string;
	severity: AlertSeverity;
	startsAtMs: number;
	/** Formatted by the backend, as the rule's description renders it. */
	value?: string;
	/** No environment label: shown, but it may belong to another environment. */
	isUnscoped: boolean;
}

export interface AlertSummary {
	firing: FiringAlert[];
	silenced: number;
}

export interface RuleSummary {
	id: string;
	name: string;
	state: string;
	service?: string;
	/** When the rule last changed state, if the API says. */
	updatedAtMs?: number;
}

export interface ServiceSample {
	name: string;
	calls: number;
	errors: number;
	/** Percentage, 0–100. */
	errorRate: number;
	p99Ns: number;
}

export type OutsideReason = 'errors' | 'latency';

export interface ServiceComparison {
	name: string;
	now: ServiceSample;
	weekAgo?: ServiceSample;
	deltaErrorsPerSec: number;
	reasons: OutsideReason[];
	isLowVolume: boolean;
	/** No baseline a week ago: never outside the usual range. */
	isNew: boolean;
}

export type TelemetrySignal = 'traces' | 'logs' | 'metrics';

export interface SignalSnapshot {
	signal: TelemetrySignal;
	count?: number;
	weekAgoCount?: number;
	/** count / weekAgoCount, when the baseline is large enough to compare. */
	ratio?: number;
	/** End of the last minute with data, in ms. */
	lastSeenMs?: number;
	/** Metrics: data arrives somewhere, in any environment. */
	isReceiving?: boolean;
}

export interface TelemetrySnapshot {
	traces: SignalSnapshot;
	logs: SignalSnapshot;
	metrics: SignalSnapshot;
}
