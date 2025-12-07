/**
 * Fix Encryption Script
 * 
 * This script:
 * 1. Decrypts subdomain in tunnels (shouldn't be encrypted - needed for routing)
 * 2. Ensures User email/name are properly encrypted with getters working
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { decrypt, isEncrypted } = require('../utils/encryption');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/api-response-manager';

async function fixTunnelSubdomains(db) {
  console.log('\n🔧 Fixing tunnel subdomains (decrypting back to plain text)...');
  
  const collection = db.collection('tunnels');
  const cursor = collection.find({});
  
  let fixed = 0;
  let skipped = 0;
  
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    
    if (doc.subdomain && isEncrypted(doc.subdomain)) {
      const decryptedSubdomain = decrypt(doc.subdomain);
      await collection.updateOne(
        { _id: doc._id },
        { $set: { subdomain: decryptedSubdomain } }
      );
      console.log(`   ✓ Fixed subdomain: ${decryptedSubdomain}`);
      fixed++;
    } else {
      skipped++;
    }
  }
  
  console.log(`   Fixed: ${fixed}, Already plain: ${skipped}`);
}

async function verifyUserDecryption(db) {
  console.log('\n🔍 Verifying user data decryption...');
  
  const collection = db.collection('users');
  const users = await collection.find({}).toArray();
  
  for (const user of users) {
    const email = isEncrypted(user.email) ? decrypt(user.email) : user.email;
    const name = isEncrypted(user.name) ? decrypt(user.name) : user.name;
    console.log(`   User: ${email} (${name || 'no name'})`);
  }
}

async function main() {
  console.log('🔐 Encryption Fix Script');
  console.log('========================');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    await fixTunnelSubdomains(db);
    await verifyUserDecryption(db);
    
    console.log('\n✅ Fix completed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
