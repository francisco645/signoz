import type { AlertmanagertypesDeprecatedGettableAlertDTO } from 'api/generated/services/sigNoz.schemas';

import { ENV_LABEL_KEYS, SERVICE_LABEL_KEYS } from '../constants';
import type { AlertSeverity, AlertSummary, FiringAlert } from '../types/home';
import { getAlertValue } from './alertValue';

type Alert = AlertmanagertypesDeprecatedGettableAlertDTO;

const firstLabel = (
	alert: Alert,
	keys: readonly string[],
): string | undefined =>
	keys.map((key) => alert.labels?.[key]).find((value) => !!value);

export const alertEnvironment = (alert: Alert): string | undefined =>
	firstLabel(alert, ENV_LABEL_KEYS);

export const alertService = (alert: Alert): string | undefined =>
	firstLabel(alert, SERVICE_LABEL_KEYS);

const SEVERITIES: AlertSeverity[] = ['critical', 'error', 'warning', 'info'];

export const alertSeverity = (alert: Alert): AlertSeverity => {
	const severity = alert.labels?.severity?.toLowerCase() as AlertSeverity;
	return SEVERITIES.includes(severity) ? severity : 'unknown';
};

/** Alerts without an environment label stay in, since they may be about this one. */
export const isInScope = (
	alert: Alert,
	environments: readonly string[],
): boolean => {
	const environment = alertEnvironment(alert);
	return (
		!environment ||
		environments.length === 0 ||
		environments.includes(environment)
	);
};

const ruleIdOf = (alert: Alert): string | undefined =>
	alert.labels?.ruleId ?? alert.generatorURL?.match(/ruleId=([^&]+)/)?.[1];

/** Active alerts in scope, most severe and oldest first; silenced ones are only counted. */
export const summarizeAlerts = (
	alerts: readonly Alert[],
	environments: readonly string[],
): AlertSummary => {
	const scoped = alerts.filter((alert) => isInScope(alert, environments));
	const firing: FiringAlert[] = scoped
		.filter((alert) => alert.status?.state === 'active')
		.map((alert) => ({
			fingerprint: alert.fingerprint ?? alert.labels?.alertname ?? '',
			name: alert.labels?.alertname ?? 'Unnamed alert',
			ruleId: ruleIdOf(alert),
			service: alertService(alert),
			severity: alertSeverity(alert),
			startsAtMs: alert.startsAt ? Date.parse(alert.startsAt) : 0,
			value: getAlertValue(alert.annotations?.description),
			isUnscoped: !alertEnvironment(alert),
		}))
		.sort(
			(a, b) =>
				SEVERITIES.indexOf(a.severity === 'unknown' ? 'info' : a.severity) -
					SEVERITIES.indexOf(b.severity === 'unknown' ? 'info' : b.severity) ||
				a.startsAtMs - b.startsAtMs,
		);
	return {
		firing,
		silenced: scoped.filter((alert) => alert.status?.state === 'suppressed')
			.length,
	};
};
