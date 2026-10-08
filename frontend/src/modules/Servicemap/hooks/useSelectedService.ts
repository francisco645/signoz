import { parseAsString, useQueryState } from 'nuqs';

import { URL_PARAMS } from '../constants';

/** The inspected service lives in the URL, so a copied link reopens the panel. */
export const useSelectedService = (): [
	string | null,
	(id: string | null) => void,
] => {
	const [selected, setSelected] = useQueryState(
		URL_PARAMS.selected,
		parseAsString.withOptions({ history: 'replace' }),
	);
	return [selected, (id): void => void setSelected(id)];
};
