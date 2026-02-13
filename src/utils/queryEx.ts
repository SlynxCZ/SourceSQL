import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";

export async function QueryEx(
  conn: ISQLConnection,
  sql: string,
  params?: any[]
): Promise<readonly [ISQLQuery | null, Error | null]> {
  try {
    const q = await conn.Query(sql, params);
    return [q, null];
  } catch (e: any) {
    return [null, e instanceof Error ? e : new Error(String(e))];
  }
}
