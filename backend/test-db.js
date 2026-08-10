const { Client } = require('pg');

async function testConnection(port, user) {
  const client = new Client({
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: port,
    database: 'postgres',
    user: user,
    password: 'manideep@2006',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ Success: port ${port}, user ${user}`);
    await client.end();
  } catch (err) {
    console.error(`❌ Failed: port ${port}, user ${user} -> ${err.message}`);
  }
}

async function runTests() {
  await testConnection(6543, 'postgres.rkwuuznnhmlibdflcuzc');
  await testConnection(5432, 'postgres');
  await testConnection(5432, 'postgres.rkwuuznnhmlibdflcuzc');
  // sometimes direct db url
  await testConnection(5432, 'postgres'); // but with db host? pooler resolves it.
}

runTests();
