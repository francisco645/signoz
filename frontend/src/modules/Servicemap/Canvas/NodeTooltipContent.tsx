import { getNodeHealthLabel } from '../utils/nodeHealthLabel';
import type { HealthBand, ServiceMapNode } from '../types';
import {
	formatCount,
	formatDuration,
	formatPercent,
	formatRate,
} from '../utils/format';

import styles from './CanvasTooltip.module.scss';

interface NodeTooltipContentProps {
	node: ServiceMapNode;
	healthLabels?: Partial<Record<HealthBand, string>>;
}

function NodeTooltipContent({
	node,
	healthLabels,
}: NodeTooltipContentProps): JSX.Element {
	const { metrics, incoming } = node;

	return (
		<>
			<div className={styles.title}>
				<span>{node.id}</span>
				<span>{getNodeHealthLabel(node, healthLabels)}</span>
			</div>
			{metrics ? (
				<>
					<div className={styles.metric}>
						{formatRate(metrics.callRate)} · {formatPercent(metrics.errorRate)} errors
						({formatCount(metrics.errorCount)} / {formatCount(metrics.callCount)})
					</div>
					<div className={styles.metric}>
						p99 (server side) {formatDuration(metrics.p99)}
					</div>
				</>
			) : (
				<div className={styles.metric}>
					Callers report {formatRate(incoming.callRate)} ·{' '}
					{formatPercent(incoming.errorRate)} errors
				</div>
			)}
		</>
	);
}

export default NodeTooltipContent;
