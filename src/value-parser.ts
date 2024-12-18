export class ValueParser {
  static normaliseName(name: string | null | undefined): string | null {
    if (!name || name.trim() === '') {
      return null;
    }

    return name
      .trim()
      .replaceAll(/([.,])(?=\S)/g, '$1 ')
      .replaceAll(',,', ', ');
  }

  static parseDate(value: string | undefined | null): string | null {
    if (!value) {
      return null;
    }

    return `${value.slice(4, 8)}-${value.slice(2, 4)}-${value.slice(0, 2)}`;
  }

  static parseString(value: string | undefined | null): string | null {
    if (!value || value.trim() === '') {
      return null;
    }

    return value.trim();
  }

  static parseBoolean(value: string | undefined | null): boolean {
    if (!value) {
      return false;
    }

    return value === '1';
  }
  static parseInt(value: string | undefined | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = parseInt(value, 10);

    return isNaN(parsed) ? null : parsed;
  }

  static parseFloat(value: string | undefined | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = parseFloat(value);

    return isNaN(parsed) ? null : parsed;
  }
}
