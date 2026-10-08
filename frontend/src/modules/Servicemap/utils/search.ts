import type { ServiceMapNode } from '../types';
import { BAND_SEVERITY } from './health';

/** Names that start with the query first, then names that contain it; worst health first within each. */
export const searchNodes = (
	nodes: readonly ServiceMapNode[],
	query: string,
	limit: number,
): ServiceMapNode[] => {
	const term = query.trim().toLowerCase();
	if (!term) {
		return [];
	}
	return nodes
		.map((node) => ({ node, index: node.id.toLowerCase().indexOf(term) }))
		.filter(({ index }) => index >= 0)
		.sort(
			(a, b) =>
				Number(a.index !== 0) - Number(b.index !== 0) ||
				BAND_SEVERITY[a.node.band] - BAND_SEVERITY[b.node.band] ||
				a.node.id.localeCompare(b.node.id),
		)
		.slice(0, limit)
		.map(({ node }) => node);
};
