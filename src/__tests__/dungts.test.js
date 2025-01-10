import $ from 'jquery';
import dungeon from '../dungeon'; // Import the dungeon module

beforeAll(() => {
    // Mock the DOM element
    document.body.innerHTML = '<div id="dungeon_name">mock-seed</div>';
});


test('TS: Corridors are generated correctly', () => {
    let dungeonData = generateDungeonConfig();
    dungeonData.corridor_layout = 'straight'; // Set corridor layout to straight
    dungeonData = applyDungeonLayout(dungeonData);

    // Check if corridors are generated
    let hasCorridors = false;
    for (let i = 1; i < dungeonData.n_i; i++) {
        for (let j = 1; j < dungeonData.n_j; j++) {
            const cellRow = 2 * i + 1;
            const cellCol = 2 * j + 1;
            if (dungeonData.cell[cellRow][cellCol] & 4) {
                hasCorridors = true;
                break;
            }
        }
    }

    expect(hasCorridors).toBe(true);
});