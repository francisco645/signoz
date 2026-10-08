import { forwardRef, KeyboardEvent, useMemo, useState } from 'react';
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
}

const LISTBOX_ID = 'service-map-search-results';

const ServiceSearch = forwardRef<HTMLInputElement, ServiceSearchProps>(
	function ServiceSearch({ nodes, onSelect }, ref): JSX.Element {
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
				event.currentTarget.blur();
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
					aria-autocomplete="list"
					title={SERVICE_MAP_TEXT.canvasLabel}
					aria-expanded={isOpen}
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
				{isOpen && (
					// A native <select> or <datalist> cannot render the health swatch and metrics.
					// eslint-disable-next-line jsx-a11y/prefer-tag-over-role
					<div className={styles.results} id={LISTBOX_ID} role="listbox">
						{results.length === 0 && (
							<div className={styles.footer}>
								{SERVICE_MAP_TEXT.searchNoResults(query.trim())}
							</div>
						)}
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
								<LegendSwatch band={node.band} />
								<span className={styles.optionName}>{node.id}</span>
								{node.metrics && (
									<span className={styles.optionMetric}>
										{`${formatPercent(node.metrics.errorRate)} · ${formatRate(node.metrics.callRate)}`}
									</span>
								)}
							</div>
						))}
						{results.length > 0 && (
							<div className={styles.footer} aria-hidden>
								{SERVICE_MAP_TEXT.searchFooter}
							</div>
						)}
					</div>
				)}
			</div>
		);
	},
);

export default ServiceSearch;
