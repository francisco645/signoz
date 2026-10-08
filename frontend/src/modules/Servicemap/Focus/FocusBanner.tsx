import { forwardRef, useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import { Copy, Focus, X } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import { toast } from '@signozhq/ui/sonner';
import { ToggleGroup, ToggleGroupItem } from '@signozhq/ui/toggle-group';

import { SERVICE_MAP_TEXT } from '../constants';
import {
	FOCUS_DEPTHS,
	FocusDirection,
	formatFocusList,
} from '../utils/traversal';

import styles from './FocusBanner.module.scss';

interface FocusBannerProps {
	root: string;
	direction: FocusDirection;
	focusSet: ReadonlyMap<string, number>;
	depth?: number;
	isDataStore: boolean;
	onDirectionChange: (direction: FocusDirection) => void;
	onDepthChange: (depth?: number) => void;
	onExit: () => void;
}

const DIRECTION_LABEL: Record<FocusDirection, string> = {
	up: SERVICE_MAP_TEXT.focusUp,
	down: SERVICE_MAP_TEXT.focusDown,
	both: SERVICE_MAP_TEXT.focusBoth,
};

const ALL_HOPS = 'all';

const FocusBanner = forwardRef<HTMLElement, FocusBannerProps>(
	function FocusBanner(
		{
			root,
			direction,
			focusSet,
			depth,
			isDataStore,
			onDirectionChange,
			onDepthChange,
			onExit,
		},
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
					<span>{SERVICE_MAP_TEXT.focusBanner(root, focusSet.size - 1)}</span>
				</div>
				<div className={styles.row}>
					<ToggleGroup
						type="single"
						size="sm"
						aria-label={SERVICE_MAP_TEXT.focusDirectionLabel}
						className={styles.toggles}
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
					<ToggleGroup
						type="single"
						size="sm"
						aria-label={SERVICE_MAP_TEXT.focusDepthLabel}
						className={styles.toggles}
						value={depth ? String(depth) : ALL_HOPS}
						onChange={(value): void => {
							if (value) {
								onDepthChange(value === ALL_HOPS ? undefined : Number(value));
							}
						}}
					>
						{FOCUS_DEPTHS.map((hops) => (
							<ToggleGroupItem
								key={hops}
								value={String(hops)}
								data-testid={`service-map-focus-depth-${hops}`}
							>
								{SERVICE_MAP_TEXT.focusDepth(hops)}
							</ToggleGroupItem>
						))}
						<ToggleGroupItem
							value={ALL_HOPS}
							data-testid="service-map-focus-depth-all"
						>
							{SERVICE_MAP_TEXT.focusDepthAll}
						</ToggleGroupItem>
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
