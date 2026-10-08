import { compareIds } from './buildGraph';
import type { PanoramaTier } from './tiers';

export interface LayoutNode {
	id: string;
	tier: PanoramaTier;
}

export interface LayoutLink {
	source: string;
	target: string;
}

export interface LayoutPoint {
	x: number;
	y: number;
}

const ITERATIONS = 600;
/** Above this many nodes a cold layout runs half the iterations, to stay near 200 ms. */
const LARGE_GRAPH = 300;
const WARM_ITERATIONS = 150;
const WARM_COOLING = 0.25;
const STRETCH_X = 1.15;
const STRETCH_Y = 0.9;
/** Nodes on the same plane push apart harder: in 3D they share it. */
const SAME_TIER_REPULSION = 1.6;
const OTHER_TIER_REPULSION = 0.8;

const sequence = (seed: number): (() => number) => {
	let state = seed >>> 0;
	return (): number => {
		state = (state * 1_664_525 + 1_013_904_223) >>> 0;
		return state / 2 ** 32;
	};
};

/** Each node starts from its own id, so adding or removing a service moves the others little. */
const hashId = (id: string): number => {
	let hash = 7;
	for (let i = 0; i < id.length; i += 1) {
		hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	}
	return hash;
};

interface Body extends LayoutPoint {
	tier: PanoramaTier;
	vx: number;
	vy: number;
}

const repel = (bodies: Body[], spacing: number): void => {
	for (let i = 0; i < bodies.length; i += 1) {
		for (let j = i + 1; j < bodies.length; j += 1) {
			const a = bodies[i];
			const b = bodies[j];
			const dx = a.x - b.x;
			const dy = a.y - b.y;
			const distance2 = dx * dx + dy * dy + 0.01;
			const distance = Math.sqrt(distance2);
			const weight =
				a.tier === b.tier ? SAME_TIER_REPULSION : OTHER_TIER_REPULSION;
			const force = (spacing * spacing * weight) / distance2;
			a.vx += (dx / distance) * force;
			a.vy += (dy / distance) * force;
			b.vx -= (dx / distance) * force;
			b.vy -= (dy / distance) * force;
		}
	}
};

const attract = (links: readonly [Body, Body][], spacing: number): void => {
	links.forEach(([a, b]) => {
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const distance = Math.hypot(dx, dy) + 0.01;
		const force = (distance - spacing * 1.3) * 0.06;
		a.vx += (dx / distance) * force;
		a.vy += (dy / distance) * force;
		b.vx -= (dx / distance) * force;
		b.vy -= (dy / distance) * force;
	});
};

const step = (bodies: Body[], cooling: number): void => {
	bodies.forEach((body) => {
		// The sideways push spreads the map to fill a wide plane.
		body.vx += -body.x * 0.012 + Math.sign(body.x) * 0.35;
		body.vy += -body.y * 0.012;
		const speed = Math.hypot(body.vx, body.vy) + 1e-6;
		const move = Math.min(6, speed) * cooling * 2.2;
		body.x += (body.vx / speed) * move;
		body.y += (body.vy / speed) * move;
		body.vx *= 0.3;
		body.vy *= 0.3;
	});
};

/**
 * One x/y per node shared by every plane, so flattening the panorama keeps
 * the picture. Node order does not matter; given the last layout, the next one
 * starts from it and moves little.
 */
export const getPanoramaLayout = (
	input: readonly LayoutNode[],
	links: readonly LayoutLink[],
	previous: ReadonlyMap<string, LayoutPoint> = new Map(),
): Map<string, LayoutPoint> => {
	const nodes = [...input].sort((a, b) => compareIds(a.id, b.id));
	const isWarm =
		nodes.filter((node) => previous.has(node.id)).length > nodes.length / 2;
	const bodies = new Map<string, Body>(
		nodes.map((node) => {
			const random = sequence(hashId(node.id));
			const angle = random() * Math.PI * 2;
			const last = previous.get(node.id);
			return [
				node.id,
				{
					tier: node.tier,
					// The final stretch is undone, so a warm start does not grow the map.
					x: last ? last.x / STRETCH_X : Math.cos(angle) * 80 + random() * 10,
					y: last ? last.y / STRETCH_Y : Math.sin(angle) * 80 + random() * 10,
					vx: 0,
					vy: 0,
				},
			];
		}),
	);
	const list = [...bodies.values()];
	const pairs = links.flatMap((link): [Body, Body][] => {
		const source = bodies.get(link.source);
		const target = bodies.get(link.target);
		return source && target && source !== target ? [[source, target]] : [];
	});
	const spacing = nodes.length > 25 ? 34 : 42;
	const coldIterations =
		nodes.length > LARGE_GRAPH ? ITERATIONS / 2 : ITERATIONS;
	const iterations = isWarm ? WARM_ITERATIONS : coldIterations;
	const cooling = isWarm ? WARM_COOLING : 1;

	for (let iteration = 0; iteration < iterations; iteration += 1) {
		repel(list, spacing);
		attract(pairs, spacing);
		step(list, cooling * (1 - iteration / iterations));
	}

	const count = Math.max(list.length, 1);
	const cx = list.reduce((sum, body) => sum + body.x, 0) / count;
	const cy = list.reduce((sum, body) => sum + body.y, 0) / count;
	return new Map(
		[...bodies].map(([id, body]) => [
			id,
			{ x: (body.x - cx) * STRETCH_X, y: (body.y - cy) * STRETCH_Y },
		]),
	);
};
