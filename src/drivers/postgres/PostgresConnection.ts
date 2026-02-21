import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { PostgresQuery } from "@drivers/postgres/PostgresQuery";
import { Pool, PoolClient, ClientConfig } from "pg";

function normalizeArgs(args?: any[]): any[] | undefined {
  if (!args) return undefined;
  if (Array.isArray(args)) return args;
  return [args];
}

function convertPlaceholders(sql: string, args?: any[]) {
  const normalized = normalizeArgs(args);

  if (!normalized || normalized.length === 0) {
    return { sql, args: normalized };
  }

  let index = 0;
  const newSql = sql.replace(/\?/g, () => `$${++index}`);

  return { sql: newSql, args: normalized };
}

export class PostgresConnection implements ISQLConnection {
  private pool: Pool;

  constructor(config: ClientConfig) {
    this.pool = new Pool({
      ...config,
      // max: 10,
      // idleTimeoutMillis: 30000,
      // connectionTimeoutMillis: 5000,
    });

    this.pool.on("error", (err) => {
      console.error("[SourceSQL]", err);
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

  IsConnected(): boolean {
    return true;
  }

  async Destroy(): Promise<void> {
    await this.pool.end();
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const { sql: newSql, args } = convertPlaceholders(sql, params);
    const res = await this.pool.query(newSql, args);

    return new PostgresQuery(
      Array.isArray(res.rows) ? res.rows : [],
      res,
      newSql
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
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();

      await client.query("BEGIN");

      const results: ISQLQuery[] = [];

      for (const q of queries) {
        const { sql, args } = convertPlaceholders(q.sql, q.args);

        const res = await client.query(sql, args);

        results.push(
          new PostgresQuery(
            Array.isArray(res.rows) ? res.rows : [],
            res,
            sql
          )
        );
      }

      await client.query("COMMIT");

      success(results);
    } catch (err: any) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch {}
      }

      failure(err?.message ?? "Transaction failed");
    } finally {
      client?.release();
    }
  }

  Escape(value: any): string {
    if (value == null) return "NULL";
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  EscapeId(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  EscapeTable(database: string, table: string): string {
    return `${this.EscapeId(database)}.${this.EscapeId(table)}`;
  }
}