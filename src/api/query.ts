import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";

export type QueryError = any;

export async function query(
  db: ISQLConnection,
  sql: string,
  args?: any[]
): Promise<ISQLQuery | null> {
  try {
    return await db.Query(sql, args);
  } catch (err) {
    return null;
  }
}

export async function queryEx(
  db: ISQLConnection,
  sql: string,
  args?: any[]
): Promise<[ISQLQuery | null, QueryError | null]> {
  try {
    const query = await db.Query(sql, args);
    return [query, null];
  } catch (err) {
    return [null, err];
  }
}

export async function transaction(
  db: ISQLConnection,
  queries: { sql: string; args?: any[] }[]
): Promise<ISQLQuery[]> {
  try {
    const results: ISQLQuery[] = [];

    await db.Query("BEGIN");

    for (const q of queries) {
      results.push(await db.Query(q.sql, q.args));
    }

    await db.Query("COMMIT");

    return results;
  } catch (err) {
    await db.Query("ROLLBACK");
    throw err;
  }
}