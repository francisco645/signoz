import { SERVICE_MAP_TEXT } from '../constants';
import LegendSwatch from '../Legend/LegendSwatch';
import type { ServiceMapNode } from '../types';
import type { ServiceDeltas } from '../utils/delta';
import {
	formatCount,
	formatDuration,
	formatPercent,
	formatRate,
} from '../utils/format';
import DeltaIndicator from './DeltaIndicator';
import { getHealthLine } from './healthLine';

import styles from './ServiceNodePanel.module.scss';

interface HealthSummaryProps {
	node: ServiceMapNode;
	deltas: ServiceDeltas;
	hasYesterday: boolean;
}

function HealthSummary({
	node,
	deltas,
	hasYesterday,
}: HealthSummaryProps): JSX.Element {
	const { metrics } = node;

	return (
		<>
			<div className={styles.health} data-testid="service-map-panel-health">
				<LegendSwatch band={node.band} kind={node.kind} />
				<span>{getHealthLine(node)}</span>
			</div>

			{metrics ? (
				<div className={styles.red}>
					<span className={styles.label}>{SERVICE_MAP_TEXT.panelRequests}</span>
					<span className={styles.value}>
						{formatRate(metrics.callRate)}
						<div className={styles.sub}>{formatCount(metrics.callCount)} calls</div>
					</span>
					<DeltaIndicator
						value={deltas.callRate}
						unit="pct"
						polarity="bothAreWorse"
					/>

					<span className={styles.label}>{SERVICE_MAP_TEXT.panelErrorRate}</span>
					<span className={styles.value}>
						{formatPercent(metrics.errorRate)}
						<div className={styles.sub}>
							{formatCount(metrics.errorCount)} / {formatCount(metrics.callCount)}
						</div>
					</span>
					<DeltaIndicator
						value={deltas.errorRate}
						unit="pp"
						testId="service-map-panel-error-delta"
					/>

					<span className={styles.label}>{SERVICE_MAP_TEXT.panelP99}</span>
					<span className={styles.value}>{formatDuration(metrics.p99)}</span>
					<DeltaIndicator value={deltas.p99} unit="pct" />
				</div>
			) : (
				<div className={styles.note}>
					{node.kind === 'service'
						? SERVICE_MAP_TEXT.panelNoServerData
						: SERVICE_MAP_TEXT.panelDataStoreNote}
				</div>
			)}

			{metrics && (
				<div className={styles.note}>
					{[
						hasYesterday
							? SERVICE_MAP_TEXT.panelVsYesterday
							: SERVICE_MAP_TEXT.panelNoYesterday,
						node.band === 'lowTraffic' ? SERVICE_MAP_TEXT.panelTooFewCalls : '',
					]
						.filter(Boolean)
						.join(' · ')}
				</div>
			)}
		</>
	);
}

export default HealthSummary;
