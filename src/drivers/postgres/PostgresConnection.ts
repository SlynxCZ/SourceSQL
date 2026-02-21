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

  constructor(private config: ClientConfig) {}

  private async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = new Client(this.config);
      await this.client.connect();
    }
    return this.client;
  }

  async Connect(callback?: (success: boolean) => void): Promise<void> {
    try {
      const client = await this.getClient();
      await client.query("SELECT 1");
      callback?.(true);
    } catch (err) {
      callback?.(false);
      throw err;
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

        results.push(new PostgresQuery(
          Array.isArray(res.rows) ? res.rows : [],
          res,
          sql
        ));
      }

      await client.query("COMMIT");

      success(results);
    } catch (err: any) {
      await client.query("ROLLBACK");
      failure(err?.message ?? "Transaction failed");
    }
  }

  async Destroy(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
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