import type {
	AlertSummary,
	RuleSummary,
	ServiceComparison,
	TelemetrySnapshot,
	TelemetrySignal,
} from '../types/home';
import { hasValue, Source, SourceName } from '../types/sources';
import { isOutsideUsualRange } from './outsideRange';
import { isLow, isSilent } from './telemetry';

export type VerdictLevel =
	| 'loading'
	| 'incident'
	| 'blind'
	| 'degraded'
	| 'unknown'
	| 'normal';

export interface Verdict {
	level: VerdictLevel;
	critical: number;
	warnings: number;
	outside: number;
	lowSignals: TelemetrySignal[];
	/** Sources that could not be read, so the verdict is not complete. */
	gaps: SourceName[];
	checked: { services: number; rules: number; signals: number };
}

export interface VerdictInput {
	alerts: Source<AlertSummary>;
	rules: Source<RuleSummary[]>;
	services: Source<ServiceComparison[]>;
	telemetry: Source<TelemetrySnapshot>;
}

/**
 * A confirmed critical alert wins even when other sources fail. "Normal" needs
 * alerts, services and telemetry read: a failed source never reads as healthy.
 */
export const getVerdict = ({
	alerts,
	rules,
	services,
	telemetry,
}: VerdictInput): Verdict => {
	const firing = hasValue(alerts) ? alerts.value.firing : [];
	const critical = firing.filter(
		(alert) => alert.severity === 'critical',
	).length;
	const warnings = firing.filter(
		(alert) => alert.severity === 'warning' || alert.severity === 'error',
	).length;
	const outside = hasValue(services)
		? services.value.filter(isOutsideUsualRange).length
		: 0;
	const signals = hasValue(telemetry)
		? [telemetry.value.traces, telemetry.value.logs, telemetry.value.metrics]
		: [];
	const lowSignals = signals.filter(isLow).map((snapshot) => snapshot.signal);
	const isBlind = hasValue(telemetry) && isSilent(telemetry.value.traces);
	const gaps = (
		Object.entries({ alerts, rules, services, telemetry }) as [
			SourceName,
			Source<unknown>,
		][]
	)
		.filter(([, source]) => source.status === 'failed')
		.map(([name]) => name);

	const required = [alerts, services, telemetry];
	let level: VerdictLevel = 'normal';
	if (critical > 0) {
		level = 'incident';
	} else if (isBlind) {
		level = 'blind';
	} else if (warnings > 0 || outside > 0 || lowSignals.length > 0) {
		level = 'degraded';
	} else if (
		required.some(
			(source) => source.status === 'failed' || source.status === 'stale',
		)
	) {
		level = 'unknown';
	} else if (required.some((source) => source.status === 'loading')) {
		level = 'loading';
	}

	return {
		level,
		critical,
		warnings,
		outside,
		lowSignals,
		gaps,
		checked: {
			services: hasValue(services) ? services.value.length : 0,
			rules: hasValue(rules) ? rules.value.length : 0,
			signals: signals.filter((snapshot) => snapshot.lastSeenMs !== undefined)
				.length,
		},
	};
};
