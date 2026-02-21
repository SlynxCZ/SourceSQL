import { ISQLResult } from "@core/ISQLResult";
import { ISQLRow } from "@core/ISQLRow";
import { PostgresRow } from "@drivers/postgres/PostgresRow";

export class PostgresResult implements ISQLResult {
  private index = -1;
  private current: ISQLRow | null = null;
  private fields: string[];

  constructor(private rows: any[]) {
    this.fields = rows.length > 0 ? Object.keys(rows[0]) : [];
  }

  GetRowCount(): number {
    return this.rows.length;
  }

  GetFieldCount(): number {
    return this.fields.length;
  }

  FieldNameToNum(name: string): number | null {
    const idx = this.fields.indexOf(name);
    return idx === -1 ? null : idx;
  }

  FieldNumToName(index: number): string | null {
    return this.fields[index] ?? null;
  }

  MoreRows(): boolean {
    return this.index + 1 < this.rows.length;
  }

  FetchRow(): ISQLRow | null {
    if (!this.MoreRows()) return null;
    this.index++;
    this.current = new PostgresRow(this.rows[this.index], this.fields);
    return this.current;
  }

  CurrentRow(): ISQLRow | null {
    return this.current;
  }

  Rewind(): void {
    this.index = -1;
    this.current = null;
  }

  GetFieldType(field: number): number {
    return 0; // WIP
  }
}