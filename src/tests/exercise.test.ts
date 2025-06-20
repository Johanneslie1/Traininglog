const assert = require('assert');

test('muscle group name casing', () => {
    const muscleGroup = "Quadriceps";
    assert.strictEqual(muscleGroup.toLowerCase(), "quadriceps");
});

test('valid category type', () => {
    const category = "power";
    const validCategories = ["cardio", "compound", "isolation", "olympic", "stretching"];
    assert.ok(!validCategories.includes(category), 'Invalid category type');
});