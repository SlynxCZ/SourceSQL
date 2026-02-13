import { ISQLResult } from "@core/ISQLResult";

export interface ISQLQuery {
  getResultSet(): ISQLResult;
  getInsertId(): number;
  getAffectedRows(): number;
}
