"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDungeonDataConfig = generateDungeonDataConfig;
exports.lookupAtIndex = lookupAtIndex;
exports.calculateDungeonDimensions = calculateDungeonDimensions;
exports.generateDoors = generateDoors;
exports.N = N;
exports.generateCorridors = generateCorridors;
exports.generateStairs = generateStairs;
exports.removeDeadEnds = removeDeadEnds;
exports.getPaletteColor = getPaletteColor;
exports.drawLabels = drawLabels;
exports.drawGrid = drawGrid;
exports.drawRooms = drawRooms;
exports.drawWallsAndShading = drawWallsAndShading;
exports.drawDoors = drawDoors;
exports.drawStairs = drawStairs;
exports.renderDungeon = renderDungeon;
exports.attemptDoorPlacement = attemptDoorPlacement;
exports.calculateDoor = calculateDoor;
exports.calculateRoomDimensions = calculateRoomDimensions;
exports.extractDoorPositions = extractDoorPositions;
exports.generateNewRooms = generateNewRooms;
exports.da = da;
exports.ba = ba;
exports.scale_table = scale_table;
exports.key_range = key_range;
// Import necessary functions from other modules
const prng_1 = require("./prng");
const generator_1 = require("./generator");
const canvas_1 = require("./canvas");
const types_1 = require("./types");
function printDungeon(dungeonData) {
    const { cell, n_rows, n_cols } = dungeonData;
    let output = '';
    // Validation: Check if the grid is valid
    if (!validateGrid(cell)) {
        console.error("Invalid grid detected in printDungeon.");
        return;
    }
    // Validation: Check for corridors
    if (!validateCorridors(cell)) {
        console.error("No corridors detected in printDungeon.");
    }
    // Validation: Check for walls
    if (!validateWalls(cell)) {
        console.error("No walls detected in printDungeon.");
    }
    // Log the grid state for debugging
    logGridState(cell);
    // Print the dungeon layout
    for (let row = 0; row <= n_rows; row++) {
        for (let col = 0; col <= n_cols; col++) {
            const cellValue = cell[row][col];
            let char = '.'; // Default to empty space
            // Check for doors first
            if (cellValue & 65536 || cellValue & 131072 || cellValue & 262144 || cellValue & 524288 || cellValue & 1048576 || cellValue & 2097152) {
                char = 'D'; // Door
            }
            else if (cellValue & 1 || cellValue & 16) {
                char = 'w'; // Wall
            }
            else if (cellValue & 4) {
                char = '+'; // Corridor
            }
            else if (cellValue & 2) {
                char = 'R'; // Room floor
            }
            else if (cellValue & 4194304 || cellValue & 8388608) {
                char = 'S'; // Stairs
            }
            else if ((cellValue >> 24) & 255) {
                char = 'L'; // Label (room ID)
            }
            output += char + ' ';
        }
        output += '\n'; // New line after each row
    }
    console.log(output);
}
function validateGrid(grid) {
    if (!grid || grid.length === 0 || grid[0].length === 0) {
        console.error("Grid is empty or invalid.");
        return false;
    }
    return true;
}
function validateCorridors(grid) {
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            if (grid[row][col] & 4) {
                return true; // Corridor found
            }
        }
    }
    console.error("No corridors found in the grid.");
    return false;
}
function validateWalls(grid) {
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            if (grid[row][col] & 16) {
                return true; // Wall found
            }
        }
    }
    console.error("No walls found in the grid.");
    return false;
}
function logGridState(grid) {
    console.log("Grid state (binary representation):");
    for (let row = 0; row < grid.length; row++) {
        let rowStr = "";
        for (let col = 0; col < grid[0].length; col++) {
            rowStr += grid[row][col].toString(2).padStart(8, "0") + " ";
        }
        console.log(rowStr);
    }
}
function generatePalette(mapStyle) {
    var _a;
    let palette = {};
    // Get the base palette based on the map_style
    const basePalette = ((_a = types_1.V[mapStyle]) === null || _a === void 0 ? void 0 : _a.colors) || types_1.V.standard.colors;
    // Merge the base palette with default colors
    palette = Object.assign({}, basePalette);
    // Ensure default colors are set
    palette.black = palette.black || '#000000';
    palette.white = palette.white || '#ffffff';
    return palette;
}
// Function to initialize dropdowns
function initializeDropdowns() {
    Object.keys(types_1.DungeonSettings).forEach((key) => {
        const settingsKey = key;
        console.log("Processing key:", key);
        const dropdown = $("#".concat(key)); // Select the dropdown by its ID
        console.log("Dropdown element:", dropdown);
        if (dropdown.length === 0) {
            console.error(`Dropdown with ID "${key}" not found!`);
        }
        else {
            console.log(`Dropdown with ID "${key}" found!`);
            // Iterate over the keys of the nested object
            Object.keys(types_1.DungeonSettings[settingsKey]).forEach((optionKey) => {
                const option = types_1.DungeonSettings[settingsKey][optionKey];
                console.log("Appending option:", option.title, optionKey);
                // Check if the option already exists in the dropdown
                if (!dropdown.find(`option[value="${optionKey}"]`).length) {
                    dropdown.append(`<option value="${optionKey}">${option.title}</option>`);
                }
            });
            console.log(`Dropdown with ID "${key}" populated successfully!`);
        }
    });
}
// Call the initializeDropdowns function once when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeDropdowns();
});
function generateDungeonDataConfig() {
    // Lookup dungeon size and layout from the dropdowns or use defaults
    const dungeonSize = lookupAtIndex("dungeon_size", $("#dungeon_size").val() || types_1.DefaultDungeonSettings.dungeon_size);
    const layoutConfig = lookupAtIndex("dungeon_layout", $("#dungeon_layout").val() || types_1.DefaultDungeonSettings.dungeon_layout);
    // Validate dungeonSize and layoutConfig
    if (!dungeonSize || !layoutConfig) {
        throw new Error("Invalid dungeon size or layout configuration.");
    }
    // Calculate dungeon dimensions
    const cellSize = dungeonSize.cell;
    const dungeonArea = dungeonSize.size;
    const aspectRatio = layoutConfig.aspect;
    const n_i = Math.floor((dungeonArea * aspectRatio) / cellSize);
    const n_j = Math.floor(dungeonArea / cellSize);
    // Initialize the config object
    let config = Object.assign(Object.assign({}, types_1.DefaultDungeonSettings), { seed: (0, prng_1.set_prng_seed)($("#dungeon_name").val()), cell: [], n_rooms: 0, room: [], base_layer: null, n_cols: 2 * n_j, n_rows: 2 * n_i, max_col: 2 * n_j - 1, max_row: 2 * n_i - 1, door_type: "standard", n_i: n_i, n_j: n_j, complex_rooms: false });
    // Initialize the cell array
    for (let i = 0; i <= config.n_rows; i++) {
        config.cell[i] = [];
        for (let j = 0; j <= config.n_cols; j++) {
            config.cell[i][j] = 0; // Initialize each cell to 0
        }
    }
    // Override with user-defined settings if available
    Object.keys(types_1.DungeonSettings).forEach((key) => {
        const settingsKey = key;
        const dropdown = $("#" + key); // Select the dropdown by its ID
        if (dropdown.length > 0) {
            const selectedValue = dropdown.val();
            if (selectedValue) {
                config[settingsKey] = selectedValue; // Update config with user-defined values
                // Set complex_rooms flag based on room layout
                if (key === "room_layout") {
                    const roomLayoutConfig = lookupAtIndex("room_layout", selectedValue);
                    config.complex_rooms = roomLayoutConfig.complex || false;
                }
            }
        }
    });
    return config;
}
function lookupAtIndex(key, value) {
    const settings = types_1.DungeonSettings[key];
    if (settings && settings[value]) {
        return settings[value];
    }
    throw new Error(`Setting not found for key: ${key} and value: ${value}`);
}
function xa(a, b) {
    let f = b.length / (a.n_rows + 1), d = b[0].length / (a.n_cols + 1), g;
    for (g = 0; g <= a.n_rows; g++) {
        let c = b[Math.floor(g * f)], e;
        for (e = 0; e <= a.n_cols; e++)
            c[Math.floor(e * d)] || (a.cell[g][e] = 1);
    }
    return a;
}
function ya(a) {
    let b = Math.floor(a.n_rows / 4), f;
    for (f = 0; f < b; f++) {
        var d = b + f;
        let g = a.n_cols - d;
        for (; d <= g; d++)
            (a.cell[f][d] = 1),
                (a.cell[a.n_rows - f][d] = 1),
                (a.cell[d][f] = 1),
                (a.cell[d][a.n_cols - f] = 1);
    }
    return a;
}
function za(a) {
    let b = Math.floor(a.n_rows / 2), f;
    for (f = 0; f <= a.n_rows; f++) {
        let d = Math.floor(0.57735 * Math.abs(f - b)) + 1, g = a.n_cols - d, c;
        for (c = 0; c <= a.n_cols; c++)
            if (c < d || c > g)
                a.cell[f][c] = 1;
    }
    return a;
}
function Aa(a) {
    let b = a.n_rows / 2, f = a.n_cols / 2, d;
    for (d = 0; d <= a.n_rows; d++) {
        let g = Math.pow(d / b - 1, 2), c;
        for (c = 0; c <= a.n_cols; c++)
            1 < Math.sqrt(g + Math.pow(c / f - 1, 2)) && (a.cell[d][c] = 1);
    }
    return a;
}
function calculateDungeonDimensions(a) {
    // Lookup dungeon size and layout
    const dungeonSize = lookupAtIndex("dungeon_size", a.dungeon_size);
    const layoutConfig = lookupAtIndex("dungeon_layout", a.dungeon_layout || "square" /*default*/);
    // Calculate dimensions
    let dungeonSizeTemp = dungeonSize.cell;
    a.n_i = Math.floor((dungeonSize.size * layoutConfig.aspect) / dungeonSizeTemp);
    a.n_j = Math.floor(dungeonSize.size / dungeonSizeTemp);
    a.cell_size = dungeonSizeTemp;
    a.n_rows = 2 * a.n_i;
    a.n_cols = 2 * a.n_j;
    a.max_row = a.n_rows - 1;
    a.max_col = a.n_cols - 1;
    // Initialize the cell array
    a.cell = [];
    for (let i = 0; i <= a.n_rows; i++) {
        a.cell[i] = [];
        for (let d = 0; d <= a.n_cols; d++) {
            a.cell[i][d] = 0;
        }
    }
    // Apply dungeon layout masks
    let g;
    if ((g = layoutConfig.mask)) {
        a = xa(a, g);
    }
    else if (a.dungeon_layout === "saltire") {
        a = ya(a);
    }
    else if (a.dungeon_layout === "hexagon") {
        a = za(a);
    }
    else if (a.dungeon_layout === "round") {
        a = Aa(a);
    }
    return a;
}
// Helper functions for modularity
function generateDenseRooms(dungeonData) {
    for (let i = 0; i < dungeonData.n_i; i++) {
        for (let j = 0; j < dungeonData.n_j; j++) {
            const cellRow = 2 * i + 1;
            const cellCol = 2 * j + 1;
            if (!(dungeonData.cell[cellRow][cellCol] & 2) && (i === 0 || j === 0 || (0, prng_1.random)(2) > 0)) {
                dungeonData = createRoom(dungeonData, { i, j });
                if (dungeonData.huge_rooms && !(dungeonData.cell[cellRow][cellCol] & 2)) {
                    dungeonData = createRoom(dungeonData, { i, j, size: "medium" });
                }
            }
        }
    }
    return dungeonData;
}
function generateScatteredRooms(dungeonData) {
    const roomCount = ba(dungeonData);
    for (let i = 0; i < roomCount; i++) {
        dungeonData = createRoom(dungeonData, { size: dungeonData.room_size }); // Pass room_size
    }
    if (dungeonData.huge_rooms) {
        const mediumRoomCount = ba(dungeonData, "medium");
        for (let i = 0; i < mediumRoomCount; i++) {
            dungeonData = createRoom(dungeonData, { size: "medium" });
        }
    }
    return dungeonData;
}
function generateDoors(dungeonData) {
    const doorConnections = {};
    // Iterate over the rooms using Object.entries()
    Object.entries(dungeonData.room).forEach(([roomId, room]) => {
        console.log(`Processing room with ID: ${roomId}`, room);
        // Attempt to place doors in the room
        const doors = attemptDoorPlacement(dungeonData, room);
        console.log("Doors found for room:", roomId, doors);
        if (!doors.length) {
            console.log("No doors found for this room.");
            return; // Skip this room if there are no doors
        }
        // Calculate the number of doors to add based on room area
        const roomArea = Math.sqrt(((room.east - room.west) / 2 + 1) * ((room.south - room.north) / 2 + 1));
        const doorCount = Math.floor(roomArea + (0, prng_1.random)(roomArea)); // Ensure doorCount is an integer
        // Add doors to the room
        for (let i = 0; i < doorCount; i++) {
            const door = doors.splice((0, prng_1.random)(doors.length), 1)[0];
            if (!door)
                break; // Stop if there are no more doors to add
            const doorWithAllProperties = {
                doorRowIndex: door.door_r, // Use updated property name
                doorColIndex: door.door_c, // Use updated property name
                sill_r: door.sill_r, // Use updated property name
                sill_c: door.sill_c, // Use updated property name
                dir: door.dir, // Use updated property name
                out_id: door.out_id, // Use updated property name (now a number)
                door_type: dungeonData.door_type || 'Standard', // Add this property
            };
            // Check if the door position is valid
            if (!(dungeonData.cell[doorWithAllProperties.doorRowIndex][doorWithAllProperties.doorColIndex] & 4128769) && // Ensure it's not already a door or stair
                dungeonData.cell[doorWithAllProperties.doorRowIndex][doorWithAllProperties.doorColIndex] & 16) { // Ensure it's a wall
                if (doorWithAllProperties.out_id) {
                    const connectionKey = [room.id, doorWithAllProperties.out_id].sort().join(",");
                    if (!doorConnections[connectionKey]) {
                        dungeonData = da(dungeonData, room, doorWithAllProperties);
                        doorConnections[connectionKey] = 1;
                    }
                }
                else {
                    dungeonData = da(dungeonData, room, doorWithAllProperties);
                }
            }
        }
    });
    return dungeonData;
}
function labelRooms(dungeonData) {
    Object.entries(dungeonData.room).forEach(([roomId, room]) => {
        console.warn(`Processing room with ID: ${roomId}`, room);
        const roomIdStr = room.id.toString();
        const roomIdLength = roomIdStr.length;
        const centerRow = Math.floor((room.north + room.south) / 2);
        const centerCol = Math.floor((room.west + room.east - roomIdLength) / 2) + 1;
        // Log room boundaries and center position
        console.warn(`Room ID: ${roomIdStr}, North: ${room.north}, South: ${room.south}, West: ${room.west}, East: ${room.east}`);
        console.warn(`Center Row: ${centerRow}, Center Col: ${centerCol}`);
        // Ensure the center position is within bounds
        if (centerRow < 0 || centerRow >= dungeonData.n_rows || centerCol < 0 || centerCol >= dungeonData.n_cols) {
            console.error(`Invalid center position for room ${room.id}: (${centerRow}, ${centerCol})`);
            return;
        }
        for (let i = 0; i < roomIdLength; i++) {
            const labelChar = roomIdStr.charAt(i);
            const labelCode = labelChar.charCodeAt(0);
            // Ensure the cell is within bounds
            if (centerCol + i >= dungeonData.n_cols) {
                console.error(`Label character "${labelChar}" at (${centerRow}, ${centerCol + i}) is out of bounds`);
                continue;
            }
            // Assign the label
            dungeonData.cell[centerRow][centerCol + i] |= labelCode << 24;
        }
    });
    return dungeonData;
}
let sortedDirections = Object.keys(types_1.M).sort();
function invertDirection(dir) {
    switch (dir) {
        case "north":
            return "south";
        case "south":
            return "north";
        case "west":
            return "east";
        case "east":
            return "west";
        default:
            throw new Error("Invalid direction");
    }
}
function Ba(a, b) {
    // Shuffle the directions
    let f = Object.keys(types_1.Direction).concat();
    for (let d = f.length - 1; d > 0; d--) {
        let g = (0, prng_1.random)(d + 1), c = f[d];
        f[d] = f[g];
        f[g] = c;
    }
    // Prioritize the current direction if straight_pct is set
    if (b && a.straight_pct && (0, prng_1.random)(100) < a.straight_pct) {
        f.unshift(b.toString());
    }
    return f;
}
function N(a, b) {
    return a - b;
}
function ea(params) {
    const directions = Ba({ straight_pct: params.a.straight_pct || 0 }, params.d);
    console.log(`Generating corridors in directions: ${directions.join(", ")}`);
    directions.forEach((direction) => {
        let c = params.a;
        let e = 2 * params.b + 1; // row = 3
        let h = 2 * params.f + 1; // col = 3
        let k = 2 * (params.b + types_1.P[direction]) + 1; // next row
        let m = 2 * (params.f + types_1.M[direction]) + 1; // next col
        let y = false;
        b: {
            let t = (h + m) / 2;
            let z = m;
            if (0 > k || k > c.n_rows || 0 > z || z > c.n_cols) {
                y = false;
            }
            else {
                y = true;
                const yRange = [(e + k) / 2, k].sort(N);
                const tRange = [t, z].sort(N);
                for (z = yRange[0]; z <= yRange[1]; z++) {
                    for (let A = tRange[0]; A <= tRange[1]; A++) {
                        if (c.cell[z][A] & 21) { // Check for walls or obstacles
                            y = false;
                            break b;
                        }
                    }
                }
            }
        }
        if (y) {
            console.log(`Marking corridor from (${e}, ${h}) to (${k}, ${m})`);
            for (let row = e; row <= k; row++) {
                for (let col = h; col <= m; col++) {
                    if (!(c.cell[row][col] & 6)) { // Ensure it's not a wall or corridor
                        c.cell[row][col] &= -33; // Clear bits
                        c.cell[row][col] |= 4; // Mark as corridor
                        console.log(`Marked cell (${row}, ${col}) as corridor`);
                    }
                }
            }
            // Recursively call ea and update the dungeonData, propagating the current direction
            c = ea({ a: c, b: params.b + types_1.P[direction], f: params.f + types_1.M[direction], d: direction });
        }
    });
    return params.a;
}
function generateCorridors(dungeonData) {
    const corridorLayout = lookupAtIndex("corridor_layout", dungeonData.corridor_layout || "straight");
    dungeonData.straight_pct = corridorLayout.pct;
    console.log("Starting corridor generation...");
    for (let i = 1; i < dungeonData.n_i; i++) {
        for (let j = 1; j < dungeonData.n_j; j++) {
            const cellRow = 2 * i + 1;
            const cellCol = 2 * j + 1;
            if (!(dungeonData.cell[cellRow][cellCol] & 6)) { // Ensure it's not a wall or corridor
                console.log(`Generating corridor at (${cellRow}, ${cellCol})`);
                const params = {
                    a: dungeonData,
                    b: i,
                    f: j,
                    d: undefined,
                };
                dungeonData = ea(params); // Generate corridors
            }
        }
    }
    console.log("Corridor generation complete.");
    return dungeonData;
}
function finalizeDungeonLayout(dungeonData) {
    for (let i = 0; i <= dungeonData.n_rows; i++) {
        for (let j = 0; j <= dungeonData.n_cols; j++) {
            if (dungeonData.cell[i][j] & 1) {
                dungeonData.cell[i][j] = 0;
            }
        }
    }
    return dungeonData;
}
function ja(grid, row, col, directionDetails) {
    // Input validation
    if (!Array.isArray(grid) || !Array.isArray(grid[0]) || typeof row !== 'number' || typeof col !== 'number' || !directionDetails) {
        throw new Error("Invalid input parameters");
    }
    if (!Array.isArray(directionDetails.corridor) || !Array.isArray(directionDetails.walled)) {
        throw new Error("Invalid DirectionDetails structure");
    }
    if (grid.length === 0 || grid[0].length === 0) {
        return false;
    }
    let isValid = true;
    // Check for corridors
    if (directionDetails.corridor) {
        for (const offset of directionDetails.corridor) {
            const cellRow = row + offset[0];
            const cellCol = col + offset[1];
            // Skip out-of-bounds cells
            if (cellRow < 0 || cellRow >= grid.length || cellCol < 0 || cellCol >= grid[0].length) {
                continue;
            }
            // Check if the cell is a corridor
            if (!(grid[cellRow][cellCol] & 4)) {
                isValid = false;
                break;
            }
        }
        if (!isValid)
            return false;
    }
    // Check for walls
    if (directionDetails.walled) {
        for (const offset of directionDetails.walled) {
            const cellRow = row + offset[0];
            const cellCol = col + offset[1];
            // Skip out-of-bounds cells
            if (cellRow < 0 || cellRow >= grid.length || cellCol < 0 || cellCol >= grid[0].length) {
                continue;
            }
            // Check if the cell is a wall
            if (!(grid[cellRow][cellCol] & 16)) {
                isValid = false;
                break;
            }
        }
    }
    return isValid;
}
function oa(dungeonData) {
    const cell = dungeonData.cell;
    const stairs = [];
    console.log("Starting stair placement search...");
    for (let row = 0; row < dungeonData.n_i; row++) {
        const cellRow = 2 * row + 1;
        for (let col = 0; col < dungeonData.n_j; col++) {
            const cellCol = 2 * col + 1;
            // Check if the cell is a corridor and not already marked as stairs
            if (cell[cellRow][cellCol] & 4 && !(cell[cellRow][cellCol] & 12582912)) {
                console.log(`Found corridor at (${cellRow}, ${cellCol})`);
                // Check all directions for valid stair placement
                Object.keys(types_1.DirectionConfig).forEach((h) => {
                    console.log(`Checking direction: ${h} at (${cellRow}, ${cellCol})`);
                    if (ja(cell, cellRow, cellCol, types_1.DirectionConfig[h])) {
                        console.log(`Valid stair placement at (${cellRow}, ${cellCol}) in direction ${h}`);
                        const stair = {
                            row: cellRow,
                            col: cellCol,
                            next_row: cellRow + types_1.DirectionConfig[h].next[0],
                            next_col: cellCol + types_1.DirectionConfig[h].next[1],
                        };
                        stairs.push(stair);
                    }
                    else {
                        console.log(`Invalid stair placement at (${cellRow}, ${cellCol}) in direction ${h}`);
                    }
                });
            }
        }
    }
    console.error(`Total stairs found: ${stairs.length}`);
    return stairs;
}
function generateStairs(dungeonData) {
    if (!dungeonData.add_stairs || dungeonData.add_stairs === 'no') {
        console.error("Bad from the gitgo, No stairs to be generated, either intentionally or by code error.");
        return dungeonData;
    }
    // Get potential stair positions
    const stairPositions = oa(dungeonData);
    // Log the number of stair positions found
    console.log(`Stair positions found: ${stairPositions.length}`);
    if (!stairPositions.length) {
        console.error("oa not returning valid stair positions.");
        return dungeonData;
    }
    // Determine the number of stairs to place
    let numStairs = 0;
    if (dungeonData.add_stairs === 'many') {
        numStairs = 3 + (0, prng_1.random)(Math.floor(dungeonData.n_cols * dungeonData.n_rows / 1000));
    }
    else if (dungeonData.add_stairs === 'yes') {
        numStairs = 2;
    }
    // Place the stairs
    const stairs = [];
    for (let i = 0; i < numStairs; i++) {
        const stair = stairPositions.splice((0, prng_1.random)(stairPositions.length), 1)[0];
        if (!stair)
            break;
        const { row, col } = stair;
        // Randomly assign the stair type (up or down)
        if ((0, prng_1.random)(2) < 1) {
            dungeonData.cell[row][col] |= 4194304; // Down stair
            stair.key = 'down'; // Use `key` instead of `dir`
        }
        else {
            dungeonData.cell[row][col] |= 8388608; // Up stair
            stair.key = 'up'; // Use `key` instead of `dir`
        }
        stairs.push(stair);
        console.log(`Placing ${stair.key} stair at (${row}, ${col})`); // Debugging
    }
    if (stairs.length === 0) {
        console.warn("No stairs were generated.");
    }
    // Update the dungeon data with the placed stairs
    dungeonData.stair = stairs;
    return dungeonData;
}
function ha(dungeonData) {
    var _a;
    const closeArcs = (_a = dungeonData.close_arcs) !== null && _a !== void 0 ? _a : 0;
    return fa(dungeonData, closeArcs, types_1.DirectionConfig); // Use DirectionConfig.north as an example
}
function ka(dungeonData, row, col, directionConfig) {
    const cell = dungeonData.cell;
    // Iterate over each direction in DirectionConfig
    for (const direction of Object.keys(directionConfig)) {
        const config = directionConfig[direction];
        // Check if the cell can be processed in this direction
        if (ja(cell, row, col, config)) {
            // Close cells if specified in the configuration
            if (config.close) {
                for (const [dr, dc] of config.close) {
                    cell[row + dr][col + dc] = 0;
                }
            }
            // Open cells if specified in the configuration
            if (config.open) {
                const [dr, dc] = config.open;
                cell[row + dr][col + dc] |= 4; // Mark as corridor
            }
            // Recurse if specified in the configuration
            if (config.recurse) {
                const [dr, dc] = config.recurse;
                dungeonData = ka(dungeonData, row + dr, col + dc, directionConfig);
            }
        }
    }
    dungeonData.cell = cell;
    return dungeonData;
}
function fa(dungeonData, closeArcs, directionConfig) {
    const shouldCloseAll = closeArcs === 100; // Close all arcs if closeArcs is 100
    for (let i = 0; i < dungeonData.n_i; i++) {
        const row = 2 * i + 1;
        for (let j = 0; j < dungeonData.n_j; j++) {
            const col = 2 * j + 1;
            // Check if the cell is a corridor or room and not already marked as a stair or door
            if ((dungeonData.cell[row][col] & 6) && !(dungeonData.cell[row][col] & 12582912)) {
                // Randomly decide whether to process the cell based on closeArcs percentage
                if (shouldCloseAll || Math.random() * 100 < closeArcs) {
                    dungeonData = ka(dungeonData, row, col, directionConfig);
                }
            }
        }
    }
    return dungeonData;
}
function qaFinalizeDoors(dungeonData) {
    let b = {}, doors = dungeonData.door || []; // Preserve existing doors
    // Convert the `room` object into an array of its values
    Object.values(dungeonData.room).forEach((d) => {
        console.log('Processing room:', d); // Log the room object
        if (!d) {
            console.error('Room is undefined:', d);
            return;
        }
        if (!d.door) {
            console.error('Room.door is undefined:', d);
            return;
        }
        let g = d.id;
        Object.keys(types_1.Direction).forEach((c) => {
            console.log('Processing direction:', c); // Log the direction
            if (!d.door[c]) {
                d.door[c] = []; // Initialize as an empty array
            }
            let e = [];
            d.door[c].forEach((h) => {
                let k = [h.row, h.col].join();
                if (dungeonData.cell[h.row][h.col] & 6) {
                    if (b[k]) {
                        e.push(h);
                    }
                    else {
                        if (h.out_id !== undefined) { // Check if out_id is defined
                            const targetRoomId = h.out_id; // Directly use the number
                            if (targetRoomId && dungeonData.room[targetRoomId]) { // Validate targetRoomId
                                let t = dungeonData.room[targetRoomId]; // Get the room using the room ID
                                let z = invertDirection(c); // Get the inverted direction
                                h.out_id = targetRoomId; // Update h.out_id (now a number)
                                if (!t.door[z]) {
                                    t.door[z] = []; // Initialize as an empty array
                                }
                                t.door[z].push(h); // Add the door to the corresponding room
                            }
                            else {
                                console.warn(`Target room with ID ${targetRoomId} not found in a.room. Skipping door.`);
                            }
                        }
                        else {
                            //console.warn(`Invalid out_id for door at (${h.row}, ${h.col}). Skipping door.`);
                        }
                        e.push(h);
                        b[k] = true;
                    }
                }
            });
            e.length ? (d.door[c] = e) : (d.door[c] = []);
            doors = doors.concat(e);
        });
    });
    // Ensure that the `door` property is updated correctly
    dungeonData.door = doors;
    return dungeonData;
}
function removeDeadEnds(dungeonData) {
    // Look up the remove_deadends setting from the dropdown
    const removeDeadEndsSetting = $('#remove_deadends').val();
    // Look up the corresponding configuration from DungeonSettings
    const removeDeadEndsConfig = types_1.DungeonSettings.remove_deadends[removeDeadEndsSetting];
    // Ensure the configuration exists and has a valid pct value
    if (!removeDeadEndsConfig || typeof removeDeadEndsConfig.pct !== 'number') {
        console.error('Invalid remove_deadends configuration:', removeDeadEndsConfig);
        return dungeonData; // Return the original data if the configuration is invalid
    }
    // Assign the pct value to dungeonData.remove_pct
    dungeonData.remove_pct = removeDeadEndsConfig.pct;
    // Process the dungeon data to remove dead ends
    dungeonData = fa(dungeonData, dungeonData.remove_pct, types_1.DirectionConfig);
    // Detect and reroute dead-end corridors
    for (let i = 1; i < dungeonData.n_rows; i++) {
        for (let j = 1; j < dungeonData.n_cols; j++) {
            if (dungeonData.cell[i][j] & 4) { // Check if it's a corridor
                let connections = 0;
                if (dungeonData.cell[i - 1][j] & 4)
                    connections++; // North
                if (dungeonData.cell[i + 1][j] & 4)
                    connections++; // South
                if (dungeonData.cell[i][j - 1] & 4)
                    connections++; // West
                if (dungeonData.cell[i][j + 1] & 4)
                    connections++; // East
                if (connections === 1) { // Dead-end detected
                    const directions = [
                        { row: i - 1, col: j }, // North
                        { row: i + 1, col: j }, // South
                        { row: i, col: j - 1 }, // West
                        { row: i, col: j + 1 }, // East
                    ];
                    for (const dir of directions) {
                        if (dungeonData.cell[dir.row][dir.col] === 0) {
                            dungeonData.cell[dir.row][dir.col] = 4; // Extend corridor
                            break; // Stop after extending in one direction
                        }
                    }
                    if (dungeonData.cell[i][j] & 4 && connections === 1) {
                        dungeonData.cell[i][j] = 0; // Remove the dead-end corridor if no extension is possible
                    }
                }
            }
        }
    }
    if (dungeonData.remove_deadends) {
        if (dungeonData.corridor_layout === 'errant') {
            dungeonData.close_arcs = dungeonData.remove_pct;
        }
        else if (dungeonData.corridor_layout === 'straight') {
            dungeonData.close_arcs = dungeonData.remove_pct;
        }
    }
    if (dungeonData.close_arcs) {
        dungeonData = ha(dungeonData);
    }
    dungeonData = qaFinalizeDoors(dungeonData);
    for (let l = 0; l <= dungeonData.n_rows; l++) {
        for (let q = 0; q <= dungeonData.n_cols; q++) {
            if (dungeonData.cell[l][q] & 1) {
                dungeonData.cell[l][q] = 0;
            }
        }
    }
    return dungeonData;
}
/**
 * Retrieves a color from the palette based on the given key.
 * @param palette - The palette object containing color mappings.
 * @param key - The key for the color to retrieve.
 * @returns The color associated with the key, or a default color if not found.
 */
function getPaletteColor(palette, key) {
    // Check if the key exists directly in the palette
    if (palette[key]) {
        return palette[key];
    }
    // Use fallback mechanism (if any)
    const fallbackKey = types_1.Ea[key];
    if (fallbackKey && palette[fallbackKey]) {
        return palette[fallbackKey];
    }
    // Default to black if no color is found
    return '#000000';
}
// Draw labels (room IDs)
function drawLabels(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    const labelColor = palette.label || palette.fill || '#000000';
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            const labelCode = (dungeonData.cell[row][col] >> 24) & 255;
            if (labelCode) {
                const labelChar = String.fromCharCode(labelCode);
                const x = col * cell_size + cell_size / 2;
                const y = row * cell_size + cell_size / 2 + 1;
                (0, canvas_1.draw_string)(canvasContext, labelChar, x, y, font, labelColor);
            }
        }
    }
    console.warn("Finished drawing labels.");
}
/**
 * Draws the grid on the dungeon map.
 * @param dungeonData - The dungeon data.
 * @param renderSettings - The rendering settings.
 * @param canvasContext - The canvas rendering context.
 */
function drawGrid(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    // Draw the grid
    const gridColor = palette.grid || palette.open_grid || '#cccccc';
    if (gridColor) {
        for (let x = 0; x <= max_x; x += cell_size) {
            (0, canvas_1.draw_line)(canvasContext, x, 0, x, max_y, gridColor);
        }
        for (let y = 0; y <= max_y; y += cell_size) {
            (0, canvas_1.draw_line)(canvasContext, 0, y, max_x, y, gridColor);
        }
    }
}
/**
 * Draws the rooms on the dungeon map.
 * @param dungeonData - The dungeon data.
 * @param renderSettings - The rendering settings.
 * @param canvasContext - The canvas rendering context.
 */
function drawRooms(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    // Draw the base layer (rooms and corridors)
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            if (dungeonData.cell[row][col] & 6) { // Check if it's a room or corridor
                const x = col * cell_size;
                const y = row * cell_size;
                canvasContext.drawImage(base_layer, x, y, cell_size, cell_size, x, y, cell_size, cell_size);
            }
        }
    }
}
/**
 * Draws wallshading and walls on the dungeon map.
 * @param dungeonData - The dungeon data.
 * @param renderSettings - The rendering settings.
 * @param canvasContext - The canvas rendering context.
 */
function drawWallsAndShading(dungeonData, renderSettings, canvasContext) {
    var _a, _b;
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    const wallColor = palette.wall || palette.fill || '#000000';
    const wallShadingColor = palette.wall_shading || palette.wall || '#666666';
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            if (dungeonData.cell[row][col] & 6) { // Check if it's a wall or room
                const x = col * cell_size;
                const y = row * cell_size;
                // Draw wall shading
                if (wallShadingColor) {
                    for (let i = x; i <= x + cell_size; i++) {
                        for (let j = y; j <= y + cell_size; j++) {
                            if ((i + j) % 2 !== 0) {
                                (0, canvas_1.set_pixel)(canvasContext, i, j, wallShadingColor);
                            }
                        }
                    }
                }
                // Draw walls
                if (wallColor) {
                    if (!(((_a = dungeonData.cell[row - 1]) === null || _a === void 0 ? void 0 : _a[col]) & 6)) { // North wall
                        (0, canvas_1.draw_line)(canvasContext, x, y, x + cell_size, y, wallColor);
                    }
                    if (!(dungeonData.cell[row][col - 1] & 6)) { // West wall
                        (0, canvas_1.draw_line)(canvasContext, x, y, x, y + cell_size, wallColor);
                    }
                    if (!(dungeonData.cell[row][col + 1] & 6)) { // East wall
                        (0, canvas_1.draw_line)(canvasContext, x + cell_size, y, x + cell_size, y + cell_size, wallColor);
                    }
                    if (!(((_b = dungeonData.cell[row + 1]) === null || _b === void 0 ? void 0 : _b[col]) & 6)) { // South wall
                        (0, canvas_1.draw_line)(canvasContext, x, y + cell_size, x + cell_size, y + cell_size, wallColor);
                    }
                }
            }
        }
    }
}
// Draw doors
/**
 * Draws the doors on the dungeon map.
 * @param dungeonData - The dungeon data.
 * @param renderSettings - The rendering settings.
 * @param canvasContext - The canvas rendering context.
 */
function drawDoors(dungeonData, renderSettings, canvasContext) {
    const cellSize = renderSettings.cell_size;
    const doorColor = renderSettings.palette.door || '#333333';
    // Check if dungeonData.door is defined
    if (!dungeonData.door) {
        return; // Exit the function if there are no doors
    }
    // Iterate over all doors and draw them
    dungeonData.door.forEach((door) => {
        const x = door.col * cellSize;
        const y = door.row * cellSize;
        // Draw the door based on its type
        switch (door.key) {
            case 'arch':
                // Archway: Fill the rectangle
                (0, canvas_1.fill_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                break;
            case 'open':
                // Open door: Stroke the rectangle
                (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                break;
            case 'lock':
                // Locked door: Stroke the rectangle and add a lock symbol
                (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                drawLockSymbol(canvasContext, x, y, cellSize, doorColor);
                break;
            case 'trap':
                // Trapped door: Stroke the rectangle and add a trap symbol
                (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                drawTrapSymbol(canvasContext, x, y, cellSize, doorColor);
                break;
            case 'secret':
                // Secret door: Stroke the rectangle and add a secret effect
                (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                drawSecretEffect(canvasContext, x, y, cellSize, doorColor);
                break;
            case 'portc':
                // Portcullis: Draw vertical bars
                drawPortcullis(canvasContext, x, y, cellSize, doorColor);
                break;
            default:
                console.warn(`Unknown door type: ${door.key}`);
                break;
        }
    });
}
// Draw stairs
/**
 * Draws the stairs on the dungeon map.
 * @param dungeonData - The dungeon data.
 * @param renderSettings - The rendering settings.
 * @param canvasContext - The canvas rendering context.
 */
function drawStairs(dungeonData, renderSettings, canvasContext) {
    if (dungeonData.stair) {
        const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
        const stairColor = palette.stair || palette.wall || '#666666';
        for (const stair of dungeonData.stair) {
            const x = stair.col * cell_size;
            const y = stair.row * cell_size;
            if (stair.key === 'up') {
                (0, canvas_1.draw_line)(canvasContext, x + cell_size / 2, y, x + cell_size / 2, y + cell_size, stairColor);
            }
            else if (stair.key === 'down') {
                (0, canvas_1.draw_line)(canvasContext, x, y + cell_size / 2, x + cell_size, y + cell_size / 2, stairColor);
            }
        }
    }
}
function drawLockSymbol(canvasContext, x, y, cellSize, color) {
    const lockSize = Math.floor(cellSize / 4);
    const lockX = x + Math.floor(cellSize / 2) - Math.floor(lockSize / 2);
    const lockY = y + Math.floor(cellSize / 2) - Math.floor(lockSize / 2);
    // Draw the lock body
    (0, canvas_1.fill_rect)(canvasContext, lockX, lockY, lockSize, lockSize, color);
    // Draw the lock bolt
    const boltSize = Math.floor(lockSize / 2);
    const boltX = lockX + Math.floor(lockSize / 4);
    const boltY = lockY - Math.floor(boltSize / 2);
    (0, canvas_1.fill_rect)(canvasContext, boltX, boltY, boltSize, boltSize, color);
}
function drawTrapSymbol(canvasContext, x, y, cellSize, color) {
    const trapSize = Math.floor(cellSize / 4);
    const trapX = x + Math.floor(cellSize / 2) - Math.floor(trapSize / 2);
    const trapY = y + Math.floor(cellSize / 2) - Math.floor(trapSize / 2);
    // Draw the trap base
    (0, canvas_1.fill_rect)(canvasContext, trapX, trapY, trapSize, trapSize, color);
    // Draw the trap spikes
    const spikeSize = Math.floor(trapSize / 4);
    const spikeX = trapX + Math.floor(trapSize / 2) - Math.floor(spikeSize / 2);
    const spikeY = trapY - spikeSize;
    (0, canvas_1.fill_rect)(canvasContext, spikeX, spikeY, spikeSize, spikeSize, color);
}
function drawSecretEffect(canvasContext, x, y, cellSize, color) {
    canvasContext.strokeStyle = color;
    canvasContext.lineWidth = 2;
    canvasContext.setLineDash([5, 5]); // Dashed line
    canvasContext.beginPath();
    canvasContext.rect(x, y, cellSize, cellSize);
    canvasContext.stroke();
    canvasContext.setLineDash([]); // Reset line dash
}
function drawPortcullis(canvasContext, x, y, cellSize, color) {
    const barWidth = Math.floor(cellSize / 10);
    const barSpacing = Math.floor(cellSize / 5);
    canvasContext.fillStyle = color;
    for (let i = 0; i < 5; i++) {
        const barX = x + i * barSpacing;
        canvasContext.fillRect(barX, y, barWidth, cellSize);
    }
}
// Function to calculate parameters for staircases
function calculateStaircaseParameters(cellSize) {
    const len = 2 * cellSize;
    const side = Math.floor(cellSize / 2);
    const tread = Math.floor(cellSize / 20) + 2;
    const down = {};
    for (let b = 0; b < len; b += tread) {
        down[b] = Math.floor(b / len * side);
    }
    return { cell: cellSize, len, side, tread, down };
}
// Function to draw horizontal stair lines
function drawHorizontalStairLines(stairs, color, context) {
    if (stairs.xc) {
        const start = stairs.xc - stairs.side;
        const end = stairs.xc + stairs.side;
        stairs.list.forEach((position) => {
            (0, canvas_1.draw_line)(context, start, position, end, position, color);
        });
    }
    else {
        const start = stairs.yc - stairs.side;
        const end = stairs.yc + stairs.side;
        stairs.list.forEach((position) => {
            (0, canvas_1.draw_line)(context, position, start, position, end, color);
        });
    }
}
// Function to draw vertical stair lines
function drawVerticalStairLines(stairs, color, context) {
    if (stairs.xc) {
        const position = stairs.xc;
        stairs.list.forEach((step) => {
            const distance = Math.abs(step - stairs.yc);
            (0, canvas_1.draw_line)(context, position - stairs.down[distance], step, position + stairs.down[distance], step, color);
        });
    }
    else if (stairs.yc) {
        const position = stairs.yc;
        stairs.list.forEach((step) => {
            const distance = Math.abs(step - stairs.xc);
            (0, canvas_1.draw_line)(context, position - stairs.down[distance], step, position + stairs.down[distance], step, color);
        });
    }
}
/**
 * Renders the entire dungeon on the canvas.
 * @param dungeonData - The dungeon data.
 * @param renderSettings - The rendering settings.
 * @param canvasContext - The canvas rendering context.
 */
function renderDungeon(dungeonData, renderSettings, canvasContext) {
    console.log("Rendering dungeon...");
    // // Clear the canvas
    // canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    // 1 Ensure the base layer is a canvas
    if (renderSettings.base_layer instanceof HTMLCanvasElement) {
        //  Draw the background (black fill)
        const fillColor = palette.fill || palette.black || '#000000';
        (0, canvas_1.fill_rect)(canvasContext, 0, 0, max_x, max_y, fillColor);
    }
    // 2 . Draw base layer (rooms and corridors)
    drawRooms(dungeonData, renderSettings, canvasContext);
    // 3. Draw the gridlines
    drawGrid(dungeonData, renderSettings, canvasContext);
    // 4. Draw walls and shading
    drawWallsAndShading(dungeonData, renderSettings, canvasContext);
    // 5. Draw doors
    drawDoors(dungeonData, renderSettings, canvasContext);
    // 6. Draw labels (room IDs)
    drawLabels(dungeonData, renderSettings, canvasContext);
    // 7. Draw stairs
    drawStairs(dungeonData, renderSettings, canvasContext);
    console.log("Dungeon rendering complete.");
}
// Main entry point
function generateNewDungeon() {
    var dungeonData = undefined;
    console.log("Starting to generate a new dungeon");
    let rndDungName = (0, generator_1.generate_text)("Dungeon Name");
    console.log("Generated dungeon name:", rndDungName);
    $("#dungeon_name").val(rndDungName); // Use .val() instead of .text() for input fields
    return updateAndGenerateDungeon();
}
function updateAndGenerateDungeon() {
    var _a, _b;
    console.log("update and generate dungeon");
    // Log the selected values for all settings
    const selectedSettings = {
        map_style: $("#map_style").val(),
        grid: $("#grid").val(),
        dungeon_layout: $("#dungeon_layout").val(),
        dungeon_size: $("#dungeon_size").val(),
        add_stairs: $("#add_stairs").val(),
        room_layout: $("#room_layout").val(),
        room_size: $("#room_size").val(),
        doors: $("#doors").val(),
        corridor_layout: $("#corridor_layout").val(),
        remove_deadends: $("#remove_deadends").val(),
    };
    console.log("Selected Dungeon Settings before generation:", selectedSettings);
    // Generate dungeon configuration
    let dungeonData = generateDungeonDataConfig();
    console.log("Dungeon Config after generation:", dungeonData);
    // Calculate dungeon dimensions
    dungeonData = calculateDungeonDimensions(dungeonData);
    console.log("DungeonData after calculating dimensions:", dungeonData);
    // Initialize room and layout configurations (from applyDungeonLayout)
    const roomConfig = lookupAtIndex("room_size", dungeonData.room_size);
    const layoutConfig = lookupAtIndex("room_layout", dungeonData.room_layout);
    dungeonData.huge_rooms = roomConfig.huge;
    dungeonData.complex_rooms = layoutConfig.complex;
    dungeonData.n_rooms = (_a = dungeonData.n_rooms) !== null && _a !== void 0 ? _a : 0;
    dungeonData.room = (_b = dungeonData.room) !== null && _b !== void 0 ? _b : [];
    // Generate rooms based on the layout (from applyDungeonLayout)
    if (dungeonData.room_layout === "dense") {
        dungeonData = generateDenseRooms(dungeonData);
    }
    else {
        dungeonData = generateScatteredRooms(dungeonData);
    }
    //printDungeon(dungeonData); // After generating rooms
    // generate Doors
    dungeonData = generateDoors(dungeonData);
    // Assertions
    Object.values(dungeonData.room).forEach(room => {
        if (room.door.north.length === 0 && room.door.south.length === 0 && room.door.east.length === 0 && room.door.west.length === 0)
            console.error("Room has no doors");
    });
    console.log("Place doors:", dungeonData); // place doors
    //printDungeon(dungeonData); // after placing doors
    // Generate corridors
    dungeonData = generateCorridors(dungeonData);
    console.log("Dungeon Config after generating corridors:", dungeonData);
    printDungeon(dungeonData); // After generating corridors
    // Label rooms with their IDs (from applyDungeonLayout)
    dungeonData = labelRooms(dungeonData);
    // Generate stairs
    dungeonData = generateStairs(dungeonData);
    console.log("Dungeon Config after generating stairs:", dungeonData);
    printDungeon(dungeonData); // after placing stairs
    // Remove dead ends
    dungeonData = removeDeadEnds(dungeonData);
    console.log("Dungeon Config after removing dead ends:", dungeonData);
    printDungeon(dungeonData); // after remove deadends
    // Finalize the dungeon layout (from applyDungeonLayout)
    dungeonData = finalizeDungeonLayout(dungeonData);
    console.log("Dungeon Config after finalizing layout:", dungeonData);
    printDungeon(dungeonData); // after finalizing
    // Generate render settings
    const renderSettings = generateRenderSettings(dungeonData);
    //console.log("Render settings generated:", renderSettings);
    // Create or retrieve the canvas element
    let canvasElement = document.getElementById('map');
    if (!canvasElement) {
        // If the canvas element doesn't exist, create it
        canvasElement = document.createElement('canvas');
        canvasElement.id = 'map';
        document.body.appendChild(canvasElement); // Add the canvas to the DOM
    }
    // Set the canvas dimensions based on render settings
    canvasElement.width = renderSettings.width;
    canvasElement.height = renderSettings.height;
    // Get the 2D rendering context from the canvas element
    const canvasContext = canvasElement.getContext('2d');
    if (!canvasContext) {
        throw new Error("Failed to get 2D rendering context from canvas.");
    }
    // Call renderDungeon with all required arguments
    renderDungeon(dungeonData, renderSettings, canvasContext);
    console.log('Render the dungeon should be complete now');
    return dungeonData;
}
function generateRenderSettings(dungeonData) {
    const dcCellSize = dungeonData.cell_size || 18; // Use a default value in case there isn't one
    const mapStyle = dungeonData.map_style || 'standard';
    // Create the render settings object
    const renderSettings = {
        mapStyle: mapStyle, // Map style (e.g., 'standard', 'classic', 'graph')
        gridStyle: dungeonData.grid || 'square', // Grid style (e.g., 'none', 'square', 'hex', 'vex')
        cellSize: dcCellSize, // Cell size in pixels
        width: (dungeonData.n_cols + 1) * dcCellSize + 1, // Total width
        height: (dungeonData.n_rows + 1) * dcCellSize + 1, // Total height
        max_x: (dungeonData.n_cols + 1) * dcCellSize, // Maximum X coordinate
        max_y: (dungeonData.n_rows + 1) * dcCellSize, // Maximum Y coordinate
        font: Math.floor(0.75 * dcCellSize).toString() + 'px sans-serif', // Font settings
        cell_size: dcCellSize, // Cell size in pixels (required by DungeonRenderSettings)
        palette: {}, // Palette settings (required by DungeonRenderSettings)
        grid: {}, // Grid settings (required by DungeonRenderSettings)
        base_layer: document.createElement('canvas'), // Create a canvas element for the base layer
    };
    // Set the canvas dimensions
    renderSettings.base_layer.width = renderSettings.width;
    renderSettings.base_layer.height = renderSettings.height;
    // Debugging: Log the render settings
    console.log("Render settings generated:", renderSettings);
    return renderSettings;
}
function saveDungeon() {
    let savDungName = $("#dungeon_name").val();
    (0, canvas_1.save_canvas)($("map"), `${savDungName}.png`);
}
// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Populate the dropdowns with options from TerrainSettingsConfig
    Object.keys(types_1.TerrainSettingsConfig).forEach((a) => {
        const topLevelKey = a; // Assert the top-level key type
        Object.keys(types_1.TerrainSettingsConfig[topLevelKey]).forEach((b) => {
            const nestedKey = b; // Assert the nested key type
            const f = types_1.TerrainSettingsConfig[topLevelKey][nestedKey].title; // Access the title property
            const d = $(a);
            if ($(b).length > 0) {
                const option = $('<option value="' + b + '">' + f + '</option>');
                d.append(option);
            }
        });
    });
    // Set default values for settings
    for (const key in types_1.DefaultDungeonSettings) {
        if (types_1.DefaultDungeonSettings.hasOwnProperty(key)) {
            const typedKey = key;
            $(`#${typedKey}`).val(types_1.DefaultDungeonSettings[typedKey]);
        }
    }
    // Log the default values
    console.log("Default Dungeon Settings:", types_1.DefaultDungeonSettings);
    // Generate the initial dungeon
    generateNewDungeon();
    // Event listeners for dungeon name input and "New" button
    $("#dungeon_name").on("change", () => {
        console.log("Dungeon name changed:", $("#dungeon_name").val());
        updateAndGenerateDungeon();
    });
    $("#new_name").on("click", () => {
        console.log("New name button clicked");
        resetRoomIdCounter(); // start from 1 for each new generation of rooms, affects labeling
        generateNewDungeon();
    });
    // Event listeners for other settings to trigger dungeon regeneration
    $("#map_style").on("change", () => {
        const mapStyle = $("#map_style").val();
        console.log("Map style changed:", mapStyle);
        // Update the dungeonData with the new map_style
        // let dungeonData = generateDungeonDataConfig(); // figure out how to get original dungeonData instead
        // Regenerate and render the dungeon
        updateAndGenerateDungeon();
    });
    $("#grid").on("change", () => {
        console.log("Grid changed:", $("#grid").val());
        updateAndGenerateDungeon();
    });
    $("#dungeon_layout").on("change", () => {
        console.log("Dungeon layout changed:", $("#dungeon_layout").val());
        updateAndGenerateDungeon();
    });
    $("#dungeon_size").on("change", () => {
        console.log("Dungeon size changed:", $("#dungeon_size").val());
        updateAndGenerateDungeon();
    });
    $("#add_stairs").on("change", () => {
        console.log("Add stairs changed:", $("#add_stairs").val());
        updateAndGenerateDungeon();
    });
    $("#room_layout").on("change", () => {
        console.log("Room layout changed:", $("#room_layout").val());
        updateAndGenerateDungeon();
    });
    $("#room_size").on("change", () => {
        console.log("Room size changed:", $("#room_size").val());
        updateAndGenerateDungeon();
    });
    $("#doors").on("change", () => {
        console.log("Doors changed:", $("#doors").val());
        updateAndGenerateDungeon();
    });
    $("#corridor_layout").on("change", () => {
        console.log("Corridor layout changed:", $("#corridor_layout").val());
        updateAndGenerateDungeon();
    });
    $("#remove_deadends").on("change", () => {
        console.log("Remove dead ends changed:", $("#remove_deadends").val());
        updateAndGenerateDungeon();
    });
    // Event listeners for saving and printing the dungeon
    $("#save_map").on("click", saveDungeon);
    $("#print_map").on("click", () => {
        window.print();
    });
});
let roomIdCounter = 0; // Add a global counter for room IDs
// Function to reset the room ID counter
function resetRoomIdCounter() {
    roomIdCounter = 0;
}
function createRoom(a, b) {
    if (a.n_rooms === 999) {
        return a;
    }
    const f = b || {};
    let size = b.size || a.room_size;
    console.log(`Creating room with size: ${size}`);
    const d = types_1.DungeonSettings.room_size[size];
    if (!d) {
        console.error(`Room size configuration not found for size: ${size}`);
        return a;
    }
    const g = d.size || 2;
    const width = d.radix || 5;
    if (!('height' in b)) {
        if ('i' in b) {
            let c = a.n_i - g - b.i;
            if (c < 0)
                c = 0;
            b.height = Math.floor(Math.random() * (c < width ? c : width)) + g;
        }
        else {
            b.height = Math.floor(Math.random() * width) + g;
        }
    }
    if (!('width' in b)) {
        if ('j' in b) {
            let c = a.n_j - g - b.j;
            if (c < 0)
                c = 0;
            b.width = Math.floor(Math.random() * (c < width ? c : width)) + g;
        }
        else {
            b.width = Math.floor(Math.random() * width) + g;
        }
    }
    if (!('i' in b)) {
        b.i = Math.floor(Math.random() * (a.n_i - b.height));
    }
    if (!('j' in b)) {
        b.j = Math.floor(Math.random() * (a.n_j - b.width));
    }
    const { i, j, height, width: roomWidth } = b;
    const bStart = 2 * i + 1;
    const gStart = 2 * j + 1;
    const dEnd = 2 * (i + height) - 1;
    const cEnd = 2 * (j + roomWidth) - 1;
    if (bStart < 1 || dEnd > a.max_row || gStart < 1 || cEnd > a.max_col) {
        return a;
    }
    let k = {};
    for (let e = bStart; e <= dEnd; e++) {
        for (let h = gStart; h <= cEnd; h++) {
            if (a.cell[e][h] & 1) {
                k = { blocked: 1 };
                break;
            }
            if (a.cell[e][h] & 2) {
                const roomId = (a.cell[e][h] & 65472) >> 6;
                if (!('blocked' in k)) { // Type guard: Ensure k is { [key: number]: number }
                    k[roomId] = (k[roomId] || 0) + 1; // No more TypeScript error
                }
            }
        }
    }
    if ('blocked' in k && k.blocked) {
        return a;
    }
    const keys = Object.keys(k);
    let roomId;
    if (keys.length === 0) {
        roomId = a.n_rooms + 1; // Room IDs start from 1
        a.n_rooms = roomId; // Increment n_rooms
    }
    else if (keys.length === 1) {
        if (a.complex_rooms) {
            if (parseInt(keys[0], 10) !== b.complex_id) { // Fix: Convert keys[0] to a number
                return a;
            }
        }
        else {
            return a;
        }
        roomId = parseInt(keys[0], 10);
    }
    else {
        return a;
    }
    if (roomId <= 0) {
        console.error(`Invalid roomId: ${roomId}. Defaulting to 1.`);
        roomId = 1;
    }
    for (let row = bStart; row <= dEnd; row++) {
        for (let col = gStart; col <= cEnd; col++) {
            a.cell[row][col] = 2 | (roomId << 6); // Correct encoding for room floor
            console.log(`Room ID: ${roomId}, Encoded Value: ${a.cell[row][col]}`); // Debugging
        }
    }
    const newRoom = {
        id: roomId,
        size: size,
        row: bStart,
        col: gStart,
        north: bStart,
        south: dEnd,
        west: gStart,
        east: cEnd,
        height: 10 * (dEnd - bStart + 1),
        width: 10 * (cEnd - gStart + 1),
        door: {
            north: [],
            south: [],
            west: [],
            east: []
        },
        complex: [] // Initialize complex as an empty array
    };
    // Add validation to ensure walls do not overlap with corridors or other rooms when adding them.
    for (let e = bStart - 1; e <= dEnd + 1; e++) {
        if (!(a.cell[e][gStart - 1] & 34) && !(a.cell[e][gStart - 1] & 4))
            a.cell[e][gStart - 1] |= 16; // West wall
        if (!(a.cell[e][cEnd + 1] & 34) && !(a.cell[e][cEnd + 1] & 4))
            a.cell[e][cEnd + 1] |= 16; // East wall
    }
    for (let h = gStart - 1; h <= cEnd + 1; h++) {
        if (!(a.cell[bStart - 1][h] & 34) && !(a.cell[bStart - 1][h] & 4))
            a.cell[bStart - 1][h] |= 16; // North wall
        if (!(a.cell[dEnd + 1][h] & 34) && !(a.cell[dEnd + 1][h] & 4))
            a.cell[dEnd + 1][h] |= 16; // South wall
    }
    if (a.room[roomId]) {
        if (a.room[roomId].complex) {
            a.room[roomId].complex.push(newRoom);
        }
        else {
            a.room[roomId] = Object.assign(Object.assign({}, a.room[roomId]), { complex: [a.room[roomId], newRoom] });
        }
    }
    else {
        a.room[roomId] = newRoom; // add the new room
    }
    // the room numbers are 1-whatever but they are encoded when you look at them in a.cell later
    // Room ID	Binary Representation	Encoded Value
    // 1	00000001	`2	(1 << 6) = 66`
    // 2	00000010	`2	(2 << 6) = 130`
    // 3	00000011	`2	(3 << 6) = 194`
    // 4	00000100	`2	(4 << 6) = 258`
    // 5	00000101	`2	(5 << 6) = 322`
    console.log(`Creating room with ID: ${roomId}`);
    console.log("New room object:", newRoom);
    console.log("Updated a.room:", a.room);
    return a;
}
function attemptDoorPlacement(a, b) {
    const doors = [];
    // Handle complex rooms
    if (b.complex && Array.isArray(b.complex)) {
        b.complex.forEach(subRoom => {
            const subRoomDoors = attemptDoorPlacement(a, subRoom);
            if (subRoomDoors.length > 0) {
                doors.push(...subRoomDoors);
            }
        });
    }
    const { north, south, west, east } = b;
    // Check each side of the room for adjacent rooms
    if (north >= 3) {
        for (let col = west; col <= east; col += 2) {
            const door = calculateDoor(a, b, north, col, 'north');
            if (door)
                doors.push(door);
        }
    }
    if (south <= a.n_rows - 3) {
        for (let col = west; col <= east; col += 2) {
            const door = calculateDoor(a, b, south, col, 'south');
            if (door)
                doors.push(door);
        }
    }
    if (west >= 3) {
        for (let row = north; row <= south; row += 2) {
            const door = calculateDoor(a, b, row, west, 'west');
            if (door)
                doors.push(door);
        }
    }
    if (east <= a.n_cols - 3) {
        for (let row = north; row <= south; row += 2) {
            const door = calculateDoor(a, b, row, east, 'east');
            if (door)
                doors.push(door);
        }
    }
    return doors;
}
function calculateDoor(a, b, row, col, dir) {
    const doorRow = row + types_1.P[dir];
    const doorCol = col + types_1.M[dir];
    const cellValue = a.cell[doorRow][doorCol];
    // Check if the cell is a wall and not already occupied
    if (!(cellValue & 16) || cellValue & 4128769) {
        return null;
    }
    // Check if the adjacent cell is blocked
    const adjacentCell = a.cell[doorRow + types_1.P[dir]][doorCol + types_1.M[dir]];
    if (adjacentCell & 1) {
        return null;
    }
    // Handle Out-of-Bounds Cells
    if (doorRow + types_1.P[dir] < 0 || doorRow + types_1.P[dir] > a.n_rows ||
        doorCol + types_1.M[dir] < 0 || doorCol + types_1.M[dir] > a.n_cols) {
        return null;
    }
    // Check if the door connects to itself
    const adjacentRoomId = (adjacentCell & 2) ? (adjacentCell & 65472) >> 6 : null;
    if (adjacentRoomId === b.id) {
        return null; // Reject if the door connects to the same room
    }
    // Assign out_id based on the adjacent cell
    const myout = (adjacentCell & 2) ? (adjacentCell & 65472) >> 6 : undefined; // Use undefined for empty spaces
    return {
        sill_r: row,
        sill_c: col,
        dir: dir,
        door_r: doorRow,
        door_c: doorCol,
        out_id: myout, // outid or undefined if empty
    };
}
function calculateRoomDimensions(a, b) {
    b = b || a.room_size || 'medium';
    const size = types_1.DungeonSettings.room_size[b]; // Replaced J with DungeonSettings from types.ts
    let totalRooms = 2 * Math.floor(a.n_cols * a.n_rows / ((size.size || 2) + (size.radix || 5) + 1));
    if (a.room_layout === 'sparse') {
        totalRooms /= 13;
    }
    return totalRooms;
}
function extractDoorPositions(dungeonData, room) {
    const doorPositions = [];
    console.log("Room passed to extractDoorPositions:", room);
    // Iterate through the doors of the room
    for (const direction of Object.keys(room.door)) {
        for (const door of room.door[direction]) {
            doorPositions.push({
                door_r: door.row,
                door_c: door.col,
                out_id: door.out_id,
            });
        }
    }
    return doorPositions;
}
/**
 * Generates new rooms for the dungeon based on the given configuration.
 * @param dungeonData - The current dungeon configuration.
 * @param roomConfig - The configuration for the rooms to be generated.
 * @returns The updated dungeon configuration with new rooms.
 */
function generateNewRooms(dungeonData, roomConfig) {
    const doorConnections = {};
    // Generate rooms using a loop instead of recursion
    let roomCount = ba(dungeonData); // Determine the number of rooms to generate
    for (let i = 0; i < roomCount; i++) {
        let validPlacement = false;
        let attempts = 0;
        while (!validPlacement && attempts < 100) {
            const newRoomConfig = {
                size: roomConfig.size || 'medium', // Default to 'medium' if size is not provided
                i: (0, prng_1.random)(dungeonData.n_i), // Random row position
                j: (0, prng_1.random)(dungeonData.n_j), // Random column position
            };
            // Calculate room dimensions based on size
            const roomSize = lookupAtIndex("room_size", newRoomConfig.size);
            const roomHeight = roomSize.size || 2; // Default height if not specified
            const roomWidth = roomSize.radix || 5; // Default width if not specified
            // Check if the room fits within the dungeon boundaries
            if (newRoomConfig.i + roomHeight > dungeonData.n_i || newRoomConfig.j + roomWidth > dungeonData.n_j) {
                attempts++;
                continue; // Skip this placement if the room doesn't fit
            }
            // Check for overlaps with existing rooms or corridors
            let overlap = false;
            for (let row = newRoomConfig.i; row < newRoomConfig.i + roomHeight; row++) {
                for (let col = newRoomConfig.j; col < newRoomConfig.j + roomWidth; col++) {
                    if (dungeonData.cell[row][col] & 2) { // Check if the cell is already part of a room
                        overlap = true;
                        break;
                    }
                }
                if (overlap)
                    break;
            }
            if (!overlap) {
                validPlacement = true;
                dungeonData = createRoom(dungeonData, newRoomConfig);
                console.log(`Created room at (${newRoomConfig.i}, ${newRoomConfig.j}) with size: ${newRoomConfig.size}`);
            }
            attempts++;
        }
    }
    // Handle huge rooms if necessary
    if (dungeonData.huge_rooms) {
        let hugeRoomCount = ba(dungeonData, 'medium'); // Generate medium-sized rooms
        for (let i = 0; i < hugeRoomCount; i++) {
            dungeonData = createRoom(dungeonData, { size: 'medium' }); // Pass size: 'medium' to createRoom
        }
    }
    // Iterate over each room in the dungeon using Object.keys
    Object.entries(dungeonData.room).forEach(([roomId, room]) => {
        const doorPositions = extractDoorPositions(dungeonData, room);
        if (!doorPositions.length)
            return;
        const roomArea = Math.sqrt(((room.east - room.west) / 2 + 1) * ((room.south - room.north) / 2 + 1));
        const doorCount = roomArea + (0, prng_1.random)(roomArea);
        for (let i = 0; i < doorCount; i++) {
            const door = doorPositions.splice((0, prng_1.random)(doorPositions.length), 1)[0];
            if (!door)
                break;
            const doorWithAllProperties = {
                doorRowIndex: door.door_r,
                doorColIndex: door.door_c,
                sill_r: door.door_r,
                sill_c: door.door_c,
                dir: "north",
                out_id: door.out_id,
                door_type: dungeonData.door_type || 'Standard',
            };
            if (!(dungeonData.cell[doorWithAllProperties.doorRowIndex][doorWithAllProperties.doorColIndex] & 4)) /* only placed in corridors */ {
                if (doorWithAllProperties.out_id) {
                    const connectionKey = [room.id, doorWithAllProperties.out_id].sort().join(",");
                    if (!doorConnections[connectionKey]) {
                        dungeonData = da(dungeonData, room, doorWithAllProperties);
                        doorConnections[connectionKey] = 1;
                    }
                }
                else {
                    dungeonData = da(dungeonData, room, doorWithAllProperties);
                }
            }
        }
    });
    return dungeonData;
}
class Trace {
    constructor() {
        this.var = {};
        this.exclude = {};
    }
    setVariable(name, value) {
        this.var[name] = value;
    }
    getVariable(name) {
        return this.var[name];
    }
}
/**
 * Places a door in the dungeon.
 * @param dungeonData - The current dungeon configuration.
 * @param room - The room where the door is being placed.
 * @param doorConfig - The configuration for the door.
 * @returns The updated dungeon configuration with the new door.
 */
function da(dungeonData, room, doorConfig) {
    console.log("Adding door to room:", room.id, doorConfig);
    // Validate the door configuration
    if (!doorConfig || !doorConfig.door_type) {
        console.error("Invalid doorConfig:", doorConfig);
        return dungeonData;
    }
    // Check for invalid out_id (0 is not a valid room ID)
    if (doorConfig.out_id === 0) {
        console.warn(`Invalid out_id (0) for door at (${doorConfig.doorRowIndex}, ${doorConfig.doorColIndex}).`);
        return dungeonData;
    }
    // Set the default door type if not provided
    dungeonData.door_type = dungeonData.door_type || 'standard';
    // Retrieve the door type configuration from DungeonSettings
    const doorTypeConfig = types_1.DungeonSettings.doors[dungeonData.door_type];
    if (!doorTypeConfig || !doorTypeConfig.table) {
        console.error("Invalid door type configuration:", doorTypeConfig);
        return dungeonData;
    }
    // Randomly select a door type from the configuration table
    const selectedDoor = (0, generator_1.select_from_table)(doorTypeConfig.table);
    const doorEntry = { row: doorConfig.doorRowIndex, col: doorConfig.doorColIndex, key: '', type: '' };
    // Map door flags to their corresponding types
    const doorTypes = {
        65536: { key: 'arch', type: 'Archway' },
        131072: { key: 'open', type: 'Unlocked Door' },
        262144: { key: 'lock', type: 'Locked Door' },
        524288: { key: 'trap', type: 'Trapped Door' },
        1048576: { key: 'secret', type: 'Secret Door' },
        2097152: { key: 'portc', type: 'Portcullis' }
    };
    // Determine the door type based on the selected flag
    const doorType = doorTypes[selectedDoor];
    if (!(dungeonData.cell[doorConfig.doorRowIndex][doorConfig.doorColIndex] & 4128769) && doorType) {
        // Mark the cell as a door by setting the appropriate flag
        dungeonData.cell[doorConfig.doorRowIndex][doorConfig.doorColIndex] |= selectedDoor;
        doorEntry.key = doorType.key;
        doorEntry.type = doorType.type;
    }
    else {
        //console.error("Invalid door placement: cell already occupied or invalid door type.");
        return dungeonData;
    }
    console.log("1 " + doorEntry);
    // If the door connects to another room, set the out_id
    if (doorConfig.out_id !== undefined) {
        doorEntry.out_id = doorConfig.out_id;
    }
    // Ensure the direction key exists in the room.door object
    if (!room.door[doorConfig.dir]) {
        room.door[doorConfig.dir] = [];
    }
    // Add the door to the room's door list for the specified direction
    room.door[doorConfig.dir].push(doorEntry);
    room.last_door = doorEntry;
    // Explicitly update the room in dungeonData.room
    dungeonData.room[room.id] = room;
    // Initialize the dungeonData.door array if it doesn't exist
    if (!dungeonData.door) {
        dungeonData.door = [];
    }
    // Add the door to the global list of doors in the dungeon
    dungeonData.door.push(doorEntry);
    // Log the door placement details for debugging
    console.log(`Placed door at (${doorConfig.doorRowIndex}, ${doorConfig.doorColIndex}) with type: ${doorEntry.type}`);
    console.log("Door configuration:", doorConfig);
    console.log("Selected door type:", selectedDoor);
    return dungeonData;
}
function ba(a, b) {
    const roomSizeConfig = types_1.DungeonSettings.room_size[b || a.room_size];
    const roomSize = roomSizeConfig.size || 2;
    const radix = roomSizeConfig.radix || 5;
    const roomArea = Math.pow((roomSize + radix + 1), 2);
    let roomCount = 2 * Math.floor((a.n_cols * a.n_rows) / roomArea);
    if (a.room_layout === 'sparse') {
        roomCount /= 13;
    }
    return roomCount;
}
function scale_table(a) {
    let c = 0;
    for (let b in a) {
        let d = key_range(b);
        d[1] > c && (c = d[1]);
    }
    return c;
}
function key_range(a) {
    let c;
    return (c = /(\d+)-00/.exec(a)) ? [parseInt(c[1], 10), 100] :
        (c = /(\d+)-(\d+)/.exec(a)) ? [parseInt(c[1], 10), parseInt(c[2], 10)] :
            '00' == a ? [100, 100] : [parseInt(a, 10), parseInt(a, 10)];
}
