const CURRENT_VALUE = /current value:?\s*([^)\n]+?)\s*\)/i;
const MAX_LENGTH = 16;

/** The value the default rule description renders, as the backend formatted it. */
export const getAlertValue = (description?: string): string | undefined => {
	const value = description?.match(CURRENT_VALUE)?.[1]?.trim();
	if (!value || value.includes('{{') || value.length > MAX_LENGTH) {
		return undefined;
	}
	return value;
};
