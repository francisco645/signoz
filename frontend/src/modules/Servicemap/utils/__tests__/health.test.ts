import { getHealthBand } from '../health';

describe('getHealthBand', () => {
	it.each([
		[undefined, 'noData'],
		[{ callCount: 19, errorRate: 90 }, 'lowTraffic'],
		[{ callCount: 20, errorRate: 0.99 }, 'healthy'],
		[{ callCount: 20, errorRate: 1 }, 'degraded'],
		[{ callCount: 20, errorRate: 4.99 }, 'degraded'],
		[{ callCount: 20, errorRate: 5 }, 'critical'],
	])('classifies %j as %s', (sample, band) => {
		expect(getHealthBand(sample)).toBe(band);
	});
});
