import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { MySQLDatabase } from "@drivers/Mysql";
import { MySQLQuery } from "@drivers/mysql/MySQLQuery";

export class MySQLConnection implements ISQLConnection {
  private connected = false;

  constructor(private config: any) {}

  private BuildQueryResult(rows: any, meta: any, sql: string): ISQLQuery {
    if (Array.isArray(rows)) {
      return new MySQLQuery(rows, meta, sql);
    }

    return new MySQLQuery([], rows, sql);
  }

  async Connect(callback?: (success: boolean) => void): Promise<void> {
    try {
      const db = MySQLDatabase(this.config);

      await db.query("SELECT 1");
      await db.end();

      this.connected = true;
      callback?.(true);

    } catch (err) {
      this.connected = false;
      callback?.(false);
      throw err;
    }
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const db = MySQLDatabase(this.config);

    try {
      const rows = await db.query(sql, params);
      await db.end();

      return this.BuildQueryResult(rows, rows, sql);

    } catch (err) {
      await db.end();
      throw err;
    }
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
    const db = MySQLDatabase(this.config);

    try {
      await db.query("START TRANSACTION");

      const results: ISQLQuery[] = [];

      for (const sql of queries) {
        const rows = await db.query(sql);
        results.push(this.BuildQueryResult(rows, rows, sql));
      }

      await db.query("COMMIT");
      await db.end();

      success(results);

    } catch (err: any) {
      await db.query("ROLLBACK");
      await db.end();

      failure(err?.message ?? "Transaction failed");
    }
  }

  async Destroy(): Promise<void> {
    // serverless → nic
  }

  Escape(value: any): string {
    return require("mysql2").escape(value);
  }

  EscapeId(value: string): string {
    return require("mysql2").escapeId(value);
  }

  EscapeTable(database: string, table: string): string {
    return `${this.EscapeId(database)}.${this.EscapeId(table)}`;
  }
}
