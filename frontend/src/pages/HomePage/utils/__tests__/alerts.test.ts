import type { AlertmanagertypesDeprecatedGettableAlertDTO } from 'api/generated/services/sigNoz.schemas';

import { alertService, isInScope, summarizeAlerts } from '../alerts';

const alert = (
	labels: Record<string, string>,
	state = 'active',
	startsAt = '2026-10-09T13:00:00Z',
): AlertmanagertypesDeprecatedGettableAlertDTO => ({
	labels: { alertname: 'Error rate > 2%', ...labels },
	status: { state },
	startsAt,
	fingerprint: JSON.stringify(labels) + state,
});

describe('alerts', () => {
	it.each([
		'deployment.environment',
		'deployment_environment',
		'env',
		'environment',
	])('reads the environment from %s', (key) => {
		expect(isInScope(alert({ [key]: 'production' }), ['production'])).toBe(true);
		expect(isInScope(alert({ [key]: 'staging' }), ['production'])).toBe(false);
	});

	it('keeps alerts without an environment and marks them', () => {
		const { firing } = summarizeAlerts([alert({})], ['production']);
		expect(firing[0].isUnscoped).toBe(true);
	});

	it.each(['service.name', 'service_name', 'serviceName'])(
		'reads the service from %s',
		(key) => {
			expect(alertService(alert({ [key]: 'checkout' }))).toBe('checkout');
		},
	);

	it('counts silenced alerts apart and sorts the rest by severity, then age', () => {
		const summary = summarizeAlerts(
			[
				alert({ severity: 'warning' }, 'active', '2026-10-09T12:00:00Z'),
				alert({ severity: 'CRITICAL' }, 'active', '2026-10-09T13:00:00Z'),
				alert({ severity: 'critical' }, 'suppressed'),
				alert({ severity: 'critical', env: 'staging' }),
			],
			['production'],
		);
		expect(summary.silenced).toBe(1);
		expect(summary.firing.map((item) => item.severity)).toStrictEqual([
			'critical',
			'warning',
		]);
	});
});
