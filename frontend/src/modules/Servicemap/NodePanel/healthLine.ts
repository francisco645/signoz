import { HEALTH_LABEL, SERVICE_MAP_TEXT } from '../constants';
import type { ServiceMapNode } from '../types';
import { formatPercent } from '../utils/format';
import { getNodeHealthLabel } from '../utils/nodeHealthLabel';

/** Services report their own error rate; databases and queues, what their callers saw. */
export const getHealthLine = (node: ServiceMapNode): string => {
	if (node.metrics) {
		return `${HEALTH_LABEL[node.band]} · ${formatPercent(node.metrics.errorRate)} errors`;
	}
	if (node.kind !== 'service' && node.incoming.callCount > 0) {
		return `${getNodeHealthLabel(node)} · ${SERVICE_MAP_TEXT.panelSeenByCallers(
			formatPercent(node.incoming.errorRate),
		)}`;
	}
	return getNodeHealthLabel(node);
};
