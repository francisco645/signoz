import { forwardRef } from 'react';
import { ChevronDown, ChevronUp } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import cx from 'classnames';

import { SERVICE_MAP_TEXT } from '../constants';
import { useLegendCollapsed } from '../hooks/useLegendCollapsed';
import type { NodeKind } from '../types';
import { PANORAMA_TIERS } from '../utils/tiers';
import EdgeGlyph from './EdgeGlyph';
import ShapeGlyph from './ShapeGlyph';
import type { PanoramaModel } from './scene/panoramaModel';
import type { PanoramaTheme } from './scene/panoramaTheme';
import { PANORAMA_TEXT, PANORAMA_TIER_TEXT } from './panoramaText';

import styles from './Panorama.module.scss';

interface PanoramaLegendProps {
	model: PanoramaModel;
	theme: PanoramaTheme;
}

const SHAPES: { kind: NodeKind; label: string }[] = [
	{ kind: 'service', label: PANORAMA_TEXT.service },
	{ kind: 'database', label: PANORAMA_TEXT.database },
	{ kind: 'queue', label: PANORAMA_TEXT.queue },
	{ kind: 'external', label: PANORAMA_TEXT.external },
];

const capitalize = (text: string): string =>
	text.charAt(0) + text.slice(1).toLowerCase();

const PanoramaLegend = forwardRef<HTMLElement, PanoramaLegendProps>(
	function PanoramaLegend({ model, theme }, ref): JSX.Element {
		const [isCollapsed, toggle] = useLegendCollapsed();
		const health = [
			{ color: theme.neutralNode, label: PANORAMA_TEXT.healthy },
			{ color: theme.degraded, label: PANORAMA_TEXT.degradedBand },
			{ color: theme.critical, label: PANORAMA_TEXT.criticalBand, halo: true },
		];

		return (
			<section
				ref={ref}
				className={cx(styles.card, styles.legend)}
				aria-label={PANORAMA_TEXT.legendHealth}
				data-testid="panorama-legend"
			>
				<div>
					<div className={styles.legendHeader}>
						<div className={styles.sectionTitle}>{PANORAMA_TEXT.legendHealth}</div>
						<Button
							variant="ghost"
							color="secondary"
							size="icon"
							prefix={isCollapsed ? <ChevronUp /> : <ChevronDown />}
							aria-label={
								isCollapsed ? SERVICE_MAP_TEXT.legendShow : SERVICE_MAP_TEXT.legendHide
							}
							aria-expanded={!isCollapsed}
							onClick={toggle}
							testId="panorama-legend-toggle"
						/>
					</div>
					{health.map(({ color, label, halo }) => (
						<div key={label} className={styles.item}>
							<span
								className={styles.dot}
								style={{
									background: color,
									boxShadow: halo ? `0 0 0 3px ${color}40` : undefined,
								}}
							/>
							{label}
						</div>
					))}
				</div>
				{!isCollapsed && (
					<>
						<div className={styles.divider} />
						<div>
							<div className={styles.sectionTitle}>{PANORAMA_TEXT.legendShape}</div>
							{SHAPES.map(({ kind, label }) => (
								<div key={kind} className={styles.item}>
									<ShapeGlyph
										kind={kind}
										color={theme.neutralNode}
										highlight={theme.tierLabels.internal}
									/>
									{label}
								</div>
							))}
						</div>
						<div className={styles.divider} />
						<div>
							<div className={styles.sectionTitle}>{PANORAMA_TEXT.legendEdges}</div>
							<div className={styles.item}>
								<EdgeGlyph edge={theme.edge} />
								{PANORAMA_TEXT.edgeWidth}
							</div>
							<div className={styles.item}>
								<EdgeGlyph edge={theme.edge} particle={theme.foreground} />
								{PANORAMA_TEXT.edgeParticles}
							</div>
						</div>
						<div className={styles.divider} />
						<div>
							<div className={styles.sectionTitle}>{PANORAMA_TEXT.legendTiers}</div>
							{PANORAMA_TIERS.map((tier) => (
								<div key={tier} className={styles.item}>
									<span
										className={styles.planeSwatch}
										style={{
											borderColor: theme.tiers[tier],
											background: `${theme.tiers[tier]}22`,
										}}
									/>
									<span>
										<span className={styles.tierName}>
											{capitalize(PANORAMA_TIER_TEXT[tier].name)}
										</span>
										{` · ${model.nodes.filter((node) => node.tier === tier).length} `}
										<span className={styles.muted}>
											{PANORAMA_TIER_TEXT[tier].description}
										</span>
									</span>
								</div>
							))}
							<div className={styles.muted}>{PANORAMA_TEXT.tierRule}</div>
						</div>
					</>
				)}
			</section>
		);
	},
);

export default PanoramaLegend;
