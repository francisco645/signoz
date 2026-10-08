import cx from 'classnames';

import { formatDelta } from '../utils/delta';

import styles from './ServiceNodePanel.module.scss';

interface DeltaIndicatorProps {
	value?: number;
	unit: 'pct' | 'pp';
	testId?: string;
}

/**
 * Up is worse for every metric the map shows, so a rise is red and a drop is
 * muted rather than green.
 */
function DeltaIndicator({
	value,
	unit,
	testId,
}: DeltaIndicatorProps): JSX.Element | null {
	if (value === undefined || !Number.isFinite(value)) {
		return null;
	}
	const isWorse = value > 0;
	const isUnchanged = Math.abs(value) < 0.05;
	return (
		<span
			className={cx(styles.delta, {
				[styles.isWorse]: isWorse && !isUnchanged,
				[styles.isBetter]: !isWorse || isUnchanged,
			})}
			data-testid={testId}
		>
			{isUnchanged
				? formatDelta(0, unit)
				: `${isWorse ? '▲' : '▼'} ${formatDelta(value, unit)}`}
		</span>
	);
}

export default DeltaIndicator;
