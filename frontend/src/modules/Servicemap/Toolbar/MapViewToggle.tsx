import { Button } from '@signozhq/ui/button';

import { SERVICE_MAP_TEXT } from '../constants';
import type { MapView } from '../hooks/useMapView';

interface MapViewToggleProps {
	view: MapView;
	is3dAvailable: boolean;
	onChange: (view: MapView) => void;
}

const LABELS: Record<MapView, string> = {
	'2d': SERVICE_MAP_TEXT.view2d,
	'3d': SERVICE_MAP_TEXT.view3d,
};

function MapViewToggle({
	view,
	is3dAvailable,
	onChange,
}: MapViewToggleProps): JSX.Element {
	return (
		// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
		<div role="group" aria-label={SERVICE_MAP_TEXT.mapView}>
			{(['2d', '3d'] as const).map((option) => (
				<Button
					key={option}
					variant={view === option ? 'solid' : 'ghost'}
					color={view === option ? 'primary' : 'secondary'}
					size="sm"
					aria-pressed={view === option}
					disabled={option === '3d' && !is3dAvailable}
					title={
						option === '3d' && !is3dAvailable
							? SERVICE_MAP_TEXT.view3dUnavailable
							: undefined
					}
					onClick={(): void => onChange(option)}
					testId={`service-map-view-${option}`}
				>
					{LABELS[option]}
				</Button>
			))}
		</div>
	);
}

export default MapViewToggle;
