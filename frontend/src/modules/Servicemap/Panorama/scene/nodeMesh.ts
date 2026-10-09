import {
	Color,
	DoubleSide,
	Group,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Object3D,
	Sprite,
} from 'three';

import {
	getNodeRadius,
	getPanoramaHealth,
	PanoramaHealth,
	PanoramaNode,
} from './panoramaModel';
import type { PanoramaTheme } from './panoramaTheme';
import type { SharedGeometries } from './sharedGeometries';
import { createTextSprite } from './textSprite';

export interface NodeObject {
	group: Group;
	radius: number;
	/** Meshes that answer the pointer. */
	hitTargets: Mesh[];
	setHighlighted: (isHighlighted: boolean) => void;
	setSelected: (isSelected: boolean) => void;
}

const EMISSIVE: Record<PanoramaHealth, number> = {
	neutral: 0.12,
	degraded: 0.3,
	critical: 0.3,
};

/** Labels draw over the translucent planes and outside the fog. */
const LABEL_RENDER_ORDER = 10;

export const healthColor = (
	health: PanoramaHealth,
	theme: PanoramaTheme,
): string => (health === 'neutral' ? theme.neutralNode : theme[health]);

const labelColor = (health: PanoramaHealth, theme: PanoramaTheme): string => {
	if (health === 'neutral') {
		return theme.foreground;
	}
	return health === 'degraded' ? theme.degradedLabel : theme.critical;
};

const createShape = (
	node: PanoramaNode,
	radius: number,
	material: MeshStandardMaterial,
	geometries: SharedGeometries,
): Object3D => {
	const shape = new Group();
	shape.scale.setScalar(radius);
	if (node.kind === 'database') {
		const capMaterial = material.clone();
		capMaterial.emissiveIntensity += 0.25;
		const cap = new Mesh(geometries.cap, capMaterial);
		cap.position.y = 0.35;
		shape.add(new Mesh(geometries.cylinder, material), cap);
	} else if (node.kind === 'queue') {
		[0, 1, 2].forEach((level) => {
			const layer = material.clone();
			layer.emissiveIntensity += (2 - level) * 0.08;
			const box = new Mesh(geometries.box, layer);
			box.position.y = (level - 1) * 0.62;
			shape.add(box);
		});
	} else if (node.kind === 'external') {
		shape.add(
			new Mesh(geometries.octahedron, material),
			new LineSegments(
				geometries.octahedronEdges,
				new LineBasicMaterial({
					color: 0xffffff,
					transparent: true,
					opacity: 0.35,
				}),
			),
		);
	} else {
		shape.add(new Mesh(geometries.sphere, material));
	}
	return shape;
};

const createRing = (
	radius: number,
	color: Color | string,
	opacity: number,
	geometries: SharedGeometries,
): Mesh => {
	const ring = new Mesh(
		geometries.ring,
		new MeshBasicMaterial({
			color,
			transparent: true,
			opacity,
			side: DoubleSide,
			depthWrite: false,
		}),
	);
	ring.scale.setScalar(radius);
	ring.rotation.x = -Math.PI / 2;
	ring.position.y = -radius * 0.9;
	return ring;
};

const createLabel = (
	node: PanoramaNode,
	radius: number,
	health: PanoramaHealth,
	theme: PanoramaTheme,
): Sprite => {
	// The asterisk marks a plane you chose; the panel says so in words.
	const label = createTextSprite(node.isAdjusted ? `${node.id} *` : node.id, {
		size: 22,
		color: labelColor(health, theme),
		halo: theme.labelHalo,
		font: 'Geist Mono',
		scale: 0.24,
	});
	label.renderOrder = LABEL_RENDER_ORDER;
	// Anchored on the node and lifted on screen, so it reads from any angle.
	label.center.set(0.5, -(radius + 1.2) / label.scale.y);
	return label;
};

/** A service, database, queue or external host, with a ring on its plane when it fails. */
export const createNodeObject = (
	node: PanoramaNode,
	theme: PanoramaTheme,
	geometries: SharedGeometries,
): NodeObject => {
	const health = getPanoramaHealth(node.band);
	const color = new Color(healthColor(health, theme));
	const radius = getNodeRadius(node.callRate);
	const material = new MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: EMISSIVE[health],
		metalness: 0.05,
		roughness: 0.6,
	});

	const group = new Group();
	group.add(createShape(node, radius, material, geometries));
	if (health !== 'neutral') {
		group.add(
			createRing(radius, color, health === 'critical' ? 0.85 : 0.6, geometries),
		);
	}
	const selection = createRing(radius * 1.25, theme.selection, 0.9, geometries);
	selection.visible = false;
	group.add(selection, createLabel(node, radius, health, theme));

	const hitTargets: Mesh[] = [];
	group.traverse((child) => {
		if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
			child.userData.nodeId = node.id;
			hitTargets.push(child);
		}
	});

	return {
		group,
		radius,
		hitTargets,
		setHighlighted: (isHighlighted): void =>
			hitTargets.forEach((mesh) =>
				(mesh.material as MeshStandardMaterial).emissive.set(
					isHighlighted ? theme.selection : color,
				),
			),
		setSelected: (isSelected): void => {
			selection.visible = isSelected;
		},
	};
};
