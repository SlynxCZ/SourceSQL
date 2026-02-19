import mysql2 from "mysql2";
import ServerlessMysql from "@drivers/ServerlessMysql";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";

const mysql = (ServerlessMysql as any).default || ServerlessMysql;

export type DB = ReturnType<typeof mysql>;

export function MySQLDatabase(config: {
  host: string;
  user: string;
  password: string;
  database?: string;
}) {
  const db = mysql({
    config: {
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      charset: "utf8mb4",
      connectTimeout: 5000
    },
    library: mysql2 as any
  });

  return db;
}

export interface MySQLError {
  error: any;
  code?: string;
}

export async function query(
  db: DB,
  sql: string,
  args?: any[]
): Promise<ISQLQuery | { error: any }> {
  try {
    const rows = await db.query(sql, args);
    return new MySQLQuery(rows, rows, sql);
  } catch (error) {
    return { error };
  }
}

export async function queryEx(
  db: DB,
  sql: string,
  args?: any[]
): Promise<[ISQLQuery | null, MySQLError | null]> {
  try {
    const rows = await db.query(sql, args);
    return [new MySQLQuery(rows, rows, sql), null];
  } catch (error) {
    return [null, error as MySQLError];
  }
}

export async function executeTransaction(
  db: DB,
  queries: string[]
) {
  try {
    await db.query("START TRANSACTION");

    const results: ISQLQuery[] = [];

    for (const sql of queries) {
      const rows = await db.query(sql);
      results.push(new MySQLQuery(rows, rows, sql));
    }

    await db.query("COMMIT");

    return results;

  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

export async function closeDB(db: DB) {
  await db.end();
}
