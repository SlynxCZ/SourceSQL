import { ISQLQuery } from "@core/ISQLQuery";
import { ISQLResult } from "@core/ISQLResult";
import { MySQLResult } from "@drivers/mysql/MySQLResult";

export class MySQLQuery implements ISQLQuery {
  private result: MySQLResult;

  constructor(
    rows: any[],
    private meta: any
  ) {
    this.result = new MySQLResult(rows);
  }

  getResultSet(): ISQLResult {
    return this.result;
  }

  getInsertId(): number {
    return this.meta?.insertId ?? 0;
  }

  getAffectedRows(): number {
    return this.meta?.affectedRows ?? 0;
  }
}
