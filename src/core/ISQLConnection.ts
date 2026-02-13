import { ISQLQuery } from "@core/ISQLQuery";

export interface ISQLConnection {
  Query(sql: string, params?: any[]): Promise<ISQLQuery>;
  Escape(value: any): string;
  EscapeId(value: string): string;
}
