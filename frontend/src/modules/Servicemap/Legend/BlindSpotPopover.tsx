import { Button } from '@signozhq/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@signozhq/ui/popover';

import { SERVICE_MAP_TEXT } from '../constants';

import styles from './ServiceMapLegend.module.scss';

function BlindSpotPopover(): JSX.Element {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="link"
					color="primary"
					size="sm"
					testId="service-map-blind-spot-trigger"
				>
					{SERVICE_MAP_TEXT.why}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className={styles.blindSpot}>
				<div className={styles.blindSpotTitle}>
					{SERVICE_MAP_TEXT.blindSpotTitle}
				</div>
				{SERVICE_MAP_TEXT.blindSpotBody.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</PopoverContent>
		</Popover>
	);
}

export default BlindSpotPopover;
