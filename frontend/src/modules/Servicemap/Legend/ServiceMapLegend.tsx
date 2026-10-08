import { forwardRef } from 'react';
import {
	Box,
	ChevronDown,
	ChevronUp,
	Database,
	Info,
	Layers,
} from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';

import {
	CRITICAL_ERROR_RATE,
	DEGRADED_ERROR_RATE,
	SERVICE_MAP_TEXT,
} from '../constants';
import type { AnimateDirection } from '../hooks/useAnimateDirection';
import { useLegendCollapsed } from '../hooks/useLegendCollapsed';
import type { HealthBand } from '../types';
import BlindSpotPopover from './BlindSpotPopover';
import FlowSwitch from './FlowSwitch';
import LegendSwatch from './LegendSwatch';

import styles from './ServiceMapLegend.module.scss';

const ITEMS: { band: HealthBand; label: string }[] = [
	{ band: 'healthy', label: `< ${DEGRADED_ERROR_RATE}%` },
	{
		band: 'degraded',
		label: `${DEGRADED_ERROR_RATE}–${CRITICAL_ERROR_RATE}%`,
	},
	{ band: 'critical', label: `≥ ${CRITICAL_ERROR_RATE}%` },
	{ band: 'lowTraffic', label: SERVICE_MAP_TEXT.legendLowTraffic },
	{ band: 'noData', label: SERVICE_MAP_TEXT.legendNoData },
];

/** The same @signozhq/icons glyphs the canvas strokes inside each node. */
const KIND_ITEMS = [
	{ kind: 'service', Icon: Box, label: SERVICE_MAP_TEXT.legendService },
	{ kind: 'database', Icon: Database, label: SERVICE_MAP_TEXT.legendDatabase },
	{ kind: 'queue', Icon: Layers, label: SERVICE_MAP_TEXT.legendQueue },
] as const;

/** Always on screen; collapsing keeps the error bands in a single line. */
interface ServiceMapLegendProps {
	animateDirection: AnimateDirection;
}

const ServiceMapLegend = forwardRef<HTMLElement, ServiceMapLegendProps>(
	function ServiceMapLegend({ animateDirection }, ref): JSX.Element {
		const [isCollapsed, toggle] = useLegendCollapsed();
		const bands = isCollapsed ? ITEMS.slice(0, 3) : ITEMS;

		return (
			<section
				ref={ref}
				className={styles.legend}
				aria-label="Legend"
				data-testid="service-map-legend"
			>
				<div className={styles.header}>
					<span className={styles.title}>{SERVICE_MAP_TEXT.legendTitle}</span>
					<Button
						variant="ghost"
						color="secondary"
						size="icon"
						prefix={isCollapsed ? <ChevronUp /> : <ChevronDown />}
						aria-label={
							isCollapsed ? SERVICE_MAP_TEXT.legendShow : SERVICE_MAP_TEXT.legendHide
						}
						aria-expanded={!isCollapsed}
						onClick={toggle}
						testId="service-map-legend-toggle"
					/>
				</div>
				<div className={styles.items}>
					{bands.map(({ band, label }) => (
						<span key={band} className={styles.item}>
							<LegendSwatch band={band} />
							{label}
						</span>
					))}
				</div>
				{!isCollapsed && (
					<>
						<div className={styles.items}>
							{KIND_ITEMS.map(({ kind, Icon, label }) => (
								<span key={kind} className={styles.item}>
									<Icon size={14} aria-hidden />
									{label}
								</span>
							))}
						</div>
						<div className={styles.item}>
							<LegendSwatch band="healthy" isCompact />
							<LegendSwatch band="healthy" kind="database" isCompact />
							{SERVICE_MAP_TEXT.legendZoomedOut}
						</div>
						<div>{SERVICE_MAP_TEXT.legendColorNote}</div>
						<div>{SERVICE_MAP_TEXT.legendCallGlyphs}</div>
						<div>{SERVICE_MAP_TEXT.legendEdges}</div>
						<FlowSwitch
							isPreferred={animateDirection.isPreferred}
							isBlockedByReducedMotion={animateDirection.isBlockedByReducedMotion}
							onChange={animateDirection.setPreferred}
						/>
						<div className={styles.footer}>
							<Info size={12} />
							{SERVICE_MAP_TEXT.legendMissingEdges}
							<BlindSpotPopover />
						</div>
					</>
				)}
			</section>
		);
	},
);

export default ServiceMapLegend;
