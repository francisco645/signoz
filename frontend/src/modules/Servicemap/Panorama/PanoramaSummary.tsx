import { useMemo } from 'react';
import cx from 'classnames';

import { formatRate } from '../utils/format';
import type { PanoramaModel } from './scene/panoramaModel';
import { PANORAMA_TEXT } from './panoramaText';

import styles from './Panorama.module.scss';

interface PanoramaSummaryProps {
	model: PanoramaModel;
	windowLabel: string;
}

function PanoramaSummary({
	model,
	windowLabel,
}: PanoramaSummaryProps): JSX.Element {
	const totals = useMemo(
		() => ({
			entryTraffic: model.nodes
				.filter((node) => node.tier === 'entry')
				.reduce((sum, node) => sum + node.callRate, 0),
			critical: model.nodes.filter((node) => node.band === 'critical').length,
			degraded: model.nodes.filter((node) => node.band === 'degraded').length,
		}),
		[model],
	);

	return (
		<section
			className={cx(styles.card, styles.summary)}
			aria-label={PANORAMA_TEXT.summaryTitle}
			data-testid="panorama-summary"
		>
			<div className={styles.sectionTitle}>{PANORAMA_TEXT.summaryTitle}</div>
			<div className={styles.window}>{windowLabel}</div>
			<div className={styles.row}>
				{PANORAMA_TEXT.services}
				<span className={styles.value}>{model.nodes.length}</span>
			</div>
			<div className={styles.row}>
				{PANORAMA_TEXT.calls}
				<span className={styles.value}>{model.links.length}</span>
			</div>
			<div className={styles.row}>
				{PANORAMA_TEXT.entryTraffic}
				<span className={styles.value}>{formatRate(totals.entryTraffic)}</span>
			</div>
			<div className={styles.row}>
				{PANORAMA_TEXT.critical}
				<span className={cx(styles.value, styles.critical)}>{totals.critical}</span>
			</div>
			<div className={styles.row}>
				{PANORAMA_TEXT.degraded}
				<span className={cx(styles.value, styles.degraded)}>{totals.degraded}</span>
			</div>
		</section>
	);
}

export default PanoramaSummary;
