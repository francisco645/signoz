import { ComponentProps, lazy, Suspense } from 'react';
import * as Sentry from '@sentry/react';

import LoadingState from '../States/LoadingState';

// three.js only loads for viewers who open the 3D view.
const PanoramaView = lazy(() => import('./PanoramaView'));

interface PanoramaSlotProps extends ComponentProps<typeof PanoramaView> {
	/** The chunk failed to load or WebGL refused a context: the map falls back to 2D. */
	onError: () => void;
}

function PanoramaSlot({ onError, ...props }: PanoramaSlotProps): JSX.Element {
	return (
		<Sentry.ErrorBoundary fallback={<LoadingState />} onError={onError}>
			<Suspense fallback={<LoadingState />}>
				<PanoramaView {...props} />
			</Suspense>
		</Sentry.ErrorBoundary>
	);
}

export default PanoramaSlot;
