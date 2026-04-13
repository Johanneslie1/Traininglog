/**
 * Weight conversion utilities
 */

// Conversion factors
const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;

/**
 * Convert weight from kg to lb
 */
export const kgToLb = (kg: number): number => {
  return Math.round((kg * KG_TO_LB) * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert weight from lb to kg
 */
export const lbToKg = (lb: number): number => {
  return Math.round((lb * LB_TO_KG) * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert weight between units
 */
export const convertWeight = (weight: number, fromUnit: 'kg' | 'lb', toUnit: 'kg' | 'lb'): number => {
  if (fromUnit === toUnit) return weight;
  
  if (fromUnit === 'kg' && toUnit === 'lb') {
    return kgToLb(weight);
  } else if (fromUnit === 'lb' && toUnit === 'kg') {
    return lbToKg(weight);
  }
  
  return weight;
};

/**
 * Format weight with appropriate precision
 */
export const formatWeight = (weight: number): string => {
  // Use 1 decimal place if needed, otherwise show whole number
  return weight % 1 === 0 ? weight.toString() : weight.toFixed(1);
};
