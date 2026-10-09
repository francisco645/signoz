import type {
	AlertSummary,
	FiringAlert,
	ServiceComparison,
	SignalSnapshot,
	TelemetrySnapshot,
} from '../../types/home';
import type { Source } from '../../types/sources';
import { getVerdict, VerdictInput } from '../verdict';

const ready = <T>(value: T): Source<T> => ({
	status: 'ready',
	value,
	updatedAt: 0,
});
const failed: Source<never> = { status: 'failed', error: new Error('down') };
const loading: Source<never> = { status: 'loading' };

const alertOf = (severity: FiringAlert['severity']): FiringAlert => ({
	fingerprint: severity,
	name: severity,
	severity,
	startsAtMs: 0,
	isUnscoped: false,
});
const signal = (
	name: SignalSnapshot['signal'],
	count = 5_000,
	weekAgoCount = 5_000,
): SignalSnapshot => ({
	signal: name,
	count,
	weekAgoCount,
	ratio: count / weekAgoCount,
	lastSeenMs: 1,
});
const healthyTelemetry: TelemetrySnapshot = {
	traces: signal('traces'),
	logs: signal('logs'),
	metrics: { signal: 'metrics', lastSeenMs: 1 },
};
const outside = { reasons: ['errors'] } as ServiceComparison;
const within = { reasons: [] } as unknown as ServiceComparison;

const input = (overrides: Partial<VerdictInput> = {}): VerdictInput => ({
	alerts: ready<AlertSummary>({ firing: [], silenced: 0 }),
	rules: ready([]),
	services: ready([within]),
	telemetry: ready(healthyTelemetry),
	...overrides,
});

describe('getVerdict', () => {
	it('is normal only with every source read and nothing wrong', () => {
		expect(getVerdict(input()).level).toBe('normal');
	});

	it('puts a critical alert first, even with other sources failing', () => {
		const verdict = getVerdict(
			input({
				alerts: ready({ firing: [alertOf('critical')], silenced: 0 }),
				services: failed,
				telemetry: failed,
			}),
		);
		expect(verdict.level).toBe('incident');
		expect(verdict.gaps).toStrictEqual(['services', 'telemetry']);
	});

	it('is blind when traces stop, ahead of degraded', () => {
		const verdict = getVerdict(
			input({
				alerts: ready({ firing: [alertOf('warning')], silenced: 0 }),
				telemetry: ready({
					...healthyTelemetry,
					traces: signal('traces', 0, 4_000),
				}),
			}),
		);
		expect(verdict.level).toBe('blind');
	});

	it.each([
		[
			'a warning',
			input({ alerts: ready({ firing: [alertOf('warning')], silenced: 0 }) }),
		],
		[
			'an error alert',
			input({ alerts: ready({ firing: [alertOf('error')], silenced: 0 }) }),
		],
		['a service outside its range', input({ services: ready([outside]) })],
		[
			'logs at half of last week',
			input({
				telemetry: ready({
					...healthyTelemetry,
					logs: signal('logs', 1_000, 5_000),
				}),
			}),
		],
	])('is degraded with %s', (_, verdictInput) => {
		expect(getVerdict(verdictInput).level).toBe('degraded');
	});

	it('ignores info alerts', () => {
		expect(
			getVerdict(
				input({ alerts: ready({ firing: [alertOf('info')], silenced: 0 }) }),
			).level,
		).toBe('normal');
	});

	it.each(['alerts', 'services', 'telemetry'] as const)(
		'never reads as normal when %s fails',
		(name) => {
			expect(getVerdict(input({ [name]: failed })).level).toBe('unknown');
		},
	);

	it('waits while sources load', () => {
		expect(getVerdict(input({ services: loading })).level).toBe('loading');
	});

	it('does not call a logs-only install blind', () => {
		const verdict = getVerdict(
			input({
				telemetry: ready({ ...healthyTelemetry, traces: signal('traces', 0, 0) }),
			}),
		);
		expect(verdict.level).not.toBe('blind');
	});
});
