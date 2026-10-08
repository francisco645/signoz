import { HEALTH_LABEL, SERVICE_MAP_TEXT } from '../constants';
import type { ServiceMapNode } from '../types';

/** "Critical" for a service; "Database · Critical" for a node seen only by its callers. */
export const getNodeHealthLabel = (
	node: Pick<ServiceMapNode, 'kind' | 'band'>,
): string =>
	node.kind === 'service'
		? HEALTH_LABEL[node.band]
		: `${SERVICE_MAP_TEXT.panelKind[node.kind]} · ${HEALTH_LABEL[node.band]}`;
