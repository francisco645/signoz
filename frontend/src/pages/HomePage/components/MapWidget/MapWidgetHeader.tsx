import { ArrowRight, Maximize2, Minimize2 } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';

import styles from './MapWidget.module.scss';

interface MapWidgetHeaderProps {
	subtitle: string;
	view: '2d' | '3d';
	is3dAvailable: boolean;
	isExpanded: boolean;
	onViewChange: (view: '2d' | '3d') => void;
	onExpandChange: (isExpanded: boolean) => void;
	onOpen: () => void;
}

function MapWidgetHeader({
	subtitle,
	view,
	is3dAvailable,
	isExpanded,
	onViewChange,
	onExpandChange,
	onOpen,
}: MapWidgetHeaderProps): JSX.Element {
	return (
		<div className={styles.header}>
			<span className={styles.title}>Service map</span>
			<span className={styles.subtitle}>{subtitle}</span>
			<div className={styles.actions}>
				{/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
				<div className={styles.segmented} role="group" aria-label="Map view">
					{(['2d', '3d'] as const).map((option) => (
						<button
							key={option}
							type="button"
							aria-pressed={view === option}
							disabled={option === '3d' && !is3dAvailable}
							onClick={(): void => onViewChange(option)}
							data-testid={`home-map-view-${option}`}
						>
							{option.toUpperCase()}
						</button>
					))}
				</div>
				<Button
					variant="outlined"
					color="secondary"
					size="icon"
					prefix={isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
					aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
					onClick={(): void => onExpandChange(!isExpanded)}
					testId="home-map-expand"
				/>
				<Button
					variant="outlined"
					color="secondary"
					size="sm"
					suffix={<ArrowRight size={13} />}
					onClick={onOpen}
					testId="home-map-open"
				>
					Open
				</Button>
			</div>
		</div>
	);
}

export default MapWidgetHeader;
