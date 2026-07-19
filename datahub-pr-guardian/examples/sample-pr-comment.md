<!-- datahub-pr-guardian -->
## 🛡️ DataHub PR Guardian

### 🔴 fct_revenue — HIGH risk

**Dropped columns:** customer_id
**Downstream assets affected:** 2
- DATASET dim_customer_lifetime_value (owner: analytics@example.com)
- DASHBOARD executive_revenue (owner: finance@example.com)

Removing customer_id breaks the join used by dim_customer_lifetime_value and leaves the executive revenue dashboard without its customer filter. Ask analytics@example.com and finance@example.com to review this migration before merging. Severity: high.
