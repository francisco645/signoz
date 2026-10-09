import { CircleX, TriangleAlert } from '@signozhq/icons';
import cx from 'classnames';

import type { AlertSummary } from '../../types/home';
import { formatAge } from '../../utils/format';

import styles from '../Section/Section.module.scss';

interface FiringAlertsProps {
	summary: AlertSummary;
	nowMs: number;
}

function FiringAlerts({ summary, nowMs }: FiringAlertsProps): JSX.Element {
	return (
		<>
			{summary.firing.map((alert) => {
				const isCritical = alert.severity === 'critical';
				const tone = isCritical ? styles.critical : styles.warning;
				return (
					<div
						key={alert.fingerprint}
						className={styles.row}
						data-testid="home-firing-alert-row"
					>
						<span className={tone}>
							{isCritical ? <CircleX size={14} /> : <TriangleAlert size={14} />}
						</span>
						<span className={styles.name}>
							{alert.name}
							{alert.service && <small>{alert.service}</small>}
						</span>
						<span className={styles.mono}>{formatAge(alert.startsAtMs, nowMs)}</span>
						<span className={cx(styles.mono, tone)}>{alert.value ?? '—'}</span>
					</div>
				);
			})}
			<div className={styles.note}>
				<span>
					<b>{summary.silenced}</b> silenced
				</span>
			</div>
		</>
	);
}

export default FiringAlerts;
