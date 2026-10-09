import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@signozhq/ui/toggle-group';

import { PLANE_ATTRIBUTE, ResolvedPlane } from '../utils/planes';
import { PANORAMA_TIERS, PanoramaTier } from '../utils/tiers';
import { describePlane, PLANE_TEXT } from './panoramaText';

import styles from './PlaneControl.module.scss';

interface PlaneControlProps {
	id: string;
	plane: ResolvedPlane;
	onChange: (tier: PanoramaTier | undefined) => void;
}

const AUTO = 'auto';

/** Picks the 3D plane of a service: Auto follows its declaration or the inference. */
function PlaneControl({ id, plane, onChange }: PlaneControlProps): JSX.Element {
	const [announcement, setAnnouncement] = useState('');
	const isDataStore = plane.inferred.reason.kind === 'dataStore';
	const automatic = plane.declared ?? plane.inferred.tier;

	return (
		<section className={styles.plane} aria-label={PLANE_TEXT.title}>
			<div className={styles.title}>{PLANE_TEXT.title}</div>
			{!isDataStore && (
				<ToggleGroup
					type="single"
					size="sm"
					aria-label={PLANE_TEXT.title}
					value={plane.source === 'adjusted' ? plane.tier : AUTO}
					onChange={(value): void => {
						if (!value) {
							return;
						}
						const tier = value === AUTO ? undefined : (value as PanoramaTier);
						onChange(tier);
						setAnnouncement(PLANE_TEXT.moved(id, tier ?? automatic));
					}}
				>
					<ToggleGroupItem value={AUTO} data-testid="service-map-plane-auto">
						{`${PLANE_TEXT.auto} (${PLANE_TEXT.tier[automatic]})`}
					</ToggleGroupItem>
					{PANORAMA_TIERS.map((tier) => (
						<ToggleGroupItem
							key={tier}
							value={tier}
							data-testid={`service-map-plane-${tier}`}
						>
							{PLANE_TEXT.tier[tier]}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			)}
			<div className={styles.source} data-testid="service-map-plane-source">
				{describePlane(plane, PLANE_ATTRIBUTE)}
			</div>
			{plane.source === 'adjusted' && (
				<div className={styles.note}>{PLANE_TEXT.adjustedNote}</div>
			)}
			{plane.invalidDeclared && (
				<div className={styles.warning}>
					{`Ignored ${PLANE_ATTRIBUTE}="${plane.invalidDeclared}": use entry, internal or data.`}
				</div>
			)}
			{!isDataStore && !plane.declared && (
				<div className={styles.note}>
					{PLANE_TEXT.declaredHint(PLANE_ATTRIBUTE)}
				</div>
			)}
			<div className={styles.srOnly} aria-live="polite">
				{announcement}
			</div>
		</section>
	);
}

export default PlaneControl;
