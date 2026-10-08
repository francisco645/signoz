import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';

import { URL_PARAMS } from '../constants';
import { FOCUS_DIRECTIONS, FocusDirection } from '../utils/traversal';

interface FocusState {
	focusRoot: string | null;
	focusDirection: FocusDirection;
	setFocus: (root: string | null, direction?: FocusDirection) => void;
}

export const useFocusState = (): FocusState => {
	const [focusRoot, setFocusRoot] = useQueryState(
		URL_PARAMS.focus,
		parseAsString.withOptions({ history: 'replace' }),
	);
	const [focusDirection, setFocusDirection] = useQueryState(
		URL_PARAMS.focusDirection,
		parseAsStringLiteral(FOCUS_DIRECTIONS)
			.withDefault('both')
			.withOptions({ history: 'replace' }),
	);

	return {
		focusRoot,
		focusDirection,
		setFocus: (root, direction): void => {
			void setFocusRoot(root);
			void setFocusDirection(root && direction ? direction : null);
		},
	};
};
