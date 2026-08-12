interface StudyCard {
  term: string;
  definition: string;
}

/**
 * Convert study cards to CSV format
 */
export function cardsToCSV(cards: StudyCard[]): string {
  const headers = ['term', 'definition'];
  const rows = cards.map((card) => [escapeCSVField(card.term), escapeCSVField(card.definition)]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Parse CSV to study cards
 */
export function csvToCards(csv: string): StudyCard[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const termIndex = headers.findIndex((h) => h.toLowerCase() === 'term');
  const definitionIndex = headers.findIndex((h) => h.toLowerCase() === 'definition');

  if (termIndex === -1 || definitionIndex === -1) {
    // Assume first column is term, second is definition
    return lines.slice(1).map((line) => {
      const fields = parseCSVLine(line);
      return {
        term: fields[0] || '',
        definition: fields[1] || '',
      };
    });
  }

  return lines.slice(1).map((line) => {
    const fields = parseCSVLine(line);
    return {
      term: fields[termIndex] || '',
      definition: fields[definitionIndex] || '',
    };
  });
}

/**
 * Escape a CSV field if it contains special characters
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Read CSV file
 */
export function readCSV(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };

    reader.readAsText(file);
  });
}
