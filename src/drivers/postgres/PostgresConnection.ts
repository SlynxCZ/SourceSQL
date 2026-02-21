import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";
import { PostgresQuery } from "@drivers/postgres/PostgresQuery";
import { Client, ClientConfig } from "pg";

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
  private client: Client | null = null;
  private connected = false;

  constructor(private config: ClientConfig) {}

  private createClient(): Client {
    return new Client({
      ...this.config,
      ssl: (this.config as any).ssl ?? {
        rejectUnauthorized: false,
      },
      keepAlive: true,
      connectionTimeoutMillis: 5000,
    });
  }

  private async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = this.createClient();
      await this.client.connect();
      this.connected = true;
      return this.client;
    }

    try {
      await this.client.query("SELECT 1");
      return this.client;
    } catch {
      // reconnect
      try {
        await this.client.end();
      } catch {}

      this.client = this.createClient();
      await this.client.connect();
      this.connected = true;

      return this.client;
    }
  }

  async Connect(callback?: (success: boolean) => void): Promise<void> {
    try {
      const client = await this.getClient();
      await client.query("SELECT 1");

      this.connected = true;
      callback?.(true);
    } catch (err) {
      this.connected = false;
      callback?.(false);
      throw err;
    }
  }

  IsConnected(): boolean {
    return this.connected;
  }

  async Destroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
      } catch {}
      this.client = null;
      this.connected = false;
    }
  }

  async Query(sql: string, params?: any[]): Promise<ISQLQuery> {
    const client = await this.getClient();

    const { sql: newSql, args } = convertPlaceholders(sql, params);

    const res = await client.query(newSql, args);

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
      .then(q => cb(q))
      .catch(err => cb(null, err));
  }

  async ExecuteTransaction(
    queries: { sql: string; args?: any[] }[],
    success: (queries: ISQLQuery[]) => void,
    failure: (error: string) => void
  ) {
    const client = await this.getClient();

    try {
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
      try {
        await client.query("ROLLBACK");
      } catch {}

      failure(err?.message ?? "Transaction failed");
    }
  }

  Escape(value: any): string {
    if (value == null) return "NULL";
    // simple fallback
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  EscapeId(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  EscapeTable(database: string, table: string): string {
    return `${this.EscapeId(database)}.${this.EscapeId(table)}`;
  }
}