import {
	KeyboardEvent,
	RefObject,
	useCallback,
	useMemo,
	useState,
} from 'react';

import { getNodeHealthLabel } from '../utils/nodeHealthLabel';
import { SERVICE_MAP_TEXT } from '../constants';
import type { ServiceMapGraph, ServiceMapNode } from '../types';
import { buildAdjacency } from '../utils/adjacency';
import { BAND_SEVERITY } from '../utils/health';
import { FocusDirection, getFocusSet } from '../utils/traversal';
import { useFocusState } from './useFocusState';
import { useSelectedService } from './useSelectedService';

interface ServiceMapInteractions {
	selected: string | null;
	cursorId?: string;
	focusRoot: string | null;
	focusDirection: FocusDirection;
	focusDepth?: number;
	focusSet?: Map<string, number>;
	announcement: string;
	select: (id: string | null) => void;
	clickNode: (id: string) => void;
	toggleFocus: () => void;
	setFocusDirection: (direction: FocusDirection) => void;
	setFocusDepth: (depth?: number) => void;
	exitFocus: () => void;
	closePanel: () => void;
	handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

const isTyping = (target: EventTarget): boolean =>
	target instanceof HTMLElement &&
	(target.isContentEditable ||
		['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
		!!target.closest('[role="listbox"], [role="menu"], [role="dialog"]'));

const NEXT_KEYS = ['ArrowDown', 'ArrowRight'];
const PREVIOUS_KEYS = ['ArrowUp', 'ArrowLeft'];

const bySeverity = (a: ServiceMapNode, b: ServiceMapNode): number =>
	BAND_SEVERITY[a.band] - BAND_SEVERITY[b.band] || a.id.localeCompare(b.id);

/**
 * Selection and focus live in the URL. Shortcuts apply while focus is inside the
 * map (canvas or panel) and never while typing, so they cannot clash with the
 * app's global hotkeys. The arrow keys walk a cursor over the services, worst
 * health first, which is the keyboard way into the canvas.
 */
export const useServiceMapInteractions = (
	graph: ServiceMapGraph,
	searchRef: RefObject<HTMLInputElement>,
	canvasRef: RefObject<HTMLDivElement>,
): ServiceMapInteractions => {
	const [selected, setSelected] = useSelectedService();
	const { focusRoot, focusDirection, setFocus } = useFocusState();
	const [focusDepth, setFocusDepthState] = useState<number>();
	const [cursorId, setCursorId] = useState<string>();
	const [announcement, setAnnouncement] = useState('');
	const adjacency = useMemo(() => buildAdjacency(graph.links), [graph.links]);
	const nodesById = useMemo(
		() => new Map(graph.nodes.map((node) => [node.id, node])),
		[graph.nodes],
	);

	const focusSet = useMemo(
		() =>
			focusRoot && nodesById.has(focusRoot)
				? getFocusSet(adjacency, focusRoot, focusDirection, focusDepth)
				: undefined,
		[adjacency, focusDepth, focusDirection, focusRoot, nodesById],
	);

	const describe = useCallback(
		(id: string): string => {
			const node = nodesById.get(id);
			return node
				? SERVICE_MAP_TEXT.announceSelection(
						node.id,
						getNodeHealthLabel(node),
						adjacency.callers.get(node.id)?.size ?? 0,
						adjacency.callees.get(node.id)?.size ?? 0,
					)
				: id;
		},
		[adjacency, nodesById],
	);

	const focusCanvas = useCallback((): void => {
		canvasRef.current?.focus({ preventScroll: true });
	}, [canvasRef]);

	const select = useCallback(
		(id: string | null): void => {
			setSelected(id);
			if (id) {
				setCursorId(id);
				setAnnouncement(describe(id));
			}
		},
		[describe, setSelected],
	);

	const focusOn = useCallback(
		(root: string, direction: FocusDirection, depth?: number): void => {
			setFocus(root, direction);
			const size = getFocusSet(adjacency, root, direction, depth).size - 1;
			setAnnouncement(SERVICE_MAP_TEXT.focusBanner(root, size));
		},
		[adjacency, setFocus],
	);

	const exitFocus = useCallback((): void => {
		setFocus(null);
		setFocusDepthState(undefined);
		setAnnouncement(SERVICE_MAP_TEXT.exitFocus);
		focusCanvas();
	}, [focusCanvas, setFocus]);

	const closePanel = useCallback((): void => {
		select(null);
		focusCanvas();
	}, [focusCanvas, select]);

	/** Data stores are asked "who depends on me?", so their focus starts upstream. */
	const toggleFocus = useCallback((): void => {
		if (focusRoot) {
			exitFocus();
		} else if (selected) {
			const isService = nodesById.get(selected)?.kind === 'service';
			focusOn(selected, isService ? 'both' : 'up', focusDepth);
		}
	}, [exitFocus, focusDepth, focusOn, focusRoot, nodesById, selected]);

	/** Clicking a dimmed service moves the focus to it. */
	const clickNode = useCallback(
		(id: string): void => {
			select(id);
			focusCanvas();
			if (focusSet && !focusSet.has(id)) {
				focusOn(id, focusDirection, focusDepth);
			}
		},
		[focusCanvas, focusDepth, focusDirection, focusOn, focusSet, select],
	);

	const moveCursor = useCallback(
		(step: 1 | -1): void => {
			const order = graph.nodes
				.filter((node) => !focusSet || focusSet.has(node.id))
				.sort(bySeverity);
			if (order.length === 0) {
				return;
			}
			const current = order.findIndex(
				(node) => node.id === (cursorId ?? selected),
			);
			const next =
				order[current < 0 ? 0 : (current + step + order.length) % order.length];
			setCursorId(next.id);
			setAnnouncement(`${describe(next.id)}. ${SERVICE_MAP_TEXT.cursorHint}`);
		},
		[cursorId, describe, focusSet, graph.nodes, selected],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>): void => {
			if (
				event.metaKey ||
				event.ctrlKey ||
				event.altKey ||
				isTyping(event.target)
			) {
				return;
			}
			const onCanvas = event.target === canvasRef.current;
			if (event.key === '/') {
				event.preventDefault();
				searchRef.current?.focus();
			} else if (event.key === 'f' || event.key === 'F') {
				event.preventDefault();
				toggleFocus();
			} else if (onCanvas && NEXT_KEYS.includes(event.key)) {
				event.preventDefault();
				moveCursor(1);
			} else if (onCanvas && PREVIOUS_KEYS.includes(event.key)) {
				event.preventDefault();
				moveCursor(-1);
			} else if (onCanvas && event.key === 'Enter' && cursorId) {
				event.preventDefault();
				select(cursorId);
			} else if (event.key === 'Escape') {
				if (focusRoot) {
					exitFocus();
				} else if (selected) {
					closePanel();
				}
			}
		},
		[
			canvasRef,
			closePanel,
			cursorId,
			exitFocus,
			focusRoot,
			moveCursor,
			searchRef,
			select,
			selected,
			toggleFocus,
		],
	);

	return {
		selected,
		cursorId,
		focusRoot,
		focusDirection,
		focusDepth,
		focusSet,
		announcement,
		select,
		clickNode,
		toggleFocus,
		setFocusDirection: (direction): void => {
			if (focusRoot) {
				focusOn(focusRoot, direction, focusDepth);
			}
		},
		setFocusDepth: (depth): void => {
			setFocusDepthState(depth);
			if (focusRoot) {
				focusOn(focusRoot, focusDirection, depth);
			}
		},
		exitFocus,
		closePanel,
		handleKeyDown,
	};
};
