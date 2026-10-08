import {
	Color,
	InstancedMesh,
	Matrix4,
	MeshBasicMaterial,
	Quaternion,
	Vector3,
} from 'three';

import { healthColor } from './nodeMesh';
import {
	getLinkRadius,
	getPanoramaHealth,
	getPanoramaParticleCount,
	getPanoramaParticlePace,
	PanoramaLink,
} from './panoramaModel';
import type { PanoramaTheme } from './panoramaTheme';
import type { SharedGeometries } from './sharedGeometries';

export interface LinkEnds {
	from: Vector3;
	to: Vector3;
	fromRadius: number;
	toRadius: number;
}

/**
 * Every edge's tube, arrow head and particles in three instanced meshes: one
 * draw call each however many edges the map has.
 */
export interface LinkBatch {
	links: PanoramaLink[];
	tubes: InstancedMesh;
	heads: InstancedMesh;
	particles: InstancedMesh;
	setHighlighted: (index: number, isHighlighted: boolean) => void;
	/** Moves every edge between its node centres; `undefined` hides it. */
	place: (
		ends: (link: PanoramaLink) => LinkEnds | undefined,
		elapsedS: number,
	) => void;
}

const UP = new Vector3(0, 1, 0);
const HIDDEN = new Matrix4().makeScale(0, 0, 0);
const direction = new Vector3();
const start = new Vector3();
const end = new Vector3();
const position = new Vector3();
const scale = new Vector3();
const rotation = new Quaternion();
const matrix = new Matrix4();
const highlight = new Color();

export const createLinkBatch = (
	links: PanoramaLink[],
	theme: PanoramaTheme,
	geometries: SharedGeometries,
): LinkBatch => {
	const colors = links.map((link) => {
		const health = getPanoramaHealth(link.colorBand);
		return new Color(
			health === 'neutral' ? theme.edge : healthColor(health, theme),
		);
	});
	const particleColors = links.map((link, index) =>
		getPanoramaHealth(link.colorBand) === 'neutral'
			? new Color(theme.foreground)
			: colors[index],
	);
	const radii = links.map((link) => getLinkRadius(link.callRate));
	const paces = links.map((link) => getPanoramaParticlePace(link.callRate));
	/** Particle slots: which edge each belongs to and how far along it is, 0 to 1. */
	const owners: number[] = [];
	const progress: number[] = [];
	links.forEach((link, index) => {
		const count = getPanoramaParticleCount(link.callRate);
		for (let i = 0; i < count; i += 1) {
			owners.push(index);
			progress.push(i / count);
		}
	});

	const tubes = new InstancedMesh(
		geometries.tube,
		new MeshBasicMaterial({
			transparent: true,
			opacity: 0.65,
			depthWrite: false,
		}),
		Math.max(links.length, 1),
	);
	const heads = new InstancedMesh(
		geometries.cone,
		new MeshBasicMaterial({ transparent: true, opacity: 0.8 }),
		Math.max(links.length, 1),
	);
	const particles = new InstancedMesh(
		geometries.particle,
		new MeshBasicMaterial(),
		Math.max(owners.length, 1),
	);
	tubes.count = links.length;
	heads.count = links.length;
	particles.count = owners.length;
	links.forEach((_, index) => {
		tubes.setColorAt(index, colors[index]);
		heads.setColorAt(index, colors[index]);
	});
	owners.forEach((owner, slot) =>
		particles.setColorAt(slot, particleColors[owner]),
	);
	tubes.userData.isLinkBatch = true;
	// Instances move every frame: their bounds are not worth recomputing for culling.
	[tubes, heads, particles].forEach((mesh) => {
		// eslint-disable-next-line no-param-reassign
		mesh.frustumCulled = false;
	});

	const segments: { start: Vector3; end: Vector3; length: number }[] = links.map(
		() => ({ start: new Vector3(), end: new Vector3(), length: 0 }),
	);

	return {
		links,
		tubes,
		heads,
		particles,
		setHighlighted: (index, isHighlighted): void => {
			highlight.copy(colors[index]);
			if (isHighlighted) {
				highlight.lerp(new Color(theme.foreground), 0.5);
			}
			tubes.setColorAt(index, highlight);
			if (tubes.instanceColor) {
				tubes.instanceColor.needsUpdate = true;
			}
		},
		place: (ends, elapsedS): void => {
			links.forEach((link, index) => {
				const at = ends(link);
				const segment = segments[index];
				if (!at) {
					tubes.setMatrixAt(index, HIDDEN);
					heads.setMatrixAt(index, HIDDEN);
					segment.length = 0;
					return;
				}
				direction.subVectors(at.to, at.from);
				const length = direction.length();
				direction.normalize();
				const startGap = at.fromRadius + 0.8;
				const endGap = at.toRadius + 1.6;
				start.copy(at.from).addScaledVector(direction, startGap);
				end.copy(at.to).addScaledVector(direction, -endGap);
				segment.start.copy(start);
				segment.end.copy(end);
				segment.length = Math.max(0.1, length - startGap - endGap);
				rotation.setFromUnitVectors(UP, direction);

				const radius = radii[index];
				position.copy(start).add(end).multiplyScalar(0.5);
				scale.set(radius, segment.length, radius);
				tubes.setMatrixAt(index, matrix.compose(position, rotation, scale));
				position.copy(end).addScaledVector(direction, -1.2);
				scale.set(radius + 1.1, 3.2, radius + 1.1);
				heads.setMatrixAt(index, matrix.compose(position, rotation, scale));
			});

			owners.forEach((owner, slot) => {
				const segment = segments[owner];
				if (segment.length === 0) {
					particles.setMatrixAt(slot, HIDDEN);
					return;
				}
				progress[slot] =
					(progress[slot] +
						(elapsedS * paces[owner]) / Math.max(segment.length, 1)) %
					1;
				position.copy(segment.start).lerp(segment.end, progress[slot]);
				scale.setScalar(radii[owner] * 0.9 + 0.55);
				particles.setMatrixAt(
					slot,
					matrix.compose(position, rotation.identity(), scale),
				);
			});
			tubes.instanceMatrix.needsUpdate = true;
			heads.instanceMatrix.needsUpdate = true;
			particles.instanceMatrix.needsUpdate = true;
		},
	};
};
