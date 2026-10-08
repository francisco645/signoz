import { useCallback, useEffect, useRef } from 'react';

import {
	CAMERA_DURATION_MS,
	FIT_PADDING_PX,
	LABEL_ALLOWANCE_PX,
	MAX_ZOOM,
	MIN_ZOOM,
} from '../constants';
import type { ServiceMapGraphRef } from '../Canvas/ServiceMapCanvas';
import type { ServiceMapGraph } from '../types';
import { fitCamera, Insets } from '../utils/camera';

interface UseGraphCameraProps {
	fgRef: ServiceMapGraphRef;
	graph: ServiceMapGraph;
	width: number;
	height: number;
	insets: Insets;
	highlighted?: ReadonlySet<string>;
	prefersReducedMotion: boolean;
}

interface GraphCamera {
	fitToView: () => void;
	zoomBy: (factor: number) => void;
	handleEngineStop: () => void;
}

/**
 * Fits the graph, or the focused part of it, into the space the toolbar,
 * focus banner and legend leave free. It fits once as soon as the warm-up
 * layout is drawn, again when the layout settles, and whenever the focused set
 * or the overlays around it change.
 */
export const useGraphCamera = ({
	fgRef,
	graph,
	width,
	height,
	insets,
	highlighted,
	prefersReducedMotion,
}: UseGraphCameraProps): GraphCamera => {
	const settledNodesRef = useRef<string>();
	const duration = prefersReducedMotion ? 0 : CAMERA_DURATION_MS;
	const nodesKey = graph.nodes.map((node) => node.id).join('\u0000');
	const hasSize = width > 0;

	const fitToView = useCallback((): void => {
		const graphRef = fgRef.current;
		if (!graphRef || graph.nodes.length === 0 || width === 0) {
			return;
		}
		const camera = fitCamera(
			graphRef.getGraphBbox((node) => !highlighted || highlighted.has(node.id)),
			{ width, height },
			{
				top: insets.top + FIT_PADDING_PX,
				right: insets.right + FIT_PADDING_PX,
				bottom: insets.bottom + FIT_PADDING_PX + LABEL_ALLOWANCE_PX,
				left: insets.left + FIT_PADDING_PX,
			},
			{ min: MIN_ZOOM, max: MAX_ZOOM },
		);
		// Two d3 transitions on the same element cancel each other: zoom at once, pan smoothly.
		graphRef.zoom(camera.zoom, 0);
		graphRef.centerAt(camera.x, camera.y, duration);
	}, [duration, fgRef, graph.nodes.length, height, highlighted, insets, width]);

	const fitRef = useRef(fitToView);
	fitRef.current = fitToView;

	useEffect(() => {
		const frame = requestAnimationFrame(() => fitRef.current());
		return (): void => cancelAnimationFrame(frame);
	}, [nodesKey, hasSize]);

	useEffect(() => {
		if (highlighted) {
			fitRef.current();
		}
	}, [highlighted, insets.top, insets.bottom]);

	const handleEngineStop = useCallback((): void => {
		if (settledNodesRef.current !== nodesKey) {
			settledNodesRef.current = nodesKey;
			fitRef.current();
		}
	}, [nodesKey]);

	const zoomBy = useCallback(
		(factor: number): void => {
			const graphRef = fgRef.current;
			if (graphRef) {
				graphRef.zoom(graphRef.zoom() * factor, duration);
			}
		},
		[duration, fgRef],
	);

	return { fitToView, zoomBy, handleEngineStop };
};
