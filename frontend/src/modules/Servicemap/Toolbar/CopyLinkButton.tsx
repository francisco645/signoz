import { useCopyToClipboard } from 'react-use';
import { Link } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import { toast } from '@signozhq/ui/sonner';

import { SERVICE_MAP_TEXT } from '../constants';
import { useWindowLabel } from '../hooks/useWindowLabel';
import { buildShareLink } from '../utils/shareLink';

interface CopyLinkButtonProps {
	minTime: number;
	maxTime: number;
}

function CopyLinkButton({
	minTime,
	maxTime,
}: CopyLinkButtonProps): JSX.Element {
	const [, copyToClipboard] = useCopyToClipboard();
	const windowLabel = useWindowLabel(minTime, maxTime);

	return (
		<Button
			variant="outlined"
			color="secondary"
			size="sm"
			prefix={<Link />}
			title={SERVICE_MAP_TEXT.copyLinkHint}
			onClick={(): void => {
				copyToClipboard(buildShareLink(window.location.href, minTime, maxTime));
				toast.success(SERVICE_MAP_TEXT.copyLinkDone(windowLabel));
			}}
			testId="service-map-copy-link"
		>
			{SERVICE_MAP_TEXT.copyLink}
		</Button>
	);
}

export default CopyLinkButton;
