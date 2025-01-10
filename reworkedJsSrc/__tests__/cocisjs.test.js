const dungeon = require('../dungeon.js'); // Import the JS dungeon module

test('JS: Corridor layout is consistent', () => {
    const dungeonData = dungeon.generateDungeonConfig();
    dungeonData.corridor_layout = 'straight'; // Set corridor layout to straight
    dungeonData = dungeon.applyDungeonLayout(dungeonData);

    // Check the number of corridors
    let corridorCount = 0;
    for (let i = 1; i < dungeonData.n_i; i++) {
        for (let j = 1; j < dungeonData.n_j; j++) {
            const cellRow = 2 * i + 1;
            const cellCol = 2 * j + 1;
            if (dungeonData.cell[cellRow][cellCol] & 4) {
                corridorCount++;
            }
        }
    }

    expect(corridorCount).toBeGreaterThan(0);
});