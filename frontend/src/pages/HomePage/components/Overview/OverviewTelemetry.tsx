import type { OverviewData } from '../../hooks/useOverviewData';
import { hasValue } from '../../types/sources';
import { HOME_TEXT } from '../../text';
import Section from '../Section/Section';
import SourceError from '../SourceError/SourceError';
import TelemetryList from '../Telemetry/TelemetryList';

interface OverviewTelemetryProps {
	data: OverviewData;
	nowMs: number;
}

function OverviewTelemetry({
	data,
	nowMs,
}: OverviewTelemetryProps): JSX.Element {
	const { telemetry } = data;
	return (
		<Section title={HOME_TEXT.telemetry} testId="home-telemetry">
			{hasValue(telemetry.source) && (
				<TelemetryList telemetry={telemetry.source.value} nowMs={nowMs} />
			)}
			{telemetry.source.status === 'failed' && (
				<SourceError source="telemetry" onRetry={telemetry.retry} />
			)}
		</Section>
	);
}

export default OverviewTelemetry;
