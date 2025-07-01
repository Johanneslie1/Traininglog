import { writeFileSync, readFileSync } from 'fs';
import path from 'path';
// Map primary muscles to our app categories
const muscleToCategory = {
    'Chest': 'chest',
    'Pectorals': 'chest',
    'Biceps': 'arms',
    'Triceps': 'arms',
    'Back': 'back',
    'Lats': 'back',
    'Trapezius': 'back',
    'Quadriceps': 'legs',
    'Hamstrings': 'legs',
    'Calves': 'legs',
    'Shoulders': 'shoulders',
    'Deltoids': 'shoulders',
    'Abdominals': 'core',
    'Core': 'core',
    'Full Body': 'full_body',
    // Add more mappings as needed
};
function determineCategory(exercise) {
    if (exercise.primaryMuscles.length === 0) {
        return 'full_body'; // Default to full_body if no muscles specified
    }
    // Check first primary muscle
    const primaryMuscle = exercise.primaryMuscles[0];
    return muscleToCategory[primaryMuscle] || 'full_body';
}
function validateAndCategorizeExercises() {
    // Read the current exercise database
    const filePath = path.join(process.cwd(), 'src', 'data', 'generatedExercises.json');
    const exercises = JSON.parse(readFileSync(filePath, 'utf-8'));
    // Add categories to all exercises
    const categorizedExercises = exercises.map(exercise => ({
        ...exercise,
        category: determineCategory(exercise),
        // Ensure type is always set
        type: exercise.type || 'strength'
    }));
    // Write back the categorized exercises
    writeFileSync(filePath, JSON.stringify(categorizedExercises, null, 2));
    // Print statistics
    const categories = categorizedExercises.reduce((acc, exercise) => {
        acc[exercise.category] = (acc[exercise.category] || 0) + 1;
        return acc;
    }, {});
    console.log('Exercise categories distribution:');
    Object.entries(categories).forEach(([category, count]) => {
        console.log(`${category}: ${count} exercises`);
    });
}
validateAndCategorizeExercises();
