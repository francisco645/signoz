import { Mesh, MeshBasicMaterial, Vector3 } from 'three';

import {
	getLinkRadius,
	getPanoramaHealth,
	getPanoramaParticleCount,
	getPanoramaParticlePace,
	PanoramaLink,
} from './panoramaModel';
import type { PanoramaTheme } from './panoramaTheme';
import { healthColor } from './nodeMesh';
import type { SharedGeometries } from './sharedGeometries';

export interface LinkObject {
	link: PanoramaLink;
	tube: Mesh;
	head: Mesh;
	particles: Mesh[];
	/** Where each particle is along the edge, 0 to 1. */
	progress: number[];
	setHighlighted: (isHighlighted: boolean) => void;
	/** Moves the tube, the arrow head and the particles between two node centres. */
	place: (
		from: Vector3,
		to: Vector3,
		fromRadius: number,
		toRadius: number,
		elapsedS: number,
	) => void;
}

const UP = new Vector3(0, 1, 0);
const direction = new Vector3();
const start = new Vector3();
const end = new Vector3();

/** A tube from caller to callee, an arrow head at the callee and particles running along it. */
export const createLinkObject = (
	link: PanoramaLink,
	theme: PanoramaTheme,
	geometries: SharedGeometries,
): LinkObject => {
	const health = getPanoramaHealth(link.colorBand);
	const color = health === 'neutral' ? theme.edge : healthColor(health, theme);
	const baseOpacity = health === 'neutral' ? 0.6 : 0.7;
	const radius = getLinkRadius(link.callRate);

	const tube = new Mesh(
		geometries.tube,
		new MeshBasicMaterial({
			color,
			transparent: true,
			opacity: baseOpacity,
			depthWrite: false,
		}),
	);
	tube.userData.link = link;
	const head = new Mesh(
		geometries.cone,
		new MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
	);
	const count = getPanoramaParticleCount(link.callRate);
	const particleRadius = radius * 0.9 + 0.55;
	const particleMaterial = new MeshBasicMaterial({
		color: health === 'neutral' ? theme.foreground : color,
	});
	const particles = Array.from({ length: count }, () => {
		const particle = new Mesh(geometries.particle, particleMaterial);
		particle.scale.setScalar(particleRadius);
		return particle;
	});
	const progress = particles.map((_, index) => index / count);
	const pace = getPanoramaParticlePace(link.callRate);

	return {
		link,
		tube,
		head,
		particles,
		progress,
		setHighlighted: (isHighlighted): void => {
			(tube.material as MeshBasicMaterial).opacity = isHighlighted
				? 0.95
				: baseOpacity;
		},
		place: (from, to, fromRadius, toRadius, elapsedS): void => {
			direction.subVectors(to, from);
			const length = direction.length();
			direction.normalize();
			const startGap = fromRadius + 0.8;
			const endGap = toRadius + 1.6;
			start.copy(from).addScaledVector(direction, startGap);
			end.copy(to).addScaledVector(direction, -endGap);
			const segment = Math.max(0.1, length - startGap - endGap);

			tube.position.copy(start).add(end).multiplyScalar(0.5);
			tube.scale.set(radius, segment, radius);
			tube.quaternion.setFromUnitVectors(UP, direction);
			head.scale.set(radius + 1.1, 3.2, radius + 1.1);
			head.quaternion.setFromUnitVectors(UP, direction);
			head.position.copy(end).addScaledVector(direction, -1.2);

			particles.forEach((particle, index) => {
				progress[index] =
					(progress[index] + (elapsedS * pace) / Math.max(segment, 1)) % 1;
				particle.position.copy(start).lerp(end, progress[index]);
			});
		},
	};
};
