import {
	BoxGeometry,
	BufferGeometry,
	ConeGeometry,
	CylinderGeometry,
	EdgesGeometry,
	OctahedronGeometry,
	RingGeometry,
	SphereGeometry,
} from 'three';

/** Unit shapes every node and edge scales, so a world holds a handful of buffers, not thousands. */
export interface SharedGeometries {
	sphere: BufferGeometry;
	cylinder: BufferGeometry;
	cap: BufferGeometry;
	box: BufferGeometry;
	octahedron: BufferGeometry;
	octahedronEdges: BufferGeometry;
	ring: BufferGeometry;
	tube: BufferGeometry;
	cone: BufferGeometry;
	particle: BufferGeometry;
}

export const createSharedGeometries = (): SharedGeometries => ({
	sphere: new SphereGeometry(1, 32, 20),
	cylinder: new CylinderGeometry(0.95, 0.95, 1.5, 32),
	cap: new CylinderGeometry(0.96, 0.96, 0.12, 32),
	box: new BoxGeometry(2, 0.45, 1.4),
	octahedron: new OctahedronGeometry(1.05),
	octahedronEdges: new EdgesGeometry(new OctahedronGeometry(1.07)),
	ring: new RingGeometry(1.45, 1.75, 48),
	tube: new CylinderGeometry(1, 1, 1, 8, 1, true),
	cone: new ConeGeometry(1, 1, 12),
	particle: new SphereGeometry(1, 10, 8),
});
