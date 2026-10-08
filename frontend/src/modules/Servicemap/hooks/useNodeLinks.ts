import { useMemo } from 'react';
import { IResourceAttribute } from 'hooks/useResourceAttribute/types';

import type { NodeLinkTargets } from '../NodePanel/NodeLinks';
import {
	buildNodeExpression,
	buildScopeExpression,
	getErrorTracesLink,
	getLogsLink,
	getServicePageLink,
	getTracesLink,
} from '../utils/explorerLinks';

export const useNodeLinks = (
	id: string,
	hasSpans: boolean,
	queries: IResourceAttribute[],
	minTime: number,
	maxTime: number,
): NodeLinkTargets =>
	useMemo(() => {
		const window = { minTime, maxTime };
		const expression = buildNodeExpression(
			id,
			hasSpans,
			buildScopeExpression(queries),
		);
		return {
			service: hasSpans ? getServicePageLink(id, queries, window) : undefined,
			traces: getTracesLink(expression, window),
			errorTraces: getErrorTracesLink(expression, window),
			logs: hasSpans ? getLogsLink(expression, window) : undefined,
		};
	}, [hasSpans, id, maxTime, minTime, queries]);
