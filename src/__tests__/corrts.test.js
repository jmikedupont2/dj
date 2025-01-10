import $ from 'jquery';
import dungeon from '../dungeon'; // Import the dungeon module
import { new_image } from '../canvas'; // Import TS canvas module


beforeAll(() => {
    // Mock the DOM element
    document.body.innerHTML = '<div id="dungeon_name">mock-seed</div>';
});


test('TS: Corridors are drawn correctly', () => {
    let dungeonData = generateDungeonConfig();
    dungeonData.corridor_layout = 'straight'; // Set corridor layout to straight
    dungeonData = applyDungeonLayout(dungeonData);

    const canvasContext = new_image('map', 500, 500); // Create a canvas context
    renderDungeon(dungeonData, canvasContext);

    // Check if corridors are drawn on the canvas
    const imageData = canvasContext.getImageData(0, 0, 500, 500);
    let hasCorridors = false;
    for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 255 || imageData.data[i + 1] !== 255 || imageData.data[i + 2] !== 255) {
            hasCorridors = true;
            break;
        }
    }

    expect(hasCorridors).toBe(true);
});
