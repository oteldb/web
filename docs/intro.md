---
sidebar_position: 1
---

# Installing OTelDB

## Add helm repository

```bash
helm repo add oteldb https://oteldb.github.io/charts
```

## Setup variables

```bash
helm show values oteldb/oteldb > oteldb.yml
```

```yaml
replicaCount: 1

image:
  repository: ghcr.io/go-faster/oteldb
  pullPolicy: IfNotPresent
  tag: "v0.23.0" # override with latest version

resources:
  limits:
    cpu: 2500m
    memory: 8Gi
  requests:
    cpu: 100m
    memory: 256Mi

env:
  # OpenTelemetry settings
  - name: OTEL_LOG_LEVEL
    value: "DEBUG"
  - name: OTEL_METRICS_EXPORTER
    value: "otlp"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "service.name=go-faster.oteldb"
  - name: OTEL_LOG_LEVEL
    value: "DEBUG"
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: "grpc"
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://otel-collector.monitoring.svc.cluster.local:4317"
  - name: OTEL_TRACES_EXPORTER
    value: "otlp"
  - name: OTEL_LOGS_EXPORTER
    value: "otlp"

  # OTelDB settings
  - name: OTELDB_STORAGE
    value: ch
  # ClickHouse DSN
  - name: CH_DSN
    value: "clickhouse://admin:admin@chi-clickhouse-default-0-0.clickhouse:9000/default"

  # Pyroscope settings
  - name: PYROSCOPE_APP_NAME
    value: oteldb
  - name: PPROF_ADDR
    value: :9010
  - name: PYROSCOPE_ENABLE
    value: "true"
  - name: PYROSCOPE_URL
    value: http://pyroscope.monitoring.svc.cluster.local:4040
  - name: PYROSCOPE_APP_NAME
    value: oteldb

config:
  dsn:
  ttl:
  tempo:
    bind: 0.0.0.0:3200
  prometheus:
    bind: 0.0.0.0:9090
    max_samples: 1_000_000
    timeout: 1m
    enable_negative_offset: true
  loki:
    bind: 0.0.0.0:3100
  health_check:
    bind: 0.0.0.0:13133
```

## Install
```bash
helm upgrade otel oteldb/oteldb --install --values oteldb.yml --namespace faster --create-namespace
```

## Usage

Add following to your Grafana datasource configuration.

For example, if you are using Grafana Helm chart, add to `values.yaml`:

```yaml
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: "oteldb: TraceQL"
        type: tempo
        access: proxy
        orgId: 1
        url: http://otel-oteldb.faster.svc.cluster.local:3200
        uid: traceql
        jsonData:
          httpMethod: GET
          tracesToLogsV2:
            # Field with an internal link pointing to a logs data source in Grafana.
            # datasourceUid value must match the uid value of the logs data source.
            datasourceUid: logql
            spanStartTimeShift: '-1h'
            spanEndTimeShift: '1h'
            customQuery: true
            query: '{$${__tags}} |= "$${__span.traceId}"'
            tags:
              - key: service.name
                value: service_name
          tracesToMetrics:
            datasourceUid: victoria
            spanStartTimeShift: '-1h'
            spanEndTimeShift: '1h'
            tags:
              - key: service.name
                value: service_name
          tracesToProfiles:
            datasourceUid: 'pyroscope'
            profileTypeId: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds'
          nodeGraph:
            enabled: true
          serviceMap:
            datasourceUid: prometheus
          lokiSearch:
            datasourceUid: logql

      - name: "oteldb: LogQL"
        type: loki
        access: proxy
        orgId: 1
        url: http://otel-oteldb.faster.svc.cluster.local:3100
        uid: logql
        jsonData:
          serviceMap:
            datasourceUid: prometheus
          maxLines: 500
          derivedFields:
            - datasourceUid: traceql
              matcherType: label
              matcherRegex: trace_id
              name: trace
              url: '$${__value.raw}'
              urlDisplayLabel: 'View Trace'

      - name: "oteldb: PromQL"
        type: prometheus
        access: proxy
        orgId: 1
        url: http://otel-oteldb.faster.svc.cluster.local:9090
        uid: promql

      # Optionally add ClickHouse datasource
      - name: "ClickHouse"
        type: grafana-clickhouse-datasource
        access: proxy
        orgId: 1
        uid: clickhouse
        jsonData:
          defaultDatabase: default
          port: 9000
          host: chi-clickhouse-default-0-0.clickhouse
          username: admin
          tlsSkipVerify: false

        secureJsonData:
          password: admin

```
