const dungeon = require('../dungeon.js'); // Import the JS dungeon module
const canvas = require('../canvas.js'); // Import the JS canvas module

test('JS: Corridors are drawn correctly', () => {
    const dungeonData = dungeon.generateDungeonConfig();
    dungeonData.corridor_layout = 'straight'; // Set corridor layout to straight
    dungeonData = dungeon.applyDungeonLayout(dungeonData);

    const canvasContext = canvas.new_image('map', 500, 500); // Create a canvas context
    dungeon.renderDungeon(dungeonData, canvasContext);

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