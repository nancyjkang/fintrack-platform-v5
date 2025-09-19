// Quick database connection test
const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connections...\n');

  const connections = [
    {
      name: 'Development',
      url: process.env.DATABASE_URL_DEVELOPMENT
    },
    {
      name: 'Staging',
      url: process.env.DATABASE_URL_STAGING
    }
  ];

  for (const conn of connections) {
    console.log(`Testing ${conn.name} database...`);
    console.log(`URL: ${conn.url?.replace(/:[^:@]*@/, ':****@')}`); // Hide password

    if (!conn.url) {
      console.log(`❌ ${conn.name}: No URL configured\n`);
      continue;
    }

    const client = new Client({ connectionString: conn.url });

    try {
      await client.connect();
      console.log(`✅ ${conn.name}: Connected successfully`);

      // Test a simple query
      const result = await client.query('SELECT NOW() as current_time');
      console.log(`✅ ${conn.name}: Query successful - ${result.rows[0].current_time}\n`);

    } catch (error) {
      console.log(`❌ ${conn.name}: Connection failed`);
      console.log(`   Error: ${error.message}\n`);
    } finally {
      await client.end();
    }
  }
}

testConnection().catch(console.error);
