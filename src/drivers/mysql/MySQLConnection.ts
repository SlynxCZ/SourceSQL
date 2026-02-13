import mysql from "mysql2/promise";
import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";

export class MySQLConnection implements ISQLConnection {
  private pool: mysql.Pool;
  private connected = false;

  constructor(private config: mysql.PoolOptions) {
    this.pool = mysql.createPool(config);
  }

  private BuildQueryResult(rows: any, meta: any, sql: string): ISQLQuery {
    if (Array.isArray(rows)) {
      return new MySQLQuery(rows, meta, sql);
    }

    return new MySQLQuery([], rows, sql);
  }

  async Connect(callback?: (success: boolean) => void): Promise<void> {
    try {
      // ping = test connection
      const conn = await this.pool.getConnection();
      await conn.ping();
      conn.release();

      this.connected = true;
      callback?.(true);
    } catch (err) {
      this.connected = false;
      callback?.(false);
      throw err;
    }
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const [rows, meta] = await this.pool.query<any>(sql, params);
    return this.BuildQueryResult(rows, meta, sql);
  }

  QueryCallback(
    sql: string,
    callback: (query: ISQLQuery | null, error?: any) => void,
    params?: any[]
  ) {
    this.Query(sql, params)
      .then(q => callback(q))
      .catch(err => callback(null, err));
  }

  async ExecuteTransaction(
    queries: string[],
    success: (queries: ISQLQuery[]) => void,
    failure: (error: string) => void
  ) {
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();

      const results: ISQLQuery[] = [];

      for (const sql of queries) {
        const [rows, meta] = await conn.query<any>(sql);
        results.push(this.BuildQueryResult(rows, meta, sql));
      }

      await conn.commit();
      success(results);

    } catch (err: any) {
      await conn.rollback();
      failure(err?.message ?? "Transaction failed");

    } finally {
      conn.release();
    }
  }

  async Destroy(): Promise<void> {
    await this.pool.end();
    this.connected = false;
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
