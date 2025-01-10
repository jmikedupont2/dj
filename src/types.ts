
// Define a new interface for stair objects
export interface Stair {
    row: number;
    col: number;
    next_row: number;
    next_col: number;
    key?: 'up' | 'down';
}

// Define an interface for door objects
export interface Door {
    row: number;
    col: number;
    key: string;
    type: string;
    out_id?: number;
    desc?: string;
}

export interface DoorDetails {
    arch?: number;
    door?: number;
    trap?: number;
    lock?: number;
    wall?: number;
}

export interface DoorPosition {
    door_r: number; // Equivalent to door_r
    door_c: number; // Equivalent to door_c
    sill_r?: number;       // Sill row
    sill_c?: number;       // Sill column
    dir?: string;          // Direction (north, south, west, east)
    out_id?: number;      // Optional: Connected room ID
    door_type?: string;   // Optional: Door type (e.g., 'Standard')
}

// Define an interface for room objects
export interface Room {
    id: number;
    size: string;
    row: number;
    col: number;
    north: number;
    south: number;
    west: number;
    east: number;
    height: number;
    width: number;
    door: { [key: string]: Door[] }; // Doors are grouped by direction
    last_door?: Door; // Optional property for last_door
    complex?: Room[]; // Optional property for complex rooms
}

export interface RoomConfig {
    size?: string; // Optional: Room size (e.g., 'medium')
    i?: number;    // Optional: Row index
    j?: number;    // Optional: Column index
    height?: number; // Optional: Room height
    width?: number;  // Optional: Room width
    complex_id?: number; // Optional: Complex room ID
    huge_rooms?: boolean; // Optional huge flag
}

// Add only the properties that are actually used in the JS version
export interface DungeonData {
    seed: number;
    cell: number[][];
    n_rooms: number;
    room: { [key: number]: Room };
    n_cols: number;
    n_rows: number;
    max_col: number;
    max_row: number;
    cell_size: number;
    door_type: string;
    n_i: number;
    n_j: number;
    base_layer: any;
}

export const V: { [key: string]: { colors: { [key: string]: string } } } = {
    standard: { colors: { fill: '#000000', open: '#ffffff', open_grid: '#cccccc' } },
    classic: { colors: { fill: '#3399cc', open: '#ffffff', open_grid: '#3399cc', hover: '#b6def2' } },
    graph: { colors: { fill: '#ffffff', open: '#ffffff', grid: '#c9ebf5', wall: '#666666', wall_shading: '#666666', door: '#333333', label: '#333333', tag: '#666666' } }
};

export interface DungeonRenderSettings {
    cell_size: number; // Size of each cell in pixels
    palette: {
        fill: string; // Background color
        open: string; // Open space color
        grid: string; // Grid color
        wall: string; // Wall color
        door: string; // Door color
        stair: string; // Stair color
        label: string; // Label color
        // Add more colors as needed
    };
    font: string; // Font for labels (e.g., "12px sans-serif")
    grid: boolean; // Whether to draw the grid
    base_layer: HTMLCanvasElement; // The base layer canvas
    max_x: number; // Maximum x-coordinate (canvas width)
    max_y: number; // Maximum y-coordinate (canvas height)
}

export interface SettingOption {
    title: string;
    [key: string]: any; // Allows for additional properties like 'aspect', 'size', 'cell', etc.
}

export interface DungeonSettingsI {
    map_style: { [key: string]: SettingOption };
    grid: { [key: string]: SettingOption };
    dungeon_layout: { [key: string]: SettingOption };
    dungeon_size: { [key: string]: SettingOption };
    add_stairs: { [key: string]: SettingOption };
    room_layout: { [key: string]: SettingOption };
    room_size: { [key: string]: SettingOption };
    doors: { [key: string]: SettingOption };
    corridor_layout: { [key: string]: SettingOption };
    remove_deadends: { [key: string]: SettingOption };
}

export const DungeonSettings: DungeonSettingsI = {
    map_style: {
        standard: { title: "Standard" },
        classic: { title: "Classic" },
        graph: { title: "GraphPaper" },
    },
    grid: {
        none: { title: "None" },
        square: { title: "Square" },
        hex: { title: "Hex" },
        vex: { title: "VertHex" },
    },
    dungeon_layout: {
        square: { title: "Square", aspect: 1 },
        rectangle: { title: "Rectangle", aspect: 1.3 },
        box: {
            title: "Box",
            aspect: 1,
            mask: [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1],
            ],
        },
        cross: {
            title: "Cross",
            aspect: 1,
            mask: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0],
            ],
        },
        dagger: {
            title: "Dagger",
            aspect: 1.3,
            mask: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0],
                [0, 1, 0],
            ],
        },
        saltire: { title: "Saltire", aspect: 1 },
        keep: {
            title: "Keep",
            aspect: 1,
            mask: [
                [1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 1, 1],
            ],
        },
        hexagon: { title: "Hexagon", aspect: 0.9 },
        round: { title: "Round", aspect: 1 },
    },
    dungeon_size: {
        fine: { title: "Fine", size: 200, cell: 18 },
        dimin: { title: "Diminiutive", size: 252, cell: 18 },
        tiny: { title: "Tiny", size: 318, cell: 18 },
        small: { title: "Small", size: 400, cell: 18 },
        medium: { title: "Medium", size: 504, cell: 18 },
        large: { title: "Large", size: 635, cell: 18 },
        huge: { title: "Huge", size: 800, cell: 18 },
        gargant: { title: "Gargantuan", size: 1008, cell: 18 },
        colossal: { title: "Colossal", size: 1270, cell: 18 },
    },
    add_stairs: {
        no: { title: "No" },
        yes: { title: "Yes" },
        many: { title: "Many" },
    },
    room_layout: {
        sparse: { title: "Sparse" },
        scattered: { title: "Scattered" },
        dense: { title: "Dense" },
    },
    room_size: {
        small: { title: "Small", size: 2, radix: 2 },
        medium: { title: "Medium", size: 2, radix: 5 },
        large: { title: "Large", size: 5, radix: 2 },
        huge: { title: "Huge", size: 5, radix: 5, huge: 1 },
        gargant: { title: "Gargantuan", size: 8, radix: 5, huge: 1 },
        colossal: { title: "Colossal", size: 8, radix: 8, huge: 1 },
    },
    //added to config rather than dynamically like js did
    doors: {
        none: { title: "None", table: { '01-15': 65536 } },
        basic: { title: "Basic", table: { '01-15': 65536, '16-60': 131072 } },
        secure: { title: "Secure", table: { '01-15': 65536, '16-60': 131072, '61-75': 262144 } },
        standard: {
            title: "Standard",
            table: {
                '01-15': 65536, '16-60': 131072, '61-75': 262144, '76-90': 524288, '91-100': 1048576,
                '101-110': 2097152
            },
        },
        deathtrap: { title: "Deathtrap", table: { '01-15': 65536, '16-30': 524288, '31-40': 1048576 } },
    },
    corridor_layout: {
        labyrinth: { title: "Labyrinth", pct: 0 },
        errant: { title: "Errant", pct: 50 },
        straight: { title: "Straight", pct: 90 },
    },
    remove_deadends: {
        none: { title: "None", pct: 0 },
        some: { title: "Some", pct: 50 },
        all: { title: "All", pct: 100 },
    },
};

export interface FObject {
    complex_id: any;
    width: number;
    height: number;
    j: number;
    i: number;
    size?: string | undefined;
}

export interface DungeonConfig {
    n_rooms: number;
    room: {
        size: number;
        height: number;
        width: number;
        row: number;
        col: number;
    }[];
}

export interface DoorTable {
    [key: string]: number;
}

export interface DoorsEntry {
    title: string;
    table: DoorTable;
}

export interface Doors {
    none: DoorsEntry;
    basic: DoorsEntry;
    secure: DoorsEntry;
    standard: DoorsEntry;
    deathtrap: DoorsEntry;
}

export interface Layout {
    map_style: string | undefined;
    grid: string | undefined;
    font?: string; // Notice the optional property here
}

export interface Map {
    map_style: string;
    grid: string;
    dungeon_layout: string;
    dungeon_size: string;
    add_stairs: string;
    room_layout: string;
    room_size: string;
    doors: string;
    corridor_layout: string;
    remove_deadends: string;
}

export interface P {
    [key: string]: number;
}

export interface M {
    [key: string]: number;
}

export type DirectionKey = keyof typeof Direction;

export interface EaParams {
    a: DungeonData;
    b: number;
    f: number;
    d?: DirectionKey;
    corridor_layout?: string;
    straight_pct?: number;
}

// Define the Direction enum
// export enum Direction {
//     north = 0,
//     south = 1,
//     west = 2,
//     east = 3
// }
export const Direction = {
    north: "north",
    south: "south",
    west: "west",
    east: "east"
} as const;

export const P: { [key: string]: number } = {
    north: -1,
    south: 1,
    west: 0,
    east: 0
};

export const M: { [key: string]: number } = {
    north: 0,
    south: 0,
    west: -1,
    east: 1
};

export const Ea = {
    door: 'fill',
    label: 'fill',
    stair: 'wall',
    wall: 'fill',
    fill: 'black',
    tag: 'white',
    open: 'fill',
    open_grid: 'grid',
    hover: 'fill',
    grid: 'fill',
    wall_shading: 'wall' // Add 'wall_shading'
};

export interface Palette {
    [key: string]: string | null; // Allow any key with a string or null value
}

export type PaletteKey = 'fill' | 'open' | 'open_grid' | 'hover' | 'grid' | 'wall' | 'wall_shading' | 'door' | 'label' | 'stair' | 'tag';

export interface GenData {
    [key: string]: string | string[] | GenData;
}
export interface NameSet {
    [key: string]: string[];
    Draconic: string[];
    Fiendish: string[];
    // Add other keys here if they exist
}
export const name_set: NameSet = {
    Draconic: [
        "Abdi", "Abiditaan", "Abiesuuh", "Ammiditana", "Ammisaduka", "Amurru", "Apilsin", "Arammadara", "Arsaces", "Asmadu", "Balshazzar", "Berossus", "Bhhazuum", "Burnaburiash", "Daad", "Ditanu", "Gezer", "Heana", "Ibni", "Ilima", "Iptiyamuta", "Kadashman", "Kheba", "Maam", "Milkilu", "Nabonidus", "Nabunaid", "Nabupolassar", "Namhuu", "Namzuu", "Nebuchadnezzer", "Ninus", "Ninyas", "Obares", "Saamsuiluna", "Sheshbazzar", "Sinmubaliit", "Sumalika", "Sumula", "Suni", "Tattenai", "Tuubtiyamuta", "Yaamkuuzzuhalamma", "Zabium", "Zuummabu"
    ],
    Fiendish: [
        "Abaddon", "Abalam", "Abraxas", "Abyzou", "Adramelech", "Aeshma", "Agares", "Ahriman", "Akvan", "Alloces", "Amon", "Anamalech", "Andhaka", "Anzu", "Armaros", "Asakku", "Astaroth", "Bael", "Balberith", "Baphomet", "Barbatos", "Behemoth", "Beleth", "Belphegor", "Charun", "Chemosh", "Culsu", "Dagon", "Drekavac", "Eblis", "Eligos", "Euryale", "Focalor", "Forneus", "Gaderel", "Gaki", "Gamigin", "Glasya", "Gomory", "Gusoyn", "Halphas", "Haures", "Iblis", "Kali", "Kasadya", "Kimaris", "Lamashtu", "Lechies", "Leraie", "Lilith", "Malaphar", "Malphas", "Malthus", "Mammon", "Mara", "Marbas", "Maricha", "Mastema", "Melchiresa", "Mephistopheles", "Merihem", "Moloch", "Naberus", "Naphula", "Ninurta", "Oriax", "Orobos", "Pazuzu", "Phenex", "Pruslas", "Rakshasa", "Raum", "Rumyal", "Saleos", "Samael", "Semyaz", "Shedim", "Sthenno", "Surgat", "Ukobach", "Valac", "Vapula", "Vassago", "Vepar", "Vephar", "Xaphan", "Yeterel", "Zagan", "Zepar"
    ],
    Gothic: [
        "Ablabius", "Achila", "Agila", "Agiwulf", "Agriwulf", "Aidoingus", "Aithanarid", "Alaric", "Alatheus", "Alaviv", "Alica", "Aligern", "Alla", "Amal", "Amalaric", "Ammius", "Anagastes", "Andagis", "Anianus", "Ansila", "Ansis", "Aoric", "Apahida", "Ardabur", "Ardaric", "Argaith", "Ariaric", "Arimir", "Arius", "Arnegliscus", "Arvandus", "Asbad", "Aspar", "Ataulf", "Ataulph", "Athalaric", "Athanagild", "Athanaric", "Atharid", "Athaulf", "Babai", "Badua", "Baduila", "Baza", "Berig", "Berimud", "Berimund", "Bessa", "Bessas", "Bessi", "Beuca", "Beucad", "Bigelis", "Bilimer", "Borani", "Braga", "Brandila", "Candac", "Cannabas", "Cannabaudes", "Cethegus", "Chindasuinth", "Cniva", "Cnivida", "Colias", "Crocus", "Cunigast", "Cunimund", "Cyrila", "Dubius", "Duda", "Ebermud", "Eberwolf", "Ebrimud", "Edica", "Eraric", "Eriulf", "Ermanaric", "Ermelandus", "Ervig", "Euric", "Eutharic", "Farnobius", "Fastida", "Feletheus", "Feva", "Filimer", "Flaccitheus", "Fravitta", "Fredegar", "Fretela", "Frideric", "Fridigern", "Frigeridus", "Frithila", "Fritigern", "Gadaric", "Gainas", "Gaiseric", "Galindo", "Galindus", "Gaut", "Gauterit", "Geberic", "Gelimer", "Gento", "Gerung", "Gesalec", "Gesimund", "Getica", "Goar", "Goddas", "Godegisel", "Godigisclus", "Goiaricus", "Gouththas", "Gundehar", "Gundiok", "Gundobad", "Gunteric", "Gunthigis", "Gutthikas", "Hadubrand", "Heldebald", "Heldefredus", "Heribrand", "Hermangild", "Hermenigild", "Herminafrid", "Hernegliscus", "Hildebad", "Hildebrand", "Hilderic", "Hilderith", "Himnerith", "Hisarna", "Hulmul", "Huml", "Huneric", "Hunigild", "Hunimund", "Hunulf", "Hunumund", "Ibba", "Ildebad", "Inna", "Irnfried", "Jordanes", "Lagariman", "Lampridius", "Leovigild", "Leuvibild", "Livila", "Marcomir", "Modaharius", "Modares", "Munderic", "Mundo", "Namatius", "Naulabates", "Nidada", "Niketas", "Odoin", "Odotheus", "Odovacar", "Ostrogotha", "Osuin", "Ovida", "Patza", "Radagaisus", "Rausimod", "Recared", "Reccared", "Recceswinth", "Rechiar", "Rechimund", "Recitach", "Rekitach", "Remismund", "Respa", "Retemeris", "Rhima", "Ricimer", "Rictiovarus", "Rikiar", "Roderic", "Rodolf", "Roduulf", "Rudesind", "Saba", "Sadagares", "Safrax", "Salla", "Sangiban", "Sansalas", "Saphrax", "Sarus", "Segeric", "Selenas", "Shapur", "Sidimund", "Sigeric", "Sigesar", "Sigibald", "Sigismund", "Sigisvult", "Sindila", "Sisbert", "Sisebut", "Sisenand", "Soas", "Suatrius", "Sueridus", "Sunericus", "Sunnia", "Tanais", "Tanca", "Teias", "Teja", "Tharuaro", "Thela", "Theodahad", "Theodehad", "Theodemer", "Theoderic", "Theoderid", "Theodoric", "Theodulf", "Theudegisel", "Theudegisklos", "Theudis", "Thidrek", "Thiudimir", "Thorismud", "Thorismund", "Thrasamund", "Thrasaric", "Thraustila", "Totila", "Tribigild", "Tufa", "Tuluin", "Ulfilas", "Unigild", "Unila", "Unimund", "Uraias", "Valamer", "Valamir", "Valaravans", "Valia", "Vandalarius", "Vandil", "Veduco", "Vetericus", "Vetranio", "Videric", "Vidigoia", "Vidimir", "Viliaris", "Vinitharius", "Visimar", "Vithimiris", "Vithmiris", "Vitigis", "Vittamar", "Vultuulf", "Wala", "Walahmar", "Wallia", "Wamba", "Wella", "Winguric", "Witige", "Wittigis", "Wittiza"
    ]
};

export interface UserSettings {
    map_style: string;
    grid: string;
    dungeon_layout: string;
    dungeon_size: string;
    add_stairs: string;
    room_layout: string;
    room_size: string;
    doors: string;
    corridor_layout: string;
    remove_deadends: string;
}

export const ma = {
    map_style: 'standard', grid: 'square', dungeon_layout: 'rectangle',
    dungeon_size: 'medium', add_stairs: 'yes', room_layout: 'scattered', room_size: 'medium', doors: 'standard', corridor_layout: 'errant', remove_deadends: 'some'
}

export interface DirectionDetails {
    walled: [number, number][]; // Cells that are considered walls
    close: [number, number][];  // Cells to close (set to 0)
    recurse: [number, number];  // Offset to recurse into
    corridor: number[][];       // Cells that are part of the corridor
    stair: number[];            // Cells that are part of stairs
    next: [number, number];     // Next cell in the direction
    open?: [number, number];    // Optional: Cells to open (set to 4)
    dir?: string;               // Direction of the stair placement
}

// Define the DirectionConfig object with all necessary properties
export const DirectionConfig: Record<string, DirectionDetails> = {
    north: {
        walled: [
            [0, -1],
            [1, -1],
            [1, 0],
            [1, 1],
            [0, 1],
        ],
        close: [[0, 0]],
        recurse: [-1, 0],
        corridor: [
            [0, 0],
            [1, 0],
            [2, 0],
        ],
        stair: [0, 0],
        next: [-1, 0],
        dir: "north", // Add the direction
    },
    south: {
        walled: [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
        ],
        close: [[0, 0]],
        recurse: [1, 0],
        corridor: [
            [0, 0],
            [-1, 0],
            [-2, 0],
        ],
        stair: [0, 0],
        next: [1, 0],
        dir: "south", // Add the direction
    },
    west: {
        walled: [
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
        ],
        close: [[0, 0]],
        recurse: [0, -1],
        corridor: [
            [0, 0],
            [0, 1],
            [0, 2],
        ],
        stair: [0, 0],
        next: [0, -1],
        dir: "west", // Add the direction
    },
    east: {
        walled: [
            [-1, 0],
            [-1, -1],
            [0, -1],
            [1, -1],
            [1, 0],
        ],
        close: [[0, 0]],
        recurse: [0, 1],
        corridor: [
            [0, 0],
            [0, -1],
            [0, -2],
        ],
        stair: [0, 0],
        next: [0, 1],
        dir: "east", // Add the direction
    },
};

export type TerrainSettingsNested = {
    title: string;
    [key: string]: any; // Allow additional properties
};

export interface TerrainSettingsI {
    map_style: {
        standard: TerrainSettingsNested;
        classic: TerrainSettingsNested;
        graph: TerrainSettingsNested;
    };
    grid: {
        none: TerrainSettingsNested;
        square: TerrainSettingsNested;
        hex: TerrainSettingsNested;
        vex: TerrainSettingsNested;
    };
    dungeon_layout: {
        square: TerrainSettingsNested & { aspect: number };
        rectangle: TerrainSettingsNested & { aspect: number };
        box: TerrainSettingsNested & { aspect: number; mask: number[][] };
        cross: TerrainSettingsNested & { aspect: number; mask: number[][] };
        dagger: TerrainSettingsNested & { aspect: number; mask: number[][] };
        saltire: TerrainSettingsNested & { aspect: number };
        keep: TerrainSettingsNested & { aspect: number; mask: number[][] };
        hexagon: TerrainSettingsNested & { aspect: number };
        round: TerrainSettingsNested & { aspect: number };
    };
    dungeon_size: {
        fine: TerrainSettingsNested & { size: number; cell: number };
        dimin: TerrainSettingsNested & { size: number; cell: number };
        tiny: TerrainSettingsNested & { size: number; cell: number };
        small: TerrainSettingsNested & { size: number; cell: number };
        medium: TerrainSettingsNested & { size: number; cell: number };
        large: TerrainSettingsNested & { size: number; cell: number };
        huge: TerrainSettingsNested & { size: number; cell: number };
        gargant: TerrainSettingsNested & { size: number; cell: number };
        colossal: TerrainSettingsNested & { size: number; cell: number };
    };
    add_stairs: {
        no: TerrainSettingsNested;
        yes: TerrainSettingsNested;
        many: TerrainSettingsNested;
    };
    room_layout: {
        sparse: TerrainSettingsNested;
        scattered: TerrainSettingsNested;
        dense: TerrainSettingsNested;
    };
    room_size: {
        small: TerrainSettingsNested & { size: number; radix: number };
        medium: TerrainSettingsNested & { size: number; radix: number };
        large: TerrainSettingsNested & { size: number; radix: number };
        huge: TerrainSettingsNested & { size: number; radix: number; huge: number };
        gargant: TerrainSettingsNested & { size: number; radix: number; huge: number };
        colossal: TerrainSettingsNested & { size: number; radix: number; huge: number };
    };
    doors: {
        none: TerrainSettingsNested;
        basic: TerrainSettingsNested;
        secure: TerrainSettingsNested;
        standard: TerrainSettingsNested;
        deathtrap: TerrainSettingsNested;
    };
    corridor_layout: {
        labyrinth: TerrainSettingsNested & { pct: number };
        errant: TerrainSettingsNested & { pct: number };
        straight: TerrainSettingsNested & { pct: number };
    };
    remove_deadends: {
        none: TerrainSettingsNested & { pct: number };
        some: TerrainSettingsNested & { pct: number };
        all: TerrainSettingsNested & { pct: number };
    };
}

export interface TerrainSettings {
    [topLevelKey: string]: {
        [nestedKey: string]: {
            title: string;
            aspect?: number; // Optional property
            size?: number; // Optional property
            cell?: number; // Optional property
            mask?: number[][]; // Optional property
            pct?: number; // Optional property
            radix?: number; // Optional property
            huge?: boolean; // Optional property, only used in specific cases
        };
    };
}

export const TerrainSettingsConfig: TerrainSettings = {
    map_style: {
        standard: { title: 'Standard' },
        classic: { title: 'Classic' },
        graph: { title: 'GraphPaper' },
    },
    grid: {
        none: { title: 'None' },
        square: { title: 'Square' },
        hex: { title: 'Hex' },
        vex: { title: 'VertHex' },
    },
    dungeon_layout: {
        square: { title: 'Square', aspect: 1 },
        rectangle: { title: 'Rectangle', aspect: 1.3 },
        box: {
            title: 'Box',
            aspect: 1,
            mask: [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1],
            ],
        },
        cross: {
            title: 'Cross',
            aspect: 1,
            mask: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0],
            ],
        },
        dagger: {
            title: 'Dagger',
            aspect: 1.3,
            mask: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 1, 0],
                [0, 1, 0],
            ],
        },
        saltire: { title: 'Saltire', aspect: 1 },
        keep: {
            title: 'Keep',
            aspect: 1,
            mask: [
                [1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 1, 1],
            ],
        },
        hexagon: { title: 'Hexagon', aspect: 0.9 },
        round: { title: 'Round', aspect: 1 },
    },
    dungeon_size: {
        fine: { title: 'Fine', size: 200, cell: 18 },
        dimin: { title: 'Diminiutive', size: 252, cell: 18 },
        tiny: { title: 'Tiny', size: 318, cell: 18 },
        small: { title: 'Small', size: 400, cell: 18 },
        medium: { title: 'Medium', size: 504, cell: 18 },
        large: { title: 'Large', size: 635, cell: 18 },
        huge: { title: 'Huge', size: 800, cell: 18 },
        gargant: { title: 'Gargantuan', size: 1008, cell: 18 },
        colossal: { title: 'Colossal', size: 1270, cell: 18 },
    },
    add_stairs: {
        no: { title: 'No' },
        yes: { title: 'Yes' },
        many: { title: 'Many' },
    },
    room_layout: {
        sparse: { title: 'Sparse' },
        scattered: { title: 'Scattered' },
        dense: { title: 'Dense' },
    },
    room_size: {
        small: { title: 'Small', size: 2, radix: 2 },
        medium: { title: 'Medium', size: 2, radix: 5 },
        large: { title: 'Large', size: 5, radix: 2 },
        huge: { title: 'Huge', size: 5, radix: 5, huge: true }, // 'huge' is used here
        gargant: { title: 'Gargantuan', size: 8, radix: 5, huge: true }, // 'huge' is used here
        colossal: { title: 'Colossal', size: 8, radix: 8, huge: true }, // 'huge' is used here
    },
    doors: {
        none: { title: 'None' },
        basic: { title: 'Basic' },
        secure: { title: 'Secure' },
        standard: { title: 'Standard' },
        deathtrap: { title: 'Deathtrap' },
    },
    corridor_layout: {
        labyrinth: { title: 'Labyrinth', pct: 0 },
        errant: { title: 'Errant', pct: 50 },
        straight: { title: 'Straight', pct: 90 },
    },
    remove_deadends: {
        none: { title: 'None', pct: 0 },
        some: { title: 'Some', pct: 50 },
        all: { title: 'All', pct: 100 },
    },
};
export const DefaultDungeonSettings = {
    map_style: 'standard', grid: 'square', dungeon_layout: 'rectangle',
    dungeon_size: /*'medium'*/ 'fine', add_stairs: 'yes', room_layout: 'scattered', room_size: 'medium', doors: 'standard', corridor_layout: 'errant', remove_deadends: 'some'
}