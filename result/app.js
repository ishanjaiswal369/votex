const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

async function getDB() {
  return mysql.createConnection({
    host: 'mysql',
    user: 'root',
    password: 'root',
    database: 'votex'
  });
}

app.get('/result', async (req, res) => {
  try {
    const db = await getDB();

    const [rows] = await db.execute(`
      SELECT vote, COUNT(*) as count 
      FROM votes 
      GROUP BY vote
    `);

    await db.end();

    let html = `
      <html>
        <body>
          <h1>Voting Results</h1>
    `;

    if (rows.length === 0) {
      html += `<p>No votes yet! Go to <a href="/vote">/vote</a> to vote.</p>`;
    } else {
      rows.forEach(row => {
        html += `<h2>${row.vote}: ${row.count} votes</h2>`;
      });
    }

    html += `
          <br/>
          <a href="/result">Refresh Results</a> | 
          <a href="/vote">Vote Again</a>
        </body>
      </html>
    `;

    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching results. Database might not be ready yet.');
  }
});

app.listen(3000, () => {
  console.log('Result service running on port 3000');
});