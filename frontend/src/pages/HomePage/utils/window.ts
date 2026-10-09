import { MINUTE_MS } from '../constants';

export interface HomeWindow {
	startMs: number;
	endMs: number;
}

/** Whole minutes only, ending before the current one, whose data is still arriving. */
export const alignWindow = (nowMs: number, windowMs: number): HomeWindow => {
	const endMs = Math.floor(nowMs / MINUTE_MS) * MINUTE_MS - MINUTE_MS;
	return { startMs: endMs - windowMs, endMs };
};
