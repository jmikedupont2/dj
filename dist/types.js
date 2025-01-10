"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDungeonSettings = exports.TerrainSettingsConfig = exports.DirectionConfig = exports.ma = exports.name_set = exports.Ea = exports.M = exports.P = exports.Direction = exports.DungeonSettings = exports.V = void 0;
exports.V = {
    standard: { colors: { fill: '#000000', open: '#ffffff', open_grid: '#cccccc' } },
    classic: { colors: { fill: '#3399cc', open: '#ffffff', open_grid: '#3399cc', hover: '#b6def2' } },
    graph: { colors: { fill: '#ffffff', open: '#ffffff', grid: '#c9ebf5', wall: '#666666', wall_shading: '#666666', door: '#333333', label: '#333333', tag: '#666666' } }
};
exports.DungeonSettings = {
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
// Define the Direction enum
// export enum Direction {
//     north = 0,
//     south = 1,
//     west = 2,
//     east = 3
// }
exports.Direction = {
    north: "north",
    south: "south",
    west: "west",
    east: "east"
};
exports.P = {
    north: -1,
    south: 1,
    west: 0,
    east: 0
};
exports.M = {
    north: 0,
    south: 0,
    west: -1,
    east: 1
};
exports.Ea = {
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
exports.name_set = {
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
exports.ma = {
    map_style: 'standard', grid: 'square', dungeon_layout: 'rectangle',
    dungeon_size: 'medium', add_stairs: 'yes', room_layout: 'scattered', room_size: 'medium', doors: 'standard', corridor_layout: 'errant', remove_deadends: 'some'
};
// Define the DirectionConfig object with all necessary properties
exports.DirectionConfig = {
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
exports.TerrainSettingsConfig = {
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
exports.DefaultDungeonSettings = {
    map_style: 'standard', grid: 'square', dungeon_layout: 'rectangle',
    dungeon_size: /*'medium'*/ 'fine', add_stairs: 'yes', room_layout: 'scattered', room_size: 'medium', doors: 'standard', corridor_layout: 'errant', remove_deadends: 'some'
};
