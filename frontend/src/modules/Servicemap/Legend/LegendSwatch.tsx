import { useEffect, useRef } from 'react';
import { useIsDarkMode } from 'hooks/useDarkMode';

import type { HealthBand } from '../types';
import { drawNode } from '../utils/draw';
import { getServiceMapPalette } from '../utils/palette';

import styles from './ServiceMapLegend.module.scss';

const SIZE = 20;

interface LegendSwatchProps {
	band: HealthBand;
}

/** Drawn with the map's own `drawNode`, so the legend cannot drift from it. */
function LegendSwatch({ band }: LegendSwatchProps): JSX.Element {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDarkMode = useIsDarkMode();

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) {
			return;
		}
		const ratio = window.devicePixelRatio || 1;
		canvas.width = SIZE * ratio;
		canvas.height = SIZE * ratio;
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		ctx.clearRect(0, 0, SIZE, SIZE);
		drawNode(
			ctx,
			{ x: SIZE / 2, y: SIZE / 2 },
			{
				band,
				label: '',
				showLabel: false,
				isSelected: false,
				isHovered: false,
				isDimmed: false,
			},
			getServiceMapPalette(isDarkMode),
			1,
		);
	}, [band, isDarkMode]);

	return <canvas ref={canvasRef} className={styles.swatch} aria-hidden />;
}

export default LegendSwatch;
