import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const matches = (): boolean =>
	typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches;

export const usePrefersReducedMotion = (): boolean => {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(matches);

	useEffect(() => {
		const mediaQuery = window.matchMedia?.(QUERY);
		if (!mediaQuery?.addEventListener) {
			return undefined;
		}
		const handleChange = (): void => setPrefersReducedMotion(mediaQuery.matches);
		mediaQuery.addEventListener('change', handleChange);
		return (): void => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	return prefersReducedMotion;
};
