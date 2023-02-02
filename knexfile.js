require('dotenv').config();

module.exports = {

  development: {
    client: process.env.DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      propagateCreateError: false
    },
    pool: {
      min: 2,
      max: 29
    }
  },
  production: {
    client: process.env.DB_CLIENT || 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true },
      propagateCreateError: false
    },
    pool: {
      min: 2,
      max: 29
    }
  },
};
