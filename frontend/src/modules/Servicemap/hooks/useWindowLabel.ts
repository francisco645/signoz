import { DATE_TIME_FORMATS } from 'constants/dateTimeFormats';
import { useTimezone } from 'providers/Timezone';

/** The absolute window, even when the picker says "Last 1 hour". */
export const useWindowLabel = (minTime: number, maxTime: number): string => {
	const { formatTimezoneAdjustedTimestamp, timezone } = useTimezone();
	const start = formatTimezoneAdjustedTimestamp(
		minTime / 1e6,
		DATE_TIME_FORMATS.ISO_DATETIME,
	);
	const end = formatTimezoneAdjustedTimestamp(
		maxTime / 1e6,
		DATE_TIME_FORMATS.ISO_DATETIME,
	);
	return `${start} – ${end} (${timezone.offset})`;
};
