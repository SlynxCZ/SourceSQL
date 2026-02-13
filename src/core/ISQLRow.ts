export interface ISQLRow {
  GetString(field: string | number): string | null;
  GetInt(field: string | number): number;
  GetFloat(field: string | number): number;
  GetInt64(field: string | number): string;
  IsNull(field: string | number): boolean;
}
