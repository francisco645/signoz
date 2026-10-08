import cx from 'classnames';

import { DeltaPolarity, formatDelta, isWorseChange } from '../utils/delta';

import styles from './ServiceNodePanel.module.scss';

interface DeltaIndicatorProps {
	value?: number;
	unit: 'pct' | 'pp';
	/** Errors and latency are worse going up; traffic is worth a look either way. */
	polarity?: DeltaPolarity;
	testId?: string;
}

/** Bad news is red; everything else stays muted, never green. */
function DeltaIndicator({
	value,
	unit,
	polarity = 'higherIsWorse',
	testId,
}: DeltaIndicatorProps): JSX.Element | null {
	if (value === undefined || !Number.isFinite(value)) {
		return null;
	}
	const isUnchanged = Math.abs(value) < 0.05;
	const isWorse = !isUnchanged && isWorseChange(value, polarity);
	let text = formatDelta(0, unit);
	if (!isUnchanged) {
		text = `${value > 0 ? '▲' : '▼'} ${formatDelta(value, unit)}`;
	}
	return (
		<span
			className={cx(styles.delta, {
				[styles.isWorse]: isWorse,
				[styles.isBetter]: !isWorse,
			})}
			data-testid={testId}
		>
			{text}
		</span>
	);
}

export default DeltaIndicator;
