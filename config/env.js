import { config } from "dotenv";

const environment = process.env.NODE_ENV || "development";

config({
  path: `.env.${environment}.local`,
});

export const {
  PORT,
  NODE_ENV,
  DB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ARCJET_KEY,
  ARCJET_ENV,
  QSTASH_URL,
  QSTASH_TOKEN,
  SERVER_URL,
  EMAIL_PASSWORD,
} = process.env;
