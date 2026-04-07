const dotenv = require('dotenv');
dotenv.config({ path: process.env.ENV_FILE || '.env' });

const app = require('./app');

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://${HOST}:${PORT}`);
});
