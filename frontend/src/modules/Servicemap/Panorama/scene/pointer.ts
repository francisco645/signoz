import { Camera, Raycaster, Vector2 } from 'three';

import type { PanoramaLink } from './panoramaModel';
import type { World } from './world';

export type PanoramaHit =
	| { kind: 'node'; id: string }
	| { kind: 'link'; link: PanoramaLink; index: number };

interface PointerHandlers {
	onHover: (hit: PanoramaHit | undefined, x: number, y: number) => void;
	onNodeClick: (id: string) => void;
}

interface Highlight {
	/** Link index; nodes compare by identity. */
	key?: number;
	setHighlighted: (on: boolean) => void;
}

const keyOf = (highlight?: Highlight): unknown => highlight?.key ?? highlight;

/** A press that moves less than this is a click, not a drag of the camera. */
const CLICK_SLOP_PX = 4;

/** Hover highlights and reports what is under the pointer; a click on a node selects it. */
export const attachPointer = (
	canvas: HTMLCanvasElement,
	camera: Camera,
	getWorld: () => World | undefined,
	handlers: PointerHandlers,
): { detach: () => void; reset: () => void } => {
	const raycaster = new Raycaster();
	const pointer = new Vector2();
	let highlighted: Highlight | undefined;
	let pressedAt: { x: number; y: number } | undefined;

	const pick = (event: PointerEvent): PanoramaHit | undefined => {
		const world = getWorld();
		if (!world) {
			return undefined;
		}
		const bounds = canvas.getBoundingClientRect();
		pointer.set(
			((event.clientX - bounds.left) / bounds.width) * 2 - 1,
			-((event.clientY - bounds.top) / bounds.height) * 2 + 1,
		);
		raycaster.setFromCamera(pointer, camera);
		const hit = raycaster.intersectObjects(world.hitTargets, false)[0];
		if (hit?.object.userData.nodeId) {
			return { kind: 'node', id: hit.object.userData.nodeId };
		}
		const index = hit?.instanceId;
		return hit?.object.userData.isLinkBatch && index !== undefined
			? { kind: 'link', link: world.links.links[index], index }
			: undefined;
	};

	const handleMove = (event: PointerEvent): void => {
		// Orbiting: no hover, so the tooltip does not flicker while the camera turns.
		if (event.buttons !== 0) {
			return;
		}
		const hit = pick(event);
		const world = getWorld();
		let next: Highlight | undefined;
		if (hit?.kind === 'node') {
			next = world?.nodes.get(hit.id);
		} else if (hit?.kind === 'link' && world) {
			const { index } = hit;
			next = {
				key: index,
				setHighlighted: (on): void => world.links.setHighlighted(index, on),
			};
		}
		if (keyOf(highlighted) !== keyOf(next)) {
			highlighted?.setHighlighted(false);
			next?.setHighlighted(true);
			highlighted = next;
		}
		// eslint-disable-next-line no-param-reassign
		canvas.style.cursor = hit ? 'pointer' : '';
		const bounds = canvas.getBoundingClientRect();
		handlers.onHover(
			hit,
			event.clientX - bounds.left,
			event.clientY - bounds.top,
		);
	};
	const handleDown = (event: PointerEvent): void => {
		pressedAt = { x: event.clientX, y: event.clientY };
	};
	const handleUp = (event: PointerEvent): void => {
		const isClick =
			!!pressedAt &&
			Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) <
				CLICK_SLOP_PX;
		pressedAt = undefined;
		const hit = isClick ? pick(event) : undefined;
		if (hit?.kind === 'node') {
			handlers.onNodeClick(hit.id);
		}
	};
	const handleLeave = (): void => handlers.onHover(undefined, 0, 0);

	canvas.addEventListener('pointermove', handleMove);
	canvas.addEventListener('pointerdown', handleDown);
	canvas.addEventListener('pointerup', handleUp);
	canvas.addEventListener('pointerleave', handleLeave);
	const detach = (): void => {
		canvas.removeEventListener('pointermove', handleMove);
		canvas.removeEventListener('pointerdown', handleDown);
		canvas.removeEventListener('pointerup', handleUp);
		canvas.removeEventListener('pointerleave', handleLeave);
	};
	return {
		detach,
		/** The world was rebuilt: the highlighted object no longer exists. */
		reset: (): void => {
			highlighted = undefined;
		},
	};
};
