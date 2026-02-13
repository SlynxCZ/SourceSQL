import { ISQLResult } from "@core/ISQLResult";
import { ISQLRow } from "@core/ISQLRow";
import { MySQLRow } from "@drivers/mysql/MySQLRow";

export class MySQLResult implements ISQLResult {
  private index = -1;
  private fields: string[];

  constructor(private rows: any[]) {
    this.fields = rows.length > 0 ? Object.keys(rows[0]) : [];
  }

  getRowCount(): number {
    return this.rows.length;
  }

  getFieldCount(): number {
    return this.fields.length;
  }

  fieldNameToNum(name: string): number | null {
    const idx = this.fields.indexOf(name);
    return idx === -1 ? null : idx;
  }

  fieldNumToName(index: number): string | null {
    return this.fields[index] ?? null;
  }

  moreRows(): boolean {
    return this.index + 1 < this.rows.length;
  }

  fetchRow(): ISQLRow | null {
    if (!this.moreRows()) return null;
    this.index++;
    return new MySQLRow(this.rows[this.index], this.fields);
  }

  rewind(): void {
    this.index = -1;
  }
}
