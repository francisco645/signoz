interface Rect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * Screen space already taken by labels in the current frame. A label that
 * would overlap one already drawn is skipped unless it is forced.
 */
export class LabelSpace {
	private rects: Rect[] = [];

	reset(): void {
		this.rects = [];
	}

	reserve(rect: Rect, force: boolean): boolean {
		const overlaps = this.rects.some(
			(taken) =>
				rect.left < taken.right &&
				rect.right > taken.left &&
				rect.top < taken.bottom &&
				rect.bottom > taken.top,
		);
		if (overlaps && !force) {
			return false;
		}
		this.rects.push(rect);
		return true;
	}
}
