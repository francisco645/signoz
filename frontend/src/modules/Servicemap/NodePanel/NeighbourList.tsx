import { useState } from 'react';
import { Button } from '@signozhq/ui/button';
import type { ServicesList } from 'types/api/metrics/getService';

import { MAX_NEIGHBOUR_ROWS, SERVICE_MAP_TEXT } from '../constants';
import LegendSwatch from '../Legend/LegendSwatch';
import { getServiceDeltas } from '../utils/delta';
import { formatDuration, formatPercent, formatRate } from '../utils/format';
import { NeighbourDirection, NeighbourRow } from '../utils/neighbours';
import DeltaIndicator from './DeltaIndicator';

import styles from './ServiceNodePanel.module.scss';

interface NeighbourListProps {
	direction: NeighbourDirection;
	rows: NeighbourRow[];
	services: ReadonlyMap<string, ServicesList>;
	yesterday: ReadonlyMap<string, ServicesList>;
	onSelect: (id: string) => void;
}

function NeighbourList({
	direction,
	rows,
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
				const deltas = getServiceDeltas(
					services.get(row.id),
					yesterday.get(row.id),
				);
				return (
					<button
						key={row.id}
						type="button"
						className={styles.row}
						onClick={(): void => onSelect(row.id)}
						data-testid={`service-map-neighbour-${direction}-${row.id}`}
					>
						<LegendSwatch band={row.band} />
						<span className={styles.rowName} title={row.id}>
							{row.id}
						</span>
						<span className={styles.rowMetric}>{formatRate(row.callRate)}</span>
						<span className={styles.rowMetric}>
							{formatPercent(row.errorRate)}
							<DeltaIndicator value={deltas.errorRate} unit="pp" />
						</span>
						<span className={styles.rowMetric}>
							{`${formatDuration(row.p99)}*`}
							<DeltaIndicator value={deltas.p99} unit="pct" />
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
