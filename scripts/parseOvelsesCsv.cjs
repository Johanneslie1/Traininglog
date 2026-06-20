const fs = require('fs');

const MUSCLE_ALIASES = {
  pectorals: 'chest',
  deltoids: 'shoulders',
  abs: 'core',
  abdominals: 'core',
  lats: 'lats',
  latissimus: 'lats',
  traps: 'traps',
  trapezius: 'traps',
  gluteus: 'glutes',
  quadricep: 'quadriceps',
  hamstring: 'hamstrings',
  calf: 'calves',
  forearm: 'forearms',
  bicep: 'biceps',
  tricep: 'triceps',
  'lower back': 'lower_back',
};

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeMuscle(rawMuscle) {
  const normalized = String(rawMuscle || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return MUSCLE_ALIASES[normalized] || normalized.replace(/\s+/g, '_');
}

function normalizeEquipment(name, equipment) {
  const combined = `${name} ${equipment}`.toLowerCase();
  const items = [];

  if (/smith/.test(combined)) {
    items.push('smith_machine');
  } else if (/machine|cable/.test(combined)) {
    items.push('machine');
  } else if (/barbell/.test(combined)) {
    items.push('barbell');
  } else if (/dumbbell/.test(combined)) {
    items.push('dumbbell');
  } else if (/band/.test(combined)) {
    items.push('bands');
  } else if (/kettlebell/.test(combined)) {
    items.push('kettlebell');
  } else if (/body only|bodyweight/.test(combined)) {
    items.push('bodyweight');
  } else if (equipment) {
    items.push(String(equipment).trim().toLowerCase().replace(/\s+/g, '_'));
  }

  return items.length > 0 ? items : ['other'];
}

function mapCategory(type, bodyPart) {
  const typeStr = String(type || '').toLowerCase();
  const bodyPartStr = String(bodyPart || '').toLowerCase();

  if (typeStr.includes('cardio')) return 'cardio';
  if (typeStr.includes('plyometric')) return 'power';
  if (typeStr.includes('stretch')) return 'stretching';
  if (bodyPartStr.includes('triceps') || bodyPartStr.includes('biceps') || bodyPartStr.includes('arms')) return 'isolation';
  if (bodyPartStr.includes('abdominals') || bodyPartStr.includes('core')) return 'isolation';
  if (bodyPartStr.includes('calves') || bodyPartStr.includes('traps')) return 'isolation';

  return 'compound';
}

function mapType(type, equipment) {
  const typeStr = String(type || '').toLowerCase();
  const equipmentStr = String(equipment || '').toLowerCase();

  if (typeStr.includes('cardio')) return 'cardio';
  if (typeStr.includes('stretch')) return 'flexibility';
  if (typeStr.includes('plyometric')) return 'plyometrics';
  if (equipmentStr.includes('body only') || equipmentStr.includes('bodyweight')) return 'bodyweight';

  return 'strength';
}

function parseCsvLine(rawLine) {
  let line = rawLine;
  if (line.startsWith('"') && line.endsWith('"')) {
    line = line.slice(1, -1).replace(/""/g, '"');
  }

  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current);

  if (parts.length < 8) {
    return null;
  }

  const [id, title, desc, type, bodyPart, equipment, kategori, lateralitet] = parts;
  if (!title || title === 'Title') {
    return null;
  }

  const primaryMuscles = (bodyPart || '')
    .split(',')
    .map((muscle) => normalizeMuscle(muscle))
    .filter(Boolean);

  const secondaryMuscles = primaryMuscles.length > 1 ? primaryMuscles.slice(1) : [];
  const mainMuscle = primaryMuscles[0] ? [primaryMuscles[0]] : [];

  const normalizedEquipment = normalizeEquipment(title, equipment);
  const exerciseType = mapType(type, equipment);

  return {
    id: String(id || '').trim(),
    name: title.trim(),
    description: (desc || '').trim(),
    type: exerciseType,
    activityType: 'resistance',
    primaryMuscles: mainMuscle.length > 0 ? mainMuscle : primaryMuscles,
    secondaryMuscles,
    equipment: normalizedEquipment,
    category: mapCategory(type, bodyPart),
    laterality: (lateralitet || 'Bilateral').trim(),
    instructions: [],
    tips: [],
    videoUrl: '',
    imageUrl: '',
    defaultUnit: exerciseType === 'strength' ? 'kg' : 'reps',
    metrics: {
      trackWeight: exerciseType === 'strength',
      trackReps: true,
      trackRPE: true,
    },
    isDefault: true,
  };
}

function parseOvelsesCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const byName = new Map();

  for (const rawLine of lines) {
    if (rawLine.startsWith('Unnamed:')) continue;

    const exercise = parseCsvLine(rawLine);
    if (!exercise?.name) continue;

    const key = normalizeName(exercise.name);
    const existing = byName.get(key);
    if (!existing || (exercise.description || '').length > (existing.description || '').length) {
      byName.set(key, exercise);
    }
  }

  return Array.from(byName.values());
}

module.exports = {
  parseOvelsesCsv,
  normalizeName,
};
