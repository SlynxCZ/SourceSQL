import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";
import mysql from "mysql2/promise";

export class MySQLConnection implements ISQLConnection {
  private connection: mysql.Connection | null = null;

  constructor(private config: any) {}

  private async getConnection(): Promise<mysql.Connection> {
    if (!this.connection) {
      this.connection = await mysql.createConnection(this.config);
    }
    return this.connection;
  }

  async Connect(callback?: (success: boolean) => void): Promise<void> {
    try {
      const conn = await this.getConnection();
      await conn.query("SELECT 1");
      callback?.(true);
    } catch (err) {
      callback?.(false);
      throw err;
    }
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const conn = await this.getConnection();

    const [rows] = await conn.query(sql, params);

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
      .then(q => cb(q))
      .catch(err => cb(null, err));
  }

  async ExecuteTransaction(
    queries: string[],
    success: (queries: ISQLQuery[]) => void,
    failure: (error: string) => void
  ) {
    const conn = await this.getConnection();

    try {
      await conn.query("START TRANSACTION");

      const results: ISQLQuery[] = [];

      for (const sql of queries) {
        const [rows] = await conn.query(sql);

        results.push(new MySQLQuery(
          Array.isArray(rows) ? rows : [],
          rows,
          sql
        ));
      }

      await conn.query("COMMIT");

      success(results);
    } catch (err: any) {
      await conn.query("ROLLBACK");
      failure(err?.message ?? "Transaction failed");
    }
  }

  async Destroy(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
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