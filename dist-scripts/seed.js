import { seedExercises } from '../scripts/seedExercises';
console.log('Starting to seed exercise database...');
seedExercises()
    .then(() => {
    console.log('Successfully seeded exercise database!');
    process.exit(0);
})
    .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
});
