"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_text = generate_text;
exports.select_from = select_from;
exports.select_from_array = select_from_array;
exports.select_from_table = select_from_table;
exports.scale_table = scale_table;
exports.key_range = key_range;
exports.new_trace = new_trace;
exports.local_trace = local_trace;
exports.expand_tokens = expand_tokens;
exports.getStringFromGenData = getStringFromGenData;
exports.expand_token = expand_token;
const types_1 = require("./types");
const gen_data_1 = require("./dungeon/gen_data");
'use strict';
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
function generate_text(a) {
    console.log("Generating text for key:", a); // Log the key being used
    if (gen_data_1.gen_data[a]) {
        let selected = select_from(gen_data_1.gen_data[a]);
        console.log("Selected value:", selected); // Log the selected value
        if (selected) {
            let c = new_trace();
            let expanded = expand_tokens(selected.toString(), c);
            console.log("Expanded tokens:", expanded); // Log the expanded tokens
            return expanded;
        }
        else {
            console.error("select_from returned undefined or null.");
        }
    }
    else {
        console.error(`Key "${a}" not found in gen_data.`);
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
        const table = a;
        const result = select_from_table(table);
        // Validate the result
        const validDoorTypes = [65536, 131072, 262144, 524288, 1048576, 2097152];
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
    const total = scale_table(table); // Get the maximum range value
    const roll = random(total); // Generate a random number within the range
    for (const [key, value] of Object.entries(table)) {
        if (typeof value === 'number') { // Ensure the value is a number
            const [min, max] = key_range(key); // Parse the key range
            if (roll >= min && roll <= max) {
                return value; // Return the corresponding value
            }
        }
    }
    //console.log("No valid door type found for roll:", roll);
    return 131072; // Default to 'Unlocked Door' if no match is found
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
function new_trace() {
    return new Trace();
}
function local_trace(a) {
    let c = Object.assign({}, a);
    c['var'] = Object.assign({}, a['var']);
    return c;
}
function expand_tokens(a, c) {
    let b = /\${ ([^{}]+) }/;
    let d;
    let match;
    while ((d = b.exec(a)) && (match = d[1])) {
        match = d[1];
        let e;
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
    let b;
    console.log(`Expanding token: ${a}`);
    // Handle tokens like ${ Dungeon Type }
    if (gen_data_1.gen_data[a]) {
        return select_from(gen_data_1.gen_data[a]); // Replace the token with a value from gen_data
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
        let tokens = b[1].split(/,\s*/);
        return expand_tokens(select_from_array(tokens), c);
    }
    // Data expansion
    else if (b = /^alt (.+) def (.+)/.exec(a)) {
        const key1 = b[1];
        const key2 = b[2];
        let d1 = select_from(gen_data_1.gen_data[key1]);
        let d2 = select_from(gen_data_1.gen_data[key2]);
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
        let newC = local_trace(c);
        return expand_token(b[1], newC);
    }
    // New trace expansion
    else if (b = /^new (.+)/.exec(a)) {
        let newC = new_trace();
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
        let varName = b[1];
        let defaultValue = b[2];
        let value = c['var'][varName];
        if (!value) {
            return set_var(varName, defaultValue, c);
        }
        else {
            return value;
        }
    }
    // Get variable (simple)
    else if (b = /^get (\w+)/.exec(a)) {
        let varName = b[1];
        let value = c['var'][varName];
        if (!value) {
            throw new Error(`Variable '${varName}' not defined`);
        }
        else {
            return value;
        }
    }
    // Shift array
    else if (b = /^shift (\w+) = (.+)/.exec(a)) {
        let varName = b[1];
        let values = b[2].split(/,\s*/);
        c['var'][varName] = values;
        c['var'][varName].shift();
        return '';
    }
    // Shift array (simple)
    else if (b = /^shift (\w+)/.exec(a)) {
        let varName = b[1];
        if (!c['var'][varName]) {
            throw new Error(`Variable '${varName}' not defined`);
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
        let result = expand_token(b[1], c);
        return ucfirst(result);
    }
    // No the
    else if (b = /^nt (.+)/.exec(a)) {
        return nothe(expand_token(b[1], c));
    }
    // Lowercase
    else if (b = /^lc (.+)/.exec(a)) {
        let result = expand_token(b[1], c);
        return lc(result);
    }
    // Inline case
    else if (b = /^lf (.+)/.exec(a)) {
        let result = expand_token(b[1], c);
        return inline_case(result);
    }
    // Lower the
    else if (b = /^lt (.+)/.exec(a)) {
        return lthe(expand_token(b[1], c));
    }
    // Uppercase
    else if (b = /^uc (.+)/.exec(a)) {
        let result = expand_token(b[1], c);
        return uc(result);
    }
    // First uppercase letter
    else if (b = /^uf (.+)/.exec(a)) {
        let result = expand_token(b[1], c);
        return ucfirst(result);
    }
    // Sentence case
    else if (b = /^sc (.+)/.exec(a)) {
        let result = expand_token(b[1], c);
        return lc(result);
    }
    // Title case
    else if (b = /^tc (.+)/.exec(a)) {
        let result = expand_token(b[1], c);
        return title_case(result);
    }
    // Generate name
    else if (b = /^gen_name (.+)/.exec(a)) {
        const nameType = b[1].trim(); // Extract and trim the name type
        return generate_name(nameType); // Call generate_name with the extracted type
    }
    // Default case
    else {
        return a;
    }
}
function expand_x(a, c, b) {
    let d = {}, e = {}, f = [], l = b.comma || ', ';
    let andMatch;
    for (; andMatch = /^(and|literal|unique) (.+)/.exec(c);)
        d[andMatch[1]] = !0, c = andMatch[2];
    let k;
    for (k = 0; k < a; k++) {
        let g = c.toString();
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
            const match = /^(\d+) x (.+)/.exec(g);
            if (match) {
                e[match[2]] = (e[match[2]] || 0) + parseInt(match[1], 10);
            }
            else {
                const increment = (e[g] || 0) + 1;
                e[g] = increment;
            }
        }
    }
    Object.keys(e).sort().forEach(h => {
        if (e[h] > 1) {
            f.push([e[h], h].join(' x '));
        }
        else {
            f.push(h);
        }
    });
    let popped;
    return d.and ? (popped = f.pop(),
        (popped !== undefined ? [f.join(l), popped].join(' and ') : f.join(l))) : f.join(l);
}
function expand_unique(a, c) {
    let b;
    for (b = 0; 100 > b; b++) {
        let d = expand_token(a, c);
        if (!c.exclude[d])
            return c.exclude[d] = !0, d;
    }
    return '';
}
function set_var(a, c, b) {
    if ('npc_name' == a) {
        let d;
        (d = /^(.+?) .+/.exec(c)) ? b['var'].name = d[1] : b['var'].name = c;
    }
    return b['var'][a] = c;
}
function aoran(a) {
    return /^the /i.test(a) ? a : /^(nunchaku)/i.test(a) ? a : /^(unicorn|unique|university)/i.test(a) ? `a ${a}` : /^(hour)/i.test(a) ? `an ${a}` : /^[BCDGJKPQTUVWYZ][A-Z0-9]+/.test(a) ? `a ${a}` : /^[AEFHILMNORSX][A-Z0-9]+/.test(a) ? `an ${a}` : /^[aeiou]/i.test(a) ? `an ${a}` : `a ${a}`;
}
function nothe(a) {
    let c;
    return (c = /^the (.+)/i.exec(a)) ? c[1] : a;
}
function lc(a) {
    return a.toLowerCase();
}
function lcfirst(a) {
    let c;
    return (c = /^([a-z])(.*)/i.exec(a)) ? lc(c[1]) + c[2] : a;
}
function inline_case(a) {
    return /^[A-Z][A-Z]/.test(a) ? a : lcfirst(a);
}
function lthe(a) {
    let c;
    return (c = /^the (.+)/i.exec(a)) ? `the ${c[1]}` : a;
}
function uc(a) {
    return a.toUpperCase();
}
function ucfirst(a) {
    let c;
    return (c = /^([a-z])(.*)/i.exec(a)) ? uc(c[1]) + c[2] : a;
}
function title_case(a) {
    return a.split(/\s+/).map(uc).join(' ');
}
function generate_name(nameType) {
    const names = types_1.name_set[nameType];
    if (!names || names.length === 0) {
        console.error(`No names found for type: ${nameType}`);
        return "Unknown";
    }
    return names[Math.floor(Math.random() * names.length)];
}
function roll_dice_str(a) {
    // Implement the roll_dice_str function
    return `${a}`;
}
function random(max) {
    return Math.floor(Math.random() * max);
}
