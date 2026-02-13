export interface ISQLRow {
  getString(field: string | number): string | null;
  getInt(field: string | number): number;
  getFloat(field: string | number): number;
  isNull(field: string | number): boolean;
}
