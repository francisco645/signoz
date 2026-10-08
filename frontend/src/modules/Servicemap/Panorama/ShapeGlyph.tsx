import type { NodeKind } from '../types';

interface ShapeGlyphProps {
	kind: NodeKind;
	color: string;
	/** Lighter tone for the top face of cylinders and queues. */
	highlight: string;
}

/** The legend's flat drawing of each 3D node shape. */
function ShapeGlyph({ kind, color, highlight }: ShapeGlyphProps): JSX.Element {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
			{kind === 'service' && <circle cx="7" cy="7" r="6" fill={color} />}
			{kind === 'database' && (
				<>
					<ellipse cx="7" cy="3" rx="6" ry="2" fill={highlight} />
					<rect x="1" y="3" width="12" height="8" fill={color} />
					<ellipse cx="7" cy="11" rx="6" ry="2" fill={color} />
				</>
			)}
			{kind === 'queue' && (
				<>
					<rect x="1" y="1" width="12" height="3" fill={highlight} />
					<rect x="1" y="5.5" width="12" height="3" fill={color} />
					<rect x="1" y="10" width="12" height="3" fill={color} opacity={0.8} />
				</>
			)}
			{kind === 'external' && (
				<path d="M7 1l6 6-6 6-6-6z" fill="none" stroke={color} strokeWidth="1.5" />
			)}
		</svg>
	);
}

export default ShapeGlyph;
