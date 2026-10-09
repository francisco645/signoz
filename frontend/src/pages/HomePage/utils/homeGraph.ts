import type { HealthBand, ServiceMapGraph } from 'modules/Servicemap/types';
import { buildAdjacency } from 'modules/Servicemap/utils/adjacency';

export type HomeMark = 'critical' | 'outside';

const BAND: Record<HomeMark, HealthBand> = {
	critical: 'critical',
	outside: 'degraded',
};

const isAlertBand = (band: HealthBand): boolean =>
	band === 'critical' || band === 'degraded';

/**
 * The map in the Home's colours: red for a critical alert, amber outside the
 * usual range, neutral otherwise. Missing data keeps its own band.
 */
export const applyHomeBands = (
	graph: ServiceMapGraph,
	marks: ReadonlyMap<string, HomeMark>,
): ServiceMapGraph => {
	const bands = new Map<string, HealthBand>();
	const nodes = graph.nodes.map((node) => {
		const mark = marks.get(node.id);
		let band: HealthBand = node.band;
		if (mark) {
			band = BAND[mark];
		} else if (isAlertBand(node.band)) {
			band = 'healthy';
		}
		bands.set(node.id, band);
		return { ...node, band };
	});
	const links = graph.links.map((link) => {
		const target = bands.get(link.target) ?? 'healthy';
		return {
			...link,
			band: 'healthy' as HealthBand,
			colorBand: isAlertBand(target) ? target : ('healthy' as HealthBand),
		};
	});
	return { nodes, links };
};

/** Affected services and their direct neighbours; `undefined` shows the whole map. */
export const getFocusSet = (
	graph: ServiceMapGraph,
	affected: ReadonlySet<string>,
): ReadonlySet<string> | undefined => {
	const present = [...affected].filter((id) =>
		graph.nodes.some((node) => node.id === id),
	);
	if (present.length === 0) {
		return undefined;
	}
	const { callers, callees } = buildAdjacency(graph.links);
	const focus = new Set(present);
	present.forEach((id) => {
		callers.get(id)?.forEach((caller) => focus.add(caller));
		callees.get(id)?.forEach((callee) => focus.add(callee));
	});
	return focus;
};
