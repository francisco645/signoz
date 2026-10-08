import { act, renderHook } from '@testing-library/react';
import { LOCALSTORAGE } from 'constants/localStorage';

import { useAnimateDirection } from '../useAnimateDirection';

const mockReducedMotion = (matches: boolean): void => {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockReturnValue({
			matches,
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		}),
	});
};

describe('useAnimateDirection', () => {
	afterEach(() => localStorage.clear());

	it('is on by default and keeps the choice', () => {
		mockReducedMotion(false);
		const { result } = renderHook(() => useAnimateDirection());
		expect(result.current.isEnabled).toBe(true);

		act(() => result.current.setPreferred(false));
		expect(result.current.isEnabled).toBe(false);
		expect(localStorage.getItem(LOCALSTORAGE.SERVICE_MAP_ANIMATE_DIRECTION)).toBe(
			'false',
		);
	});

	it('stays off under reduced motion without dropping the choice', () => {
		mockReducedMotion(true);
		const { result } = renderHook(() => useAnimateDirection());
		expect(result.current.isEnabled).toBe(false);
		expect(result.current.isPreferred).toBe(true);
		expect(result.current.isBlockedByReducedMotion).toBe(true);
	});
});
