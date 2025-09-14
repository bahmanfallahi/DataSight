
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
 * Cleans and normalizes a single value.
 */
function cleanValue(value: string): any {
  if (typeof value !== 'string') return value;

  const trimmedValue = value.trim();

  if (trimmedValue.toLowerCase() === 'free' || trimmedValue.toLowerCase() === 'have' || trimmedValue === '-') {
    return 0; // Standardize special categorical values that imply a zero cost
  }
  
  // Remove commas from numbers
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmedValue)) {
    return trimmedValue.replace(/,/g, '');
  }

  return trimmedValue;
}


/**
 * Parses a CSV string into headers and an array of data objects.
 * Handles quoted fields, commas within quotes, and cleans the data.
 */
export function parseCSV(csvText: string): ParsedData {
  const lines = csvText.trim().split(/\r\n|\n/);
  const allHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Keep track of original indices to map data correctly
  const headerMap = allHeaders.map((header, index) => ({ header, index })).filter(h => h.header !== '');
  const headers = headerMap.map(h => h.header);

  const data = lines.slice(1).map(line => {
    // Regex to split by comma, but not inside quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const row: Record<string, any> = {};
    headerMap.forEach(({ header, index }) => {
      const rawValue = values[index]?.trim().replace(/^"|"$/g, '') || '';
      row[header] = cleanValue(rawValue);
    });
    return row;
  });

  return { headers, data };
}

/**
 * Detects the type of a column based on its values.
 * Uses a scoring system and prioritizes date detection.
 */
function detectColumnType(values: any[]): ColumnType {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'unknown';

  let numericCount = 0;
  let dateCount = 0;
  
  // Use a sample for performance on large datasets
  const sample = nonNullValues.slice(0, 100);

  for (const v of sample) {
    // Check for Solar Hijri date format (YYYY/MM/DD)
    if (typeof v === 'string' && /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(v.trim())) {
      const parts = v.split('/');
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        dateCount++;
        continue; // It's a date, no need to check for numeric
      }
    }

    // Check for standard date formats
    if (!isNaN(new Date(v).getTime()) && String(v).length > 4) {
      dateCount++;
      continue;
    }

    // Check for numeric
    if (!isNaN(Number(v)) && String(v).trim() !== '') {
      numericCount++;
    }
  }

  const sampleSize = sample.length;
  if (dateCount / sampleSize > 0.8) return 'date';
  if (numericCount / sampleSize > 0.8) return 'numeric';

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
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '' && v !== 0);

    stats.count = nonNullValues.length;
    stats.missing = values.length - nonNullValues.length;

    if (type === 'numeric' && nonNullValues.length > 0) {
      const numericValues = nonNullValues.map(Number).filter(n => !isNaN(n));
      if (numericValues.length > 0) {
        stats.min = Math.min(...numericValues);
        stats.max = Math.max(...numericValues);
        const sum = numericValues.reduce((a, b) => a + b, 0);
        stats.mean = sum / numericValues.length;
        const variance = numericValues.reduce((sq, n) => sq + Math.pow(n - stats.mean, 2), 0) / numericValues.length;
        stats.stdDev = Math.sqrt(variance);
      }
    } else if (type === 'date' && nonNullValues.length > 0) {
      // For Solar Hijri dates, we can't use native Date object for min/max sorting directly
      // but string comparison works for YYYY/MM/DD format.
      const sortedDates = [...nonNullValues].sort();
      if(sortedDates.length > 0){
        stats.earliest = sortedDates[0];
        stats.latest = sortedDates[sortedDates.length - 1];
      }
    } else if (type === 'categorical') {
      const uniqueValues = new Set(nonNullValues);
      stats.uniqueCount = uniqueValues.size;
      const frequencies: Record<string, number> = {};
      for (const val of nonNullValues) {
        const key = String(val);
        frequencies[key] = (frequencies[key] || 0) + 1;
      }
      stats.frequencies = Object.entries(frequencies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    }

    return { name: header, type, stats };
  });
}
