import {
	DirectionalLight,
	Fog,
	HemisphereLight,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { PanoramaTier } from '../../utils/tiers';
import { easeInOutCubic, getCameraPose, PanoramaView } from './cameraPoses';
import { attachPointer, PanoramaHit } from './pointer';
import type { PanoramaModel } from './panoramaModel';
import type { PanoramaTheme } from './panoramaTheme';
import type { TierText } from './tierPlanes';
import { buildWorld, disposeWorld, placeWorld, World } from './world';

interface PanoramaSceneOptions {
	theme: PanoramaTheme;
	tierText: Record<PanoramaTier, TierText>;
	reduceMotion: boolean;
	onHover: (hit: PanoramaHit | undefined, x: number, y: number) => void;
	onNodeClick: (id: string) => void;
	/** The viewer grabbed the camera, which stops the auto rotation. */
	onAutoRotateStop: () => void;
}

export interface PanoramaScene {
	setModel: (model: PanoramaModel) => void;
	/** Camera preset and flattening move together, so the framing uses the new state. */
	setPose: (view: PanoramaView, isFlat: boolean) => void;
	setAutoRotate: (isOn: boolean) => void;
	setSelected: (id: string | undefined) => void;
	/** Screen space on the left kept for the legend. */
	setSize: (width: number, height: number, leftInsetPx: number) => void;
	dispose: () => void;
}

type TweenKey = 'camera' | 'flat';

interface Tween {
	startedAt: number;
	durationMs: number;
	apply: (progress: number) => void;
}

const VIEW_MS = 900;
const FLATTEN_MS = 1100;

/** Builds the three.js world for a panorama and drives it; the caller owns the container. */
export const createPanoramaScene = (
	container: HTMLElement,
	options: PanoramaSceneOptions,
): PanoramaScene => {
	const { theme, reduceMotion } = options;
	const renderer = new WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
	renderer.setClearColor(theme.background);
	const canvas = renderer.domElement;
	container.appendChild(canvas);

	const scene = new Scene();
	scene.fog = new Fog(theme.background, 700, 1400);
	// three.js lights are physical since r155: π keeps the prototype's brightness.
	scene.add(new HemisphereLight(0xdfe6ff, 0x2a2e38, 0.7 * Math.PI));
	const keyLight = new DirectionalLight(0xffffff, 0.55 * Math.PI);
	keyLight.position.set(120, 260, 160);
	scene.add(keyLight);

	const camera = new PerspectiveCamera(38, 1, 1, 3000);
	const controls = new OrbitControls(camera, canvas);
	controls.enableDamping = true;
	controls.dampingFactor = 0.08;
	controls.autoRotateSpeed = 0.45;
	controls.minDistance = 80;
	controls.maxDistance = 900;

	let world: World | undefined;
	let view: PanoramaView = 'iso';
	let isFlat = false;
	let flat = 0;
	let selectedId: string | undefined;
	let shownModel: PanoramaModel | undefined;
	/** The camera still sits on a preset; once the viewer orbits, resizes keep their angle. */
	let isFramed = true;
	let isDirty = true;
	const tweens = new Map<TweenKey, Tween>();

	const tween = (
		key: TweenKey,
		durationMs: number,
		apply: (progress: number) => void,
	): void => {
		isDirty = true;
		if (reduceMotion || durationMs === 0) {
			tweens.delete(key);
			apply(1);
			return;
		}
		tweens.set(key, { startedAt: performance.now(), durationMs, apply });
	};

	const frame = (durationMs: number): void => {
		if (!world) {
			return;
		}
		const pose = getCameraPose(view, world.extent, isFlat, camera.aspect);
		const fromPosition = camera.position.clone();
		const fromTarget = controls.target.clone();
		isFramed = true;
		tween('camera', durationMs, (progress) => {
			if (progress >= 1) {
				camera.position.copy(pose.position);
				controls.target.copy(pose.target);
				return;
			}
			const eased = easeInOutCubic(progress);
			camera.position.lerpVectors(fromPosition, pose.position, eased);
			controls.target.lerpVectors(fromTarget, pose.target, eased);
		});
	};

	controls.addEventListener('start', () => {
		isFramed = false;
		tweens.delete('camera');
		if (controls.autoRotate) {
			controls.autoRotate = false;
			options.onAutoRotateStop();
		}
	});
	controls.addEventListener('change', () => {
		isDirty = true;
	});

	let animationFrame = 0;
	let last = performance.now();
	const loop = (now: number): void => {
		const elapsedS = Math.min(0.05, (now - last) / 1000);
		last = now;
		tweens.forEach((current, key) => {
			const progress = Math.min(1, (now - current.startedAt) / current.durationMs);
			current.apply(progress);
			if (progress >= 1) {
				tweens.delete(key);
			}
		});
		controls.update();
		// Particles keep the scene moving; with reduced motion it only draws on change.
		const isMoving = !reduceMotion || tweens.size > 0 || controls.autoRotate;
		if (world && (isMoving || isDirty)) {
			placeWorld(world, flat, reduceMotion ? 0 : elapsedS, reduceMotion);
			renderer.render(scene, camera);
			isDirty = false;
		}
		animationFrame = requestAnimationFrame(loop);
	};
	animationFrame = requestAnimationFrame(loop);

	const pointer = attachPointer(canvas, camera, () => world, {
		onHover: (hit, x, y) => {
			isDirty = true;
			options.onHover(hit, x, y);
		},
		onNodeClick: options.onNodeClick,
	});

	const removeWorld = (): void => {
		if (world) {
			scene.remove(world.root);
			disposeWorld(world);
			world = undefined;
		}
	};

	return {
		setModel: (model): void => {
			if (model === shownModel) {
				return;
			}
			shownModel = model;
			const isFirst = !world;
			const heights = new Map(
				[...(world?.nodes ?? [])].map(([id, node]) => [id, node.height]),
			);
			removeWorld();
			pointer.reset();
			world = buildWorld(model, theme, options.tierText, heights);
			world.nodes.get(selectedId ?? '')?.setSelected(true);
			scene.add(world.root);
			isDirty = true;
			if (isFirst) {
				frame(0);
			}
		},
		setPose: (nextView, nextFlat): void => {
			if (nextView === view && nextFlat === isFlat) {
				return;
			}
			if (nextFlat !== isFlat) {
				const from = flat;
				tween('flat', FLATTEN_MS, (progress) => {
					flat = from + ((nextFlat ? 1 : 0) - from) * easeInOutCubic(progress);
				});
			}
			view = nextView;
			isFlat = nextFlat;
			frame(VIEW_MS);
		},
		setAutoRotate: (isOn): void => {
			controls.autoRotate = isOn && !reduceMotion;
		},
		setSelected: (id): void => {
			world?.nodes.get(selectedId ?? '')?.setSelected(false);
			selectedId = id;
			world?.nodes.get(id ?? '')?.setSelected(true);
			isDirty = true;
		},
		setSize: (width, height, leftInsetPx): void => {
			// No layout yet (lazy chunk rendered before its container had a size).
			if (width < 1 || height < 1) {
				return;
			}
			renderer.setSize(width, height);
			camera.aspect = width / height;
			camera.setViewOffset(width, height, -leftInsetPx / 2, 0, width, height);
			camera.updateProjectionMatrix();
			if (isFramed) {
				frame(0);
			}
			isDirty = true;
		},
		dispose: (): void => {
			cancelAnimationFrame(animationFrame);
			tweens.clear();
			pointer.detach();
			removeWorld();
			controls.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		},
	};
};
