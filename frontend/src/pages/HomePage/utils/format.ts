const MINUTE_MS = 60_000;

export const formatAge = (fromMs: number, nowMs: number): string => {
	const minutes = Math.max(0, Math.round((nowMs - fromMs) / MINUTE_MS));
	if (minutes < 60) {
		return `${minutes} min`;
	}
	const hours = Math.floor(minutes / 60);
	return hours < 48 ? `${hours} h` : `${Math.floor(hours / 24)} d`;
};

export const formatClock = (ms: number): string =>
	new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatSince = (fromMs: number, nowMs: number): string => {
	const seconds = Math.max(0, Math.round((nowMs - fromMs) / 1000));
	if (seconds < 120) {
		return `last ${seconds} s ago`;
	}
	return `since ${formatClock(fromMs)}`;
};
