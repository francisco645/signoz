import { Tags } from 'hooks/useResourceAttribute/types';

export interface Props {
	/** Nanoseconds. */
	start: number;
	/** Nanoseconds. */
	end: number;
	tags: Tags[];
}

export interface ServiceMapDependency {
	parent: string;
	child: string;
	callCount: number;
	/** Calls per second. */
	callRate: number;
	/** Percentage of calls that failed. */
	errorRate: number;
	/** Nanoseconds. */
	p99: number;
	p95?: number;
	p90?: number;
	p75?: number;
	p50?: number;
}

export type PayloadProps = ServiceMapDependency[];
