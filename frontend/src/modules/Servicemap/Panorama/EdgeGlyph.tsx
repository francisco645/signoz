interface EdgeGlyphProps {
	edge: string;
	particle?: string;
}

/** A short edge for the legend, with particles when `particle` is set. */
function EdgeGlyph({ edge, particle }: EdgeGlyphProps): JSX.Element {
	return (
		<svg width="34" height="10" aria-hidden="true">
			<line
				x1="1"
				y1="5"
				x2="33"
				y2="5"
				stroke={edge}
				strokeWidth={particle ? 2 : 1}
			/>
			{particle && (
				<>
					<circle cx="10" cy="5" r="2.5" fill={particle} />
					<circle cx="24" cy="5" r="2.5" fill={particle} />
				</>
			)}
		</svg>
	);
}

export default EdgeGlyph;
