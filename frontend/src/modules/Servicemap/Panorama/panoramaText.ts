import type { ResolvedPlane } from '../utils/planes';
import type { PanoramaTier } from '../utils/tiers';
import type { PanoramaModel } from './scene/panoramaModel';
import type { PanoramaView } from './scene/cameraPoses';
import type { TierText } from './scene/tierPlanes';

export const PANORAMA_TIER_TEXT: Record<PanoramaTier, TierText> = {
	entry: { name: 'ENTRY', description: 'where traffic starts' },
	internal: { name: 'INTERNAL', description: 'services called by others' },
	data: { name: 'DATA', description: 'databases · queues · external' },
};

export const PANORAMA_VIEW_TEXT: Record<PanoramaView, string> = {
	iso: 'Isometric',
	side: 'Side',
	top: 'Top',
};

export const PANORAMA_TEXT = {
	canvasLabel:
		'Service map in 3D: entry services on top, internal services in the middle, databases and queues below. Click a service for details.',
	views: 'Camera',
	autoRotate: 'Auto-rotate',
	autoRotateReduced: 'Auto-rotate (off: reduced motion)',
	flatten: 'Flatten',
	showPlanes: 'Show planes',
	summaryTitle: 'Summary',
	services: 'Services and dependencies',
	calls: 'Calls (edges)',
	entryTraffic: 'Entry traffic',
	critical: 'Critical (≥ 5%)',
	degraded: 'Degraded (1–5%)',
	legendHealth: 'Health (error rate)',
	healthy: 'Neutral · < 1%',
	degradedBand: 'Degraded · 1–5%',
	criticalBand: 'Critical · ≥ 5%',
	legendShape: 'Shape = kind',
	service: 'Service (sphere)',
	database: 'Database / cache (cylinder)',
	queue: 'Queue (stacked boxes)',
	external: 'External (octahedron)',
	legendEdges: 'Edges',
	edgeWidth: 'Width = req/s (log)',
	edgeParticles: 'Particles: caller → callee',
	legendTiers: 'Planes',
	tierRule:
		'Entry: no other service makes 5% or more of its calls, so health checks are ignored.',
	hint: 'Drag to orbit · scroll to zoom · click a service for details.',
} as const;

/** What a screen reader hears instead of the picture. */
export const describePanorama = (model: PanoramaModel): string => {
	const critical = model.nodes
		.filter((node) => node.band === 'critical')
		.map((node) => node.id);
	return critical.length
		? `${model.nodes.length} services; ${critical.length} critical: ${critical.join(', ')}.`
		: `${model.nodes.length} services; none critical.`;
};

const TIER_LABEL: Record<PanoramaTier, string> = {
	entry: 'Entry',
	internal: 'Internal',
	data: 'Data',
};

export const PLANE_TEXT = {
	title: 'Plane (3D)',
	auto: 'Auto',
	tier: TIER_LABEL,
	adjustedNote: 'Only you see this, in this browser.',
	declaredHint: (attribute: string): string =>
		`Services can declare their plane with the ${attribute} resource attribute: entry, internal or data.`,
	moved: (id: string, tier: PanoramaTier): string =>
		`${id} moved to the ${TIER_LABEL[tier]} plane.`,
	adjustedCount: (count: number): string =>
		`${count} ${count === 1 ? 'service' : 'services'} adjusted by you`,
	reset: 'Reset',
	resetDone: 'Planes reset to automatic.',
	undo: 'Undo',
} as const;

/** One line on where a node's plane comes from. */
export const describePlane = (
	plane: ResolvedPlane,
	attribute: string,
): string => {
	const label = TIER_LABEL[plane.tier];
	if (plane.source === 'adjusted') {
		return `${label} · adjusted by you`;
	}
	if (plane.source === 'declared') {
		return `${label} · declared by the service (${attribute})`;
	}
	const { reason } = plane.inferred;
	if (reason.kind === 'dataStore') {
		return `${label} · databases and queues stay on the data plane`;
	}
	if (reason.kind === 'calledBy') {
		return reason.share === undefined
			? `${label} · called by ${reason.caller}`
			: `${label} · ${reason.caller} makes ${Math.round(reason.share * 100)}% of its calls`;
	}
	if (reason.kind === 'cycle') {
		return `${label} · every service is called; this one has the most outside traffic`;
	}
	return `${label} · no other service makes 5% or more of its calls`;
};
