// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowsToCSVForPowerBi = (rows: Record<string, any>[], headers: string[]): string => {
  const delimiter = ',';

  const formatNumberForPowerBi = (val: number): string => {
    if (!Number.isFinite(val)) return '';
    return new Intl.NumberFormat('nb-NO', {
      useGrouping: false,
      maximumFractionDigits: 20,
    }).format(val);
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

  const lines = [
    headers.join(delimiter),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(delimiter)),
  ];

  return lines.join('\n');
};
