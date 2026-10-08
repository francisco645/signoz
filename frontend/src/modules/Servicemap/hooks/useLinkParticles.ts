import { useMemo } from 'react';

import { CANVAS, PARTICLES } from '../constants';
import type { ServiceMapGraphRef } from '../Canvas/ServiceMapCanvas';
import type { ServiceMapLink, ServiceMapPalette } from '../types';
import { linkEndId } from '../utils/adjacency';
import { getLinkWidth } from '../utils/drawLink';
import { bandColor } from '../utils/drawPrimitives';
import { isAlerting } from '../utils/health';
import { getParticleCount, getParticleSpeed } from '../utils/particles';
import type { GraphLink } from './useCanvasPainters';

interface UseLinkParticlesProps {
	fgRef: ServiceMapGraphRef;
	links: readonly ServiceMapLink[];
	isEnabled: boolean;
	activeId?: string;
	highlighted?: ReadonlySet<string>;
	palette: ServiceMapPalette;
}

interface LinkParticles {
	linkDirectionalParticles: (link: GraphLink) => number;
	linkDirectionalParticleSpeed: (link: GraphLink) => number;
	linkDirectionalParticleWidth: (link: GraphLink) => number;
	linkDirectionalParticleColor: (link: GraphLink) => string;
	/** Same curve the painter draws, so particles stay on bidirectional edges. */
	linkCurvature: (link: GraphLink) => number;
}

/** force-graph's own particles: they keep the canvas redrawing only while any edge has one. */
export const useLinkParticles = ({
	fgRef,
	links,
	isEnabled,
	activeId,
	highlighted,
	palette,
}: UseLinkParticlesProps): LinkParticles => {
	const isCrowded = links.length > PARTICLES.maxEdges;
	// New accessors restart every particle: hover only matters on a crowded map.
	const movingId = isCrowded ? activeId : undefined;

	return useMemo(() => {
		const moves = (link: GraphLink): boolean => {
			const source = linkEndId(link.source);
			const target = linkEndId(link.target);
			if (!isEnabled) {
				return false;
			}
			if (highlighted) {
				return highlighted.has(source) && highlighted.has(target);
			}
			return !isCrowded || source === movingId || target === movingId;
		};

		return {
			linkDirectionalParticles: (link): number =>
				moves(link) ? getParticleCount(link.callRate) : 0,
			linkDirectionalParticleSpeed: (link): number =>
				getParticleSpeed(
					link.source as object,
					link.target as object,
					link.callRate,
				),
			// force-graph shrinks particles by √zoom; this keeps them a few pixels wider than the edge.
			linkDirectionalParticleWidth: (link): number =>
				(getLinkWidth(link.callRate) + PARTICLES.extraWidth) /
				Math.sqrt(fgRef.current?.zoom() ?? 1),
			linkDirectionalParticleColor: (link): string =>
				isAlerting(link.colorBand)
					? bandColor(link.colorBand, palette)
					: palette.foreground,
			linkCurvature: (link): number =>
				link.isBidirectional ? CANVAS.curvature : 0,
		};
	}, [fgRef, highlighted, isCrowded, isEnabled, movingId, palette]);
};
