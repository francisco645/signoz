import { forwardRef } from 'react';
import { Info } from '@signozhq/icons';

import {
	CRITICAL_ERROR_RATE,
	DEGRADED_ERROR_RATE,
	SERVICE_MAP_TEXT,
} from '../constants';
import type { HealthBand } from '../types';
import BlindSpotPopover from './BlindSpotPopover';
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

const ServiceMapLegend = forwardRef<HTMLElement>(
	function ServiceMapLegend(_props, ref): JSX.Element {
		return (
			<section
				ref={ref}
				className={styles.legend}
				aria-label="Legend"
				data-testid="service-map-legend"
			>
				<div className={styles.title}>{SERVICE_MAP_TEXT.legendTitle}</div>
				<div className={styles.items}>
					{ITEMS.map(({ band, label }) => (
						<span key={band} className={styles.item}>
							<LegendSwatch band={band} />
							{label}
						</span>
					))}
				</div>
				<div>{SERVICE_MAP_TEXT.legendColorNote}</div>
				<div>{SERVICE_MAP_TEXT.legendEdges}</div>
				<div className={styles.footer}>
					<Info size={12} />
					{SERVICE_MAP_TEXT.legendMissingEdges}
					<BlindSpotPopover />
				</div>
			</section>
		);
	},
);

export default ServiceMapLegend;
