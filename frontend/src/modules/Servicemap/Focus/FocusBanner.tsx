import { forwardRef, useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import { Copy, Focus, X } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import { toast } from '@signozhq/ui/sonner';
import { ToggleGroup, ToggleGroupItem } from '@signozhq/ui/toggle-group';

import { SERVICE_MAP_TEXT } from '../constants';
import { FocusDirection, formatFocusList } from '../utils/traversal';

import styles from './FocusBanner.module.scss';

interface FocusBannerProps {
	root: string;
	direction: FocusDirection;
	focusSet: ReadonlyMap<string, number>;
	total: number;
	isDataStore: boolean;
	onDirectionChange: (direction: FocusDirection) => void;
	onExit: () => void;
}

const DIRECTION_LABEL: Record<FocusDirection, string> = {
	up: SERVICE_MAP_TEXT.focusUp,
	down: SERVICE_MAP_TEXT.focusDown,
	both: SERVICE_MAP_TEXT.focusBoth,
};

const FocusBanner = forwardRef<HTMLElement, FocusBannerProps>(
	function FocusBanner(
		{ root, direction, focusSet, total, isDataStore, onDirectionChange, onExit },
		ref,
	): JSX.Element {
		const [isListOpen, setIsListOpen] = useState(false);
		const [, copyToClipboard] = useCopyToClipboard();
		const list = formatFocusList(root, direction, focusSet);

		return (
			<section
				ref={ref}
				className={styles.banner}
				aria-label={SERVICE_MAP_TEXT.focus}
				data-testid="service-map-focus-banner"
			>
				<div className={styles.row}>
					<Focus size={14} />
					<span>{SERVICE_MAP_TEXT.focusBanner(root, focusSet.size, total)}</span>
					<ToggleGroup
						type="single"
						size="sm"
						value={direction}
						onChange={(value): void => {
							if (value) {
								onDirectionChange(value as FocusDirection);
							}
						}}
					>
						{(Object.keys(DIRECTION_LABEL) as FocusDirection[]).map((value) => (
							<ToggleGroupItem
								key={value}
								value={value}
								data-testid={`service-map-focus-${value}`}
							>
								{DIRECTION_LABEL[value]}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					<Button
						variant="link"
						color="secondary"
						size="sm"
						onClick={(): void => setIsListOpen((open) => !open)}
						testId="service-map-focus-list-toggle"
					>
						{isListOpen
							? SERVICE_MAP_TEXT.focusHideList
							: SERVICE_MAP_TEXT.focusShowList}
					</Button>
					<Button
						variant="ghost"
						color="secondary"
						size="sm"
						prefix={<X />}
						onClick={onExit}
						testId="service-map-focus-exit"
					>
						{SERVICE_MAP_TEXT.exitFocus}
					</Button>
				</div>
				{isDataStore && (
					<div className={styles.note}>{SERVICE_MAP_TEXT.focusDataStore(root)}</div>
				)}
				{isListOpen && (
					<>
						<pre className={styles.list} data-testid="service-map-focus-list">
							{list}
						</pre>
						<div className={styles.row}>
							<Button
								variant="outlined"
								color="secondary"
								size="sm"
								prefix={<Copy />}
								onClick={(): void => {
									copyToClipboard(list);
									toast.success(SERVICE_MAP_TEXT.focusCopied);
								}}
								testId="service-map-focus-copy"
							>
								{SERVICE_MAP_TEXT.focusCopyNames}
							</Button>
						</div>
					</>
				)}
			</section>
		);
	},
);

export default FocusBanner;
