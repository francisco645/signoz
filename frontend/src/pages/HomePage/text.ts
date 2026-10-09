import { pluralize } from 'utils/pluralize';

import type { TelemetrySignal } from './types/home';
import type { SourceName } from './types/sources';

const SOURCE_LABEL: Record<SourceName, string> = {
	alerts: 'alerts',
	rules: 'alert rules',
	services: 'service metrics',
	telemetry: 'telemetry',
};

export const HOME_TEXT = {
	title: 'Home',
	environment: 'Environment',
	allEnvironments: 'all environments',
	window: 'Time range',
	versus: 'vs 1 week ago',
	every: (seconds: number): string => `every ${seconds} s`,
	refresh: 'Refresh',
	normalTitle: 'No issues detected',
	normalDetail: (services: number, rules: number, signals: number): string =>
		`Checked ${pluralize(services, 'service')}, ${pluralize(rules, 'rule')} and ${pluralize(signals, 'signal')}.`,
	incidentTitle: (critical: number): string =>
		`${pluralize(critical, 'critical alert')} firing`,
	degradedTitle: 'Something is outside the usual range',
	blindTitle: "Can't confirm health · no traces received",
	blindDetail:
		"Error rate, latency and the service map can't be computed. No alerts firing is not the same as healthy.",
	unknownTitle: "Couldn't confirm health",
	unknownDetail: (gaps: SourceName[]): string =>
		`${gaps.map((gap) => SOURCE_LABEL[gap]).join(', ')} could not be read. Nothing here is a sign of health until they are.`,
	loading: 'Checking health…',
	lowSignal: (signals: TelemetrySignal[]): string =>
		`Partial blind spot: ${signals.join(' and ')} arriving at under half the usual rate. Searches for this window may be incomplete.`,
	openFiring: 'Open firing alerts',
	troubleshoot: 'Troubleshoot ingestion',
	sourceFailed: (source: SourceName): string =>
		`Couldn't load ${SOURCE_LABEL[source]}.`,
	retry: 'Retry',
	firingAlerts: 'Firing alerts',
	outsideRange: 'Outside usual range',
	rulesNoData: 'Rules with no data',
	of: (total: number): string => `of ${total}`,
	silenced: (count: number): string => `${count} silenced`,
	allRules: 'All alert rules →',
	allServices: 'All services →',
	services: 'Services',
	servicesOutside: 'Services outside usual range',
	sortedBy: 'Sorted by errors/s above 1 week ago',
	withinRange: (count: number): string => `${count} within usual range`,
	lowVolume: (count: number): string => `${count} low volume, not ranked`,
	topByTraffic: 'Top by traffic',
	showAll: (count: number): string => `show all ${count}`,
	pinned: 'Pinned',
	more: (count: number): string => `+${count} recent`,
	telemetry: 'Telemetry',
	onTime: 'On time',
	low: 'Low',
	silent: 'Silent',
	receiving: 'Receiving',
	noData: 'No data',
	allEnvs: 'all environments',
	weekAgo: '1w ago',
} as const;
