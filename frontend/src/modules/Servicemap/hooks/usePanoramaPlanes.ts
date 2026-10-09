import { useMemo } from 'react';
import { toast } from '@signozhq/ui/sonner';

import { PLANE_TEXT } from '../Panorama/panoramaText';
import type { ServiceMapGraph } from '../types';
import { ResolvedPlane, resolvePlanes } from '../utils/planes';
import { getInferredTiers, PanoramaTier } from '../utils/tiers';
import { useDeclaredPlanes } from './useDeclaredPlanes';
import { usePlaneAdjustments } from './usePlaneAdjustments';

export interface PanoramaPlanes {
	planes: ReadonlyMap<string, ResolvedPlane>;
	adjustedCount: number;
	setPlane: (id: string, tier: PanoramaTier | undefined) => void;
	/** Clears every adjustment, with an undo in the toast. */
	reset: () => void;
}

/** The plane of every node: your adjustment, then the service's declaration, then the inference. */
export const usePanoramaPlanes = (
	graph: ServiceMapGraph,
	minTime: number,
	maxTime: number,
	isEnabled: boolean,
): PanoramaPlanes => {
	const declared = useDeclaredPlanes(minTime, maxTime, isEnabled);
	const { adjusted, setPlane, replaceAll } = usePlaneAdjustments();
	const inferred = useMemo(() => getInferredTiers(graph), [graph]);
	const planes = useMemo(
		() => resolvePlanes(inferred, declared, adjusted),
		[adjusted, declared, inferred],
	);
	const adjustedCount = [...planes.values()].filter(
		(plane) => plane.source === 'adjusted',
	).length;

	return {
		planes,
		adjustedCount,
		setPlane,
		reset: (): void => {
			const previous = new Map(adjusted);
			replaceAll(new Map());
			toast.success(PLANE_TEXT.resetDone, {
				action: { label: PLANE_TEXT.undo, onClick: () => replaceAll(previous) },
			});
		},
	};
};
