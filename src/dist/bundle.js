var DungeonGenerator = (function (exports) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    // prng.ts (1-48)
    var prng = (function (c, callback) {
        var b = Date.now();
        function e(a) {
            b = 1103515245 * b + 12345;
            b &= 2147483647;
            return a > 1 ? (b >> 8) % a : 0;
        }
        c.set_prng_seed = function (a) {
            if (typeof a === 'number') {
                b = Math.floor(a);
            }
            else if (typeof a === 'string') {
                var d = 42;
                for (var f = 0; f < a.length; f++) {
                    d = (d << 5) - d + a.charCodeAt(f);
                    d &= 2147483647;
                }
                b = d;
            }
            else {
                b = Date.now();
            }
            return b;
        };
        c.random = e;
        c.random_fp = function () {
            return e(32768) / 32768;
        };
        // Return the functions you want to export
        return {
            set_prng_seed: c.set_prng_seed,
            random: c.random,
            random_fp: c.random_fp
        };
    })(window);
    // Named exports
    var set_prng_seed = prng.set_prng_seed;
    var random$1 = prng.random;

    var V = {
        standard: { colors: { fill: '#000000', open: '#ffffff', open_grid: '#cccccc' } },
        classic: { colors: { fill: '#3399cc', open: '#ffffff', open_grid: '#3399cc', hover: '#b6def2' } },
        graph: { colors: { fill: '#ffffff', open: '#ffffff', grid: '#c9ebf5', wall: '#666666', wall_shading: '#666666', door: '#333333', label: '#333333', tag: '#666666' } }
    };
    var DungeonSettings = {
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
    var Direction = {
        north: "north",
        south: "south",
        west: "west",
        east: "east"
    };
    var P = {
        north: -1,
        south: 1,
        west: 0,
        east: 0
    };
    var M = {
        north: 0,
        south: 0,
        west: -1,
        east: 1
    };
    var Ea = {
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
    var name_set = {
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
    // Define the DirectionConfig object with all necessary properties
    var DirectionConfig = {
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
    var DefaultDungeonSettings = {
        map_style: 'standard', grid: 'square', dungeon_layout: 'rectangle',
        dungeon_size: /*'medium'*/ 'fine', add_stairs: 'yes', room_layout: 'scattered', room_size: 'medium', doors: 'standard', corridor_layout: 'errant', remove_deadends: 'some'
    };

    var gen_data = {
        'Dungeon Name': [
            'The ${ Dungeon Type } of ${ Dire Horror } ${ Dungeon Horror }',
            'The ${ Lost Dungeon } ${ Dungeon Type } of ${ Dungeon Horror }',
            'The ${ Dungeon Type } of ${ lt The Darklord }',
            'The ${ Lost Dungeon } ${ Dungeon Type } of ${ lt The Darklord }'
        ],
        'Lost Dungeon': [
            "Black", "Dark", "Dread", "Forsaken", "Lost", "Secret"
        ],
        'Dungeon Type': [
            "Barrow", "Catacombs", "Caverns", "Chambers", "Crypts", "Cyst", "Delve", "Dungeon", "Gauntlet", "Halls", "Hive", "Labyrinth", "Lair", "Pit", "Prison", "Sanctum", "Sepulcher", "Shrine", "Temple", "Tomb", "Tunnels", "Undercrypt", "Vaults", "Warrens"
        ],
        'Dire Horror': [
            '${ Bloody Epithet };${ Dark Epithet };${ Dire Epithet };${ Eldritch Epithet };${ Fiendish Epithet };${ Mighty Epithet }'
        ].map(function (epithets) { return epithets.split(';'); }).flat(),
        'Bloody Epithet': [
            "Bloody", "Crimson", "Ghastly", "Gruesome"
        ],
        'Dark Epithet': [
            "Aphotic", "Black", "Dark", "Dismal", "Gloomy", "Tenebrous", "Shadowy", "Sunless"
        ],
        'Dire Epithet': [
            "Baleful", "Cruel", "Dire", "Grim", "Horrendous", "Merciless", "Poisonous", "Sinister", "Treacherous", "Unspeakable", "Woeful"
        ],
        'Eldritch Epithet': [
            "Arcane", "Demonic", "Eldritch", "Elemental", "Fiendish", "Infernal", "Unearthly"
        ],
        'Fiendish Epithet': [
            "Abyssal", "Accursed", "Baatorian", "Black", "Corrupt", "Damned", "Demonic", "Fallen", "Fell", "Fiendish", "Hellish", "Malefic", "Malevolent", "Malign", "Profane", "Vile", "Wicked"
        ],
        'Mighty Epithet': [
            "Adamant", "Awesome", "Indomitable", "Mighty", "Terrible"
        ],
        'Dungeon Horror': [
            "Ages", "Annihilation", "Chaos", "Death", "Devastation", "Doom", "Evil", "Horror", "Madness", "Malice", "Necromancy", "Nightmares", "Ruin", "Secrets", "Sorrows", "Souls", "Terror", "Woe", "Worms"
        ],
        'The Darklord': [
            '${ Named Darklord }',
            '${ Darklord Name }',
            '${ Darklord Name } the ${ Darklord Epithet }',
            'The ${ Monster Epithet } ${ Noble Title }'
        ],
        'Named Darklord': [
            "Emirkol the Chaotic",
            "Gothmog of Udun",
            "Kas the Bloody",
            "Kas the Betrayer",
            "Lord Greywulf",
            "Marceline the Vampire Queen",
            "Shiva the Destroyer",
            "The Goblin King",
            "Ulfang the Black",
            "Zeiram the Lich"
        ],
        'Darklord Name': [
            '${ gen_name Draconic }',
            '${ gen_name Gothic }',
            '${ gen_name Fiendish }'
        ],
        'Darklord Epithet': [
            '${ Bloody Epithet };${ Dire Epithet };${ Eldritch Epithet };${ Fiendish Epithet };${ Insane Epithet };${ Mighty Epithet };${ Darkmage }'
        ].map(function (epithets) { return epithets.split(';'); }).flat(),
        'Insane Epithet': [
            "Deranged", "Insane", "Lunatic", "Mad", "Possessed"
        ],
        'Darkmage': [
            "Archmage", "Enchantress", "Necromancer", "Pontifex", "Sorceror", "Warlock", "Witch"
        ],
        'Monster Epithet': [
            "Demon", "Gargoyle", "Lich", "Shadow", "Vampire", "Wraith", "Wyrm"
        ],
        'Noble Title': [
            "Baron", "Count", "Duke", "Knight", "Lord", "Warlord", "Baroness", "Countess", "Duchess", "Knight", "Emperor", "King", "Prince", "Tyrant", "Empress", "Princess", "Queen"
        ]
    };

    var Trace = /** @class */ (function () {
        function Trace() {
            this.var = {};
            this.exclude = {};
        }
        Trace.prototype.setVariable = function (name, value) {
            this.var[name] = value;
        };
        Trace.prototype.getVariable = function (name) {
            return this.var[name];
        };
        return Trace;
    }());
    function generate_text(a) {
        console.log("Generating text for key:", a); // Log the key being used
        if (gen_data[a]) {
            var selected = select_from(gen_data[a]);
            console.log("Selected value:", selected); // Log the selected value
            if (selected) {
                var c = new_trace();
                var expanded = expand_tokens(selected.toString(), c);
                console.log("Expanded tokens:", expanded); // Log the expanded tokens
                return expanded;
            }
            else {
                console.error("select_from returned undefined or null.");
            }
        }
        else {
            console.error("Key \"".concat(a, "\" not found in gen_data."));
        }
        return '';
    }
    function select_from(a) {
        if (typeof a === 'number') {
            return a.toString(); // Convert number to string
        }
        if (Array.isArray(a)) {
            return select_from_array(a); // Return a string from the array
        }
        if (typeof a === 'object') {
            // Ensure 'a' is of type GenData
            var table = a;
            var result = select_from_table(table);
            // Validate the result
            var validDoorTypes = [65536, 131072, 262144, 524288, 1048576, 2097152];
            if (validDoorTypes.includes(result)) {
                return result.toString(); // Return the valid door type as a string
            }
            else {
                //console.error("Invalid door type selected:", result);
                return "131072"; // Default to 'Unlocked Door' as a string
            }
        }
        return a; // Return the string as-is
    }
    function select_from_array(a) {
        return a[random(a.length)];
    }
    function select_from_table(table) {
        var total = scale_table$1(table); // Get the maximum range value
        var roll = random(total); // Generate a random number within the range
        for (var _i = 0, _a = Object.entries(table); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (typeof value === 'number') { // Ensure the value is a number
                var _c = key_range$1(key), min = _c[0], max = _c[1]; // Parse the key range
                if (roll >= min && roll <= max) {
                    return value; // Return the corresponding value
                }
            }
        }
        //console.log("No valid door type found for roll:", roll);
        return 131072; // Default to 'Unlocked Door' if no match is found
    }
    function scale_table$1(a) {
        var c = 0;
        for (var b in a) {
            var d = key_range$1(b);
            d[1] > c && (c = d[1]);
        }
        return c;
    }
    function key_range$1(a) {
        var c;
        return (c = /(\d+)-00/.exec(a)) ? [parseInt(c[1], 10), 100] :
            (c = /(\d+)-(\d+)/.exec(a)) ? [parseInt(c[1], 10), parseInt(c[2], 10)] :
                '00' == a ? [100, 100] : [parseInt(a, 10), parseInt(a, 10)];
    }
    function new_trace() {
        return new Trace();
    }
    function local_trace(a) {
        var c = Object.assign({}, a);
        c['var'] = Object.assign({}, a['var']);
        return c;
    }
    function expand_tokens(a, c) {
        var b = /\${ ([^{}]+) }/;
        var d;
        var match;
        while ((d = b.exec(a)) && (match = d[1])) {
            match = d[1];
            var e = void 0;
            a = (e = expand_token(match, c)) ? a.replace('${ ' + match + ' }', e) : a.replace('{' + match + '}', match);
        }
        return a;
    }
    function getStringFromGenData(value) {
        if (typeof value === 'string') {
            return value;
        }
        else if (typeof value === 'number') {
            // Handle the number case (e.g., convert it to a string or return a default value)
            return value.toString(); // Convert the number to a string
        }
        else {
            return select_from(value);
        }
    }
    function expand_token(a, c) {
        var b;
        console.log("Expanding token: ".concat(a));
        // Handle tokens like ${ Dungeon Type }
        if (gen_data[a]) {
            return select_from(gen_data[a]); // Replace the token with a value from gen_data
        }
        // Dice rolls
        else if ((b = /^\d*d\d+/.exec(a)) || (b = /^calc (.+)/.exec(a))) {
            return roll_dice_str(b[1]);
        }
        // Expansion of x tokens
        else if (b = /^(\d+) x (.+)/.exec(a)) {
            return expand_x(parseInt(b[1], 10), b[2], c);
        }
        // Array expansion
        else if (b = /^\[ (.+) \]/.exec(a)) {
            var tokens = b[1].split(/,\s*/);
            return expand_tokens(select_from_array(tokens), c);
        }
        // Data expansion
        else if (b = /^alt (.+) def (.+)/.exec(a)) {
            var key1 = b[1];
            var key2 = b[2];
            var d1 = select_from(gen_data[key1]);
            var d2 = select_from(gen_data[key2]);
            if (d1 !== b[2]) {
                return getStringFromGenData(d1);
            }
            else {
                return getStringFromGenData(d2);
            }
        }
        // Unique tokens
        else if (b = /^unique (.+)/.exec(a)) {
            return expand_unique(b[1], c);
        }
        // Local variable expansion
        else if (b = /^local (.+)/.exec(a)) {
            var newC = local_trace(c);
            return expand_token(b[1], newC);
        }
        // New trace expansion
        else if (b = /^new (.+)/.exec(a)) {
            var newC = new_trace();
            return expand_token(b[1], newC);
        }
        // Set variable
        else if (b = /^set (\w+) = (.+?) in (.+)/.exec(a)) {
            c['var'][b[1]] = b[2];
            return expand_token(b[3], c);
        }
        // Set variable (simple)
        else if (b = /^set (\w+) = (.+)/.exec(a)) {
            set_var(b[1], b[2], c);
            return '';
        }
        // Get variable
        else if (b = /^get (\w+) def (.+)/.exec(a)) {
            return c['var'][b[1]] || b[2];
        }
        // Get variable (fix)
        else if (b = /^get (\w+) fix (.+)/.exec(a)) {
            var varName = b[1];
            var defaultValue = b[2];
            var value = c['var'][varName];
            if (!value) {
                return set_var(varName, defaultValue, c);
            }
            else {
                return value;
            }
        }
        // Get variable (simple)
        else if (b = /^get (\w+)/.exec(a)) {
            var varName = b[1];
            var value = c['var'][varName];
            if (!value) {
                throw new Error("Variable '".concat(varName, "' not defined"));
            }
            else {
                return value;
            }
        }
        // Shift array
        else if (b = /^shift (\w+) = (.+)/.exec(a)) {
            var varName = b[1];
            var values = b[2].split(/,\s*/);
            c['var'][varName] = values;
            c['var'][varName].shift();
            return '';
        }
        // Shift array (simple)
        else if (b = /^shift (\w+)/.exec(a)) {
            var varName = b[1];
            if (!c['var'][varName]) {
                throw new Error("Variable '".concat(varName, "' not defined"));
            }
            else {
                c['var'][varName].shift();
                return '';
            }
        }
        // An token
        else if (b = /^an (.+)/.exec(a)) {
            return aoran(expand_token(b[1], c));
        }
        // An token (capitalized)
        else if (b = /^An (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return ucfirst(result);
        }
        // No the
        else if (b = /^nt (.+)/.exec(a)) {
            return nothe(expand_token(b[1], c));
        }
        // Lowercase
        else if (b = /^lc (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return lc(result);
        }
        // Inline case
        else if (b = /^lf (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return inline_case(result);
        }
        // Lower the
        else if (b = /^lt (.+)/.exec(a)) {
            return lthe(expand_token(b[1], c));
        }
        // Uppercase
        else if (b = /^uc (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return uc(result);
        }
        // First uppercase letter
        else if (b = /^uf (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return ucfirst(result);
        }
        // Sentence case
        else if (b = /^sc (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return lc(result);
        }
        // Title case
        else if (b = /^tc (.+)/.exec(a)) {
            var result = expand_token(b[1], c);
            return title_case(result);
        }
        // Generate name
        else if (b = /^gen_name (.+)/.exec(a)) {
            var nameType = b[1].trim(); // Extract and trim the name type
            return generate_name(nameType); // Call generate_name with the extracted type
        }
        // Default case
        else {
            return a;
        }
    }
    function expand_x(a, c, b) {
        var d = {}, e = {}, f = [], l = b.comma || ', ';
        var andMatch;
        for (; andMatch = /^(and|literal|unique) (.+)/.exec(c);)
            d[andMatch[1]] = !0, c = andMatch[2];
        var k;
        for (k = 0; k < a; k++) {
            var g = c.toString();
            if (d.unique) {
                g = expand_unique(g, b);
            }
            else {
                g = expand_token(g, b);
            }
            if (d.literal) {
                f.push(g);
            }
            else {
                var match = /^(\d+) x (.+)/.exec(g);
                if (match) {
                    e[match[2]] = (e[match[2]] || 0) + parseInt(match[1], 10);
                }
                else {
                    var increment = (e[g] || 0) + 1;
                    e[g] = increment;
                }
            }
        }
        Object.keys(e).sort().forEach(function (h) {
            if (e[h] > 1) {
                f.push([e[h], h].join(' x '));
            }
            else {
                f.push(h);
            }
        });
        var popped;
        return d.and ? (popped = f.pop(),
            (popped !== undefined ? [f.join(l), popped].join(' and ') : f.join(l))) : f.join(l);
    }
    function expand_unique(a, c) {
        var b;
        for (b = 0; 100 > b; b++) {
            var d = expand_token(a, c);
            if (!c.exclude[d])
                return c.exclude[d] = !0, d;
        }
        return '';
    }
    function set_var(a, c, b) {
        if ('npc_name' == a) {
            var d = void 0;
            (d = /^(.+?) .+/.exec(c)) ? b['var'].name = d[1] : b['var'].name = c;
        }
        return b['var'][a] = c;
    }
    function aoran(a) {
        return /^the /i.test(a) ? a : /^(nunchaku)/i.test(a) ? a : /^(unicorn|unique|university)/i.test(a) ? "a ".concat(a) : /^(hour)/i.test(a) ? "an ".concat(a) : /^[BCDGJKPQTUVWYZ][A-Z0-9]+/.test(a) ? "a ".concat(a) : /^[AEFHILMNORSX][A-Z0-9]+/.test(a) ? "an ".concat(a) : /^[aeiou]/i.test(a) ? "an ".concat(a) : "a ".concat(a);
    }
    function nothe(a) {
        var c;
        return (c = /^the (.+)/i.exec(a)) ? c[1] : a;
    }
    function lc(a) {
        return a.toLowerCase();
    }
    function lcfirst(a) {
        var c;
        return (c = /^([a-z])(.*)/i.exec(a)) ? lc(c[1]) + c[2] : a;
    }
    function inline_case(a) {
        return /^[A-Z][A-Z]/.test(a) ? a : lcfirst(a);
    }
    function lthe(a) {
        var c;
        return (c = /^the (.+)/i.exec(a)) ? "the ".concat(c[1]) : a;
    }
    function uc(a) {
        return a.toUpperCase();
    }
    function ucfirst(a) {
        var c;
        return (c = /^([a-z])(.*)/i.exec(a)) ? uc(c[1]) + c[2] : a;
    }
    function title_case(a) {
        return a.split(/\s+/).map(uc).join(' ');
    }
    function generate_name(nameType) {
        var names = name_set[nameType];
        if (!names || names.length === 0) {
            console.error("No names found for type: ".concat(nameType));
            return "Unknown";
        }
        return names[Math.floor(Math.random() * names.length)];
    }
    function roll_dice_str(a) {
        // Implement the roll_dice_str function
        return "".concat(a);
    }
    function random(max) {
        return Math.floor(Math.random() * max);
    }

    // canvas2.ts
    // Declare the $ function for selecting canvas elements
    function set_pixel(a, c, b, d) {
        {
            fill_rect(a, c, b, c, b, d);
        }
    }
    function fill_rect(a, c, b, d, e, f) {
        a.fillStyle = f;
        a.fillRect(c, b, d - c + 1, e - b + 1); //ensure the rectangle includes the end coordinates.
    }
    function draw_line(a, c, b, d, e, f) {
        if (d === c && e === b) {
            set_pixel(a, c, b, f);
        }
        else {
            a.beginPath();
            a.moveTo(c + 0.5, b + 0.5); // draw crisp lines by aligning to pixel grid
            a.lineTo(d + 0.5, e + 0.5); // draw crisp lines by aligning to pixel grid
            a.strokeStyle = f;
            a.stroke();
        }
    }
    function stroke_rect(a, c, b, d, e, f) {
        a.strokeStyle = f;
        a.strokeRect(c, b, d - c + 1, e - b + 1); //ensure the rectangle includes the end coordinates.
    }
    function draw_string(a, c, b, d, e, f) {
        a.textBaseline = 'middle';
        a.textAlign = 'center';
        a.font = e;
        a.fillStyle = f;
        a.fillText(c, b, d);
    }
    function save_canvas(a, c) {
        var dataURL = a.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        var link = document.createElement('a');
        if ('string' === typeof link.download) { //checks if the download attribute is supported
            link.href = dataURL;
            link.download = c;
            link.click();
        }
        else {
            window.location.assign(dataURL);
        }
    }

    function printDungeon(dungeonData) {
        var cell = dungeonData.cell, n_rows = dungeonData.n_rows, n_cols = dungeonData.n_cols;
        var output = '';
        // Define dungeon feature characters
        var FEATURE_CHARS = {
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
        for (var row = 0; row <= n_rows; row++) {
            for (var col = 0; col <= n_cols; col++) {
                var cellValue = cell[row][col];
                var char = FEATURE_CHARS.EMPTY; // Default to empty space
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
                    var roomId = (cellValue >> 24) & 255; // Extract the room ID from the upper bits
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
        var palette = {};
        // Get the base palette based on the map_style
        var basePalette = ((_a = V[mapStyle]) === null || _a === void 0 ? void 0 : _a.colors) || V.standard.colors;
        // Merge the base palette with default colors
        palette = __assign({}, basePalette);
        // Ensure default colors are set
        palette.black = palette.black || '#000000';
        palette.white = palette.white || '#ffffff';
        return palette;
    }
    function initializeDropdowns() {
        // Loop through each setting in DungeonSettings
        Object.keys(DungeonSettings).forEach(function (key) {
            var settingsKey = key;
            var dropdown = $("#".concat(key)); // Get the dropdown element by ID
            if (dropdown.length === 0) {
                console.error("Dropdown with ID \"".concat(key, "\" not found!"));
            }
            else {
                // Populate the dropdown with options
                Object.keys(DungeonSettings[settingsKey]).forEach(function (optionKey) {
                    var option = DungeonSettings[settingsKey][optionKey];
                    dropdown.append("<option value=\"".concat(optionKey, "\">").concat(option.title, "</option>"));
                });
                // Set the default value for the dropdown using DefaultDungeonSettings
                var defaultValue = DefaultDungeonSettings[settingsKey];
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
        var config = {
            seed: set_prng_seed($("#dungeon_name").val()),
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
        var sizeConfig = DungeonSettings.dungeon_size[dungeonSize];
        var layoutConfig = DungeonSettings.dungeon_layout[dungeonLayout];
        if (!sizeConfig || !layoutConfig) {
            throw new Error("Invalid dungeon size or layout configuration: ".concat(dungeonSize, ", ").concat(dungeonLayout));
        }
        var cellSize = sizeConfig.cell;
        var dungeonArea = sizeConfig.size;
        var aspectRatio = layoutConfig.aspect;
        return Math.floor((dungeonArea * aspectRatio) / cellSize);
    }
    /**
     * Calculates the number of columns for the dungeon based on dungeon size and layout.
     * @param dungeonSize - The size of the dungeon (e.g., 'medium', 'large').
     * @param dungeonLayout - The layout of the dungeon (e.g., 'rectangle', 'square').
     * @returns The number of columns.
     */
    function calculateDungeonColumns(dungeonSize, dungeonLayout) {
        var sizeConfig = DungeonSettings.dungeon_size[dungeonSize];
        var layoutConfig = DungeonSettings.dungeon_layout[dungeonLayout];
        if (!sizeConfig || !layoutConfig) {
            throw new Error("Invalid dungeon size or layout configuration: ".concat(dungeonSize, ", ").concat(dungeonLayout));
        }
        var cellSize = sizeConfig.cell;
        var dungeonArea = sizeConfig.size;
        return Math.floor(dungeonArea / cellSize);
    }
    /**
     * Retrieves the cell size based on the dungeon size.
     * @param dungeonSize - The size of the dungeon (e.g., 'medium', 'large').
     * @returns The cell size.
     */
    function getCellSize(dungeonSize) {
        var sizeConfig = DungeonSettings.dungeon_size[dungeonSize];
        if (!sizeConfig) {
            throw new Error("Invalid dungeon size configuration: ".concat(dungeonSize));
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
        var cell = [];
        for (var i = 0; i <= n_rows; i++) {
            cell[i] = [];
            for (var j = 0; j <= n_cols; j++) {
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
        var layoutConfig = DungeonSettings.dungeon_layout[dungeonLayout];
        if (!layoutConfig) {
            throw new Error("Invalid dungeon layout configuration: ".concat(dungeonLayout));
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
        var maskRowRatio = mask.length / (cell.length + 1);
        var maskColRatio = mask[0].length / (cell[0].length + 1);
        for (var row = 0; row <= cell.length; row++) {
            var maskRow = mask[Math.floor(row * maskRowRatio)];
            for (var col = 0; col <= cell[0].length; col++) {
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
        var quarterRows = Math.floor(cell.length / 4);
        for (var offset = 0; offset < quarterRows; offset++) {
            var rowStart = quarterRows + offset;
            var rowEnd = cell[0].length - offset;
            for (var col = rowStart; col <= rowEnd; col++) {
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
        var midRow = Math.floor(cell.length / 2);
        for (var row = 0; row <= cell.length; row++) {
            var hexOffset = Math.floor(0.57735 * Math.abs(row - midRow)) + 1;
            var colStart = hexOffset;
            var colEnd = cell[0].length - hexOffset;
            for (var col = 0; col <= cell[0].length; col++) {
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
        var midRow = cell.length / 2;
        var midCol = cell[0].length / 2;
        for (var row = 0; row <= cell.length; row++) {
            var rowRatio = Math.pow(row / midRow - 1, 2);
            for (var col = 0; col <= cell[0].length; col++) {
                var colRatio = Math.pow(col / midCol - 1, 2);
                if (Math.sqrt(rowRatio + colRatio) > 1) {
                    cell[row][col] = 1; // Mark as wall
                }
            }
        }
        return cell;
    }
    function lookupAtIndex(key, value) {
        var settings = DungeonSettings[key];
        if (settings && settings[value]) {
            return settings[value];
        }
        throw new Error("Setting not found for key: ".concat(key, " and value: ").concat(value));
    }
    function xa(dungeonData, mask) {
        var maskRowRatio = mask.length / (dungeonData.n_rows + 1);
        var maskColRatio = mask[0].length / (dungeonData.n_cols + 1);
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            var maskRow = mask[Math.floor(row * maskRowRatio)];
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                if (!maskRow[Math.floor(col * maskColRatio)]) {
                    dungeonData.cell[row][col] = 1; // Mark as wall
                }
            }
        }
        return dungeonData;
    }
    function ya(dungeonData) {
        var quarterRows = Math.floor(dungeonData.n_rows / 4);
        for (var offset = 0; offset < quarterRows; offset++) {
            var rowStart = quarterRows + offset;
            var rowEnd = dungeonData.n_cols - offset;
            for (var col = rowStart; col <= rowEnd; col++) {
                dungeonData.cell[offset][col] = 1; // Top-left to bottom-right
                dungeonData.cell[dungeonData.n_rows - offset][col] = 1; // Bottom-left to top-right
                dungeonData.cell[col][offset] = 1; // Top-left to bottom-right
                dungeonData.cell[col][dungeonData.n_cols - offset] = 1; // Bottom-left to top-right
            }
        }
        return dungeonData;
    }
    function za(dungeonData) {
        var midRow = Math.floor(dungeonData.n_rows / 2);
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            var hexOffset = Math.floor(0.57735 * Math.abs(row - midRow)) + 1;
            var colStart = hexOffset;
            var colEnd = dungeonData.n_cols - hexOffset;
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                if (col < colStart || col > colEnd) {
                    dungeonData.cell[row][col] = 1; // Mark as wall
                }
            }
        }
        return dungeonData;
    }
    function Aa(dungeonData) {
        var midRow = dungeonData.n_rows / 2;
        var midCol = dungeonData.n_cols / 2;
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            var rowRatio = Math.pow(row / midRow - 1, 2);
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                var colRatio = Math.pow(col / midCol - 1, 2);
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
        var dungeonSizeConfig = DungeonSettings.dungeon_size[dungeonSize];
        var layoutConfig = DungeonSettings.dungeon_layout[dungeonLayout];
        // Calculate dimensions
        var cellSize = dungeonSizeConfig.cell;
        var dungeonArea = dungeonSizeConfig.size;
        var aspectRatio = layoutConfig.aspect;
        dungeonData.n_i = Math.floor((dungeonArea * aspectRatio) / cellSize);
        dungeonData.n_j = Math.floor(dungeonArea / cellSize);
        dungeonData.cell_size = cellSize;
        dungeonData.n_rows = 2 * dungeonData.n_i;
        dungeonData.n_cols = 2 * dungeonData.n_j;
        dungeonData.max_row = dungeonData.n_rows - 1;
        dungeonData.max_col = dungeonData.n_cols - 1;
        // Initialize the cell array
        dungeonData.cell = [];
        for (var i = 0; i <= dungeonData.n_rows; i++) {
            dungeonData.cell[i] = [];
            for (var j = 0; j <= dungeonData.n_cols; j++) {
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
    function generateDoors(dungeonData) {
        var doorConnections = {};
        Object.entries(dungeonData.room).forEach(function (_a) {
            var roomId = _a[0], room = _a[1];
            console.log("Processing room with ID: ".concat(roomId), room);
            var doors = attemptDoorPlacement(dungeonData, room);
            console.log("Doors found for room:", roomId, doors);
            if (!doors.length) {
                console.log("No doors found for this room.");
                return; // Skip this room if there are no doors
            }
            var roomArea = Math.sqrt(((room.east - room.west) / 2 + 1) * ((room.south - room.north) / 2 + 1));
            var doorCount = Math.floor(roomArea + random$1(roomArea));
            for (var i = 0; i < doorCount; i++) {
                var door = doors.splice(random$1(doors.length), 1)[0];
                if (!door)
                    break;
                var doorWithAllProperties = {
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
                        var connectionKey = [room.id, doorWithAllProperties.out_id].sort().join(",");
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
        Object.entries(dungeonData.room).forEach(function (_a) {
            var roomId = _a[0], room = _a[1];
            console.warn("Processing room with ID: ".concat(roomId), room);
            var roomIdStr = room.id.toString();
            var roomIdLength = roomIdStr.length;
            var centerRow = Math.floor((room.north + room.south) / 2);
            var centerCol = Math.floor((room.west + room.east - roomIdLength) / 2) + 1;
            // Log room boundaries and center position
            console.warn("Room ID: ".concat(roomIdStr, ", North: ").concat(room.north, ", South: ").concat(room.south, ", West: ").concat(room.west, ", East: ").concat(room.east));
            console.warn("Center Row: ".concat(centerRow, ", Center Col: ").concat(centerCol));
            // Ensure the center position is within bounds
            if (centerRow < 0 || centerRow >= dungeonData.n_rows || centerCol < 0 || centerCol >= dungeonData.n_cols) {
                console.error("Invalid center position for room ".concat(room.id, ": (").concat(centerRow, ", ").concat(centerCol, ")"));
                return;
            }
            for (var i = 0; i < roomIdLength; i++) {
                var labelChar = roomIdStr.charAt(i);
                var labelCode = labelChar.charCodeAt(0);
                // Ensure the cell is within bounds
                if (centerCol + i >= dungeonData.n_cols) {
                    console.error("Label character \"".concat(labelChar, "\" at (").concat(centerRow, ", ").concat(centerCol + i, ") is out of bounds"));
                    continue;
                }
                // Assign the label
                dungeonData.cell[centerRow][centerCol + i] |= labelCode << 24;
            }
        });
        return dungeonData;
    }
    Object.keys(M).sort();
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
    function N(a, b) {
        return a - b;
    }
    function generateCorridors(dungeonData) {
        var corridorLayout = lookupAtIndex("corridor_layout", dungeonData.corridor_layout || "straight");
        var straight_pct = corridorLayout.pct; // Get straight_pct from corridor_layout
        console.log("Starting corridor generation...");
        // Recursive function to generate corridors in a specific direction
        function generateCorridorRecursive(dungeonData, row, col, direction, visited) {
            if (visited === void 0) { visited = new Set(); }
            var cellKey = "".concat(row, ",").concat(col);
            if (visited.has(cellKey)) {
                return dungeonData; // Skip if already visited
            }
            visited.add(cellKey);
            var directions = shuffleDirections(dungeonData, direction, straight_pct);
            //console.log(`Processing cell: (${row}, ${col}), directions: ${directions.join(", ")}`);
            directions.forEach(function (dir) {
                var nextRow = row + P[dir];
                var nextCol = col + M[dir];
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
                        for (var row_1 = 1; row_1 < dungeonData.n_rows; row_1++) {
                            for (var col_1 = 1; col_1 < dungeonData.n_cols; col_1++) {
                                if (dungeonData.cell[row_1][col_1] & 4) { // Check if it's a corridor
                                    // Add walls around the corridor cell
                                    for (var dr = -1; dr <= 1; dr++) {
                                        for (var dc = -1; dc <= 1; dc++) {
                                            if (dr === 0 && dc === 0)
                                                continue; // Skip the corridor cell itself
                                            var newRow = row_1 + dr;
                                            var newCol = col_1 + dc;
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
            });
            return dungeonData;
        }
        // Shuffle directions and prioritize the current direction if straight_pct is set
        function shuffleDirections(dungeonData, currentDirection, straight_pct) {
            var _a;
            var directions = Object.keys(M);
            // Shuffle the directions
            for (var i = directions.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                _a = [directions[j], directions[i]], directions[i] = _a[0], directions[j] = _a[1];
            }
            // Prioritize the current direction if straight_pct is set
            if (currentDirection && straight_pct && Math.random() * 100 < straight_pct) {
                directions.unshift(currentDirection);
            }
            return directions;
        }
        // Start corridor generation from the edges of each room
        Object.values(dungeonData.room).forEach(function (room) {
            // Start from one cell outside the north edge of the room
            var startRow = room.north - 1;
            var startCol = Math.floor((room.west + room.east) / 2);
            if (!(dungeonData.cell[startRow][startCol] & 6)) { // Ensure it's not a wall or room
                dungeonData = generateCorridorRecursive(dungeonData, startRow, startCol);
            }
            // Start from one cell outside the south edge of the room
            var endRow = room.south + 1;
            var endCol = Math.floor((room.west + room.east) / 2);
            if (!(dungeonData.cell[endRow][endCol] & 6)) { // Ensure it's not a wall or room
                dungeonData = generateCorridorRecursive(dungeonData, endRow, endCol);
            }
            // Start from one cell outside the west edge of the room
            var westRow = Math.floor((room.north + room.south) / 2);
            var westCol = room.west - 1;
            if (!(dungeonData.cell[westRow][westCol] & 6)) { // Ensure it's not a wall or room
                dungeonData = generateCorridorRecursive(dungeonData, westRow, westCol);
            }
            // Start from one cell outside the east edge of the room
            var eastRow = Math.floor((room.north + room.south) / 2);
            var eastCol = room.east + 1;
            if (!(dungeonData.cell[eastRow][eastCol] & 6)) { // Ensure it's not a wall or room
                dungeonData = generateCorridorRecursive(dungeonData, eastRow, eastCol);
            }
        });
        console.log("Corridor generation complete.");
        printDungeon(dungeonData); // Print the dungeon grid after corridors are generated
        return dungeonData;
    }
    function finalizeDungeonLayout(dungeonData) {
        for (var i = 0; i <= dungeonData.n_rows; i++) {
            for (var j = 0; j <= dungeonData.n_cols; j++) {
                if (dungeonData.cell[i][j] & 1) {
                    dungeonData.cell[i][j] = 0;
                }
            }
        }
        return dungeonData;
    }
    function ja(grid, row, col, directionDetails) {
        var isValid = true;
        // Check for corridors
        if (directionDetails.corridor) {
            for (var _i = 0, _a = directionDetails.corridor; _i < _a.length; _i++) {
                var offset = _a[_i];
                var cellRow = row + offset[0];
                var cellCol = col + offset[1];
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
            for (var _b = 0, _c = directionDetails.walled; _b < _c.length; _b++) {
                var offset = _c[_b];
                var cellRow = row + offset[0];
                var cellCol = col + offset[1];
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
            var cellRow = row + directionDetails.stair[0];
            var cellCol = col + directionDetails.stair[1];
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
        var cell = dungeonData.cell;
        var stairs = [];
        console.log("Starting stair placement search...");
        var _loop_1 = function (row) {
            var cellRow = 2 * row + 1;
            var _loop_2 = function (col) {
                var cellCol = 2 * col + 1;
                // Check if the cell is a corridor and not already marked as stairs
                if (cell[cellRow][cellCol] & 4 && !(cell[cellRow][cellCol] & 12582912)) {
                    console.log("Found corridor at (".concat(cellRow, ", ").concat(cellCol, ")"));
                    // Check all directions for valid stair placement
                    Object.keys(DirectionConfig).forEach(function (direction) {
                        //console.log(`Checking direction: ${direction} at (${cellRow}, ${cellCol})`);
                        // Validate stair placement using DirectionConfig
                        if (ja(cell, cellRow, cellCol, DirectionConfig[direction])) {
                            //console.log(`Valid stair placement at (${cellRow}, ${cellCol}) in direction ${direction}`);
                            // Create a stair object
                            var stair = {
                                row: cellRow,
                                col: cellCol,
                                next_row: cellRow + DirectionConfig[direction].next[0],
                                next_col: cellCol + DirectionConfig[direction].next[1],
                            };
                            // Add the stair to the list
                            stairs.push(stair);
                        }
                    });
                }
            };
            for (var col = 0; col < dungeonData.n_j; col++) {
                _loop_2(col);
            }
        };
        for (var row = 0; row < dungeonData.n_i; row++) {
            _loop_1(row);
        }
        console.log("Potential stairs found in oa: ".concat(stairs.length));
        return stairs;
    }
    function generateStairs(dungeonData, userSettings) {
        if (!userSettings.add_stairs || userSettings.add_stairs === 'no') {
            console.error("No stairs to be generated, either intentionally or by code error.");
            return dungeonData;
        }
        // Get potential stair positions
        var stairPositions = oa(dungeonData);
        if (!stairPositions.length) {
            console.error("oa not returning valid stair positions.");
            return dungeonData;
        }
        // Determine the number of stairs to place
        var numStairs = 0;
        if (dungeonData.add_stairs === 'many') {
            numStairs = 3 + random$1(Math.floor(dungeonData.n_cols * dungeonData.n_rows / 1000));
        }
        else if (dungeonData.add_stairs === 'yes') {
            numStairs = 2;
        }
        // Place the stairs
        var stairs = [];
        for (var i = 0; i < numStairs; i++) {
            var stair = stairPositions.splice(random$1(stairPositions.length), 1)[0];
            if (!stair)
                break;
            var row = stair.row, col = stair.col;
            // Ensure the cell is not already a door or part of a room
            if (dungeonData.cell[row][col] & 4128769 || dungeonData.cell[row][col] & 2) {
                console.warn("Cannot place stair at (".concat(row, ", ").concat(col, ") - cell is occupied by a door or room."));
                continue; // Skip this stair position
            }
            // Randomly assign the stair type (up or down)
            if (random$1(2) < 1) {
                dungeonData.cell[row][col] |= 4194304; // Down stair
                stair.key = 'down'; // Use `key` instead of `dir`
            }
            else {
                dungeonData.cell[row][col] |= 8388608; // Up stair
                stair.key = 'up'; // Use `key` instead of `dir`
            }
            stairs.push(stair);
            console.log("Placing ".concat(stair.key, " stair at (").concat(row, ", ").concat(col, ")")); // Debugging
        }
        if (stairs.length === 0) {
            console.warn("No stairs were generated.");
        }
        // Update the dungeon data with the placed stairs
        dungeonData.stair = stairs;
        return dungeonData;
    }
    function ha(dungeonData, closeArcs) {
        return fa(dungeonData, closeArcs, DirectionConfig); // Use DirectionConfig.north as an example
    }
    function ka(dungeonData, row, col, directionConfig) {
        var cell = dungeonData.cell;
        // Iterate over each direction in DirectionConfig
        for (var _i = 0, _a = Object.keys(directionConfig); _i < _a.length; _i++) {
            var direction = _a[_i];
            var config = directionConfig[direction];
            // Check if the cell can be processed in this direction
            if (ja(cell, row, col, config)) {
                // Close cells if specified in the configuration
                if (config.close) {
                    for (var _b = 0, _c = config.close; _b < _c.length; _b++) {
                        var _d = _c[_b], dr = _d[0], dc = _d[1];
                        cell[row + dr][col + dc] = 0;
                    }
                }
                // Open cells if specified in the configuration
                if (config.open) {
                    var _e = config.open, dr = _e[0], dc = _e[1];
                    cell[row + dr][col + dc] |= 4; // Mark as corridor
                }
                // Recurse if specified in the configuration
                if (config.recurse) {
                    var _f = config.recurse, dr = _f[0], dc = _f[1];
                    dungeonData = ka(dungeonData, row + dr, col + dc, directionConfig);
                }
            }
        }
        dungeonData.cell = cell;
        return dungeonData;
    }
    function fa(dungeonData, closeArcs, directionConfig) {
        var shouldCloseAll = closeArcs === 100; // Close all arcs if closeArcs is 100
        for (var i = 0; i < dungeonData.n_i; i++) {
            var row = 2 * i + 1;
            for (var j = 0; j < dungeonData.n_j; j++) {
                var col = 2 * j + 1;
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
        var b = {};
        // Convert the `room` object into an array of its values
        Object.values(dungeonData.room).forEach(function (d) {
            console.log('Processing room:', d); // Log the room object
            if (!d) {
                console.error('Room is undefined:', d);
                return;
            }
            if (!d.door) {
                console.error('Room.door is undefined:', d);
                return;
            }
            d.id;
            Object.keys(Direction).forEach(function (c) {
                console.log('Processing direction:', c); // Log the direction
                if (!d.door[c]) {
                    d.door[c] = []; // Initialize as an empty array
                }
                var e = [];
                d.door[c].forEach(function (h) {
                    var k = [h.row, h.col].join();
                    if (dungeonData.cell[h.row][h.col] & 6) {
                        if (b[k]) {
                            e.push(h);
                        }
                        else {
                            if (h.out_id !== undefined) { // Check if out_id is defined
                                var targetRoomId = h.out_id; // Directly use the number
                                if (targetRoomId && dungeonData.room[targetRoomId]) { // Validate targetRoomId
                                    var t = dungeonData.room[targetRoomId]; // Get the room using the room ID
                                    var z = invertDirection(c); // Get the inverted direction
                                    h.out_id = targetRoomId; // Update h.out_id (now a number)
                                    if (!t.door[z]) {
                                        t.door[z] = []; // Initialize as an empty array
                                    }
                                    t.door[z].push(h); // Add the door to the corresponding room
                                }
                                else {
                                    console.warn("Target room with ID ".concat(targetRoomId, " not found in a.room. Skipping door."));
                                }
                            }
                            else {
                                console.warn("Invalid out_id for door at (".concat(h.row, ", ").concat(h.col, "). Skipping door."));
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
        var removeDeadEndsConfig = DungeonSettings.remove_deadends[removeDeadEndsSetting];
        // Ensure the configuration exists and has a valid pct value
        if (!removeDeadEndsConfig || typeof removeDeadEndsConfig.pct !== 'number') {
            console.error('Invalid remove_deadends configuration:', removeDeadEndsConfig);
            return dungeonData; // Return the original data if the configuration is invalid
        }
        // Assign the pct value to close_arcs
        var closeArcs = removeDeadEndsConfig.pct;
        // Process the dungeon data to remove dead ends
        dungeonData = fa(dungeonData, closeArcs, DirectionConfig);
        // Detect and reroute dead-end corridors
        for (var i = 1; i < dungeonData.n_rows; i++) {
            for (var j = 1; j < dungeonData.n_cols; j++) {
                if (dungeonData.cell[i][j] & 4) { // Check if it's a corridor
                    var connections = 0;
                    if (dungeonData.cell[i - 1][j] & 4)
                        connections++; // North
                    if (dungeonData.cell[i + 1][j] & 4)
                        connections++; // South
                    if (dungeonData.cell[i][j - 1] & 4)
                        connections++; // West
                    if (dungeonData.cell[i][j + 1] & 4)
                        connections++; // East
                    if (connections === 1) { // Dead-end detected
                        var directions = [
                            { row: i - 1, col: j }, // North
                            { row: i + 1, col: j }, // South
                            { row: i, col: j - 1 }, // West
                            { row: i, col: j + 1 }, // East
                        ];
                        for (var _i = 0, directions_1 = directions; _i < directions_1.length; _i++) {
                            var dir = directions_1[_i];
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
        var doors = dungeonData.door || [];
        // Finalize doors
        dungeonData = qaFinalizeDoors(dungeonData, doors);
        // Clean up walls
        for (var l = 0; l <= dungeonData.n_rows; l++) {
            for (var q = 0; q <= dungeonData.n_cols; q++) {
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
        var fallbackKey = Ea[key];
        if (fallbackKey && palette[fallbackKey]) {
            return palette[fallbackKey];
        }
        // Default to black if no color is found
        return '#000000';
    }
    function drawBackground(renderSettings, canvasContext) {
        renderSettings.cell_size; var palette = renderSettings.palette; renderSettings.base_layer; var max_x = renderSettings.max_x, max_y = renderSettings.max_y; renderSettings.font;
        // Draw the background (black fill)
        var fillColor = palette.fill || palette.black || '#000000';
        fill_rect(canvasContext, 0, 0, max_x, max_y, fillColor);
    }
    function drawGrid(dungeonData, renderSettings, canvasContext) {
        var cell_size = renderSettings.cell_size, palette = renderSettings.palette; renderSettings.base_layer; var max_x = renderSettings.max_x, max_y = renderSettings.max_y; renderSettings.font;
        var gridColor = palette.grid || palette.open_grid || '#cccccc';
        if (gridColor) {
            for (var x = 0; x <= max_x; x += cell_size) {
                draw_line(canvasContext, x, 0, x, max_y, gridColor);
            }
            for (var y = 0; y <= max_y; y += cell_size) {
                draw_line(canvasContext, 0, y, max_x, y, gridColor);
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
        var cell_size = renderSettings.cell_size, palette = renderSettings.palette; renderSettings.base_layer; renderSettings.max_x; renderSettings.max_y; renderSettings.font;
        var roomColor = palette.open || '#ffffff'; // Default to white if no color is set
        // Debug: Log grid dimensions
        console.log("Grid Dimensions: Rows: ".concat(dungeonData.n_rows, ", Cols: ").concat(dungeonData.n_cols));
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                // Debug: Log cell value and position
                console.log("Row: ".concat(row, ", Col: ").concat(col, ", Cell Value: ").concat(dungeonData.cell[row][col]));
                // Check if the cell is a room (value 2)
                if (dungeonData.cell[row][col] & 2) {
                    var x = col * cell_size;
                    var y = row * cell_size;
                    // Debug: Log drawing coordinates
                    console.log("Drawing room at (".concat(x, ", ").concat(y, ")"));
                    // Draw the room cell
                    //canvasContext.drawImage(base_layer, x, y, cell_size, cell_size, x, y, cell_size, cell_size);
                    fill_rect(canvasContext, x, y, cell_size, cell_size, roomColor);
                }
            }
        }
    }
    // Draw labels (room IDs)
    function drawLabels(dungeonData, renderSettings, canvasContext) {
        var cell_size = renderSettings.cell_size, palette = renderSettings.palette, font = renderSettings.font;
        var labelColor = palette.label || '#000000'; // Default to black if no color is set
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                var cellValue = dungeonData.cell[row][col];
                var roomId = (cellValue >> 6) & 255; // Decode room ID
                // Ensure the room ID is a printable ASCII character (32–126)
                if (roomId >= 32 && roomId <= 126) {
                    var labelChar = String.fromCharCode(roomId);
                    var x = col * cell_size + cell_size / 2;
                    var y = row * cell_size + cell_size / 2 + 1;
                    draw_string(canvasContext, labelChar, x, y, font, labelColor);
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
        var cell_size = renderSettings.cell_size, palette = renderSettings.palette; renderSettings.base_layer; renderSettings.max_x; renderSettings.max_y; renderSettings.font;
        var wallColor = palette.wall || '#666666';
        var wallShadingColor = palette.wall_shading || '#cccccc';
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                if (dungeonData.cell[row][col] & 16) { // Check if it's a wall
                    var x = col * cell_size;
                    var y = row * cell_size;
                    // Draw wall shading
                    if (wallShadingColor) {
                        for (var i = x; i <= x + cell_size; i++) {
                            for (var j = y; j <= y + cell_size; j++) {
                                if ((i + j) % 2 !== 0) {
                                    set_pixel(canvasContext, i, j, wallShadingColor);
                                }
                            }
                        }
                    }
                    // Draw walls
                    if (wallColor) {
                        if (!(((_a = dungeonData.cell[row - 1]) === null || _a === void 0 ? void 0 : _a[col]) & 6)) { // North wall
                            draw_line(canvasContext, x, y, x + cell_size, y, wallColor);
                        }
                        if (!(dungeonData.cell[row][col - 1] & 6)) { // West wall
                            draw_line(canvasContext, x, y, x, y + cell_size, wallColor);
                        }
                        if (!(dungeonData.cell[row][col + 1] & 6)) { // East wall
                            draw_line(canvasContext, x + cell_size, y, x + cell_size, y + cell_size, wallColor);
                        }
                        if (!(((_b = dungeonData.cell[row + 1]) === null || _b === void 0 ? void 0 : _b[col]) & 6)) { // South wall
                            draw_line(canvasContext, x, y + cell_size, x + cell_size, y + cell_size, wallColor);
                        }
                    }
                }
            }
        }
    }
    // Function to draw doors
    function drawDoors(dungeonData, renderSettings, canvasContext) {
        var cellSize = renderSettings.cell_size;
        var doorColor = renderSettings.palette.door || '#333333';
        // Iterate over all rooms to find doors
        Object.values(dungeonData.room).forEach(function (room) {
            // Iterate over all directions (north, south, east, west) in the room
            Object.keys(room.door).forEach(function (direction) {
                // Iterate over all doors in the current direction
                room.door[direction].forEach(function (door) {
                    var x = door.col * cellSize;
                    var y = door.row * cellSize;
                    // Draw the door based on its type
                    switch (door.key) {
                        case 'arch':
                            fill_rect(canvasContext, x, y, cellSize, cellSize, doorColor);
                            break;
                        case 'open':
                            stroke_rect(canvasContext, x, y, cellSize, cellSize, doorColor);
                            break;
                        case 'lock':
                            stroke_rect(canvasContext, x, y, cellSize, cellSize, doorColor);
                            drawLockSymbol(canvasContext, x, y, cellSize, doorColor);
                            break;
                        case 'trap':
                            stroke_rect(canvasContext, x, y, cellSize, cellSize, doorColor);
                            drawTrapSymbol(canvasContext, x, y, cellSize, doorColor);
                            break;
                        case 'secret':
                            stroke_rect(canvasContext, x, y, cellSize, cellSize, doorColor);
                            drawSecretEffect(canvasContext, x, y, cellSize, doorColor);
                            break;
                        case 'portc':
                            drawPortcullis(canvasContext, x, y, cellSize, doorColor);
                            break;
                        default:
                            console.warn("Unknown door type: ".concat(door.key));
                            break;
                    }
                });
            });
        });
    }
    // Function to draw stairs
    function drawStairs(dungeonData, renderSettings, canvasContext) {
        var cell_size = renderSettings.cell_size, palette = renderSettings.palette;
        var stairColor = palette.stair || palette.wall || '#666666';
        // Iterate over the dungeon grid to find stairs
        for (var row = 0; row <= dungeonData.n_rows; row++) {
            for (var col = 0; col <= dungeonData.n_cols; col++) {
                var cellValue = dungeonData.cell[row][col];
                // Check if the cell contains stairs
                if (cellValue & 4194304) { // Down stair
                    var x = col * cell_size;
                    var y = row * cell_size;
                    draw_line(canvasContext, x + cell_size / 2, y, x + cell_size / 2, y + cell_size, stairColor);
                }
                else if (cellValue & 8388608) { // Up stair
                    var x = col * cell_size;
                    var y = row * cell_size;
                    draw_line(canvasContext, x, y + cell_size / 2, x + cell_size, y + cell_size / 2, stairColor);
                }
            }
        }
    }
    function drawLockSymbol(canvasContext, x, y, cellSize, color) {
        var lockSize = Math.floor(cellSize / 4);
        var lockX = x + Math.floor(cellSize / 2) - Math.floor(lockSize / 2);
        var lockY = y + Math.floor(cellSize / 2) - Math.floor(lockSize / 2);
        // Draw the lock body
        fill_rect(canvasContext, lockX, lockY, lockSize, lockSize, color);
        // Draw the lock bolt
        var boltSize = Math.floor(lockSize / 2);
        var boltX = lockX + Math.floor(lockSize / 4);
        var boltY = lockY - Math.floor(boltSize / 2);
        fill_rect(canvasContext, boltX, boltY, boltSize, boltSize, color);
    }
    function drawTrapSymbol(canvasContext, x, y, cellSize, color) {
        var trapSize = Math.floor(cellSize / 4);
        var trapX = x + Math.floor(cellSize / 2) - Math.floor(trapSize / 2);
        var trapY = y + Math.floor(cellSize / 2) - Math.floor(trapSize / 2);
        // Draw the trap base
        fill_rect(canvasContext, trapX, trapY, trapSize, trapSize, color);
        // Draw the trap spikes
        var spikeSize = Math.floor(trapSize / 4);
        var spikeX = trapX + Math.floor(trapSize / 2) - Math.floor(spikeSize / 2);
        var spikeY = trapY - spikeSize;
        fill_rect(canvasContext, spikeX, spikeY, spikeSize, spikeSize, color);
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
        var barWidth = Math.floor(cellSize / 10);
        var barSpacing = Math.floor(cellSize / 5);
        canvasContext.fillStyle = color;
        for (var i = 0; i < 5; i++) {
            var barX = x + i * barSpacing;
            canvasContext.fillRect(barX, y, barWidth, cellSize);
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
        var mainCanvas = renderSettings.base_layer;
        if (!(mainCanvas instanceof HTMLCanvasElement)) {
            console.error("Invalid base_layer in renderSettings. Expected an HTMLCanvasElement.");
            return;
        }
        var mainContext = mainCanvas.getContext('2d');
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
        var rndDungName = generate_text("Dungeon Name");
        console.log("Generated dungeon name:", rndDungName);
        $("#dungeon_name").val(rndDungName); // Use .val() instead of .text() for input fields
        var dungeonData = updateAndGenerateDungeon();
        return dungeonData;
    }
    function updateAndGenerateDungeon() {
        console.log("Updating and generating dungeon");
        // Retrieve user settings
        var userSettings = getUserSettings();
        console.log("Selected Dungeon Settings before generation:", userSettings);
        // Generate dungeon configuration
        var dungeonData = generateDungeonDataConfig(userSettings);
        console.log("Dungeon Config after generation:", dungeonData);
        // Generate rooms
        var roomConfig = {
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
        var renderSettings = generateRenderSettings(dungeonData, userSettings);
        console.log("Render settings generated:", renderSettings);
        // Render the dungeon
        renderDungeon(dungeonData, renderSettings);
        console.log('Render the dungeon should be complete now');
        return dungeonData;
    }
    function generateRenderSettings(dungeonData, selectedSettings) {
        var dcCellSize = dungeonData.cell_size || 18;
        // Ensure the canvas element exists
        var baseLayer = document.getElementById("map");
        if (!baseLayer) {
            throw new Error("Canvas element with ID 'map' not found.");
        }
        var width = (dungeonData.n_cols + 1) * dcCellSize + 1;
        var height = (dungeonData.n_rows + 1) * dcCellSize + 1;
        var max_x = (dungeonData.n_cols + 1) * dcCellSize;
        var max_y = (dungeonData.n_rows + 1) * dcCellSize;
        var font = Math.floor(0.75 * dcCellSize).toString() + 'px sans-serif';
        var grid = selectedSettings.grid !== 'none'; // Enable grid if not 'none'
        baseLayer.width = width;
        baseLayer.height = height;
        // Generate the palette based on the selected map style
        var palette = generatePalette(selectedSettings.map_style);
        var renderSettings = {
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
        var savDungName = $("#dungeon_name").val();
        save_canvas($("map"), "".concat(savDungName, ".png"));
    }
    // Event listeners
    document.addEventListener("DOMContentLoaded", function () {
        // Populate the dropdowns
        initializeDropdowns();
        // Generate the initial dungeon
        var userSettings = getUserSettings();
        generateDungeonDataConfig(userSettings);
        // Generate the initial dungeon
        generateNewDungeon();
        // Event listeners for dungeon name input and "New" button
        $("#dungeon_name").on("change", function () {
            console.log("Dungeon name changed:", $("#dungeon_name").val());
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#new_name").on("click", function () {
            console.log("New name button clicked");
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        // Event listeners for other settings to trigger dungeon regeneration
        $("#map_style").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#grid").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#dungeon_layout").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#dungeon_size").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#add_stairs").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#room_layout").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#room_size").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#doors").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#corridor_layout").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        $("#remove_deadends").on("change", function () {
            var userSettings = getUserSettings();
            generateDungeonDataConfig(userSettings);
            generateNewDungeon();
        });
        // Event listeners for saving and printing the dungeon
        $("#save_map").on("click", saveDungeon);
        // $("#print_map").on("click", () => {
        //     window.print();
        // });
    });
    function createRoom(dungeonData, roomConfig, roomParams) {
        if (dungeonData.n_rooms === 999) {
            return dungeonData; // Maximum number of rooms reached
        }
        var size = roomParams.size || roomConfig.size;
        console.log("Creating room with size: ".concat(size));
        var d = DungeonSettings.room_size[size];
        if (!d) {
            console.error("Room size configuration not found for size: ".concat(size));
            return dungeonData;
        }
        var g = d.size || 2;
        var width = d.radix || 5;
        // Ensure height is defined
        if (!('height' in roomParams)) {
            if ('i' in roomParams) {
                var c = dungeonData.n_i - g - roomParams.i;
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
                var c = dungeonData.n_j - g - roomParams.j;
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
        var i = roomParams.i, j = roomParams.j, height = roomParams.height, roomWidth = roomParams.width;
        var bStart = 2 * i + 1;
        var gStart = 2 * j + 1;
        var dEnd = 2 * (i + height) - 1;
        var cEnd = 2 * (j + roomWidth) - 1;
        if (bStart < 1 || dEnd > dungeonData.max_row || gStart < 1 || cEnd > dungeonData.max_col) {
            return dungeonData; // Room is out of bounds
        }
        var k = {};
        for (var row = bStart; row <= dEnd; row++) {
            for (var col = gStart; col <= cEnd; col++) {
                if (dungeonData.cell[row][col] & 1) {
                    k = { blocked: 1 };
                    break;
                }
                if (dungeonData.cell[row][col] & 2) {
                    var roomId_1 = (dungeonData.cell[row][col] & 65472) >> 6; // Decode room number
                    if (!('blocked' in k)) {
                        k[roomId_1] = (k[roomId_1] || 0) + 1;
                    }
                }
            }
        }
        if ('blocked' in k && k.blocked) {
            return dungeonData; // Room overlaps with a wall
        }
        var keys = Object.keys(k);
        var roomId;
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
            console.error("Invalid roomId: ".concat(roomId, ". Defaulting to 1."));
            roomId = 1;
        }
        for (var row = bStart; row <= dEnd; row++) {
            for (var col = gStart; col <= cEnd; col++) {
                dungeonData.cell[row][col] = 2 | (roomId << 6); // room encoding - per js lets keep this final
                console.log("Room ID: ".concat(roomId, ", Encoded Value: ").concat(dungeonData.cell[row][col])); // Debugging
            }
        }
        var newRoom = {
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
        for (var row = newRoom.north - 1; row <= newRoom.south + 1; row++) {
            for (var col = newRoom.west - 1; col <= newRoom.east + 1; col++) {
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
        var doors = [];
        // Handle complex rooms
        if (b.complex && Array.isArray(b.complex)) {
            b.complex.forEach(function (subRoom) {
                var subRoomDoors = attemptDoorPlacement(a, subRoom);
                if (subRoomDoors.length > 0) {
                    doors.push.apply(doors, subRoomDoors);
                }
            });
        }
        var north = b.north, south = b.south, west = b.west, east = b.east;
        // Check each side of the room for adjacent rooms
        if (north >= 3) {
            for (var col = west; col <= east; col += 2) {
                var door = calculateDoor(a, b, north, col, 'north');
                if (door)
                    doors.push(door);
            }
        }
        if (south <= a.n_rows - 3) {
            for (var col = west; col <= east; col += 2) {
                var door = calculateDoor(a, b, south, col, 'south');
                if (door)
                    doors.push(door);
            }
        }
        if (west >= 3) {
            for (var row = north; row <= south; row += 2) {
                var door = calculateDoor(a, b, row, west, 'west');
                if (door)
                    doors.push(door);
            }
        }
        if (east <= a.n_cols - 3) {
            for (var row = north; row <= south; row += 2) {
                var door = calculateDoor(a, b, row, east, 'east');
                if (door)
                    doors.push(door);
            }
        }
        return doors;
    }
    function calculateDoor(a, b, row, col, dir) {
        var doorRow = row + P[dir];
        var doorCol = col + M[dir];
        // Check if the door cell is within bounds
        if (doorRow < 0 || doorRow > a.n_rows || doorCol < 0 || doorCol > a.n_cols) {
            return null;
        }
        var cellValue = a.cell[doorRow][doorCol];
        // Check if the cell is a wall and not already a door or stair
        if (!(cellValue & 16) || (cellValue & 4128769)) { // parens important here
            return null;
        }
        // Check the adjacent cell (inside the room)
        var adjacentRow = doorRow + P[dir];
        var adjacentCol = doorCol + M[dir];
        if (adjacentRow < 0 || adjacentRow > a.n_rows || adjacentCol < 0 || adjacentCol > a.n_cols) {
            return null;
        }
        var adjacentCell = a.cell[adjacentRow][adjacentCol];
        // Ensure the adjacent cell is not a wall
        if (adjacentCell & 1) {
            return null;
        }
        // Check if the door connects to itself
        var adjacentRoomId = (adjacentCell & 2) ? (adjacentCell & 65472) >> 6 : null; // decode room number
        if (adjacentRoomId === b.id) {
            return null; // Reject if the door connects to the same room
        }
        // Assign out_id based on the adjacent cell
        var myout = (adjacentCell & 2) ? ((adjacentCell & 65472) >> 6) : undefined; // parens important here -  decode room number - default to undefined for empty spaces
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
        var sizeConfig = DungeonSettings.room_size[roomSize];
        if (!sizeConfig) {
            console.error("Invalid room size: ".concat(roomSize));
            return 0;
        }
        // Calculate room dimensions based on size
        var roomArea = (sizeConfig.size || 2) + (sizeConfig.radix || 5) + 1;
        var totalRooms = 2 * Math.floor((dungeonData.n_cols * dungeonData.n_rows) / (roomArea * roomArea));
        // Adjust room count based on layout
        if (roomLayout === 'sparse') {
            totalRooms /= 13; // Sparse layout has fewer rooms
        }
        return totalRooms;
    }
    function extractDoorPositions(dungeonData, room) {
        var doorPositions = [];
        console.log("Room passed to extractDoorPositions:", room);
        // Iterate through the doors of the room
        for (var _i = 0, _a = Object.keys(room.door); _i < _a.length; _i++) {
            var direction = _a[_i];
            for (var _b = 0, _c = room.door[direction]; _b < _c.length; _b++) {
                var door = _c[_b];
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
        // Calculate the total number of rooms to generate
        var roomCount = calculateRoomDimensions(dungeonData, roomConfig.size || 'medium', userSettings.room_layout);
        // Generate rooms using a loop
        for (var i = 0; i < roomCount; i++) {
            var validPlacement = false;
            var attempts = 0;
            while (!validPlacement && attempts < 100) {
                var newRoomConfig = {
                    size: roomConfig.size || 'medium', // Default to 'medium' if size is not provided
                    i: random$1(dungeonData.n_i), // Random row position
                    j: random$1(dungeonData.n_j), // Random column position
                };
                // Calculate room dimensions based on size
                var roomSize = lookupAtIndex("room_size", newRoomConfig.size);
                var roomHeight = roomSize.size || 2; // Default height if not specified
                var roomWidth = roomSize.radix || 5; // Default width if not specified
                // Check if the room fits within the dungeon boundaries
                if (newRoomConfig.i + roomHeight > dungeonData.n_i || newRoomConfig.j + roomWidth > dungeonData.n_j) {
                    attempts++;
                    continue; // Skip this placement if the room doesn't fit
                }
                // Check for overlaps with existing rooms or corridors
                var overlap = false;
                for (var row = newRoomConfig.i; row < newRoomConfig.i + roomHeight; row++) {
                    for (var col = newRoomConfig.j; col < newRoomConfig.j + roomWidth; col++) {
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
                    console.log("Created room at (".concat(newRoomConfig.i, ", ").concat(newRoomConfig.j, ") with size: ").concat(newRoomConfig.size));
                }
                attempts++;
            }
        }
        // Handle huge rooms if necessary
        if (roomConfig.huge_rooms) {
            var hugeRoomCount = calculateRoomDimensions(dungeonData, 'medium', userSettings.room_layout);
            for (var i = 0; i < hugeRoomCount; i++) {
                dungeonData = createRoom(dungeonData, roomConfig, { size: 'medium' }); // Pass size: 'medium' to createRoom
            }
        }
        return dungeonData;
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
        var doorTypeConfig = DungeonSettings.doors[doorConfig.door_type];
        if (!doorTypeConfig || !doorTypeConfig.table) {
            console.error("Invalid door type configuration:", doorTypeConfig);
            return dungeonData;
        }
        // Randomly select a door type from the configuration table
        var selectedDoor = select_from_table(doorTypeConfig.table);
        var doorEntry = { row: doorConfig.doorRowIndex, col: doorConfig.doorColIndex, key: '', type: '' };
        // Map door flags to their corresponding types
        var doorTypes = {
            65536: { key: 'arch', type: 'Archway' },
            131072: { key: 'open', type: 'Unlocked Door' },
            262144: { key: 'lock', type: 'Locked Door' },
            524288: { key: 'trap', type: 'Trapped Door' },
            1048576: { key: 'secret', type: 'Secret Door' },
            2097152: { key: 'portc', type: 'Portcullis' }
        };
        // Determine the door type based on the selected flag
        var doorType = doorTypes[selectedDoor];
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
        console.log("Placed door at (".concat(doorConfig.doorRowIndex, ", ").concat(doorConfig.doorColIndex, ") with type: ").concat(doorEntry.type));
        console.log("Door configuration:", doorConfig);
        console.log("Selected door type:", selectedDoor);
        return dungeonData;
    }
    function scale_table(a) {
        var c = 0;
        for (var b in a) {
            var d = key_range(b);
            d[1] > c && (c = d[1]);
        }
        return c;
    }
    function key_range(a) {
        var c;
        return (c = /(\d+)-00/.exec(a)) ? [parseInt(c[1], 10), 100] :
            (c = /(\d+)-(\d+)/.exec(a)) ? [parseInt(c[1], 10), parseInt(c[2], 10)] :
                '00' == a ? [100, 100] : [parseInt(a, 10), parseInt(a, 10)];
    }

    exports.N = N;
    exports.attemptDoorPlacement = attemptDoorPlacement;
    exports.calculateDungeonDimensions = calculateDungeonDimensions;
    exports.calculateRoomDimensions = calculateRoomDimensions;
    exports.da = da;
    exports.extractDoorPositions = extractDoorPositions;
    exports.generateCorridors = generateCorridors;
    exports.generateDoors = generateDoors;
    exports.generateDungeonDataConfig = generateDungeonDataConfig;
    exports.generateStairs = generateStairs;
    exports.getPaletteColor = getPaletteColor;
    exports.key_range = key_range;
    exports.lookupAtIndex = lookupAtIndex;
    exports.removeDeadEnds = removeDeadEnds;
    exports.scale_table = scale_table;

    return exports;

})({});
//# sourceMappingURL=bundle.js.map
