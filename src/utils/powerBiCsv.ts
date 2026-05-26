export const rowsToCSVForPowerBi = (rows: object[], headers: string[]): string => {
  const delimiter = ',';

  const formatNumberForPowerBi = (val: number): string => {
    if (!Number.isFinite(val)) return '';
    return String(val);
  };

  const escape = (val: unknown): string => {
    const str =
      typeof val === 'number'
        ? formatNumberForPowerBi(val)
        : val === null || val === undefined
          ? ''
          : String(val);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const getValue = (row: object, header: string): unknown =>
    (row as Record<string, unknown>)[header];

  const lines = [
    headers.join(delimiter),
    ...rows.map((row) => headers.map((h) => escape(getValue(row, h))).join(delimiter)),
  ];

  return lines.join('\n');
};
