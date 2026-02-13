import { ISQLRow } from "@core/ISQLRow";

export interface ISQLResult {
  GetRowCount(): number;
  GetFieldCount(): number;

  FieldNameToNum(name: string): number | null;
  FieldNumToName(index: number): string | null;

  MoreRows(): boolean;
  FetchRow(): ISQLRow | null;
  CurrentRow(): ISQLRow | null;

  Rewind(): void;

  GetFieldType(field: number): number;
}