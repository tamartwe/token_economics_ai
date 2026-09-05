export const offlineResponses = {
  baseline:
    "According to the production database CPU and replication lag runbook, the on-call engineer should stop nonessential batch workloads such as analytics backfills and ETL jobs, inspect the currently running expensive queries, notify the #db-incidents database incident channel with the CPU and replication lag details, and escalate to the database owner if replication lag continues above 30 seconds after those mitigations.",
  optimized:
    "The on-call engineer should stop nonessential batch workloads, inspect the currently running expensive queries, notify the #db-incidents database incident channel, and escalate to the database owner if replication lag continues above 30 seconds.",
} as const;
