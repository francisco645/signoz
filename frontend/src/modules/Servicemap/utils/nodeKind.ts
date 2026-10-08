import type { NodeKind } from '../types';

/** `messaging.system` values from the OpenTelemetry semantic conventions. */
const MESSAGING_SYSTEMS = new Set([
	'activemq',
	'aws_sqs',
	'aws_sns',
	'azure_eventhubs',
	'azure_servicebus',
	'eventhubs',
	'gcp_pubsub',
	'jms',
	'kafka',
	'nats',
	'pulsar',
	'rabbitmq',
	'rocketmq',
	'servicebus',
]);

/**
 * Services report their own spans. A node that only receives calls and has no
 * spans of its own is a `db.system` or `messaging.system` value the callers
 * recorded, so the name tells a queue from a database.
 */
export const getNodeKind = (
	id: string,
	hasSpans: boolean,
	isCaller: boolean,
): NodeKind => {
	if (hasSpans || isCaller) {
		return 'service';
	}
	return MESSAGING_SYSTEMS.has(id.toLowerCase()) ? 'queue' : 'database';
};
