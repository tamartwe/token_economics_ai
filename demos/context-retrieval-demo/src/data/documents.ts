export type DocumentMetadata = {
  service: string;
  environment: "production" | "staging" | "development";
  documentType: "runbook" | "policy" | "postmortem";
  updatedAt: string;
};

export type OperationalDocument = {
  id: string;
  title: string;
  metadata: DocumentMetadata;
  content: string;
  owner: string;
  ticketRef: string;
  payload: Record<string, unknown>;
};

export const demoQuestion =
  "A production database has remained above 90% CPU for ten minutes, and replication lag is now above 30 seconds. According to the operational runbook, what should the on-call engineer do?";

export const requiredActions = [
  {
    id: "stop_batch",
    description: "Stop nonessential batch workloads",
    terms: ["stop", "pause", "disable", "suspend"],
    subjects: [
      "nonessential batch",
      "batch workloads",
      "batch jobs",
      "etl jobs",
    ],
  },
  {
    id: "inspect_queries",
    description: "Inspect currently running expensive queries",
    terms: ["inspect", "review", "check", "identify"],
    subjects: [
      "expensive queries",
      "running queries",
      "slow queries",
      "query plan",
    ],
  },
  {
    id: "notify_channel",
    description: "Notify the database incident channel",
    terms: ["notify", "post", "page", "alert"],
    subjects: [
      "database incident channel",
      "#db-incidents",
      "incident channel",
    ],
  },
  {
    id: "escalate_owner",
    description: "Escalate to the database owner if replication lag continues",
    terms: ["escalate", "page", "contact"],
    subjects: ["database owner", "db owner", "service owner"],
    conditionTerms: [
      "replication lag",
      "lag continues",
      "lag remains",
      "continues",
    ],
  },
] as const;

export const documents: OperationalDocument[] = [
  {
    id: "prod-db-cpu-lag-runbook",
    title: "Production Database CPU and Replication Lag Runbook",
    metadata: {
      service: "database",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-08-20",
    },
    owner: "database-platform",
    ticketRef: "DB-1421",
    payload: {
      severity: "high",
      pagerRotation: "primary-db-oncall",
      dashboard: "prod-db-primary",
    },
    content:
      "Use this production database runbook when primary database CPU remains above 90% for ten minutes and replication lag exceeds 30 seconds. First, stop nonessential batch workloads, including analytics backfills and nightly ETL jobs. Next, inspect the currently running expensive queries and cancel only queries approved by the incident commander or database owner. Notify the #db-incidents database incident channel with CPU, replication lag, and query findings. If replication lag continues above 30 seconds after batch workloads are stopped and expensive queries are reviewed, escalate to the database owner.",
  },
  {
    id: "prod-db-replication-policy",
    title: "Production Database Replication Policy",
    metadata: {
      service: "database",
      environment: "production",
      documentType: "policy",
      updatedAt: "2026-07-04",
    },
    owner: "database-platform",
    ticketRef: "DB-1199",
    payload: {
      severity: "medium",
      dashboards: ["replica-health", "wal-shipping"],
    },
    content:
      "Replication lag above 20 seconds should be recorded in the incident log. Replica promotion is forbidden unless the primary is unreachable or data corruption is confirmed. Replication dashboards include WAL shipping delay, replica apply delay, and write throughput. This policy does not replace the CPU and replication lag runbook for active production incidents.",
  },
  {
    id: "prod-k8s-cpu-runbook",
    title: "Production Kubernetes Node CPU Runbook",
    metadata: {
      service: "kubernetes",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-08-01",
    },
    owner: "compute-platform",
    ticketRef: "K8S-3381",
    payload: {
      severity: "high",
      cluster: "prod-us-east",
    },
    content:
      "When production Kubernetes node CPU remains above 90% for ten minutes, cordon affected nodes, inspect noisy pods, and rebalance workloads. Do not restart stateful database pods from this runbook. Notify #compute-incidents if more than three nodes are saturated.",
  },
  {
    id: "staging-db-load-runbook",
    title: "Staging Database Load Test Runbook",
    metadata: {
      service: "database",
      environment: "staging",
      documentType: "runbook",
      updatedAt: "2026-08-11",
    },
    owner: "qa-platform",
    ticketRef: "QA-2280",
    payload: {
      severity: "low",
      database: "staging-primary",
    },
    content:
      "During staging load tests, database CPU above 90% is expected. Keep synthetic batch workloads running unless the test coordinator cancels the exercise. Replication lag may exceed 30 seconds in staging and does not require escalation to the production database owner.",
  },
  {
    id: "dev-db-query-tuning",
    title: "Development Database Query Tuning Notes",
    metadata: {
      service: "database",
      environment: "development",
      documentType: "runbook",
      updatedAt: "2026-06-21",
    },
    owner: "developer-experience",
    ticketRef: "DX-774",
    payload: {
      severity: "low",
      sandbox: true,
    },
    content:
      "Developers can inspect expensive queries in the development database with EXPLAIN ANALYZE. CPU spikes are usually caused by local seed scripts. Do not page the database owner for development-only replication lag.",
  },
  {
    id: "prod-api-latency-postmortem",
    title: "Production API Latency Postmortem",
    metadata: {
      service: "api",
      environment: "production",
      documentType: "postmortem",
      updatedAt: "2026-05-30",
    },
    owner: "api-platform",
    ticketRef: "API-9021",
    payload: {
      severity: "medium",
      region: "us-east-1",
    },
    content:
      "The API latency incident was caused by a slow cache dependency and a burst of expensive account-summary queries. The response team reduced request concurrency, warmed cache keys, and notified #api-incidents. Database replication lag stayed below five seconds.",
  },
  {
    id: "prod-auth-failure-runbook",
    title: "Production Authentication Failure Runbook",
    metadata: {
      service: "auth",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-08-15",
    },
    owner: "identity-platform",
    ticketRef: "AUTH-5120",
    payload: {
      severity: "critical",
      pagerRotation: "identity-oncall",
    },
    content:
      "When login failures exceed 15% in production, inspect identity provider health, validate signing key rotation, and notify #auth-incidents. Database CPU and replication lag are not handled by this authentication runbook.",
  },
  {
    id: "prod-deploy-rollback-runbook",
    title: "Production Deployment Rollback Runbook",
    metadata: {
      service: "release",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-07-27",
    },
    owner: "release-engineering",
    ticketRef: "REL-7100",
    payload: {
      severity: "medium",
      deployTool: "shipyard",
    },
    content:
      "If a production deployment causes sustained errors or latency, stop the rollout, pin the last healthy artifact, and run the rollback workflow. Notify #deploy-incidents with the version, service, and error rate. Do not use this runbook for database replication lag unless a deploy is confirmed as the trigger.",
  },
  {
    id: "security-escalation-policy",
    title: "Security Escalation Policy",
    metadata: {
      service: "security",
      environment: "production",
      documentType: "policy",
      updatedAt: "2026-08-18",
    },
    owner: "security",
    ticketRef: "SEC-4409",
    payload: {
      severity: "critical",
      hotline: "security-primary",
    },
    content:
      "Escalate to security leadership for suspected credential compromise, privilege escalation, or unauthorized production data access. Database owners should be included only when the incident involves data stores. CPU saturation alone is not a security escalation.",
  },
  {
    id: "prod-db-backup-runbook",
    title: "Production Database Backup Runbook",
    metadata: {
      service: "database",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-04-12",
    },
    owner: "database-platform",
    ticketRef: "DB-1004",
    payload: {
      severity: "medium",
      schedule: "daily",
    },
    content:
      "For production database backup failures, verify the latest snapshot, check object storage permissions, and rerun the backup job once. Batch analytics workloads may be paused during backup windows, but this backup procedure does not address CPU above 90% or replication lag above 30 seconds.",
  },
  {
    id: "prod-db-connection-runbook",
    title: "Production Database Connection Saturation Runbook",
    metadata: {
      service: "database",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-07-29",
    },
    owner: "database-platform",
    ticketRef: "DB-1330",
    payload: {
      severity: "high",
      dashboard: "db-connections",
    },
    content:
      "When production database connections exceed 85% of the pool, identify connection leaks, reduce application pool size if needed, and notify #db-incidents. Query CPU may increase during connection storms, but replication lag is not the primary signal for this runbook.",
  },
  {
    id: "staging-k8s-incident-postmortem",
    title: "Staging Kubernetes Incident Postmortem",
    metadata: {
      service: "kubernetes",
      environment: "staging",
      documentType: "postmortem",
      updatedAt: "2026-05-12",
    },
    owner: "compute-platform",
    ticketRef: "K8S-3009",
    payload: {
      severity: "low",
      cluster: "staging-us-east",
    },
    content:
      "A staging Kubernetes test saturated CPU above 90% after a replica count mistake. The team reduced pod replicas and documented the load test limit. No production database replication lag was observed.",
  },
  {
    id: "dev-auth-sandbox-policy",
    title: "Development Authentication Sandbox Policy",
    metadata: {
      service: "auth",
      environment: "development",
      documentType: "policy",
      updatedAt: "2026-03-19",
    },
    owner: "identity-platform",
    ticketRef: "AUTH-4012",
    payload: {
      severity: "low",
      sandbox: true,
    },
    content:
      "Development authentication failures are usually caused by expired local tokens or test identity provider resets. Developers may clear local sessions and retry. Do not notify production incident channels for development sandbox authentication failures.",
  },
  {
    id: "prod-cache-latency-runbook",
    title: "Production Cache Latency Runbook",
    metadata: {
      service: "cache",
      environment: "production",
      documentType: "runbook",
      updatedAt: "2026-08-03",
    },
    owner: "cache-platform",
    ticketRef: "CACHE-8104",
    payload: {
      severity: "medium",
      dashboard: "redis-prod",
    },
    content:
      "When production cache latency exceeds 50 ms, inspect hot keys, check memory fragmentation, and fail over only when error rates climb. Database CPU can rise when cache hit rate falls, but database replication lag should be handled by the database runbook.",
  },
];
