export interface ParsedData {
  headers: string[];
  data: Record<string, any>[];
}

export type ColumnType = 'numeric' | 'categorical' | 'date' | 'unknown';

export interface ColumnAnalysis {
  name: string;
  type: ColumnType;
  stats: Record<string, any>;
}

/**
 * Parses a CSV string into headers and an array of data objects.
 * Handles quoted fields and commas within quotes.
 */
export function parseCSV(csvText: string): ParsedData {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = lines.slice(1).map(line => {
    // Simple regex to split by comma, but not inside quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim().replace(/^"|"$/g, '') || '';
      row[header] = value;
    });
    return row;
  });

  return { headers, data };
}

/**
 * Detects the type of a column based on its values.
 */
function detectColumnType(values: any[]): ColumnType {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'unknown';

  let numericCount = 0;
  let dateCount = 0;

  for (const v of nonNullValues) {
    if (!isNaN(Number(v)) && v.trim() !== '') {
      numericCount++;
    }
    if (!isNaN(new Date(v).getTime()) && v.length > 4) { // Avoid treating years like '2023' as dates
        dateCount++;
    }
  }

  if (numericCount / nonNullValues.length > 0.8) return 'numeric';
  if (dateCount / nonNullValues.length > 0.8) return 'date';

  return 'categorical';
}

/**
 * Analyzes columns of parsed data to determine type and calculate statistics.
 */
export function analyzeColumns(data: Record<string, any>[], headers: string[]): ColumnAnalysis[] {
  return headers.map(header => {
    const values = data.map(row => row[header]);
    const type = detectColumnType(values);
    const stats: Record<string, any> = {};
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

    stats.count = nonNullValues.length;
    stats.missing = values.length - nonNullValues.length;

    if (type === 'numeric') {
      const numericValues = nonNullValues.map(Number);
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      stats.mean = sum / numericValues.length;
      const variance = numericValues.reduce((sq, n) => sq + Math.pow(n - stats.mean, 2), 0) / numericValues.length;
      stats.stdDev = Math.sqrt(variance);
    } else if (type === 'date') {
      const dateValues = nonNullValues.map(v => new Date(v).getTime());
      stats.earliest = new Date(Math.min(...dateValues)).toISOString().split('T')[0];
      stats.latest = new Date(Math.max(...dateValues)).toISOString().split('T')[0];
    } else if (type === 'categorical') {
      const uniqueValues = new Set(nonNullValues);
      stats.uniqueCount = uniqueValues.size;
      const frequencies: Record<string, number> = {};
      for (const val of nonNullValues) {
        frequencies[val] = (frequencies[val] || 0) + 1;
      }
      stats.frequencies = Object.entries(frequencies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    }

    return { name: header, type, stats };
  });
}
