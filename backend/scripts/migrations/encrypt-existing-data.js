/**
 * Migration Script: Encrypt Existing Data for GDPR Compliance
 * 
 * This script encrypts sensitive fields in existing database records.
 * Run this once after enabling encryption.
 * 
 * Usage: node scripts/encrypt-existing-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { encrypt, isEncrypted } = require('../utils/encryption');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/api-response-manager';

// Define sensitive fields per collection
// NOTE: Don't encrypt fields needed for routing/lookups (like subdomain)
const COLLECTIONS_TO_ENCRYPT = {
  users: ['email', 'name'],
  projects: ['name', 'description'],
  // tunnels: subdomain should NOT be encrypted - needed for routing
  webhooks: ['name'],
};

async function encryptCollection(db, collectionName, fields) {
  const collection = db.collection(collectionName);
  const cursor = collection.find({});
  
  let processed = 0;
  let encrypted = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\n📦 Processing collection: ${collectionName}`);
  console.log(`   Fields to encrypt: ${fields.join(', ')}`);

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    processed++;
    
    const updates = {};
    let needsUpdate = false;

    for (const field of fields) {
      const value = doc[field];
      
      // Skip if field doesn't exist, is empty, or already encrypted
      if (!value || typeof value !== 'string') {
        continue;
      }
      
      if (isEncrypted(value)) {
        skipped++;
        continue;
      }

      // Encrypt the field
      try {
        updates[field] = encrypt(value);
        needsUpdate = true;
      } catch (err) {
        console.error(`   ❌ Error encrypting ${field} in doc ${doc._id}: ${err.message}`);
        errors++;
      }
    }

    if (needsUpdate) {
      try {
        await collection.updateOne(
          { _id: doc._id },
          { $set: updates }
        );
        encrypted++;
      } catch (err) {
        console.error(`   ❌ Error updating doc ${doc._id}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`   ✓ Processed: ${processed}, Encrypted: ${encrypted}, Skipped: ${skipped}, Errors: ${errors}`);
  return { processed, encrypted, skipped, errors };
}

async function createSearchIndexes(db) {
  console.log('\n🔍 Creating search hash indexes...');
  
  // For users, create a hash index for email searching
  try {
    const usersCollection = db.collection('users');
    
    // Add emailHash field for searching
    const cursor = usersCollection.find({});
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.email && !doc.emailHash) {
        const { hashForSearch } = require('../utils/encryption');
        // Get original email (decrypt if needed)
        const { decrypt } = require('../utils/encryption');
        const email = decrypt(doc.email);
        const emailHash = hashForSearch(email);
        
        await usersCollection.updateOne(
          { _id: doc._id },
          { $set: { emailHash } }
        );
      }
    }
    
    // Create index on emailHash
    await usersCollection.createIndex({ emailHash: 1 });
    console.log('   ✓ Created emailHash index on users collection');
  } catch (err) {
    console.error('   ❌ Error creating indexes:', err.message);
  }
}

async function main() {
  console.log('🔐 GDPR Data Encryption Migration');
  console.log('==================================');
  console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  
  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   ✓ Connected successfully');

    const db = mongoose.connection.db;
    
    // Process each collection
    const totals = { processed: 0, encrypted: 0, skipped: 0, errors: 0 };
    
    for (const [collectionName, fields] of Object.entries(COLLECTIONS_TO_ENCRYPT)) {
      try {
        const result = await encryptCollection(db, collectionName, fields);
        totals.processed += result.processed;
        totals.encrypted += result.encrypted;
        totals.skipped += result.skipped;
        totals.errors += result.errors;
      } catch (err) {
        console.error(`   ❌ Error processing ${collectionName}: ${err.message}`);
      }
    }

    // Create search indexes
    await createSearchIndexes(db);

    // Summary
    console.log('\n==================================');
    console.log('📊 Migration Summary');
    console.log(`   Total documents processed: ${totals.processed}`);
    console.log(`   Documents encrypted: ${totals.encrypted}`);
    console.log(`   Already encrypted (skipped): ${totals.skipped}`);
    console.log(`   Errors: ${totals.errors}`);
    
    if (totals.errors === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review.');
    }

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { encryptCollection, main };
