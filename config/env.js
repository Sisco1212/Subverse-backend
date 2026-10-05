
console.log("BEFORE DOTENV:", process.env.NODE_ENV);

import { config } from 'dotenv';

config({path: `.env.${process.env.NODE_ENV || 'development'}.local`});

console.log("AFTER DOTENV:", process.env.NODE_ENV);

config({path: `.env.${process.env.NODE_ENV || 'development'}.local`});

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
    EMAIL_PASSWORD
} = process.env;

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("SERVER_URL:", process.env.SERVER_URL);
console.log("QSTASH_URL:", process.env.QSTASH_URL);