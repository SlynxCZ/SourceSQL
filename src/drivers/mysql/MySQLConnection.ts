import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";
import mysql from "mysql2/promise";

export class MySQLConnection implements ISQLConnection {
  private pool: mysql.Pool;

  constructor(private config: any) {
    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }

  async Connect(callback?: (success: boolean) => void): Promise<void> {
    try {
      await this.pool.query("SELECT 1");
      callback?.(true);
    } catch (err) {
      callback?.(false);
      throw err;
    }
  }

  async Destroy(): Promise<void> {
    await this.pool.end();
  }

  IsConnected(): boolean {
    return true;
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const start = performance.now();

    const [rows] = await this.pool.query(sql, params);

    const time = performance.now() - start;

    if (time > 100) {
      console.warn(`[SLOW QUERY] ${time.toFixed(2)} ms -> ${sql}`);
    }

    return new MySQLQuery(
      Array.isArray(rows) ? rows : [],
      rows,
      sql
    );
  }

  QueryCallback(
    sql: string,
    cb: (query: ISQLQuery | null, error?: any) => void,
    params?: any[]
  ) {
    this.Query(sql, params)
      .then((q) => cb(q))
      .catch((err) => cb(null, err));
  }

  async ExecuteTransaction(
    queries: { sql: string; args?: any[] }[],
    success: (queries: ISQLQuery[]) => void,
    failure: (error: string) => void
  ) {
    let conn: mysql.PoolConnection | null = null;

    try {
      conn = await this.pool.getConnection();

      await conn.beginTransaction();

      const results: ISQLQuery[] = [];

      for (const q of queries) {
        const [rows] = await conn.query(q.sql, q.args);

        results.push(
          new MySQLQuery(
            Array.isArray(rows) ? rows : [],
            rows,
            q.sql
          )
        );
      }

      await conn.commit();
      success(results);
    } catch (err: any) {
      if (conn) {
        try {
          await conn.rollback();
        } catch {}
      }

      failure(err?.message ?? "Transaction failed");
    } finally {
      conn?.release();
    }
  }

  Escape(value: any): string {
    return mysql.escape(value);
  }

  EscapeId(value: string): string {
    return mysql.escapeId(value);
  }

  EscapeTable(database: string, table: string): string {
    return `${this.EscapeId(database)}.${this.EscapeId(table)}`;
  }
}