import { Maximize2, Minus, Plus } from '@signozhq/icons';
import { Button, ButtonGroup } from '@signozhq/ui/button';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './ServiceMapCanvas.module.scss';

interface ZoomControlsProps {
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFit: () => void;
}

function ZoomControls({
	onZoomIn,
	onZoomOut,
	onFit,
}: ZoomControlsProps): JSX.Element {
	return (
		<ButtonGroup
			className={styles.zoomControls}
			variant="outlined"
			color="secondary"
			size="icon"
			testId="service-map-zoom-controls"
		>
			<Button
				prefix={<Plus />}
				aria-label={SERVICE_MAP_TEXT.zoomIn}
				title={SERVICE_MAP_TEXT.zoomIn}
				onClick={onZoomIn}
				testId="service-map-zoom-in"
			/>
			<Button
				prefix={<Minus />}
				aria-label={SERVICE_MAP_TEXT.zoomOut}
				title={SERVICE_MAP_TEXT.zoomOut}
				onClick={onZoomOut}
				testId="service-map-zoom-out"
			/>
			<Button
				prefix={<Maximize2 />}
				aria-label={SERVICE_MAP_TEXT.zoomFit}
				title={SERVICE_MAP_TEXT.zoomFit}
				onClick={onFit}
				testId="service-map-zoom-fit"
			/>
		</ButtonGroup>
	);
}

export default ZoomControls;
