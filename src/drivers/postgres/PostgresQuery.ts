import { ISQLQuery, QueryType } from "@core/ISQLQuery";
import { PostgresResult } from "@drivers/postgres/PostgresResult";

export class PostgresQuery implements ISQLQuery {
  private result: PostgresResult | null;
  private type: QueryType;

  constructor(
    rows: any[],
    private meta: any,
    private sql: string
  ) {
    this.type = this.DetectType(sql);
    this.result = rows.length > 0 ? new PostgresResult(rows) : null;
  }

  private DetectType(sql: string): QueryType {
    const q = sql.trimStart().toLowerCase();

    if (q.startsWith("select")) return QueryType.SELECT;
    if (q.startsWith("insert")) return QueryType.INSERT;
    if (q.startsWith("update")) return QueryType.UPDATE;
    if (q.startsWith("delete")) return QueryType.DELETE;

    return QueryType.OTHER;
  }

  GetResultSet() {
    return this.result;
  }

  GetInsertId(): number {
    if (!this.meta?.rows?.length) return 0;

    const row = this.meta.rows[0];

    if ("id" in row) return Number(row.id) || 0;

    const firstKey = Object.keys(row)[0];
    return firstKey ? Number(row[firstKey]) || 0 : 0;
  }

  GetAffectedRows(): number {
    return Number(this.meta?.rowCount ?? 0);
  }

  GetType(): QueryType {
    return this.type;
  }
}