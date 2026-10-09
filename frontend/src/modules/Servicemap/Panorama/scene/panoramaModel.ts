import type { HealthBand, NodeKind, ServiceMapGraph } from '../../types';
import { linkEndId } from '../../utils/adjacency';
import { getPanoramaLayout, LayoutPoint } from '../../utils/panoramaLayout';
import { getNodeTiers, PanoramaTier } from '../../utils/tiers';

export interface PanoramaNode {
	id: string;
	kind: NodeKind;
	tier: PanoramaTier;
	/** You moved it to this plane. */
	isAdjusted: boolean;
	band: HealthBand;
	/** Calls per second into the node, or out of it when nothing calls it. */
	callRate: number;
	x: number;
	y: number;
}

export interface PanoramaLink {
	source: string;
	target: string;
	callRate: number;
	colorBand: HealthBand;
}

export interface PanoramaModel {
	nodes: PanoramaNode[];
	links: PanoramaLink[];
}

export type PanoramaHealth = 'neutral' | 'degraded' | 'critical';

export const getPanoramaHealth = (band: HealthBand): PanoramaHealth =>
	band === 'critical' || band === 'degraded' ? band : 'neutral';

const toPanoramaLinks = (graph: ServiceMapGraph): PanoramaLink[] =>
	graph.links.map((link) => ({
		source: linkEndId(link.source),
		target: linkEndId(link.target),
		callRate: link.callRate,
		colorBand: link.colorBand,
	}));

/**
 * x/y per node from the inferred planes only, so moving a service to another
 * plane changes its height and leaves every other node where it was.
 */
export const getPanoramaPositions = (
	graph: ServiceMapGraph,
	previous?: ReadonlyMap<string, LayoutPoint>,
): Map<string, LayoutPoint> => {
	const tiers = getNodeTiers(graph);
	return getPanoramaLayout(
		graph.nodes.map((node) => ({
			id: node.id,
			tier: tiers.get(node.id) ?? 'internal',
		})),
		toPanoramaLinks(graph),
		previous,
	);
};

/** The 2D graph as the panorama draws it: a plane and an x/y per node. */
export const buildPanoramaModel = (
	graph: ServiceMapGraph,
	positions: ReadonlyMap<string, LayoutPoint>,
	planes: ReadonlyMap<string, { tier: PanoramaTier; source: string }>,
): PanoramaModel => {
	const links = toPanoramaLinks(graph);
	const outgoing = new Map<string, number>();
	links.forEach((link) =>
		outgoing.set(link.source, (outgoing.get(link.source) ?? 0) + link.callRate),
	);

	return {
		nodes: graph.nodes.map((node) => {
			const point = positions.get(node.id) ?? { x: 0, y: 0 };
			const plane = planes.get(node.id);
			return {
				id: node.id,
				kind: node.kind,
				tier: plane?.tier ?? 'internal',
				isAdjusted: plane?.source === 'adjusted',
				band: node.band,
				callRate:
					node.metrics?.callRate ||
					node.incoming.callRate ||
					outgoing.get(node.id) ||
					0,
				x: point.x,
				y: point.y,
			};
		}),
		links,
	};
};

export const getNodeRadius = (callRate: number): number =>
	3.2 + 1.1 * Math.log10(callRate + 1);

export const getLinkRadius = (callRate: number): number =>
	0.25 + 0.45 * Math.log10(callRate + 1);

export const getPanoramaParticleCount = (callRate: number): number =>
	Math.min(4, 1 + Math.floor(Math.log10(callRate + 1) * 1.6));

/** Scene units per second. */
export const getPanoramaParticlePace = (callRate: number): number =>
	10 + 34 * Math.min(1, Math.log10(callRate + 1) / 2);
