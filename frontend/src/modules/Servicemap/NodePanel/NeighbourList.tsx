import { useState } from 'react';
import { getNodeHealthLabel } from '../utils/nodeHealthLabel';
import { Button } from '@signozhq/ui/button';
import type { ServicesList } from 'types/api/metrics/getService';

import { MAX_NEIGHBOUR_ROWS, SERVICE_MAP_TEXT } from '../constants';
import LegendSwatch from '../Legend/LegendSwatch';
import type { ServiceMapNode } from '../types';
import { getServiceDeltas } from '../utils/delta';
import { formatDuration, formatPercent, formatRate } from '../utils/format';
import { NeighbourDirection, NeighbourRow } from '../utils/neighbours';
import DeltaIndicator from './DeltaIndicator';

import styles from './ServiceNodePanel.module.scss';

interface NeighbourListProps {
	direction: NeighbourDirection;
	rows: NeighbourRow[];
	nodes: ReadonlyMap<string, ServiceMapNode>;
	services: ReadonlyMap<string, ServicesList>;
	yesterday: ReadonlyMap<string, ServicesList>;
	onSelect: (id: string) => void;
}

/**
 * Each row keeps two things apart: the neighbour itself (its symbol, health and
 * change since yesterday, as on the map) and the call between the two services.
 */
function NeighbourList({
	direction,
	rows,
	nodes,
	services,
	yesterday,
	onSelect,
}: NeighbourListProps): JSX.Element {
	const [showAll, setShowAll] = useState(false);
	const visible = showAll ? rows : rows.slice(0, MAX_NEIGHBOUR_ROWS);
	const title =
		direction === 'callers'
			? SERVICE_MAP_TEXT.panelCallers
			: SERVICE_MAP_TEXT.panelCallees;

	return (
		<section className={styles.section} aria-label={title}>
			<div className={styles.sectionTitle}>
				{title} ({rows.length})
			</div>
			{rows.length === 0 && (
				<div className={styles.empty}>
					{direction === 'callers'
						? SERVICE_MAP_TEXT.panelNoCallers
						: SERVICE_MAP_TEXT.panelNoCallees}
				</div>
			)}
			{visible.map((row) => {
				const node = nodes.get(row.id);
				const deltas = getServiceDeltas(
					services.get(row.id),
					yesterday.get(row.id),
				);
				const hasDeltas =
					deltas.errorRate !== undefined || deltas.p99 !== undefined;
				const health = node ? getNodeHealthLabel(node) : '';
				return (
					<button
						key={row.id}
						type="button"
						className={styles.row}
						onClick={(): void => onSelect(row.id)}
						data-testid={`service-map-neighbour-${direction}-${row.id}`}
					>
						<LegendSwatch
							band={node?.band ?? 'noData'}
							kind={node?.kind ?? 'service'}
						/>
						<span className={styles.rowBody}>
							<span className={styles.rowName} title={row.id}>
								{row.id}
								<span className={styles.srOnly}>{`, ${health}`}</span>
							</span>
							<span className={styles.rowMetric}>
								{`${SERVICE_MAP_TEXT.panelCall}: ${formatRate(row.callRate)} · ${formatPercent(row.errorRate)} errors · p99 ${formatDuration(row.p99)}*`}
							</span>
							{hasDeltas && (
								<span className={styles.rowMetric}>
									<span>{`${SERVICE_MAP_TEXT.panelVsYesterdayShort}:`}</span>
									<DeltaIndicator value={deltas.errorRate} unit="pp" />
									<DeltaIndicator value={deltas.p99} unit="pct" />
								</span>
							)}
						</span>
					</button>
				);
			})}
			{rows.length > MAX_NEIGHBOUR_ROWS && !showAll && (
				<Button
					variant="link"
					color="secondary"
					size="sm"
					onClick={(): void => setShowAll(true)}
					testId={`service-map-neighbour-${direction}-show-all`}
				>
					{SERVICE_MAP_TEXT.panelShowAll(rows.length)}
				</Button>
			)}
		</section>
	);
}

export default NeighbourList;
