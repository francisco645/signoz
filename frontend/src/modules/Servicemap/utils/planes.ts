import type { InferredTier, PanoramaTier } from './tiers';
import { isPanoramaTier } from './tiers';

/** Resource attribute a service sets to choose its 3D plane. */
export const PLANE_ATTRIBUTE = 'signoz.service_map.layer';

export type PlaneSource = 'inferred' | 'declared' | 'adjusted';

export interface ResolvedPlane {
	tier: PanoramaTier;
	source: PlaneSource;
	inferred: InferredTier;
	/** What the service declares, when it does. */
	declared?: PanoramaTier;
	/** A declared value that is not a plane name, ignored. */
	invalidDeclared?: string;
}

/**
 * Your adjustment, then what the service declares, then the map's inference.
 * Databases and queues stay on the data plane: they report no spans to declare
 * anything, and their callers may disagree.
 */
export const resolvePlanes = (
	inferred: ReadonlyMap<string, InferredTier>,
	declared: ReadonlyMap<string, string>,
	adjusted: ReadonlyMap<string, PanoramaTier>,
): Map<string, ResolvedPlane> =>
	new Map(
		[...inferred].map(([id, inference]): [string, ResolvedPlane] => {
			const raw = declared.get(id)?.trim().toLowerCase();
			const isDataStore = inference.reason.kind === 'dataStore';
			const declaredTier = !isDataStore && isPanoramaTier(raw) ? raw : undefined;
			const invalidDeclared =
				!isDataStore && raw && !declaredTier ? declared.get(id) : undefined;
			const adjustedTier = isDataStore ? undefined : adjusted.get(id);
			const base = {
				inferred: inference,
				declared: declaredTier,
				invalidDeclared,
			};
			if (adjustedTier) {
				return [id, { ...base, tier: adjustedTier, source: 'adjusted' }];
			}
			if (declaredTier) {
				return [id, { ...base, tier: declaredTier, source: 'declared' }];
			}
			return [id, { ...base, tier: inference.tier, source: 'inferred' }];
		}),
	);
