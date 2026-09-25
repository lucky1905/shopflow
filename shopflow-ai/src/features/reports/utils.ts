/**
 * Converts a table data array to a downloadable CSV string and initiates download.
 */
export function exportToCSV<T extends object>(
  filename: string,
  rows: T[],
  columns: Array<{ key: keyof T | string; header: string; format?: (val: unknown, row: T) => string }>,
): void {
  if (!rows || rows.length === 0) {
    return;
  }

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');

  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        let val: unknown = (row as Record<string, unknown>)[col.key as string];
        if (col.format) {
          val = col.format(val, row);
        }
        if (val === null || val === undefined) {
          return '""';
        }
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(','),
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headerRow, ...dataRows].join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename.endsWith('.csv') ? filename : `${filename}.csv`}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers window print with clean print-area isolation.
 */
export function triggerPrintReport(): void {
  window.print();
}
