import { ISQLRow } from "@core/ISQLRow";

export interface ISQLResult {
  getRowCount(): number;
  getFieldCount(): number;

  fieldNameToNum(name: string): number | null;
  fieldNumToName(index: number): string | null;

  moreRows(): boolean;
  fetchRow(): ISQLRow | null;
  rewind(): void;
}
