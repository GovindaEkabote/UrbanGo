const dotenv = require('dotenv-flow');
dotenv.config();

module.exports = {
  ENV: process.env.ENV,
  PORT: process.env.PORT,
  SERVER_URL: process.env.SERVER_URL,
  DATABASE_URL: process.env.DATABASE_URL,
};


