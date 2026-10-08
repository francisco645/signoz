import {
	KeyboardEvent,
	RefObject,
	useCallback,
	useMemo,
	useState,
} from 'react';

import { HEALTH_LABEL, SERVICE_MAP_TEXT } from '../constants';
import type { ServiceMapGraph } from '../types';
import { buildAdjacency } from '../utils/adjacency';
import { FocusDirection, getFocusSet } from '../utils/traversal';
import { useFocusState } from './useFocusState';
import { useSelectedService } from './useSelectedService';

interface ServiceMapInteractions {
	selected: string | null;
	focusRoot: string | null;
	focusDirection: FocusDirection;
	focusSet?: Map<string, number>;
	announcement: string;
	select: (id: string | null) => void;
	clickNode: (id: string) => void;
	toggleFocus: () => void;
	setFocusDirection: (direction: FocusDirection) => void;
	exitFocus: () => void;
	handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

const isTyping = (target: EventTarget): boolean =>
	target instanceof HTMLElement &&
	(target.isContentEditable ||
		['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
		!!target.closest('[role="listbox"], [role="menu"], [role="dialog"]'));

/**
 * Selection and focus live in the URL. Shortcuts only fire while focus is
 * inside the map, so they never compete with the app's global hotkeys.
 */
export const useServiceMapInteractions = (
	graph: ServiceMapGraph,
	searchRef: RefObject<HTMLInputElement>,
): ServiceMapInteractions => {
	const [selected, setSelected] = useSelectedService();
	const { focusRoot, focusDirection, setFocus } = useFocusState();
	const [announcement, setAnnouncement] = useState('');
	const adjacency = useMemo(() => buildAdjacency(graph.links), [graph.links]);

	const focusSet = useMemo(
		() =>
			focusRoot && graph.nodes.some((node) => node.id === focusRoot)
				? getFocusSet(adjacency, focusRoot, focusDirection)
				: undefined,
		[adjacency, focusDirection, focusRoot, graph.nodes],
	);

	const select = useCallback(
		(id: string | null): void => {
			setSelected(id);
			const node = id
				? graph.nodes.find((candidate) => candidate.id === id)
				: undefined;
			if (node) {
				setAnnouncement(
					SERVICE_MAP_TEXT.announceSelection(
						node.id,
						HEALTH_LABEL[node.band],
						adjacency.callers.get(node.id)?.size ?? 0,
						adjacency.callees.get(node.id)?.size ?? 0,
					),
				);
			}
		},
		[adjacency, graph.nodes, setSelected],
	);

	const focusOn = useCallback(
		(root: string, direction: FocusDirection): void => {
			setFocus(root, direction);
			setAnnouncement(
				SERVICE_MAP_TEXT.focusBanner(
					root,
					getFocusSet(adjacency, root, direction).size,
					graph.nodes.length,
				),
			);
		},
		[adjacency, graph.nodes.length, setFocus],
	);

	const exitFocus = useCallback((): void => {
		setFocus(null);
		setAnnouncement(SERVICE_MAP_TEXT.exitFocus);
	}, [setFocus]);

	const toggleFocus = useCallback((): void => {
		if (focusRoot) {
			exitFocus();
		} else if (selected) {
			focusOn(selected, focusDirection);
		}
	}, [exitFocus, focusDirection, focusOn, focusRoot, selected]);

	/** Clicking a dimmed service moves the focus to it. */
	const clickNode = useCallback(
		(id: string): void => {
			select(id);
			if (focusSet && !focusSet.has(id)) {
				focusOn(id, focusDirection);
			}
		},
		[focusDirection, focusOn, focusSet, select],
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
			if (event.key === '/') {
				event.preventDefault();
				searchRef.current?.focus();
			} else if (event.key === 'f' || event.key === 'F') {
				event.preventDefault();
				toggleFocus();
			} else if (event.key === 'Escape') {
				if (focusRoot) {
					exitFocus();
				} else if (selected) {
					select(null);
				}
			}
		},
		[exitFocus, focusRoot, searchRef, select, selected, toggleFocus],
	);

	return {
		selected,
		focusRoot,
		focusDirection,
		focusSet,
		announcement,
		select,
		clickNode,
		toggleFocus,
		setFocusDirection: (direction): void => {
			if (focusRoot) {
				focusOn(focusRoot, direction);
			}
		},
		exitFocus,
		handleKeyDown,
	};
};
