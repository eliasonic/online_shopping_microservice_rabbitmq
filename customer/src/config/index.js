const dotEnv = require("dotenv");

if (process.env.NODE_ENV === "dev") {
  const configFile = `./.env.${process.env.NODE_ENV}`;
  console.log(configFile)
  dotEnv.config({ path: configFile });
} else {
  dotEnv.config();
}

module.exports = {
  PORT: process.env.PORT,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.APP_SECRET,
  MESSAGE_BROKER_URL: process.env.MESSAGE_BROKER_URL,
  EXCHANGE_NAME: 'ONLINE_SHOPPING',
  CUSTOMER_BINDING_KEY: 'CUSTOMER_SERVICE',
  SHOPPING_BINDING_KEY: 'SHOPPING_SERVICE',
  QUEUE_NAME: 'CUSTOMER_QUEUE'
};
