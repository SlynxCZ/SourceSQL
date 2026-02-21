import { ISQLQuery } from "@core/ISQLQuery";

export interface ISQLConnection {
  Connect(callback?: (success: boolean) => void): Promise<void>;
  Destroy(): Promise<void>;
  IsConnected(): boolean;

  Query(sql: string, params?: any[]): Promise<ISQLQuery>;

  QueryCallback(
    sql: string,
    cb: (query: ISQLQuery | null, error?: any) => void,
    params?: any[]
  ): void;

  ExecuteTransaction(
    queries: { sql: string; args?: any[] }[],
    success: (queries: ISQLQuery[]) => void,
    failure: (error: string) => void
  ): Promise<void>;

  Escape(value: any): string;
  EscapeId(value: string): string;
  EscapeTable(database: string, table: string): string;
}