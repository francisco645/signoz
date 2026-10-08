import { PARTICLES } from '../../constants';
import {
	getParticleCount,
	getParticlePace,
	getParticleSpeed,
} from '../particles';

describe('getParticleCount', () => {
	it('adds a particle per order of magnitude of calls', () => {
		expect(getParticleCount(0)).toBe(1);
		expect(getParticleCount(0.5)).toBe(1);
		expect(getParticleCount(9)).toBe(2);
		expect(getParticleCount(99)).toBe(3);
	});

	it('caps the particles per edge', () => {
		expect(getParticleCount(1_000_000)).toBe(PARTICLES.maxPerEdge);
	});
});

describe('getParticlePace', () => {
	it('grows with traffic on a log scale, within bounds', () => {
		expect(getParticlePace(0)).toBe(PARTICLES.minSpeed);
		expect(getParticlePace(10)).toBeGreaterThan(getParticlePace(1));
		expect(getParticlePace(100)).toBeGreaterThan(getParticlePace(10));
		expect(getParticlePace(PARTICLES.fastRate)).toBeCloseTo(PARTICLES.maxSpeed);
		expect(getParticlePace(10 * PARTICLES.fastRate)).toBe(PARTICLES.maxSpeed);
	});
});

describe('getParticleSpeed', () => {
	it('keeps the pace on short and long edges with the same traffic', () => {
		const short = getParticleSpeed({ x: 0, y: 0 }, { x: 50, y: 0 }, 5);
		const long = getParticleSpeed({ x: 0, y: 0 }, { x: 200, y: 0 }, 5);
		expect(short * 50).toBeCloseTo(long * 200);
	});

	it('stops on a zero-length edge', () => {
		expect(getParticleSpeed({ x: 1, y: 1 }, { x: 1, y: 1 }, 5)).toBe(0);
	});
});
