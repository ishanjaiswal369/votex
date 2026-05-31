const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = redis.createClient({
  url: 'redis://redis:6379'
});

client.on('error', (err) => console.error('Redis error:', err));

client.connect().then(() => {
  console.log('Vote service connected to Redis');
}).catch(console.error);

app.get('/vote', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Vote for your favourite</h1>
        <form method="POST" action="/vote">
          <button name="vote" value="cats" type="submit">Cats</button>
          <button name="vote" value="dogs" type="submit">Dogs</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/vote', async (req, res) => {
  const vote = req.body.vote;
  console.log('Received vote:', vote);

  if (!vote) return res.status(400).send('No vote provided');

  try {
    await client.lPush('votes', vote);
    console.log('Vote pushed to Redis:', vote);
    res.send(`<h2>You voted for: ${vote}! <a href="/vote">Vote again</a></h2>`);
  } catch (err) {
    console.error('Redis push error:', err);
    res.status(500).send('Error saving vote');
  }
});

app.listen(3000, () => {
  console.log('Vote service running on port 3000');
});