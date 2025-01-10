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
exports.attemptDoorPlacement = attemptDoorPlacement;
exports.calculateRoomDimensions = calculateRoomDimensions;
exports.extractDoorPositions = extractDoorPositions;
exports.da = da;
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
    // Define dungeon feature characters
    const FEATURE_CHARS = {
        WALL: 'w', // Wall (1 or 16)
        ROOM: 'R', // Room floor (2)
        CORRIDOR: '+', // Corridor (4)
        DOOR: 'D', // Door (65536, 131072, etc.)
        STAIR_DOWN: 'v', // Down stairs (4194304)
        STAIR_UP: '^', // Up stairs (8388608)
        LABEL: 'L', // Room label (upper bits)
        EMPTY: '.', // Empty space
    };
    // Iterate through each cell in the dungeon grid
    for (let row = 0; row <= n_rows; row++) {
        for (let col = 0; col <= n_cols; col++) {
            const cellValue = cell[row][col];
            let char = FEATURE_CHARS.EMPTY; // Default to empty space
            // Check for overlapping features in priority order
            if (cellValue & 4194304) {
                char = FEATURE_CHARS.STAIR_DOWN; // Down stairs
            }
            else if (cellValue & 8388608) {
                char = FEATURE_CHARS.STAIR_UP; // Up stairs
            }
            else if (cellValue & 65536 || cellValue & 131072 || cellValue & 262144 || cellValue & 524288 || cellValue & 1048576 || cellValue & 2097152) {
                char = FEATURE_CHARS.DOOR; // Door
            }
            else if ((cellValue >> 24) & 255) {
                // Handle room labels (room IDs)
                const roomId = (cellValue >> 24) & 255; // Extract the room ID from the upper bits
                // Only display printable ASCII characters (32 to 126)
                if (roomId >= 32 && roomId <= 126) {
                    char = String.fromCharCode(roomId); // Convert the room ID to its corresponding ASCII character
                }
                else {
                    char = FEATURE_CHARS.ROOM; // Fallback to room floor character for non-printable IDs
                }
            }
            else if (cellValue & 2) {
                char = FEATURE_CHARS.ROOM; // Room floor
            }
            else if (cellValue & 4) {
                char = FEATURE_CHARS.CORRIDOR; // Corridor
            }
            else if (cellValue & 1 || cellValue & 16) {
                char = FEATURE_CHARS.WALL; // Wall
            }
            output += char + ' ';
        }
        output += '\n'; // New line after each row
    }
    console.log(output);
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
function initializeDropdowns() {
    // Loop through each setting in DungeonSettings
    Object.keys(types_1.DungeonSettings).forEach((key) => {
        const settingsKey = key;
        const dropdown = $(`#${key}`); // Get the dropdown element by ID
        if (dropdown.length === 0) {
            console.error(`Dropdown with ID "${key}" not found!`);
        }
        else {
            // Populate the dropdown with options
            Object.keys(types_1.DungeonSettings[settingsKey]).forEach((optionKey) => {
                const option = types_1.DungeonSettings[settingsKey][optionKey];
                dropdown.append(`<option value="${optionKey}">${option.title}</option>`);
            });
            // Set the default value for the dropdown using DefaultDungeonSettings
            const defaultValue = types_1.DefaultDungeonSettings[settingsKey];
            dropdown.val(defaultValue); // Set the default value
        }
    });
}
/**
 * Generates the initial dungeon configuration based on user settings.
 * @param userSettings - The user's settings for dungeon generation.
 * @returns The initial dungeon configuration.
 */
function generateDungeonDataConfig(userSettings) {
    // Validate user settings
    if (!userSettings) {
        throw new Error("User settings are required to generate dungeon data.");
    }
    // Initialize the config object with default values
    const config = {
        seed: (0, prng_1.set_prng_seed)($("#dungeon_name").val()),
        cell: [],
        n_rooms: 0,
        room: {},
        n_cols: 0,
        n_rows: 0,
        max_col: 0,
        max_row: 0,
        cell_size: 0,
        door_type: "standard",
        n_i: 0,
        n_j: 0,
        base_layer: null,
    };
    // Calculate dungeon dimensions based on user settings
    config.n_i = calculateDungeonRows(userSettings.dungeon_size, userSettings.dungeon_layout);
    config.n_j = calculateDungeonColumns(userSettings.dungeon_size, userSettings.dungeon_layout);
    config.cell_size = getCellSize(userSettings.dungeon_size);
    config.n_rows = 2 * config.n_i;
    config.n_cols = 2 * config.n_j;
    config.max_row = config.n_rows - 1;
    config.max_col = config.n_cols - 1;
    // Initialize the cell array with zeros
    config.cell = initializeCellArray(config.n_rows, config.n_cols);
    // Apply dungeon layout masks if necessary
    applyDungeonLayoutMask(config, userSettings.dungeon_layout);
    // Dynamically add user settings to the config object
    Object.assign(config, {
        dungeon_layout: userSettings.dungeon_layout,
        dungeon_size: userSettings.dungeon_size,
        add_stairs: userSettings.add_stairs,
        room_layout: userSettings.room_layout,
        room_size: userSettings.room_size,
        corridor_layout: userSettings.corridor_layout,
        remove_deadends: userSettings.remove_deadends,
    });
    return config;
}
/**
 * Calculates the number of rows for the dungeon based on dungeon size and layout.
 * @param dungeonSize - The size of the dungeon (e.g., 'medium', 'large').
 * @param dungeonLayout - The layout of the dungeon (e.g., 'rectangle', 'square').
 * @returns The number of rows.
 */
function calculateDungeonRows(dungeonSize, dungeonLayout) {
    const sizeConfig = types_1.DungeonSettings.dungeon_size[dungeonSize];
    const layoutConfig = types_1.DungeonSettings.dungeon_layout[dungeonLayout];
    if (!sizeConfig || !layoutConfig) {
        throw new Error(`Invalid dungeon size or layout configuration: ${dungeonSize}, ${dungeonLayout}`);
    }
    const cellSize = sizeConfig.cell;
    const dungeonArea = sizeConfig.size;
    const aspectRatio = layoutConfig.aspect;
    return Math.floor((dungeonArea * aspectRatio) / cellSize);
}
/**
 * Calculates the number of columns for the dungeon based on dungeon size and layout.
 * @param dungeonSize - The size of the dungeon (e.g., 'medium', 'large').
 * @param dungeonLayout - The layout of the dungeon (e.g., 'rectangle', 'square').
 * @returns The number of columns.
 */
function calculateDungeonColumns(dungeonSize, dungeonLayout) {
    const sizeConfig = types_1.DungeonSettings.dungeon_size[dungeonSize];
    const layoutConfig = types_1.DungeonSettings.dungeon_layout[dungeonLayout];
    if (!sizeConfig || !layoutConfig) {
        throw new Error(`Invalid dungeon size or layout configuration: ${dungeonSize}, ${dungeonLayout}`);
    }
    const cellSize = sizeConfig.cell;
    const dungeonArea = sizeConfig.size;
    return Math.floor(dungeonArea / cellSize);
}
/**
 * Retrieves the cell size based on the dungeon size.
 * @param dungeonSize - The size of the dungeon (e.g., 'medium', 'large').
 * @returns The cell size.
 */
function getCellSize(dungeonSize) {
    const sizeConfig = types_1.DungeonSettings.dungeon_size[dungeonSize];
    if (!sizeConfig) {
        throw new Error(`Invalid dungeon size configuration: ${dungeonSize}`);
    }
    return sizeConfig.cell;
}
/**
 * Initializes the cell array with zeros.
 * @param n_rows - The number of rows in the dungeon.
 * @param n_cols - The number of columns in the dungeon.
 * @returns A 2D array initialized with zeros.
 */
function initializeCellArray(n_rows, n_cols) {
    const cell = [];
    for (let i = 0; i <= n_rows; i++) {
        cell[i] = [];
        for (let j = 0; j <= n_cols; j++) {
            cell[i][j] = 0;
        }
    }
    return cell;
}
/**
 * Applies the dungeon layout mask to the cell array.
 * @param dungeonData - The dungeon data configuration.
 * @param dungeonLayout - The layout of the dungeon (e.g., 'rectangle', 'square').
 */
function applyDungeonLayoutMask(dungeonData, dungeonLayout) {
    const layoutConfig = types_1.DungeonSettings.dungeon_layout[dungeonLayout];
    if (!layoutConfig) {
        throw new Error(`Invalid dungeon layout configuration: ${dungeonLayout}`);
    }
    if (layoutConfig.mask) {
        dungeonData.cell = applyMask(dungeonData.cell, layoutConfig.mask);
    }
    else if (dungeonLayout === "saltire") {
        dungeonData.cell = applySaltireMask(dungeonData.cell);
    }
    else if (dungeonLayout === "hexagon") {
        dungeonData.cell = applyHexagonMask(dungeonData.cell);
    }
    else if (dungeonLayout === "round") {
        dungeonData.cell = applyRoundMask(dungeonData.cell);
    }
}
/**
 * Applies a mask to the cell array.
 * @param cell - The cell array.
 * @param mask - The mask to apply.
 * @returns The modified cell array.
 */
function applyMask(cell, mask) {
    const maskRowRatio = mask.length / (cell.length + 1);
    const maskColRatio = mask[0].length / (cell[0].length + 1);
    for (let row = 0; row <= cell.length; row++) {
        const maskRow = mask[Math.floor(row * maskRowRatio)];
        for (let col = 0; col <= cell[0].length; col++) {
            if (!maskRow[Math.floor(col * maskColRatio)]) {
                cell[row][col] = 1; // Mark as wall
            }
        }
    }
    return cell;
}
/**
 * Applies a saltire mask to the cell array.
 * @param cell - The cell array.
 * @returns The modified cell array.
 */
function applySaltireMask(cell) {
    const quarterRows = Math.floor(cell.length / 4);
    for (let offset = 0; offset < quarterRows; offset++) {
        const rowStart = quarterRows + offset;
        const rowEnd = cell[0].length - offset;
        for (let col = rowStart; col <= rowEnd; col++) {
            cell[offset][col] = 1; // Top-left to bottom-right
            cell[cell.length - offset][col] = 1; // Bottom-left to top-right
            cell[col][offset] = 1; // Top-left to bottom-right
            cell[col][cell[0].length - offset] = 1; // Bottom-left to top-right
        }
    }
    return cell;
}
/**
 * Applies a hexagon mask to the cell array.
 * @param cell - The cell array.
 * @returns The modified cell array.
 */
function applyHexagonMask(cell) {
    const midRow = Math.floor(cell.length / 2);
    for (let row = 0; row <= cell.length; row++) {
        const hexOffset = Math.floor(0.57735 * Math.abs(row - midRow)) + 1;
        const colStart = hexOffset;
        const colEnd = cell[0].length - hexOffset;
        for (let col = 0; col <= cell[0].length; col++) {
            if (col < colStart || col > colEnd) {
                cell[row][col] = 1; // Mark as wall
            }
        }
    }
    return cell;
}
/**
 * Applies a round mask to the cell array.
 * @param cell - The cell array.
 * @returns The modified cell array.
 */
function applyRoundMask(cell) {
    const midRow = cell.length / 2;
    const midCol = cell[0].length / 2;
    for (let row = 0; row <= cell.length; row++) {
        const rowRatio = Math.pow(row / midRow - 1, 2);
        for (let col = 0; col <= cell[0].length; col++) {
            const colRatio = Math.pow(col / midCol - 1, 2);
            if (Math.sqrt(rowRatio + colRatio) > 1) {
                cell[row][col] = 1; // Mark as wall
            }
        }
    }
    return cell;
}
function lookupAtIndex(key, value) {
    const settings = types_1.DungeonSettings[key];
    if (settings && settings[value]) {
        return settings[value];
    }
    throw new Error(`Setting not found for key: ${key} and value: ${value}`);
}
function xa(dungeonData, mask) {
    const maskRowRatio = mask.length / (dungeonData.n_rows + 1);
    const maskColRatio = mask[0].length / (dungeonData.n_cols + 1);
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        const maskRow = mask[Math.floor(row * maskRowRatio)];
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            if (!maskRow[Math.floor(col * maskColRatio)]) {
                dungeonData.cell[row][col] = 1; // Mark as wall
            }
        }
    }
    return dungeonData;
}
function ya(dungeonData) {
    const quarterRows = Math.floor(dungeonData.n_rows / 4);
    for (let offset = 0; offset < quarterRows; offset++) {
        const rowStart = quarterRows + offset;
        const rowEnd = dungeonData.n_cols - offset;
        for (let col = rowStart; col <= rowEnd; col++) {
            dungeonData.cell[offset][col] = 1; // Top-left to bottom-right
            dungeonData.cell[dungeonData.n_rows - offset][col] = 1; // Bottom-left to top-right
            dungeonData.cell[col][offset] = 1; // Top-left to bottom-right
            dungeonData.cell[col][dungeonData.n_cols - offset] = 1; // Bottom-left to top-right
        }
    }
    return dungeonData;
}
function za(dungeonData) {
    const midRow = Math.floor(dungeonData.n_rows / 2);
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        const hexOffset = Math.floor(0.57735 * Math.abs(row - midRow)) + 1;
        const colStart = hexOffset;
        const colEnd = dungeonData.n_cols - hexOffset;
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            if (col < colStart || col > colEnd) {
                dungeonData.cell[row][col] = 1; // Mark as wall
            }
        }
    }
    return dungeonData;
}
function Aa(dungeonData) {
    const midRow = dungeonData.n_rows / 2;
    const midCol = dungeonData.n_cols / 2;
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        const rowRatio = Math.pow(row / midRow - 1, 2);
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            const colRatio = Math.pow(col / midCol - 1, 2);
            if (Math.sqrt(rowRatio + colRatio) > 1) {
                dungeonData.cell[row][col] = 1; // Mark as wall
            }
        }
    }
    return dungeonData;
}
function calculateDungeonDimensions(dungeonData, dungeonSize, // Pass dungeon_size as a parameter
dungeonLayout // Pass dungeon_layout as a parameter
) {
    // Lookup dungeon size and layout from DungeonSettings
    const dungeonSizeConfig = types_1.DungeonSettings.dungeon_size[dungeonSize];
    const layoutConfig = types_1.DungeonSettings.dungeon_layout[dungeonLayout];
    // Calculate dimensions
    const cellSize = dungeonSizeConfig.cell;
    const dungeonArea = dungeonSizeConfig.size;
    const aspectRatio = layoutConfig.aspect;
    dungeonData.n_i = Math.floor((dungeonArea * aspectRatio) / cellSize);
    dungeonData.n_j = Math.floor(dungeonArea / cellSize);
    dungeonData.cell_size = cellSize;
    dungeonData.n_rows = 2 * dungeonData.n_i;
    dungeonData.n_cols = 2 * dungeonData.n_j;
    dungeonData.max_row = dungeonData.n_rows - 1;
    dungeonData.max_col = dungeonData.n_cols - 1;
    // Initialize the cell array
    dungeonData.cell = [];
    for (let i = 0; i <= dungeonData.n_rows; i++) {
        dungeonData.cell[i] = [];
        for (let j = 0; j <= dungeonData.n_cols; j++) {
            dungeonData.cell[i][j] = 0;
        }
    }
    // Apply dungeon layout masks
    if (layoutConfig.mask) {
        dungeonData = xa(dungeonData, layoutConfig.mask);
    }
    else if (dungeonLayout === "saltire") {
        dungeonData = ya(dungeonData);
    }
    else if (dungeonLayout === "hexagon") {
        dungeonData = za(dungeonData);
    }
    else if (dungeonLayout === "round") {
        dungeonData = Aa(dungeonData);
    }
    return dungeonData;
}
function generateDenseRooms(dungeonData, roomConfig, totalRooms) {
    let roomsGenerated = 0;
    for (let i = 0; i < dungeonData.n_i; i++) {
        for (let j = 0; j < dungeonData.n_j; j++) {
            if (roomsGenerated >= totalRooms) {
                return dungeonData; // Stop if we've reached the desired number of rooms
            }
            const cellRow = 2 * i + 1;
            const cellCol = 2 * j + 1;
            if (!(dungeonData.cell[cellRow][cellCol] & 2) && (i === 0 || j === 0 || (0, prng_1.random)(2) > 0)) {
                dungeonData = createRoom(dungeonData, roomConfig, { i, j });
                roomsGenerated++;
                if (roomConfig.huge_rooms && !(dungeonData.cell[cellRow][cellCol] & 2)) {
                    dungeonData = createRoom(dungeonData, roomConfig, { i, j, size: "medium" });
                    roomsGenerated++;
                }
            }
        }
    }
    return dungeonData;
}
function generateScatteredRooms(dungeonData, roomConfig, totalRooms) {
    for (let i = 0; i < totalRooms; i++) {
        dungeonData = createRoom(dungeonData, roomConfig, { size: roomConfig.size }); // Pass room_size
    }
    if (roomConfig.huge_rooms) {
        const mediumRoomCount = Math.floor(totalRooms / 2); // Example: Half of total rooms are huge
        for (let i = 0; i < mediumRoomCount; i++) {
            dungeonData = createRoom(dungeonData, roomConfig, { size: "medium" });
        }
    }
    return dungeonData;
}
function generateDoors(dungeonData) {
    const doorConnections = {};
    Object.entries(dungeonData.room).forEach(([roomId, room]) => {
        console.log(`Processing room with ID: ${roomId}`, room);
        const doors = attemptDoorPlacement(dungeonData, room);
        console.log("Doors found for room:", roomId, doors);
        if (!doors.length) {
            console.log("No doors found for this room.");
            return; // Skip this room if there are no doors
        }
        const roomArea = Math.sqrt(((room.east - room.west) / 2 + 1) * ((room.south - room.north) / 2 + 1));
        const doorCount = Math.floor(roomArea + (0, prng_1.random)(roomArea));
        for (let i = 0; i < doorCount; i++) {
            const door = doors.splice((0, prng_1.random)(doors.length), 1)[0];
            if (!door)
                break;
            const doorWithAllProperties = {
                doorRowIndex: door.door_r,
                doorColIndex: door.door_c,
                sill_r: door.sill_r,
                sill_c: door.sill_c,
                dir: door.dir,
                out_id: door.out_id !== undefined ? door.out_id : undefined,
                door_type: dungeonData.door_type || 'Standard',
            };
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
function Ba(config, // Accept straight_pct as part of config
currentDirection) {
    const directions = Object.keys(types_1.M);
    // Shuffle the directions
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    // Prioritize the current direction if straight_pct is set
    if (currentDirection && config.straight_pct && Math.random() * 100 < config.straight_pct) {
        directions.unshift(currentDirection);
    }
    return directions;
}
function N(a, b) {
    return a - b;
}
function ea(dungeonData, row, col, direction, straight_pct // Pass straight_pct as a parameter
) {
    const directions = Ba({ straight_pct }, direction); // Pass straight_pct to Ba
    console.log(`Generating corridors in directions: ${directions.join(", ")}`);
    directions.forEach((dir) => {
        const nextRow = row + types_1.P[dir];
        const nextCol = col + types_1.M[dir];
        // Check if the next cell is within bounds
        if (nextRow >= 0 &&
            nextRow <= dungeonData.n_rows &&
            nextCol >= 0 &&
            nextCol <= dungeonData.n_cols) {
            // Check if the next cell is not a wall or corridor
            if (!(dungeonData.cell[nextRow][nextCol] & 6)) {
                // Mark the cell as a corridor
                dungeonData.cell[nextRow][nextCol] |= 4;
                console.log(`Marked cell (${nextRow}, ${nextCol}) as corridor`);
                // Recursively call ea to continue generating corridors
                dungeonData = ea(dungeonData, nextRow, nextCol, dir, straight_pct);
            }
        }
    });
    return dungeonData;
}
function generateCorridors(dungeonData) {
    const corridorLayout = lookupAtIndex("corridor_layout", dungeonData.corridor_layout || "straight");
    const straight_pct = corridorLayout.pct; // Get straight_pct from corridor_layout
    console.log("Starting corridor generation...");
    // Recursive function to generate corridors in a specific direction
    function generateCorridorRecursive(dungeonData, row, col, direction, visited = new Set()) {
        const cellKey = `${row},${col}`;
        if (visited.has(cellKey)) {
            return dungeonData; // Skip if already visited
        }
        visited.add(cellKey);
        const directions = shuffleDirections(dungeonData, direction, straight_pct);
        //console.log(`Processing cell: (${row}, ${col}), directions: ${directions.join(", ")}`);
        directions.forEach((dir) => {
            const nextRow = row + types_1.P[dir];
            const nextCol = col + types_1.M[dir];
            // Check if the next cell is within bounds
            if (nextRow >= 0 && nextRow <= dungeonData.n_rows &&
                nextCol >= 0 && nextCol <= dungeonData.n_cols) {
                //console.log(`Checking next cell: (${nextRow}, ${nextCol}), cell value: ${dungeonData.cell[nextRow][nextCol]}`);
                // Check if the next cell is not a wall or room
                if (!(dungeonData.cell[nextRow][nextCol] & 6)) {
                    // Mark the cell as a corridor
                    //console.log(`Marking cell (${nextRow}, ${nextCol}) as corridor`);
                    dungeonData.cell[nextRow][nextCol] |= 4;
                    // Add walls around corridors
                    for (let row = 1; row < dungeonData.n_rows; row++) {
                        for (let col = 1; col < dungeonData.n_cols; col++) {
                            if (dungeonData.cell[row][col] & 4) { // Check if it's a corridor
                                // Add walls around the corridor cell
                                for (let dr = -1; dr <= 1; dr++) {
                                    for (let dc = -1; dc <= 1; dc++) {
                                        if (dr === 0 && dc === 0)
                                            continue; // Skip the corridor cell itself
                                        const newRow = row + dr;
                                        const newCol = col + dc;
                                        // Ensure the cell is not already a wall, room, or corridor
                                        if (!(dungeonData.cell[newRow][newCol] & 6)) { // must be empty
                                            dungeonData.cell[newRow][newCol] |= 16; // Mark as wall
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // Recursively extend the corridor in the current direction
                    dungeonData = generateCorridorRecursive(dungeonData, nextRow, nextCol, dir, visited);
                }
            }
            else {
                //console.log(`Skipping out-of-bounds cell: (${nextRow}, ${nextCol})`);
            }
        });
        return dungeonData;
    }
    // Shuffle directions and prioritize the current direction if straight_pct is set
    function shuffleDirections(dungeonData, currentDirection, straight_pct) {
        const directions = Object.keys(types_1.M);
        // Shuffle the directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        // Prioritize the current direction if straight_pct is set
        if (currentDirection && straight_pct && Math.random() * 100 < straight_pct) {
            directions.unshift(currentDirection);
        }
        return directions;
    }
    // Start corridor generation from the edges of each room
    Object.values(dungeonData.room).forEach((room) => {
        // Start from one cell outside the north edge of the room
        const startRow = room.north - 1;
        const startCol = Math.floor((room.west + room.east) / 2);
        if (!(dungeonData.cell[startRow][startCol] & 6)) { // Ensure it's not a wall or room
            dungeonData = generateCorridorRecursive(dungeonData, startRow, startCol);
        }
        // Start from one cell outside the south edge of the room
        const endRow = room.south + 1;
        const endCol = Math.floor((room.west + room.east) / 2);
        if (!(dungeonData.cell[endRow][endCol] & 6)) { // Ensure it's not a wall or room
            dungeonData = generateCorridorRecursive(dungeonData, endRow, endCol);
        }
        // Start from one cell outside the west edge of the room
        const westRow = Math.floor((room.north + room.south) / 2);
        const westCol = room.west - 1;
        if (!(dungeonData.cell[westRow][westCol] & 6)) { // Ensure it's not a wall or room
            dungeonData = generateCorridorRecursive(dungeonData, westRow, westCol);
        }
        // Start from one cell outside the east edge of the room
        const eastRow = Math.floor((room.north + room.south) / 2);
        const eastCol = room.east + 1;
        if (!(dungeonData.cell[eastRow][eastCol] & 6)) { // Ensure it's not a wall or room
            dungeonData = generateCorridorRecursive(dungeonData, eastRow, eastCol);
        }
    });
    console.log("Corridor generation complete.");
    printDungeon(dungeonData); // Print the dungeon grid after corridors are generated
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
                //console.log(`Cell (${cellRow}, ${cellCol}) is not a corridor`);
                isValid = false;
                break;
            }
        }
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
                //console.log(`Cell (${cellRow}, ${cellCol}) is not a wall`);
                isValid = false;
                break;
            }
        }
    }
    // Check for stairs
    if (directionDetails.stair) {
        const cellRow = row + directionDetails.stair[0];
        const cellCol = col + directionDetails.stair[1];
        if (cellRow < 0 || cellRow >= grid.length || cellCol < 0 || cellCol >= grid[0].length) {
            isValid = false;
        }
        else if (grid[cellRow][cellCol] & 12582912) { // Check if cell is already marked as stairs
            isValid = false;
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
                Object.keys(types_1.DirectionConfig).forEach((direction) => {
                    //console.log(`Checking direction: ${direction} at (${cellRow}, ${cellCol})`);
                    // Validate stair placement using DirectionConfig
                    if (ja(cell, cellRow, cellCol, types_1.DirectionConfig[direction])) {
                        //console.log(`Valid stair placement at (${cellRow}, ${cellCol}) in direction ${direction}`);
                        // Create a stair object
                        const stair = {
                            row: cellRow,
                            col: cellCol,
                            next_row: cellRow + types_1.DirectionConfig[direction].next[0],
                            next_col: cellCol + types_1.DirectionConfig[direction].next[1],
                        };
                        // Add the stair to the list
                        stairs.push(stair);
                    }
                    else {
                        //console.log(`Invalid stair placement at (${cellRow}, ${cellCol}) in direction ${direction}`);
                    }
                });
            }
        }
    }
    console.log(`Potential stairs found in oa: ${stairs.length}`);
    return stairs;
}
function generateStairs(dungeonData, userSettings) {
    if (!userSettings.add_stairs || userSettings.add_stairs === 'no') {
        console.error("No stairs to be generated, either intentionally or by code error.");
        return dungeonData;
    }
    // Get potential stair positions
    const stairPositions = oa(dungeonData);
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
        // Ensure the cell is not already a door or part of a room
        if (dungeonData.cell[row][col] & 4128769 || dungeonData.cell[row][col] & 2) {
            console.warn(`Cannot place stair at (${row}, ${col}) - cell is occupied by a door or room.`);
            continue; // Skip this stair position
        }
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
function ha(dungeonData, closeArcs) {
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
function getUserSettings() {
    return {
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
}
function qaFinalizeDoors(dungeonData, doors) {
    let b = {};
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
                            console.warn(`Invalid out_id for door at (${h.row}, ${h.col}). Skipping door.`);
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
    // Return the updated DungeonData without modifying its structure
    return dungeonData;
}
function removeDeadEnds(dungeonData, removeDeadEndsSetting, // Pass remove_deadends setting
corridorLayoutSetting // Pass corridor_layout setting
) {
    // Look up the corresponding configuration from DungeonSettings
    const removeDeadEndsConfig = types_1.DungeonSettings.remove_deadends[removeDeadEndsSetting];
    // Ensure the configuration exists and has a valid pct value
    if (!removeDeadEndsConfig || typeof removeDeadEndsConfig.pct !== 'number') {
        console.error('Invalid remove_deadends configuration:', removeDeadEndsConfig);
        return dungeonData; // Return the original data if the configuration is invalid
    }
    // Assign the pct value to close_arcs
    const closeArcs = removeDeadEndsConfig.pct;
    // Process the dungeon data to remove dead ends
    dungeonData = fa(dungeonData, closeArcs, types_1.DirectionConfig);
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
    // Apply additional logic based on corridor_layout
    if (corridorLayoutSetting === 'errant' || corridorLayoutSetting === 'straight') {
        dungeonData = ha(dungeonData, closeArcs); // Pass closeArcs to ha
    }
    // Initialize doors array if not already initialized
    const doors = dungeonData.door || [];
    // Finalize doors
    dungeonData = qaFinalizeDoors(dungeonData, doors);
    // Clean up walls
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
function drawBackground(renderSettings, canvasContext) {
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    // Draw the background (black fill)
    const fillColor = palette.fill || palette.black || '#000000';
    (0, canvas_1.fill_rect)(canvasContext, 0, 0, max_x, max_y, fillColor);
}
function drawGrid(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
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
// function drawRooms(dungeonData: DungeonData, renderSettings: DungeonRenderSettings, canvasContext: CanvasRenderingContext2D): void {
//     const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
//     const roomColor = palette.open || '#ffffff'; // Default to white if no color is set
//     for (let row = 0; row <= dungeonData.n_rows; row++) {
//         for (let col = 0; col <= dungeonData.n_cols; col++) {
//             if (dungeonData.cell[row][col] & 2) { // Check if it's a room
//                 const x = col * cell_size;
//                 const y = row * cell_size;
//                 //canvasContext.drawImage(base_layer, x, y, cell_size, cell_size, x, y, cell_size, cell_size);
//                 fill_rect(canvasContext, x, y, cell_size, cell_size, roomColor);
//             }
//         }
//     }
// }
function drawRooms(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette, base_layer, max_x, max_y, font } = renderSettings;
    const roomColor = palette.open || '#ffffff'; // Default to white if no color is set
    // Debug: Log grid dimensions
    console.log(`Grid Dimensions: Rows: ${dungeonData.n_rows}, Cols: ${dungeonData.n_cols}`);
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            // Debug: Log cell value and position
            console.log(`Row: ${row}, Col: ${col}, Cell Value: ${dungeonData.cell[row][col]}`);
            // Check if the cell is a room (value 2)
            if (dungeonData.cell[row][col] & 2) {
                const x = col * cell_size;
                const y = row * cell_size;
                // Debug: Log drawing coordinates
                console.log(`Drawing room at (${x}, ${y})`);
                // Draw the room cell
                //canvasContext.drawImage(base_layer, x, y, cell_size, cell_size, x, y, cell_size, cell_size);
                (0, canvas_1.fill_rect)(canvasContext, x, y, cell_size, cell_size, roomColor);
            }
        }
    }
}
// Draw labels (room IDs)
function drawLabels(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette, font } = renderSettings;
    const labelColor = palette.label || '#000000'; // Default to black if no color is set
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            const cellValue = dungeonData.cell[row][col];
            const roomId = (cellValue >> 6) & 255; // Decode room ID
            // Ensure the room ID is a printable ASCII character (32–126)
            if (roomId >= 32 && roomId <= 126) {
                const labelChar = String.fromCharCode(roomId);
                const x = col * cell_size + cell_size / 2;
                const y = row * cell_size + cell_size / 2 + 1;
                (0, canvas_1.draw_string)(canvasContext, labelChar, x, y, font, labelColor);
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
    const wallColor = palette.wall || '#666666';
    const wallShadingColor = palette.wall_shading || '#cccccc';
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            if (dungeonData.cell[row][col] & 16) { // Check if it's a wall
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
// Function to draw doors
function drawDoors(dungeonData, renderSettings, canvasContext) {
    const cellSize = renderSettings.cell_size;
    const doorColor = renderSettings.palette.door || '#333333';
    // Iterate over all rooms to find doors
    Object.values(dungeonData.room).forEach((room) => {
        // Iterate over all directions (north, south, east, west) in the room
        Object.keys(room.door).forEach((direction) => {
            // Iterate over all doors in the current direction
            room.door[direction].forEach((door) => {
                const x = door.col * cellSize;
                const y = door.row * cellSize;
                // Draw the door based on its type
                switch (door.key) {
                    case 'arch':
                        (0, canvas_1.fill_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                        break;
                    case 'open':
                        (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                        break;
                    case 'lock':
                        (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                        drawLockSymbol(canvasContext, x, y, cellSize, doorColor);
                        break;
                    case 'trap':
                        (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                        drawTrapSymbol(canvasContext, x, y, cellSize, doorColor);
                        break;
                    case 'secret':
                        (0, canvas_1.stroke_rect)(canvasContext, x, y, cellSize, cellSize, doorColor);
                        drawSecretEffect(canvasContext, x, y, cellSize, doorColor);
                        break;
                    case 'portc':
                        drawPortcullis(canvasContext, x, y, cellSize, doorColor);
                        break;
                    default:
                        console.warn(`Unknown door type: ${door.key}`);
                        break;
                }
            });
        });
    });
}
// Function to draw stairs
function drawStairs(dungeonData, renderSettings, canvasContext) {
    const { cell_size, palette } = renderSettings;
    const stairColor = palette.stair || palette.wall || '#666666';
    // Iterate over the dungeon grid to find stairs
    for (let row = 0; row <= dungeonData.n_rows; row++) {
        for (let col = 0; col <= dungeonData.n_cols; col++) {
            const cellValue = dungeonData.cell[row][col];
            // Check if the cell contains stairs
            if (cellValue & 4194304) { // Down stair
                const x = col * cell_size;
                const y = row * cell_size;
                (0, canvas_1.draw_line)(canvasContext, x + cell_size / 2, y, x + cell_size / 2, y + cell_size, stairColor);
            }
            else if (cellValue & 8388608) { // Up stair
                const x = col * cell_size;
                const y = row * cell_size;
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
            const distance = Math.abs(step - (stairs.yc));
            (0, canvas_1.draw_line)(context, position - stairs.down[distance], step, position + stairs.down[distance], step, color);
        });
    }
    else if (stairs.yc) {
        const position = stairs.yc;
        stairs.list.forEach((step) => {
            const distance = Math.abs(step - (stairs.xc));
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
function renderDungeon(dungeonData, renderSettings) {
    console.log("Rendering dungeon...");
    // Get the main canvas from renderSettings.base_layer
    const mainCanvas = renderSettings.base_layer;
    if (!(mainCanvas instanceof HTMLCanvasElement)) {
        console.error("Invalid base_layer in renderSettings. Expected an HTMLCanvasElement.");
        return;
    }
    const mainContext = mainCanvas.getContext('2d');
    if (!mainContext) {
        console.error("Failed to get 2D context for main canvas.");
        return;
    }
    // // Step 1: Clear the canvas
    // console.log("Clearing canvas...");
    // mainContext.fillStyle = '#000000'; // Black
    // mainContext.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
    // console.log("Canvas cleared.");
    // Clear the main canvas
    mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    // Step 2: Draw the background and grid
    console.log("Drawing background (and grid if defined)");
    drawBackground(renderSettings, mainContext);
    if (renderSettings.grid) {
        drawGrid(dungeonData, renderSettings, mainContext);
    }
    // Step 3: Draw rooms and corridors
    console.log("Drawing rooms and corridors...");
    drawRooms(dungeonData, renderSettings, mainContext);
    // Step 4: Draw walls and shading
    console.log("Drawing walls and shading...");
    drawWallsAndShading(dungeonData, renderSettings, mainContext);
    // Step 5: Draw doors
    console.log("Drawing doors...");
    drawDoors(dungeonData, renderSettings, mainContext);
    // Step 6: Draw labels (room IDs)
    console.log("Drawing labels...");
    drawLabels(dungeonData, renderSettings, mainContext);
    // Step 7: Draw stairs
    console.log("Drawing stairs...");
    drawStairs(dungeonData, renderSettings, mainContext);
    console.log("Dungeon rendering complete.");
}
// Main entry point
function generateNewDungeon() {
    console.log("Starting to generate a new dungeon");
    let rndDungName = (0, generator_1.generate_text)("Dungeon Name");
    console.log("Generated dungeon name:", rndDungName);
    $("#dungeon_name").val(rndDungName); // Use .val() instead of .text() for input fields
    let dungeonData = updateAndGenerateDungeon();
    return dungeonData;
}
function updateAndGenerateDungeon() {
    console.log("Updating and generating dungeon");
    // Retrieve user settings
    const userSettings = getUserSettings();
    console.log("Selected Dungeon Settings before generation:", userSettings);
    // Generate dungeon configuration
    let dungeonData = generateDungeonDataConfig(userSettings);
    console.log("Dungeon Config after generation:", dungeonData);
    // Generate rooms
    const roomConfig = {
        size: userSettings.room_size,
        huge_rooms: userSettings.room_layout === 'dense' // Example logic for huge rooms
    };
    dungeonData = generateNewRooms(dungeonData, userSettings, roomConfig);
    console.log("DungeonData after generating rooms:", dungeonData);
    // Generate doors
    dungeonData = generateDoors(dungeonData);
    console.log("DungeonData after generating doors:", dungeonData);
    // Generate corridors
    dungeonData = generateCorridors(dungeonData);
    console.log("DungeonData after generating corridors:", dungeonData);
    // Label rooms
    dungeonData = labelRooms(dungeonData);
    console.log("DungeonData after labeling rooms:", dungeonData);
    // Generate stairs
    dungeonData = generateStairs(dungeonData, userSettings);
    console.log("DungeonData after generating stairs:", dungeonData);
    console.log("Stair generation complete.");
    printDungeon(dungeonData); // Print the dungeon grid after stair generation
    if ("stair" in dungeonData)
        console.warn("Stairs " + dungeonData.stair.length);
    // Remove dead ends
    dungeonData = removeDeadEnds(dungeonData, userSettings.remove_deadends, userSettings.corridor_layout);
    console.log("DungeonData after removing dead ends:", dungeonData);
    printDungeon(dungeonData); // Print the dungeon grid after removing dead ends
    // Finalize the dungeon layout
    dungeonData = finalizeDungeonLayout(dungeonData);
    console.log("Dungeon Config after finalizing layout:", dungeonData);
    printDungeon(dungeonData); // Print the dungeon grid after finalizing layout
    // Generate render settings
    const renderSettings = generateRenderSettings(dungeonData, userSettings);
    console.log("Render settings generated:", renderSettings);
    // Render the dungeon
    renderDungeon(dungeonData, renderSettings);
    console.log('Render the dungeon should be complete now');
    return dungeonData;
}
function generateRenderSettings(dungeonData, selectedSettings) {
    const dcCellSize = dungeonData.cell_size || 18;
    // Ensure the canvas element exists
    const baseLayer = document.getElementById("map");
    if (!baseLayer) {
        throw new Error("Canvas element with ID 'map' not found.");
    }
    let width = (dungeonData.n_cols + 1) * dcCellSize + 1;
    let height = (dungeonData.n_rows + 1) * dcCellSize + 1;
    let max_x = (dungeonData.n_cols + 1) * dcCellSize;
    let max_y = (dungeonData.n_rows + 1) * dcCellSize;
    let font = Math.floor(0.75 * dcCellSize).toString() + 'px sans-serif';
    let grid = selectedSettings.grid !== 'none'; // Enable grid if not 'none'
    baseLayer.width = width;
    baseLayer.height = height;
    // Generate the palette based on the selected map style
    const palette = generatePalette(selectedSettings.map_style);
    const renderSettings = {
        mapStyle: selectedSettings.map_style,
        gridStyle: selectedSettings.grid,
        cellSize: dcCellSize,
        // width: width,
        // height: height,
        max_x: max_x,
        max_y: max_y,
        font: font,
        cell_size: dcCellSize,
        palette: palette,
        grid: grid,
        base_layer: baseLayer,
    };
    return renderSettings;
}
function saveDungeon() {
    let savDungName = $("#dungeon_name").val();
    (0, canvas_1.save_canvas)($("map"), `${savDungName}.png`);
}
// Event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Populate the dropdowns
    initializeDropdowns();
    // Generate the initial dungeon
    const userSettings = getUserSettings();
    let dungeonData = generateDungeonDataConfig(userSettings);
    // Generate the initial dungeon
    generateNewDungeon();
    // Event listeners for dungeon name input and "New" button
    $("#dungeon_name").on("change", () => {
        console.log("Dungeon name changed:", $("#dungeon_name").val());
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#new_name").on("click", () => {
        console.log("New name button clicked");
        resetRoomIdCounter(); // start from 1 for each new generation of rooms, affects labeling
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    // Event listeners for other settings to trigger dungeon regeneration
    $("#map_style").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#grid").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#dungeon_layout").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#dungeon_size").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#add_stairs").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#room_layout").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#room_size").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#doors").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#corridor_layout").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    $("#remove_deadends").on("change", () => {
        const userSettings = getUserSettings();
        dungeonData = generateDungeonDataConfig(userSettings);
        generateNewDungeon();
    });
    // Event listeners for saving and printing the dungeon
    $("#save_map").on("click", saveDungeon);
    // $("#print_map").on("click", () => {
    //     window.print();
    // });
});
let roomIdCounter = 0; // Add a global counter for room IDs
// Function to reset the room ID counter
function resetRoomIdCounter() {
    roomIdCounter = 0;
}
function createRoom(dungeonData, roomConfig, roomParams) {
    if (dungeonData.n_rooms === 999) {
        return dungeonData; // Maximum number of rooms reached
    }
    const f = roomParams || {};
    let size = roomParams.size || roomConfig.size;
    console.log(`Creating room with size: ${size}`);
    const d = types_1.DungeonSettings.room_size[size];
    if (!d) {
        console.error(`Room size configuration not found for size: ${size}`);
        return dungeonData;
    }
    const g = d.size || 2;
    const width = d.radix || 5;
    // Ensure height is defined
    if (!('height' in roomParams)) {
        if ('i' in roomParams) {
            let c = dungeonData.n_i - g - roomParams.i;
            if (c < 0)
                c = 0;
            roomParams.height = Math.floor(Math.random() * (c < width ? c : width)) + g;
        }
        else {
            roomParams.height = Math.floor(Math.random() * width) + g;
        }
    }
    // Ensure width is defined
    if (!('width' in roomParams)) {
        if ('j' in roomParams) {
            let c = dungeonData.n_j - g - roomParams.j;
            if (c < 0)
                c = 0;
            roomParams.width = Math.floor(Math.random() * (c < width ? c : width)) + g;
        }
        else {
            roomParams.width = Math.floor(Math.random() * width) + g;
        }
    }
    // Ensure i is defined
    if (!('i' in roomParams)) {
        roomParams.i = Math.floor(Math.random() * (dungeonData.n_i - roomParams.height));
    }
    // Ensure j is defined
    if (!('j' in roomParams)) {
        roomParams.j = Math.floor(Math.random() * (dungeonData.n_j - roomParams.width));
    }
    const { i, j, height, width: roomWidth } = roomParams;
    const bStart = 2 * i + 1;
    const gStart = 2 * j + 1;
    const dEnd = 2 * (i + height) - 1;
    const cEnd = 2 * (j + roomWidth) - 1;
    if (bStart < 1 || dEnd > dungeonData.max_row || gStart < 1 || cEnd > dungeonData.max_col) {
        return dungeonData; // Room is out of bounds
    }
    let k = {};
    for (let row = bStart; row <= dEnd; row++) {
        for (let col = gStart; col <= cEnd; col++) {
            if (dungeonData.cell[row][col] & 1) {
                k = { blocked: 1 };
                break;
            }
            if (dungeonData.cell[row][col] & 2) {
                const roomId = (dungeonData.cell[row][col] & 65472) >> 6; // Decode room number
                if (!('blocked' in k)) {
                    k[roomId] = (k[roomId] || 0) + 1;
                }
            }
        }
    }
    if ('blocked' in k && k.blocked) {
        return dungeonData; // Room overlaps with a wall
    }
    const keys = Object.keys(k);
    let roomId;
    if (keys.length === 0) {
        roomId = dungeonData.n_rooms + 1; // Room IDs start from 1
        dungeonData.n_rooms = roomId; // Increment n_rooms
    }
    else if (keys.length === 1) {
        if (roomConfig.huge_rooms) {
            if (parseInt(keys[0], 10) !== roomParams.complex_id) {
                return dungeonData; // Complex room ID mismatch
            }
        }
        else {
            return dungeonData; // Room overlaps with another room
        }
        roomId = parseInt(keys[0], 10);
    }
    else {
        return dungeonData; // Room overlaps with multiple rooms
    }
    if (roomId <= 0) {
        console.error(`Invalid roomId: ${roomId}. Defaulting to 1.`);
        roomId = 1;
    }
    for (let row = bStart; row <= dEnd; row++) {
        for (let col = gStart; col <= cEnd; col++) {
            dungeonData.cell[row][col] = 2 | (roomId << 6); // room encoding - per js lets keep this final
            console.log(`Room ID: ${roomId}, Encoded Value: ${dungeonData.cell[row][col]}`); // Debugging
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
            east: [],
        },
        complex: [], // Initialize complex as an empty array
    };
    // Add walls around the room
    for (let row = newRoom.north - 1; row <= newRoom.south + 1; row++) {
        for (let col = newRoom.west - 1; col <= newRoom.east + 1; col++) {
            // Check if the cell is on the perimeter of the room
            if (row === newRoom.north - 1 || row === newRoom.south + 1 || col === newRoom.west - 1 || col === newRoom.east + 1) {
                if (!(dungeonData.cell[row][col] & 6)) { // must be empty
                    dungeonData.cell[row][col] |= 16; // Mark as wall
                }
            }
        }
    }
    if (dungeonData.room[roomId]) {
        if (dungeonData.room[roomId].complex) {
            dungeonData.room[roomId].complex.push(newRoom);
        }
        else {
            dungeonData.room[roomId] = Object.assign(Object.assign({}, dungeonData.room[roomId]), { complex: [dungeonData.room[roomId], newRoom] });
        }
    }
    else {
        dungeonData.room[roomId] = newRoom; // Add the new room
    }
    return dungeonData;
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
    // Check if the door cell is within bounds
    if (doorRow < 0 || doorRow > a.n_rows || doorCol < 0 || doorCol > a.n_cols) {
        return null;
    }
    const cellValue = a.cell[doorRow][doorCol];
    // Check if the cell is a wall and not already a door or stair
    if (!(cellValue & 16) || (cellValue & 4128769)) { // parens important here
        return null;
    }
    // Check the adjacent cell (inside the room)
    const adjacentRow = doorRow + types_1.P[dir];
    const adjacentCol = doorCol + types_1.M[dir];
    if (adjacentRow < 0 || adjacentRow > a.n_rows || adjacentCol < 0 || adjacentCol > a.n_cols) {
        return null;
    }
    const adjacentCell = a.cell[adjacentRow][adjacentCol];
    // Ensure the adjacent cell is not a wall
    if (adjacentCell & 1) {
        return null;
    }
    // Check if the door connects to itself
    const adjacentRoomId = (adjacentCell & 2) ? (adjacentCell & 65472) >> 6 : null; // decode room number
    if (adjacentRoomId === b.id) {
        return null; // Reject if the door connects to the same room
    }
    // Assign out_id based on the adjacent cell
    const myout = (adjacentCell & 2) ? ((adjacentCell & 65472) >> 6) : undefined; // parens important here -  decode room number - default to undefined for empty spaces
    return {
        sill_r: row,
        sill_c: col,
        dir: dir,
        door_r: doorRow,
        door_c: doorCol,
        out_id: myout, // outid or undefined if empty
    };
}
/**
 * Calculates the total number of rooms to generate based on dungeon size and room configuration.
 * @param dungeonData - The current dungeon configuration.
 * @param roomSize - The size of the rooms (e.g., 'small', 'medium', 'large').
 * @param roomLayout - The layout of the rooms (e.g., 'sparse', 'scattered', 'dense').
 * @returns The total number of rooms to generate.
 */
function calculateRoomDimensions(dungeonData, roomSize, // Room size (e.g., 'small', 'medium', 'large')
roomLayout // Room layout (e.g., 'sparse', 'scattered', 'dense')
) {
    // Look up room size configuration
    const sizeConfig = types_1.DungeonSettings.room_size[roomSize];
    if (!sizeConfig) {
        console.error(`Invalid room size: ${roomSize}`);
        return 0;
    }
    // Calculate room dimensions based on size
    const roomArea = (sizeConfig.size || 2) + (sizeConfig.radix || 5) + 1;
    let totalRooms = 2 * Math.floor((dungeonData.n_cols * dungeonData.n_rows) / (roomArea * roomArea));
    // Adjust room count based on layout
    if (roomLayout === 'sparse') {
        totalRooms /= 13; // Sparse layout has fewer rooms
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
 * @param userSettings - The user's settings for dungeon generation.
 * @param roomConfig - The configuration for the rooms to be generated.
 * @returns The updated dungeon configuration with new rooms.
 */
function generateNewRooms(dungeonData, userSettings, roomConfig) {
    const doorConnections = {};
    // Calculate the total number of rooms to generate
    const roomCount = calculateRoomDimensions(dungeonData, roomConfig.size || 'medium', userSettings.room_layout);
    // Generate rooms using a loop
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
                dungeonData = createRoom(dungeonData, roomConfig, newRoomConfig); // Pass roomConfig and newRoomConfig
                console.log(`Created room at (${newRoomConfig.i}, ${newRoomConfig.j}) with size: ${newRoomConfig.size}`);
            }
            attempts++;
        }
    }
    // Handle huge rooms if necessary
    if (roomConfig.huge_rooms) {
        const hugeRoomCount = calculateRoomDimensions(dungeonData, 'medium', userSettings.room_layout);
        for (let i = 0; i < hugeRoomCount; i++) {
            dungeonData = createRoom(dungeonData, roomConfig, { size: 'medium' }); // Pass size: 'medium' to createRoom
        }
    }
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
        //console.warn(`Invalid out_id (0) for door at (${doorConfig.doorRowIndex}, ${doorConfig.doorColIndex}).`);
        return dungeonData;
    }
    // Retrieve the door type configuration from DungeonSettings
    const doorTypeConfig = types_1.DungeonSettings.doors[doorConfig.door_type];
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
        dungeonData.cell[doorConfig.doorRowIndex][doorConfig.doorColIndex] |= selectedDoor | (room.id << 6); // room encoding per js - keep
        doorEntry.key = doorType.key;
        doorEntry.type = doorType.type;
    }
    else {
        console.error("Invalid door placement: cell already occupied or invalid door type.");
        return dungeonData;
    }
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
    // Log the door placement details for debugging
    console.log(`Placed door at (${doorConfig.doorRowIndex}, ${doorConfig.doorColIndex}) with type: ${doorEntry.type}`);
    console.log("Door configuration:", doorConfig);
    console.log("Selected door type:", selectedDoor);
    return dungeonData;
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
