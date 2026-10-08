import { useEffect, useState } from 'react';

interface Size {
	width: number;
	height: number;
}

export const useContainerSize = (element: HTMLElement | null): Size => {
	const [size, setSize] = useState<Size>({ width: 0, height: 0 });

	useEffect(() => {
		if (!element) {
			return undefined;
		}

		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setSize((previous) =>
				previous.width === width && previous.height === height
					? previous
					: { width, height },
			);
		});
		observer.observe(element);

		return (): void => observer.disconnect();
	}, [element]);

	return size;
};
