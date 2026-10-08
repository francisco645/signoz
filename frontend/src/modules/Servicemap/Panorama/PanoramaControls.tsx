import { Button } from '@signozhq/ui/button';
import { Switch } from '@signozhq/ui/switch';

import { PANORAMA_VIEWS, PanoramaView } from './scene/cameraPoses';
import { PANORAMA_TEXT, PANORAMA_VIEW_TEXT } from './panoramaText';

import styles from './Panorama.module.scss';

interface PanoramaControlsProps {
	view: PanoramaView;
	isFlat: boolean;
	isAutoRotating: boolean;
	canAutoRotate: boolean;
	onViewChange: (view: PanoramaView) => void;
	onFlatChange: (isFlat: boolean) => void;
	onAutoRotateChange: (isOn: boolean) => void;
}

function PanoramaControls({
	view,
	isFlat,
	isAutoRotating,
	canAutoRotate,
	onViewChange,
	onFlatChange,
	onAutoRotateChange,
}: PanoramaControlsProps): JSX.Element {
	return (
		<div className={styles.controls}>
			<div
				className={styles.segmented}
				// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="group"
				aria-label={PANORAMA_TEXT.views}
			>
				{PANORAMA_VIEWS.map((option) => (
					<Button
						key={option}
						variant={view === option ? 'solid' : 'ghost'}
						color="secondary"
						size="sm"
						aria-pressed={view === option}
						onClick={(): void => onViewChange(option)}
						testId={`panorama-view-${option}`}
					>
						{PANORAMA_VIEW_TEXT[option]}
					</Button>
				))}
			</div>
			<Switch
				value={isAutoRotating}
				disabled={!canAutoRotate}
				onChange={onAutoRotateChange}
				testId="panorama-auto-rotate"
			>
				{canAutoRotate ? PANORAMA_TEXT.autoRotate : PANORAMA_TEXT.autoRotateReduced}
			</Switch>
			<Button
				variant="solid"
				color="primary"
				size="sm"
				aria-pressed={isFlat}
				onClick={(): void => onFlatChange(!isFlat)}
				testId="panorama-flatten"
			>
				{isFlat ? PANORAMA_TEXT.showPlanes : PANORAMA_TEXT.flatten}
			</Button>
		</div>
	);
}

export default PanoramaControls;
