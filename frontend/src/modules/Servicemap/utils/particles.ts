import { PARTICLES } from '../constants';

interface Position {
	x?: number;
	y?: number;
}

/** 1 particle under 1 req/s, one more per order of magnitude, up to the cap. */
export const getParticleCount = (callRate: number): number =>
	Math.min(
		PARTICLES.maxPerEdge,
		1 + Math.max(0, Math.floor(Math.log10(Math.max(callRate, 0) + 1))),
	);

/** Canvas units per frame: log of req/s, from `minSpeed` up to `maxSpeed` at `fastRate`. */
export const getParticlePace = (callRate: number): number => {
	const share = Math.min(
		1,
		Math.log10(Math.max(callRate, 0) + 1) / Math.log10(PARTICLES.fastRate + 1),
	);
	return PARTICLES.minSpeed + share * (PARTICLES.maxSpeed - PARTICLES.minSpeed);
};

/** Share of the edge to advance per frame, so the pace does not depend on the edge length. */
export const getParticleSpeed = (
	source: Position,
	target: Position,
	callRate: number,
): number => {
	const length = Math.hypot(
		(target.x ?? 0) - (source.x ?? 0),
		(target.y ?? 0) - (source.y ?? 0),
	);
	return length > 0 ? Math.min(1, getParticlePace(callRate) / length) : 0;
};
