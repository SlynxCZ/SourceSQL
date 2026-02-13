import { ISQLQuery } from "@core/ISQLQuery";

export interface ISQLConnection {
  query(sql: string, params?: any[]): Promise<ISQLQuery>;
  escape(value: any): string;
  escapeId(value: string): string;
}
