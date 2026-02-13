import { ISQLConnection } from "@core/ISQLConnection";
import { ISQLQuery } from "@core/ISQLQuery";

export async function queryEx(
  conn: ISQLConnection,
  sql: string,
  params?: any[]
): Promise<[ISQLQuery | null, any]> {
  try {
    const q = await conn.query(sql, params);
    return [q, null];
  } catch (e) {
    return [null, e];
  }
}
