import dotenv from 'dotenv';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

dotenv.config({ path: '.env.local' });
dotenv.config();

const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const traceExporter = endpoint ? new OTLPTraceExporter({ url: endpoint }) : undefined;

const sdk = new NodeSDK({
  ...(traceExporter ? { traceExporter } : {}),
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'ao20-discord-bot',
  }),
});

if (endpoint) {
  sdk.start();
  console.log(`OpenTelemetry tracing enabled: ${endpoint}`);
} else {
  console.warn('OpenTelemetry tracing disabled: no OTEL_EXPORTER_OTLP_ENDPOINT configured');
}

let shuttingDown = false;

async function shutdownTracing(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    if (endpoint) await sdk.shutdown();
    console.log(`OpenTelemetry tracing terminated after ${signal}`);
  } catch (error) {
    console.error('Error terminating OpenTelemetry tracing', error);
  }
}

process.once('SIGTERM', () => void shutdownTracing('SIGTERM'));
process.once('SIGINT', () => void shutdownTracing('SIGINT'));
