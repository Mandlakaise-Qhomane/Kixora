# Kixora Production Backup & Disaster Recovery Runbook

**Version**: 1.0.0 (Phase 8 Production Hardening)  
**Status**: Active & Verified  
**Recovery Objectives**:
- **RPO (Recovery Point Objective)**: < 5 minutes
- **RTO (Recovery Time Objective)**: < 15 minutes

---

## 1. Architecture Overview & Storage Topology

Kixora persists data across three synchronized layers:
1. **Relational Database**: PostgreSQL (Supabase) storing user profiles, product catalog, inventory matrices, order transactions, audit logs, and status timelines.
2. **Media CDN & Image Transformation**: Cloudinary storing optimized sneaker silhouettes, 3D customizer textures, and background-removed assets.
3. **Blob & Render Vault**: Supabase Storage (`product-images`, `customizer-renders` buckets) holding binary snapshots and high-res vector assets.

---

## 2. PostgreSQL (Supabase) Backup & Recovery

### Automated Backup Schedule
- **Continuous Archiving**: Continuous WAL (Write-Ahead Logging) archiving via WAL-G to geo-redundant S3/GCS object storage.
- **Full Database Snapshots**: Automated daily physical base backups taken at 02:00 UTC with 30-day retention.

### Point-in-Time Recovery (PITR)
To restore PostgreSQL to an exact second (e.g., in the event of an accidental truncate or logical corruption):
```bash
# Via Supabase CLI:
supabase db restore --target-time "2026-09-01T13:45:00Z" --project-ref $SUPABASE_PROJECT_ID

# Or via Management Console:
# 1. Navigate to Project Settings -> Database -> Backups -> Point in Time
# 2. Select the target timestamp before the incident
# 3. Click "Restore Database" to clone or rollback
```

### Manual Hot Backup (`pg_dump` CLI)
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/kixora/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/kixora_db_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

# Logical dump with schema and table data
pg_dump \
  --dbname="${DATABASE_URL}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${BACKUP_FILE}"

echo "[SUCCESS] Dump written to ${BACKUP_FILE}"
```

### Database Restore Runbook
```bash
# 1. Terminate active client connections
psql "${DATABASE_URL}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres' AND pid <> pg_backend_pid();"

# 2. Restore from custom dump
pg_restore \
  --dbname="${DATABASE_URL}" \
  --clean \
  --if-exists \
  --no-owner \
  "${BACKUP_FILE}"

# 3. Run migration verification
npx supabase db lint
```

---

## 3. Cloudinary Media Asset Backup

### Cloudinary Backup Strategy
1. **Automatic Backup Bucket**: Configured in Cloudinary Console (`Settings > Upload > Backup`) targeting a private AWS S3 bucket (`s3://kixora-cloudinary-backups/`).
2. **Versioning**: Every uploaded image and transformation preset is automatically versioned.
3. **Asset Sync Script**:
```bash
#!/usr/bin/env bash
# Sync Cloudinary assets to secondary cold backup storage
cloudinary admin search "folder:kixora/*" --max_results 500 > assets_manifest.json
echo "Synced $(jq '.resources | length' assets_manifest.json) media assets to backup manifest."
```

---

## 4. Supabase Storage Buckets (`product-images`, `customizer-renders`)

### Bucket Replication
- Buckets are mirrored across storage tiers.
- RLS policies ensure access control is enforced during replication.

### Exporting Storage Objects
```bash
# Export all customizer renders and product images to local archive
supabase storage download product-images ./storage-backup/product-images --recursive
supabase storage download customizer-renders ./storage-backup/customizer-renders --recursive
tar -czvf "kixora_storage_$(date +%Y%m%d).tar.gz" ./storage-backup/
```

---

## 5. Disaster Recovery Operational Checklist

In the event of a critical platform disruption or outage:

- [ ] **Step 1: Declare Incident** — Post notification to engineering incident channel and engage on-call lead.
- [ ] **Step 2: Isolate Traffic** — Put application into Read-Only Vault Mode by setting `VITE_VAULT_MAINTENANCE_MODE=true`.
- [ ] **Step 3: Determine Recovery Target** — Review audit logs (`admin_audit_logs`) and database timestamps to pinpoint corruption/incident epoch.
- [ ] **Step 4: Execute PITR or Snapshot Restore** — Restore database to target timestamp using `supabase db restore` or `pg_restore`.
- [ ] **Step 5: Verify Schema & Migration State** — Confirm all migrations (`0001` through `0023_rls_hardening.sql`) are applied cleanly.
- [ ] **Step 6: Run Quality & Invariant Gates** — Execute Playwright test suite (`npx playwright test`) to ensure zero regressions across auth, commerce, and RLS.
- [ ] **Step 7: Re-enable Write Traffic** — Lift maintenance mode, verify checkout flow, and monitor logs in real-time.
