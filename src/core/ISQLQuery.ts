import { ISQLResult } from "./ISQLResult";

export enum QueryType {
  SELECT,
  INSERT,
  UPDATE,
  DELETE,
  OTHER
}

export interface ISQLQuery {
  GetResultSet(): ISQLResult | null;
  GetInsertId(): number;
  GetAffectedRows(): number;

  GetType(): QueryType;
}