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
  private connected = false;
  private pool: Pool;

  constructor(config: ClientConfig) {
    this.pool = new Pool({
      ...config,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on("error", (err) => {
      console.error("[SourceSQL] Pool error:", err);
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
    const { sql: newSql, args } = convertPlaceholders(sql, params);

    try {
      const res = await this.pool.query(newSql, args);
      this.markSuccess();

      return new PostgresQuery(res.rows ?? [], res, newSql);
    } catch (err) {
      this.markFailure();

      // retry once (important for pg)
      try {
        const res = await this.pool.query(newSql, args);
        this.markSuccess();

        return new PostgresQuery(
          Array.isArray(res.rows) ? res.rows : [],
          res,
          newSql
        );
      } catch (err2) {
        this.markFailure();
        throw err2;
      }
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
    let client: PoolClient | null = null;

    try {
      client = await this.pool.connect();
      await client.query("BEGIN");

      const results: ISQLQuery[] = [];

      for (const q of queries) {
        const { sql, args } = convertPlaceholders(q.sql, q.args);

        const res = await client.query(sql, args);

        results.push(new PostgresQuery(
          Array.isArray(res.rows) ? res.rows : [],
          res,
          sql
        ));
      }

      await client.query("COMMIT");

      this.markSuccess();
      success(results);
    } catch (err: any) {
      this.markFailure();

      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch {}
      }

      failure(err instanceof Error ? err.message : String(err));
    } finally {
      client?.release();
    }
  }

  Escape(): never {
    throw new Error("[SourceSQL] Escape() not supported in Postgres. Use parameters.");
  }

  EscapeId(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  EscapeTable(database: string, table: string): string {
    return `${this.EscapeId(database)}.${this.EscapeId(table)}`;
  }
}