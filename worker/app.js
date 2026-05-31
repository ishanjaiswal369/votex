const redis = require('redis');
const mysql = require('mysql2/promise');

async function connectMySQL() {
  while (true) {
    try {
      const db = await mysql.createConnection({
        host: 'mysql',
        user: 'root',
        password: 'root',
        database: 'votex'
      });
      console.log('Worker connected to MySQL');
      return db;
    } catch (err) {
      console.log('MySQL not ready, retrying in 3 seconds...');
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

async function main() {
  const redisClient = redis.createClient({
    url: 'redis://redis:6379'
  });

  await redisClient.connect();
  console.log('Worker connected to Redis');

  const db = await connectMySQL();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vote VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Table ready. Worker is now watching Redis for votes...');

  while (true) {
    const result = await redisClient.brPop('votes', 5);

    if (result) {
      const vote = result.element;
      console.log(`Got vote: ${vote}`);
      await db.execute('INSERT INTO votes (vote) VALUES (?)', [vote]);
      console.log(`Saved vote to MySQL: ${vote}`);
    }
  }
}

main().catch(console.error);
