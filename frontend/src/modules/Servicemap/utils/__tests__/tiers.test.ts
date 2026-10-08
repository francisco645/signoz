import type { ServiceMapLink, ServiceMapNode } from '../../types';
import { getNodeTiers } from '../tiers';

const service = (id: string, calls = 0, incoming = 0): ServiceMapNode => ({
	id,
	kind: 'service',
	band: 'healthy',
	metrics: calls
		? { callCount: calls, errorCount: 0, callRate: 1, errorRate: 0, p99: 0 }
		: undefined,
	incoming: { callCount: incoming, errorCount: 0, callRate: 0, errorRate: 0 },
});

const link = (
	source: string,
	target: string,
	callCount: number,
): ServiceMapLink => ({
	source,
	target,
	callCount,
	callRate: 1,
	errorRate: 0,
	p99: 0,
	band: 'healthy',
	colorBand: 'healthy',
	isBidirectional: false,
});

describe('getNodeTiers', () => {
	it('puts entry services on top, called services in the middle and data stores below', () => {
		const tiers = getNodeTiers({
			nodes: [
				service('gateway', 1000),
				service('frontend', 900, 900),
				{ ...service('mysql'), kind: 'database' },
				{ ...service('kafka'), kind: 'queue' },
			],
			links: [
				link('gateway', 'frontend', 900),
				link('frontend', 'mysql', 50),
				link('frontend', 'kafka', 20),
			],
		});
		expect(Object.fromEntries(tiers)).toStrictEqual({
			gateway: 'entry',
			frontend: 'internal',
			mysql: 'data',
			kafka: 'data',
		});
	});

	it('keeps a gateway on the entry plane when only a health check calls it', () => {
		const tiers = getNodeTiers({
			nodes: [service('health-checker'), service('gateway', 1000, 1)],
			links: [link('health-checker', 'gateway', 1)],
		});
		expect(tiers.get('gateway')).toBe('entry');
		expect(tiers.get('health-checker')).toBe('entry');
	});

	it('picks the service with the most outside traffic when every service is called', () => {
		const tiers = getNodeTiers({
			nodes: [service('gateway', 1000, 100), service('auth', 100, 100)],
			links: [link('gateway', 'auth', 100), link('auth', 'gateway', 100)],
		});
		expect(tiers.get('gateway')).toBe('entry');
		expect(tiers.get('auth')).toBe('internal');
	});

	it('does not count a service calling itself', () => {
		const tiers = getNodeTiers({
			nodes: [service('worker', 100, 50)],
			links: [link('worker', 'worker', 50)],
		});
		expect(tiers.get('worker')).toBe('entry');
	});
});
