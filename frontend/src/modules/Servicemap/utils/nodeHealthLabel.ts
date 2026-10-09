import { HEALTH_LABEL, SERVICE_MAP_TEXT } from '../constants';
import type { HealthBand, ServiceMapNode } from '../types';

/** "Critical" for a service; "Database · Critical" for a node seen only by its callers. */
export const getNodeHealthLabel = (
	node: Pick<ServiceMapNode, 'kind' | 'band'>,
	labels: Partial<Record<HealthBand, string>> = {},
): string => {
	const health = labels[node.band] ?? HEALTH_LABEL[node.band];
	return node.kind === 'service'
		? health
		: `${SERVICE_MAP_TEXT.panelKind[node.kind]} · ${health}`;
};
