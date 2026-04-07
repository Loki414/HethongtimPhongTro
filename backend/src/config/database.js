const dotenv = require('dotenv');

dotenv.config({ path: process.env.ENV_FILE || '.env' });

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME = 'dack',
  DB_USER = 'root',
  DB_PASS = 'root',
  NODE_ENV = 'development',
} = process.env;

module.exports = {
  [NODE_ENV]: {
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: 'mysql',
    logging: false,
  },
};
