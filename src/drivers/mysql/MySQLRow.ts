import { ISQLRow } from "@core/ISQLRow";

export class MySQLRow implements ISQLRow {
  constructor(private row: any, private fields: string[]) {}

  private resolve(field: string | number): any {
    if (typeof field === "number")
      return this.row[this.fields[field]];
    return this.row[field];
  }

  getString(field: string | number): string | null {
    const val = this.resolve(field);
    return val == null ? null : String(val);
  }

  getInt(field: string | number): number {
    const val = this.resolve(field);
    return val == null ? 0 : Number(val);
  }

  getFloat(field: string | number): number {
    return this.getInt(field);
  }

  isNull(field: string | number): boolean {
    return this.resolve(field) == null;
  }
}
