// Simple Node.js test to verify ActivityType classification
const { readFileSync } = require('fs');
const { join } = require('path');

const __dirname = __dirname;

console.log('🧪 Testing ActivityType Classification');
console.log('=====================================');

// Read and analyze the key files
try {
    // Check activityTypes.ts for the main enum
    const activityTypesPath = join(__dirname, 'src', 'types', 'activityTypes.ts');
    const activityTypesContent = readFileSync(activityTypesPath, 'utf8');
    
    console.log('1. ActivityTypes.ts enum:');
    const enumMatch = activityTypesContent.match(/enum ActivityType\s*{[^}]+}/s);
    if (enumMatch) {
        console.log(enumMatch[0]);
    }
    
    // Check activityLog.ts for import
    const activityLogPath = join(__dirname, 'src', 'types', 'activityLog.ts');
    const activityLogContent = readFileSync(activityLogPath, 'utf8');
    
    console.log('\n2. ActivityLog.ts import:');
    const importMatch = activityLogContent.match(/import.*ActivityType.*from.*activityTypes/);
    if (importMatch) {
        console.log('✅ Correctly imports ActivityType from activityTypes.ts');
        console.log(importMatch[0]);
    } else {
        console.log('❌ No proper import found');
    }
    
    // Check for any remaining duplicate definitions
    const duplicateTypeMatch = activityLogContent.match(/export type ActivityType\s*=/);
    if (duplicateTypeMatch) {
        console.log('❌ Still has duplicate ActivityType definition');
    } else {
        console.log('✅ No duplicate ActivityType definition found');
    }
    
    // Check unifiedExerciseUtils.ts for mapping
    const utilsPath = join(__dirname, 'src', 'utils', 'unifiedExerciseUtils.ts');
    const utilsContent = readFileSync(utilsPath, 'utf8');
    
    console.log('\n3. Exercise mapping function:');
    const mappingMatch = utilsContent.match(/mapExerciseTypeToActivityType[^}]+}/s);
    if (mappingMatch) {
        const speedAgilityMatch = mappingMatch[0].match(/case 'speedAgility':[^;]+;/);
        if (speedAgilityMatch) {
            console.log('Speed & Agility mapping:', speedAgilityMatch[0]);
        }
    }
    
    // Check UniversalSetLogger.tsx for consistency
    const loggerPath = join(__dirname, 'src', 'components', 'UniversalSetLogger.tsx');
    const loggerContent = readFileSync(loggerPath, 'utf8');
    
    console.log('\n4. UniversalSetLogger activity type handling:');
    const loggerMatch = loggerContent.match(/ActivityType\.SPEED_AGILITY:[^;]+;/);
    if (loggerMatch) {
        console.log('Logger mapping:', loggerMatch[0]);
    }
    
    console.log('\n✅ Classification analysis complete!');
    console.log('\nNext steps:');
    console.log('1. Test in browser at http://localhost:3000');
    console.log('2. Try logging a speed & agility exercise like "Butt Kicks"');
    console.log('3. Check if it shows as "Speed & Agility Activity" instead of "Resistance Activity"');
    
} catch (error) {
    console.error('❌ Error reading files:', error.message);
}
