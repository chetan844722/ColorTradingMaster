import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Initialize the neon client
const sql = neon(process.env.DATABASE_URL);

// Initialize drizzle with the schema
export const db = drizzle(sql, { schema });
