---
sidebar_position: 2
---

# Installing ClickHouse

To install ClickHouse, you can use [ClickHouse Operator](https://github.com/Altinity/clickhouse-operator)
from [Altinity](https://altinity.com/).

## Installing operator

```bash
helm repo add clickhouse-operator https://docs.altinity.com/clickhouse-operator/
helm upgrade ch clickhouse-operator/altinity-clickhouse-operator --install --namespace clickhouse --create-namespace
```

## Creating simple instance

Let's create simple ClickHouse instance optimized for low-memory environments,
that is not shared nor replicated.

Create `chi.yml`:

```yaml
apiVersion: "clickhouse.altinity.com/v1"
kind: "ClickHouseInstallation"
metadata:
  name: "clickhouse"
  namespace: "clickhouse"
spec:
  defaults:
    templates:
      dataVolumeClaimTemplate: data-volume-template
      logVolumeClaimTemplate: log-volume-template
  templates:
    volumeClaimTemplates:
      - name: data-volume-template
        reclaimPolicy: Retain
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 100Gi
      - name: log-volume-template
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 1Gi
    podTemplates:
      - name: clickhouse
        spec:
          containers:
            - name: clickhouse
              image: clickhouse/clickhouse-server:25.9
              resources:
                requests:
                  memory: "4Gi"
                  cpu: "100m"
                limits:
                  memory: "4Gi"
                  cpu: "7000m"

            - name: clickhouse-log
              image: registry.access.redhat.com/ubi8/ubi-minimal:latest
              command:
                - "/bin/sh"
                - "-c"
                - "--"
              args:
                - "while true; do sleep 30; done;"
  configuration:
    users:
      admin/password: admin
      admin/profile: default
      admin/quota: default
      admin/networks/ip:
        - 0.0.0.0/0
      readonly/password: readonly_password
      readonly/profile: readonly
      readonly/quota: default
      readonly/networks/ip:
        - 0.0.0.0/0
    profiles:
      readonly/readonly: 1
    settings:
      compression/case/method: zstd
      disable_internal_dns_cache: 1
    files:
      config.d/my_custom_settings.xml: |
        <yandex>
          <asynchronous_metric_log>0</asynchronous_metric_log>
          <metric_log>0</metric_log>
          <text_log>0</text_log>
          <trace_log>0</trace_log>
          <mark_cache_size>524288000</mark_cache_size>
          <background_pool_size>2</background_pool_size>
          <background_merges_mutations_concurrency_ratio>2</background_merges_mutations_concurrency_ratio>
          <merge_tree>
            <merge_max_block_size>1024</merge_max_block_size>
            <max_bytes_to_merge_at_max_space_in_pool>1073741824</max_bytes_to_merge_at_max_space_in_pool> <!-- 1 GB max part-->
            <number_of_free_entries_in_pool_to_lower_max_size_of_merge>2</number_of_free_entries_in_pool_to_lower_max_size_of_merge>
            <number_of_free_entries_in_pool_to_execute_mutation>2</number_of_free_entries_in_pool_to_execute_mutation>
            <number_of_free_entries_in_pool_to_execute_optimize_entire_partition>2</number_of_free_entries_in_pool_to_execute_optimize_entire_partition>
          </merge_tree>
        </yandex>
    clusters:
      - name: "default"
        templates:
          podTemplate: clickhouse
        layout:
          shardsCount: 1
          replicasCount: 1
```

Run `kubectl apply -f chi.yal` to create ClickHouse instance.
Your ClickHouse server will be available with following DSN:

```
clickhouse://admin:admin@chi-clickhouse-default-0-0.clickhouse:9000/default
```

## Accessing ClickHouse

Also, you can port-forward ClickHouse client to your local machine for easier access:

:::tip

Use

```
clickhouse-client --compression yes
```
To access forwarded ClickHouse, as compression is disabled by default on localhost.

:::

```bash
kubectl -n clickhouse port-forward svc/clickhouse-clickhouse 9000:9000 8123:8123
```

