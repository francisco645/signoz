import {
	getPanoramaLayout,
	LayoutLink,
	LayoutNode,
	LayoutPoint,
} from '../panoramaLayout';

const nodes: LayoutNode[] = [
	{ id: 'gateway', tier: 'entry' },
	{ id: 'frontend', tier: 'internal' },
	{ id: 'cart', tier: 'internal' },
	{ id: 'auth', tier: 'internal' },
	{ id: 'catalogue', tier: 'internal' },
	{ id: 'mysql', tier: 'data' },
	{ id: 'redis', tier: 'data' },
];
const links: LayoutLink[] = [
	{ source: 'gateway', target: 'frontend' },
	{ source: 'frontend', target: 'cart' },
	{ source: 'frontend', target: 'auth' },
	{ source: 'frontend', target: 'catalogue' },
	{ source: 'cart', target: 'redis' },
	{ source: 'catalogue', target: 'mysql' },
	{ source: 'auth', target: 'mysql' },
];

const width = (layout: Map<string, LayoutPoint>): number => {
	const xs = [...layout.values()].map((p) => p.x);
	return Math.max(...xs) - Math.min(...xs);
};

describe('getPanoramaLayout', () => {
	it('places every node, centred on the origin', () => {
		const layout = getPanoramaLayout(nodes, links);
		expect(new Set(layout.keys())).toStrictEqual(
			new Set(nodes.map((node) => node.id)),
		);
		const points = [...layout.values()];
		expect(points.reduce((sum, p) => sum + p.x, 0) / points.length).toBeCloseTo(
			0,
		);
		expect(points.reduce((sum, p) => sum + p.y, 0) / points.length).toBeCloseTo(
			0,
		);
	});

	it('does not depend on the node order', () => {
		expect(getPanoramaLayout([...nodes].reverse(), links)).toStrictEqual(
			getPanoramaLayout(nodes, links),
		);
	});

	it('moves the other nodes little when a service appears', () => {
		const before = getPanoramaLayout(nodes, links);
		const after = getPanoramaLayout(
			[...nodes, { id: 'shipping', tier: 'internal' }],
			[...links, { source: 'frontend', target: 'shipping' }],
			before,
		);
		const moved = nodes.map(({ id }) => {
			const a = before.get(id) as LayoutPoint;
			const b = after.get(id) as LayoutPoint;
			return Math.hypot(a.x - b.x, a.y - b.y);
		});
		const mean = moved.reduce((sum, d) => sum + d, 0) / moved.length;
		expect(mean).toBeLessThan(width(before) * 0.1);
	});

	it('keeps nodes apart', () => {
		const points = [...getPanoramaLayout(nodes, links).values()];
		points.forEach((a, i) =>
			points.slice(i + 1).forEach((b) => {
				expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(10);
			}),
		);
	});

	it('handles empty and single-node graphs, self-links and unknown nodes', () => {
		expect(getPanoramaLayout([], []).size).toBe(0);
		const single = getPanoramaLayout(
			[{ id: 'worker', tier: 'entry' }],
			[{ source: 'worker', target: 'worker' }],
		);
		expect(single.get('worker')).toStrictEqual({ x: 0, y: 0 });
		expect(
			getPanoramaLayout(nodes, [{ source: 'gateway', target: 'ghost' }]).size,
		).toBe(nodes.length);
	});
});
