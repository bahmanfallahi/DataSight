import * as XLSX from 'xlsx';

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
function cleanValue(value: any): any {
  if (value === null || value === undefined) return '';

  const stringValue = String(value).trim();
  
  if (stringValue.toLowerCase() === 'free' || stringValue.toLowerCase() === 'have' || stringValue === '-') {
    return 0; // Standardize special categorical values that imply a zero cost
  }
  
  // Remove commas from numbers
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(stringValue)) {
    return stringValue.replace(/,/g, '');
  }

  return stringValue;
}

/**
 * Parses a CSV string into headers and an array of data objects.
 */
function parseCSV(csvText: string): ParsedData {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 1) return { headers: [], data: [] };

  const allHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const headerMap = allHeaders.map((header, index) => ({ header, index })).filter(h => h.header !== '');
  const headers = headerMap.map(h => h.header);

  const data = lines.slice(1).map(line => {
    if (!line.trim()) return null; // Skip empty lines
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const row: Record<string, any> = {};
    headerMap.forEach(({ header, index }) => {
      const rawValue = values[index]?.trim().replace(/^"|"$/g, '') || '';
      row[header] = cleanValue(rawValue);
    });
    return row;
  }).filter(row => row !== null); // Remove null entries from empty lines

  return { headers, data: data as Record<string, any>[] };
}

/**
 * Parses an Excel file buffer into headers and an array of data objects.
 */
function parseExcel(buffer: ArrayBuffer): ParsedData {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (jsonData.length === 0) return { headers: [], data: [] };

    const allHeaders = (jsonData[0] as string[]).map(h => String(h).trim());
    
    const headerMap = allHeaders.map((header, index) => ({ header, index })).filter(h => h.header !== '');
    const headers = headerMap.map(h => h.header);
    
    const data = jsonData.slice(1).map(rowArray => {
        const row: Record<string, any> = {};
        headerMap.forEach(({ header, index }) => {
            const rawValue = (rowArray as any[])[index];
            row[header] = cleanValue(rawValue);
        });
        return row;
    });

    return { headers, data };
}

/**
 * Parses a file based on its type (CSV or Excel).
 */
export async function parseDataFile(file: File): Promise<ParsedData> {
    if (file.type === 'text/csv') {
        const text = await file.text();
        return parseCSV(text);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel') {
        const buffer = await file.arrayBuffer();
        return parseExcel(buffer);
    } else {
        throw new Error(`Unsupported file type: ${file.type}`);
    }
}


/**
 * Detects the type of a column based on its values.
 */
function detectColumnType(values: any[]): ColumnType {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'unknown';

  let numericCount = 0;
  let dateCount = 0;
  
  const sample = nonNullValues.slice(0, 100);

  for (const v of sample) {
    const stringV = String(v);
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(stringV.trim())) {
      const parts = stringV.split('/');
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        dateCount++;
        continue;
      }
    }

    if (!isNaN(new Date(v).getTime()) && String(v).length > 4 && isNaN(Number(v))) {
      dateCount++;
      continue;
    }

    if (!isNaN(Number(v)) && String(v).trim() !== '') {
      numericCount++;
    }
  }

  const sampleSize = sample.length;
  if (sampleSize > 0) {
    if (dateCount / sampleSize > 0.8) return 'date';
    if (numericCount / sampleSize > 0.8) return 'numeric';
  }

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
