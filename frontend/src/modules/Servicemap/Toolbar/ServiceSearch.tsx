import { forwardRef, KeyboardEvent, useMemo, useState } from 'react';
import { getNodeHealthLabel } from '../utils/nodeHealthLabel';
import { Search } from '@signozhq/icons';
import { Input } from '@signozhq/ui/input';
import { Kbd } from '@signozhq/ui/kbd';
import cx from 'classnames';

import { MAX_SEARCH_RESULTS, SERVICE_MAP_TEXT } from '../constants';
import LegendSwatch from '../Legend/LegendSwatch';
import type { ServiceMapNode } from '../types';
import { formatPercent, formatRate } from '../utils/format';
import { searchNodes } from '../utils/search';

import styles from './ServiceSearch.module.scss';

interface ServiceSearchProps {
	nodes: readonly ServiceMapNode[];
	onSelect: (id: string) => void;
	/** Esc closed the search; focus goes back to the map. */
	onDismiss: () => void;
}

const LISTBOX_ID = 'service-map-search-results';

/** `Input` types leave `role` out, but forward it to the `<input>`. */
const COMBOBOX_ROLE = { role: 'combobox' } as Record<string, string>;

const ServiceSearch = forwardRef<HTMLInputElement, ServiceSearchProps>(
	function ServiceSearch({ nodes, onSelect, onDismiss }, ref): JSX.Element {
		const [query, setQuery] = useState('');
		const [activeIndex, setActiveIndex] = useState(0);
		const results = useMemo(
			() => searchNodes(nodes, query, MAX_SEARCH_RESULTS),
			[nodes, query],
		);
		const isOpen = query.trim().length > 0;

		const select = (id: string): void => {
			onSelect(id);
			setQuery('');
		};

		const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				const step = event.key === 'ArrowDown' ? 1 : -1;
				setActiveIndex(
					(index) => (index + step + results.length) % Math.max(results.length, 1),
				);
			} else if (event.key === 'Enter' && results[activeIndex]) {
				event.preventDefault();
				select(results[activeIndex].id);
			} else if (event.key === 'Escape') {
				event.stopPropagation();
				setQuery('');
				onDismiss();
			}
		};

		return (
			<div className={styles.search}>
				<Input
					ref={ref}
					value={query}
					placeholder={SERVICE_MAP_TEXT.searchPlaceholder}
					prefix={<Search size={14} />}
					suffix={<Kbd size="sm">/</Kbd>}
					{...COMBOBOX_ROLE}
					aria-label={SERVICE_MAP_TEXT.searchLabel}
					aria-autocomplete="list"
					aria-expanded={isOpen && results.length > 0}
					aria-controls={LISTBOX_ID}
					aria-activedescendant={
						results[activeIndex] ? `${LISTBOX_ID}-${activeIndex}` : undefined
					}
					onChange={(event): void => {
						setQuery(event.target.value);
						setActiveIndex(0);
					}}
					onKeyDown={handleKeyDown}
					testId="service-map-search"
				/>
				{isOpen && results.length === 0 && (
					<output className={styles.results}>
						<div className={styles.footer}>
							{SERVICE_MAP_TEXT.searchNoResults(query.trim())}
						</div>
					</output>
				)}
				{isOpen &&
					results.length > 0 && (
						// A native <select> or <datalist> cannot render the health swatch and metrics.
						<div
							className={styles.results}
							id={LISTBOX_ID}
							// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
							role="listbox"
							aria-label={SERVICE_MAP_TEXT.searchLabel}
						>
							{results.map((node, index) => (
								<div
									key={node.id}
									id={`${LISTBOX_ID}-${index}`}
									// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
									role="option"
									tabIndex={-1}
									aria-selected={index === activeIndex}
									className={cx(styles.option, {
										[styles.isActive]: index === activeIndex,
									})}
									onMouseDown={(event): void => {
										event.preventDefault();
										select(node.id);
									}}
									data-testid={`service-map-search-option-${node.id}`}
								>
									<LegendSwatch band={node.band} kind={node.kind} />
									<span className={styles.optionName}>{node.id}</span>
									<span className={styles.srOnly}>{getNodeHealthLabel(node)}</span>
									{node.metrics && (
										<span className={styles.optionMetric}>
											{`${formatPercent(node.metrics.errorRate)} · ${formatRate(node.metrics.callRate)}`}
										</span>
									)}
								</div>
							))}
							<div className={styles.footer} aria-hidden>
								{SERVICE_MAP_TEXT.searchFooter}
							</div>
						</div>
					)}
			</div>
		);
	},
);

export default ServiceSearch;
