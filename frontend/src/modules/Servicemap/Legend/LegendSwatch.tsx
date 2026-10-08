import { useEffect, useRef } from 'react';
import { useIsDarkMode } from 'hooks/useDarkMode';

import type { HealthBand, NodeKind } from '../types';
import { drawNode } from '../utils/drawNode';
import { getServiceMapPalette } from '../utils/palette';

import styles from './ServiceMapLegend.module.scss';

/** Room for the 22px disc plus its badge, which sticks out at the top right. */
const SIZE = 28;
const COMPACT_SIZE = 16;
/** Any zoom below `pictogramMinZoom` draws the compact shape. */
const COMPACT_SCALE = 0.5;
const BADGE_ROOM = 2;

interface LegendSwatchProps {
	band: HealthBand;
	kind?: NodeKind;
	/** Draw the zoomed-out shape instead of the disc with its icon. */
	isCompact?: boolean;
}

/** Drawn with the map's own `drawNode`, so the legend cannot drift from it. */
function LegendSwatch({
	band,
	kind = 'service',
	isCompact = false,
}: LegendSwatchProps): JSX.Element {
	const size = isCompact ? COMPACT_SIZE : SIZE;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDarkMode = useIsDarkMode();

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) {
			return;
		}
		const ratio = window.devicePixelRatio || 1;
		canvas.width = size * ratio;
		canvas.height = size * ratio;
		const scale = isCompact ? COMPACT_SCALE : 1;
		ctx.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);
		ctx.clearRect(0, 0, size / scale, size / scale);
		const palette = getServiceMapPalette(isDarkMode);
		const offset = isCompact ? 0 : BADGE_ROOM;
		drawNode(
			ctx,
			{ x: (size / 2 - offset / 2) / scale, y: (size / 2 + offset / 2) / scale },
			{
				kind,
				band,
				label: '',
				showLabel: false,
				forceLabel: false,
				isSelected: false,
				isHovered: false,
				isCursor: false,
				isDimmed: false,
			},
			{ ...palette, background: palette.surface },
			scale,
		);
	}, [band, isCompact, isDarkMode, kind, size]);

	return (
		<canvas
			ref={canvasRef}
			className={isCompact ? styles.swatchCompact : styles.swatch}
			aria-hidden
		/>
	);
}

export default LegendSwatch;
