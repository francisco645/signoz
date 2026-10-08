import { SERVICE_MAP_TEXT } from '../constants';
import type { ServiceMapLink } from '../types';
import {
	formatCount,
	formatDuration,
	formatPercent,
	formatRate,
} from '../utils/format';

import styles from './CanvasTooltip.module.scss';

interface LinkTooltipContentProps {
	link: ServiceMapLink;
	source: string;
	target: string;
	/** The callee has spans of its own, so the call was measured on its side. */
	isServerSide: boolean;
}

function LinkTooltipContent({
	link,
	source,
	target,
	isServerSide,
}: LinkTooltipContentProps): JSX.Element {
	const errorCount = (link.errorRate / 100) * link.callCount;
	const side = isServerSide ? 'server' : 'client';

	return (
		<>
			<div className={styles.title}>
				{source} → {target}
			</div>
			<div className={styles.metric}>
				{formatRate(link.callRate)} · {formatPercent(link.errorRate)} errors (
				{formatCount(errorCount)} / {formatCount(link.callCount)})
			</div>
			<div className={styles.metric}>
				{`p99 (${side} side) ${formatDuration(link.p99)}`}
			</div>
			<div className={styles.note}>
				{isServerSide
					? SERVICE_MAP_TEXT.tooltipServerSide(target)
					: SERVICE_MAP_TEXT.tooltipClientSide(source, target)}
			</div>
		</>
	);
}

export default LinkTooltipContent;
