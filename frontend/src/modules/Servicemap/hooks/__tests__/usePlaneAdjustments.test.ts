import { act, renderHook } from '@testing-library/react';
import { LOCALSTORAGE } from 'constants/localStorage';

import { usePlaneAdjustments } from '../usePlaneAdjustments';

describe('usePlaneAdjustments', () => {
	afterEach(() => localStorage.clear());

	it('keeps adjustments in this browser and drops one set back to automatic', () => {
		const { result } = renderHook(() => usePlaneAdjustments());
		act(() => result.current.setPlane('cart', 'entry'));
		expect(result.current.adjusted.get('cart')).toBe('entry');
		expect(
			JSON.parse(
				localStorage.getItem(LOCALSTORAGE.SERVICE_MAP_PLANE_ADJUSTMENTS) ?? '{}',
			),
		).toStrictEqual({ cart: 'entry' });

		act(() => result.current.setPlane('cart', undefined));
		expect(result.current.adjusted.size).toBe(0);
	});

	it('ignores stored values that are not planes', () => {
		localStorage.setItem(
			LOCALSTORAGE.SERVICE_MAP_PLANE_ADJUSTMENTS,
			JSON.stringify({ cart: 'entry', worker: 'basement' }),
		);
		const { result } = renderHook(() => usePlaneAdjustments());
		expect(Object.fromEntries(result.current.adjusted)).toStrictEqual({
			cart: 'entry',
		});
	});
});
