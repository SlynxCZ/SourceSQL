import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";
import mysql from "mysql2/promise";

export class MySQLConnection implements ISQLConnection {
  private connected = false;
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
    this.connected = await this.Ping();
    callback?.(this.connected);
  }

  async Destroy(): Promise<void> {
    await this.pool.end();
    this.connected = false;
  }

  IsConnected(): boolean {
    return this.connected;
  }

  async Ping(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  private markSuccess() {
    this.connected = true;
  }

  private markFailure() {
    this.connected = false;
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    try {
      const [rows] = await this.pool.query(sql, params);
      this.markSuccess();

      return new MySQLQuery(
        Array.isArray(rows) ? rows : [],
        rows,
        sql
      );
    } catch (err) {
      this.markFailure();
      throw err;
    }
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

        results.push(new MySQLQuery(
          Array.isArray(rows) ? rows : [],
          rows,
          q.sql
        ));
      }

      await conn.commit();

      this.markSuccess();
      success(results);
    } catch (err: any) {
      this.markFailure();

      if (conn) {
        try {
          await conn.rollback();
        } catch {}
      }

      failure(err instanceof Error ? err.message : String(err));
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