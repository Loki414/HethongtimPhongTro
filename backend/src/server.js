const dotenv = require('dotenv');
dotenv.config({ path: process.env.ENV_FILE || '.env' });

const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
});
