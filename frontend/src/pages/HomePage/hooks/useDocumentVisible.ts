import { useEffect, useState } from 'react';

const isVisible = (): boolean => document.visibilityState !== 'hidden';

export const useDocumentVisible = (): boolean => {
	const [visible, setVisible] = useState(isVisible);
	useEffect(() => {
		const onChange = (): void => setVisible(isVisible());
		document.addEventListener('visibilitychange', onChange);
		return (): void => document.removeEventListener('visibilitychange', onChange);
	}, []);
	return visible;
};
