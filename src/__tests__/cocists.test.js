import { generateDungeonConfig, applyDungeonLayout } from '../dungeon'; // Import TS dungeon module

test('TS: Corridor layout is consistent', () => {
    let dungeonData = generateDungeonConfig();
    dungeonData.corridor_layout = 'straight'; // Set corridor layout to straight
    dungeonData = applyDungeonLayout(dungeonData);

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