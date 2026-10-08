import axios from 'api';
import { ErrorResponseHandlerV2 } from 'api/ErrorResponseHandlerV2';
import { AxiosError } from 'axios';
import { ErrorV2Resp } from 'types/api';
import { PayloadProps, Props } from 'types/api/serviceMap/getDependencyGraph';

const getDependencyGraph = async (
	{ start, end, tags }: Props,
	signal?: AbortSignal,
): Promise<PayloadProps> => {
	try {
		const response = await axios.post<PayloadProps>(
			'/dependency_graph',
			{ start: `${start}`, end: `${end}`, tags },
			{ signal },
		);

		return response.data ?? [];
	} catch (error) {
		ErrorResponseHandlerV2(error as AxiosError<ErrorV2Resp>);
	}
};

export default getDependencyGraph;
