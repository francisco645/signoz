import { ReactNode } from 'react';

import styles from './CanvasTooltip.module.scss';

/** Distance from the pointer, so the pointer never lands on the tooltip. */
const POINTER_OFFSET = 15;

interface CanvasTooltipProps {
	x: number;
	y: number;
	children: ReactNode;
}

function CanvasTooltip({ x, y, children }: CanvasTooltipProps): JSX.Element {
	return (
		<div
			className={styles.tooltip}
			style={{ left: x + POINTER_OFFSET, top: y + POINTER_OFFSET }}
			role="tooltip"
			data-testid="service-map-tooltip"
		>
			{children}
		</div>
	);
}

export default CanvasTooltip;
