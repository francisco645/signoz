import { useMemo } from 'react';
import { useListDashboardsForUserV2 } from 'api/generated/services/dashboard';
import {
	DashboardtypesListOrderDTO,
	DashboardtypesListSortDTO,
} from 'api/generated/services/sigNoz.schemas';

export interface PinnedDashboard {
	id: string;
	name: string;
}

const SHOWN = 3;

/** Pinned dashboards come first in the list the old Home already asks for. */
export const usePinnedDashboards = (): {
	pinned: PinnedDashboard[];
	more: number;
} => {
	const { data } = useListDashboardsForUserV2({
		sort: DashboardtypesListSortDTO.updated_at,
		order: DashboardtypesListOrderDTO.desc,
		limit: 5,
		offset: 0,
	});
	return useMemo(() => {
		const dashboards = data?.data?.dashboards ?? [];
		const pinned = dashboards.filter((dashboard) => dashboard.pinned);
		const shown = (pinned.length ? pinned : dashboards).slice(0, SHOWN);
		return {
			pinned: shown.map(({ id, name }) => ({ id, name })),
			more: Math.max(0, dashboards.length - shown.length),
		};
	}, [data]);
};
