# Migration Scripts

One-time migration scripts for database operations. **Run these only when needed.**

## Scripts

### `encrypt-existing-data.js`

Encrypts existing sensitive data in the database for GDPR compliance.

**When to use:**
- After enabling `ENCRYPTION_KEY` on an existing database with unencrypted data
- Run once per database

**Usage:**
```bash
cd backend
node scripts/migrations/encrypt-existing-data.js
```

### `fix-encryption.js`

Fixes tunnel subdomains that were accidentally encrypted (subdomains should remain plain text for routing).

**When to use:**
- Only if tunnel routing stops working due to encrypted subdomains
- This is a recovery script, not normally needed

**Usage:**
```bash
cd backend
node scripts/migrations/fix-encryption.js
```

## Important Notes

1. **Backup your database** before running any migration
2. These scripts connect using `MONGODB_URI` from `.env`
3. Run from the `backend/` directory
4. Each script should only be run once
