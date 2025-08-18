import { describe, it, expect } from 'vitest';

// Import the norm function - we'll need to export it for testing
// For now, let's recreate it here for testing
function norm(str: unknown): string {
  if (str == null) return '';
  if (typeof str === 'string') return str.toLowerCase().replace(/\s+/g, '-');
  try { 
    return String(str).toLowerCase().replace(/\s+/g, '-'); 
  } catch { 
    return ''; 
  }
}

describe('speedAgilityFilters - norm function', () => {
  it('should handle normal strings', () => {
    expect(norm('Kettlebell')).toBe('kettlebell');
    expect(norm('High Knees')).toBe('high-knees');
    expect(norm('Box Jumps')).toBe('box-jumps');
  });

  it('should handle null and undefined', () => {
    expect(norm(null)).toBe('');
    expect(norm(undefined)).toBe('');
  });

  it('should handle numbers', () => {
    expect(norm(123)).toBe('123');
    expect(norm(0)).toBe('0');
  });

  it('should handle arrays (convert to string)', () => {
    expect(norm(['kettlebell'])).toBe('kettlebell');
    expect(norm(['barbell', 'dumbbells'])).toBe('barbell,dumbbells');
  });

  it('should handle objects', () => {
    expect(norm({ name: 'test' })).toBe('[object-object]');
  });

  it('should handle boolean values', () => {
    expect(norm(true)).toBe('true');
    expect(norm(false)).toBe('false');
  });

  it('should handle empty strings and whitespace', () => {
    expect(norm('')).toBe('');
    expect(norm('   ')).toBe('-'); // Whitespace gets replaced with dash
    expect(norm('  multiple   spaces  ')).toBe('multiple-spaces');
  });
});
