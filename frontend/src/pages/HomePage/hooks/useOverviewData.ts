import { useMemo } from 'react';
import type { ServicesList } from 'types/api/metrics/getService';

import type { ServiceMapGraph } from 'modules/Servicemap/types';

import type { HomeWindowKey } from '../constants';
import type {
	AlertSummary,
	RuleSummary,
	ServiceComparison,
	TelemetrySnapshot,
} from '../types/home';
import type { Source } from '../types/sources';
import type { HomeWindow } from '../utils/window';
import { hasValue } from '../types/sources';
import { applyHomeBands, getFocusSet, HomeMark } from '../utils/homeGraph';
import { isOutsideUsualRange } from '../utils/outsideRange';
import { getVerdict, Verdict } from '../utils/verdict';
import { useFiringAlerts } from './useFiringAlerts';
import { HomeClock, useHomeClock } from './useHomeClock';
import { HomeMapGraph, useHomeMapGraph } from './useHomeMapGraph';
import { HomeScope, useHomeScope } from './useHomeScope';
import { LastTraceAt, useLastTraceAt } from './useLastTraceAt';
import { useRuleStates } from './useRuleStates';
import { useServiceComparison } from './useServiceComparison';
import { useTelemetry } from './useTelemetry';

const BLIND_MAP_MS = 15 * 60_000;

/** Every source of the overview, the verdict, and the map in the Home's colours. */
interface Fetched<T> {
	source: Source<T>;
	retry: () => void;
}

export interface OverviewData {
	clock: HomeClock;
	scope: HomeScope;
	alerts: Fetched<AlertSummary>;
	rules: Fetched<RuleSummary[]>;
	services: Fetched<ServiceComparison[]>;
	telemetry: Fetched<TelemetrySnapshot>;
	verdict: Verdict;
	isBlind: boolean;
	lastTrace: LastTraceAt;
	mapWindow: HomeWindow;
	map: HomeMapGraph;
	homeGraph?: ServiceMapGraph;
	focus?: ReadonlySet<string>;
	critical: ReadonlySet<string>;
	outside: ReadonlySet<string>;
}

export const useOverviewData = (windowKey: HomeWindowKey): OverviewData => {
	const clock = useHomeClock(windowKey);
	const scope = useHomeScope(clock);
	const alerts = useFiringAlerts(scope.environments);
	const rules = useRuleStates();
	const telemetry = useTelemetry(clock, scope.environments);
	const isBlind =
		hasValue(telemetry.source) &&
		telemetry.source.value.traces.count === 0 &&
		(telemetry.source.value.traces.weekAgoCount ?? 0) > 0;
	const services = useServiceComparison(clock, scope.queries, !isBlind);
	const verdict = getVerdict({
		alerts: alerts.source,
		rules: rules.source,
		services: services.source,
		telemetry: telemetry.source,
	});

	const lastTrace = useLastTraceAt(clock.endMs, scope.environments, isBlind);
	const mapWindow = isBlind
		? {
				startMs: (lastTrace.lastTraceMs ?? clock.endMs) - BLIND_MAP_MS,
				endMs: lastTrace.lastTraceMs ?? clock.endMs,
			}
		: { startMs: clock.startMs, endMs: clock.endMs };
	const comparisonsValue = hasValue(services.source)
		? services.source.value
		: undefined;
	const comparisons = useMemo(() => comparisonsValue ?? [], [comparisonsValue]);
	const servicesNow = useMemo(
		() =>
			isBlind || !comparisons.length
				? undefined
				: comparisons.map(
						({ now }): ServicesList => ({
							serviceName: now.name,
							numCalls: now.calls,
							numErrors: now.errors,
							errorRate: now.errorRate,
							p99: now.p99Ns,
							callRate: now.calls / ((clock.endMs - clock.startMs) / 1000),
							avgDuration: 0,
						}),
					),
		[clock.endMs, clock.startMs, comparisons, isBlind],
	);
	const map = useHomeMapGraph(
		mapWindow.startMs,
		mapWindow.endMs,
		scope.queries,
		servicesNow,
		!isBlind || !!lastTrace.lastTraceMs,
	);

	const critical = useMemo(
		() =>
			new Set(
				(hasValue(alerts.source) ? alerts.source.value.firing : [])
					.filter((alert) => alert.severity === 'critical' && alert.service)
					.map((alert) => alert.service as string),
			),
		[alerts.source],
	);
	const outside = useMemo(
		() =>
			new Set(comparisons.filter(isOutsideUsualRange).map(({ name }) => name)),
		[comparisons],
	);
	const affectedKey = [...critical, ...outside].sort().join('|');
	const homeGraph = useMemo(() => {
		const marks = new Map<string, HomeMark>();
		outside.forEach((name) => marks.set(name, 'outside'));
		critical.forEach((name) => marks.set(name, 'critical'));
		return map.graph ? applyHomeBands(map.graph, marks) : undefined;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [map.graph, affectedKey]);
	const focus = useMemo(
		() =>
			homeGraph
				? getFocusSet(homeGraph, new Set([...critical, ...outside]))
				: undefined,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[homeGraph, affectedKey],
	);

	return {
		clock,
		scope,
		alerts,
		rules,
		services,
		telemetry,
		verdict,
		isBlind,
		lastTrace,
		mapWindow,
		map,
		homeGraph,
		focus,
		critical,
		outside,
	};
};
