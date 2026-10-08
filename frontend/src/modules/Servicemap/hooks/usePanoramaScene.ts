import { RefObject, useEffect, useRef } from 'react';

import type { PanoramaView } from '../Panorama/scene/cameraPoses';
import {
	createPanoramaScene,
	PanoramaScene,
} from '../Panorama/scene/createPanoramaScene';
import type { PanoramaModel } from '../Panorama/scene/panoramaModel';
import { getPanoramaTheme } from '../Panorama/scene/panoramaTheme';
import type { PanoramaHit } from '../Panorama/scene/pointer';
import { PANORAMA_TIER_TEXT } from '../Panorama/panoramaText';

interface UsePanoramaSceneProps {
	containerRef: RefObject<HTMLDivElement>;
	/** Off until the container has a size and the label fonts loaded. */
	isReady: boolean;
	model: PanoramaModel;
	isDarkMode: boolean;
	reduceMotion: boolean;
	view: PanoramaView;
	isFlat: boolean;
	isAutoRotating: boolean;
	selectedId?: string;
	width: number;
	height: number;
	leftInsetPx: number;
	onHover: (hit: PanoramaHit | undefined, x: number, y: number) => void;
	onNodeClick: (id: string) => void;
	onAutoRotateStop: () => void;
}

/** Owns the three.js scene: built once per theme, then fed the model and the controls. */
export const usePanoramaScene = (props: UsePanoramaSceneProps): void => {
	const { containerRef, isReady, isDarkMode, reduceMotion } = props;
	const { model, view, isFlat, isAutoRotating, selectedId } = props;
	const { width, height, leftInsetPx } = props;
	const sceneRef = useRef<PanoramaScene>();
	const latest = useRef(props);
	latest.current = props;

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !isReady) {
			return undefined;
		}
		const scene = createPanoramaScene(container, {
			theme: getPanoramaTheme(isDarkMode),
			tierText: PANORAMA_TIER_TEXT,
			reduceMotion,
			onHover: (hit, x, y) => latest.current.onHover(hit, x, y),
			onNodeClick: (id) => latest.current.onNodeClick(id),
			onAutoRotateStop: () => latest.current.onAutoRotateStop(),
		});
		const current = latest.current;
		scene.setSize(current.width, current.height, current.leftInsetPx);
		scene.setModel(current.model);
		scene.setSelected(current.selectedId);
		scene.setPose(current.view, current.isFlat);
		scene.setAutoRotate(current.isAutoRotating);
		sceneRef.current = scene;
		return (): void => {
			scene.dispose();
			sceneRef.current = undefined;
		};
	}, [containerRef, isDarkMode, isReady, reduceMotion]);

	// Each setter ignores a value it already has, so the first run after creation is free.
	useEffect(() => sceneRef.current?.setModel(model), [model]);
	useEffect(() => sceneRef.current?.setPose(view, isFlat), [view, isFlat]);
	useEffect(
		() => sceneRef.current?.setAutoRotate(isAutoRotating),
		[isAutoRotating],
	);
	useEffect(() => sceneRef.current?.setSelected(selectedId), [selectedId]);
	useEffect(
		() => sceneRef.current?.setSize(width, height, leftInsetPx),
		[width, height, leftInsetPx],
	);
};
