import { ISQLQuery, QueryType } from "@core/ISQLQuery";
import { MySQLResult } from "./MySQLResult";

export class MySQLQuery implements ISQLQuery {
  private result: MySQLResult | null;
  private type: QueryType;

  constructor(
    rows: any[],
    private meta: any,
    private sql: string
  ) {
    this.type = this.DetectType(sql);

    if (rows && rows.length > 0) {
      this.result = new MySQLResult(rows);
    } else {
      this.result = null;
    }
  }

  private DetectType(sql: string): QueryType {
    const q = sql.trim().toLowerCase();

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
    return this.meta?.insertId ?? 0;
  }

  GetAffectedRows(): number {
    return this.meta?.affectedRows ?? 0;
  }

  GetType(): QueryType {
    return this.type;
  }
}
