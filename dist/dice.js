// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// dice.ts
//
// written by drow <drow@bin.sh>
// http://creativecommons.org/licenses/by-nc/3.0/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.dicerolls = void 0;
const dicerolls = ((k, l) => l(k))(window, (k) => {
    function l(a) {
        let c = q(a);
        c = p(c);
        console.log(JSON.stringify(c));
        return c.string.replace(/\{(\w+)\}/g, (b, d) => c[d].value);
    }
    function q(a) {
        let c = { string: a };
        [
            {
                regex: /(\d*)d(\d+)/, fn: (b, d, h) => {
                    let rollCount = parseInt(d, 10) || 1;
                    let dieFaces = parseInt(h, 10);
                    let isD20 = rollCount === 1 && dieFaces === 20;
                    let rollId = m();
                    let rollResult = {
                        n: rollCount,
                        d: dieFaces,
                        d20: isD20,
                        vx: [],
                        sx: [],
                        value: 0,
                        roll_die: () => Math.floor(Math.random() * rollResult.d) + 1,
                        fmt_die: (g) => rollResult.d20 && g === 1 ? `<b class="miss">${g}</b>` : rollResult.d20 && g === 20 ? `<b class="crit">${g}</b>` : g === 1 || g === rollResult.d ? `<b>${g}</b>` : g,
                        sum: (g) => g.reduce((n, r) => n + r),
                        fmt_pool: (g) => `${rollResult.n}d${rollResult.d} (${g.join(', ')})`
                    };
                    for (let i = 0; i < rollCount; i++) {
                        let roll = rollResult.roll_die();
                        rollResult.sx.push(rollResult.fmt_die(roll));
                        rollResult.vx.push(roll);
                    }
                    rollResult.value = rollResult.sum(rollResult.vx);
                    rollResult.str = rollResult.fmt_pool(rollResult.sx);
                    c[rollId] = rollResult;
                    return `{${rollId}}`;
                }
            },
            {
                regex: /(\d+\.\d+|\d+)/, fn: (b, d) => {
                    let value = parseFloat(d);
                    let valueId = m();
                    c[valueId] = { value, str: value.toString(10) };
                    return `{${valueId}}`;
                }
            }
        ].forEach(rule => {
            while (rule.regex.test(c.string)) {
                c.string = c.string.replace(rule.regex, rule.fn);
            }
        });
        return c;
    }
    function p(a) {
        [
            {
                regex: /([a-z]*)\(([^()]+)\)/, fn: (c, b, d) => {
                    a.string = d;
                    a = p(a);
                    let resultId = m();
                    a.string = a.string.replace(/\{(\w+)\}/, (f, e) => {
                        let value = a[e].value;
                        let str = `${b}(${a[e].str})`;
                        if (b === 'avg') {
                            if (a[e].n && a[e].d) {
                                value = a[e].n * (a[e].d + 1) / 2;
                            }
                        }
                        else if (b === 'int') {
                            value = Math.floor(value);
                        }
                        else if (b === 'round') {
                            value = Math.floor(value + 0.5);
                        }
                        else if (b === 'sqrt') {
                            value = Math.sqrt(value);
                        }
                        else if ((b === 'adv' || b === 'dis') && a[e].d20) {
                            let roll = a[e].roll_die();
                            let formattedRoll = a[e].fmt_die(roll);
                            if ((b === 'adv' && roll > a[e].vx[0]) || (b === 'dis' && roll < a[e].vx[0])) {
                                value = roll;
                                str = `${b}(${a[e].fmt_pool([`<s>${a[e].sx[0]}</s>`, formattedRoll])})`;
                            }
                            else {
                                str = `${b}(${a[e].fmt_pool([a[e].sx[0], `<s>${formattedRoll}</s>`])})`;
                            }
                        }
                        a[resultId] = { value, str };
                        return `{${resultId}}`;
                    });
                    return `{${resultId}}`;
                }
            },
            {
                regex: /\{(\w+)\}\s*(\*|\/|%)\s*\{(\w+)\}/, fn: (c, b, d, h) => {
                    let resultId = m();
                    let value;
                    value = 0; // Initialize value to 0 or any default value
                    let str = `${a[b].str} ${d} ${a[h].str}`;
                    if (d === '*') {
                        value = a[b].value * a[h].value;
                    }
                    else if (d === '/') {
                        value = a[b].value / a[h].value;
                    }
                    else if (d === '%') {
                        value = a[b].value % a[h].value;
                    }
                    a[resultId] = { value, str };
                    return `{${resultId}}`;
                }
            },
            {
                regex: /\{(\w+)\}\s*(\+|\-)\s*\{(\w+)\}/, fn: (c, b, d, h) => {
                    let resultId = m();
                    let value;
                    let str = `${a[b].str} ${d} ${a[h].str}`;
                    if (d === '+') {
                        value = a[b].value + a[h].value;
                    }
                    else if (d === '-') {
                        value = a[b].value - a[h].value;
                    }
                    value = 0; // Initialize value to 0 or any default value
                    a[resultId] = { value, str };
                    return `{${resultId}}`;
                }
            }
        ].forEach(rule => {
            while (rule.regex.test(a.string)) {
                a.string = a.string.replace(rule.regex, rule.fn);
            }
        });
        return a;
    }
    function m() {
        let randomValue = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        let chars = [];
        while (randomValue > 0) {
            chars.push(String.fromCharCode(97 + randomValue % 26));
            randomValue = Math.floor(randomValue / 26);
        }
        return chars.join('');
    }
    k.roll_dice = function (a) { return parseInt(l(a)); };
    k.roll_dice_fp = function (a) { return parseFloat(l(a)); };
    k.roll_dice_str = l;
    k.roll_dice_det = function (a) {
        let c = q(a);
        c = p(c);
        console.log(JSON.stringify(c));
        return c.string.replace(/\{(\w+)\}/g, (b, d) => {
            let str = c[d].str;
            let value = c[d].value;
            if (!Number.isInteger(value)) {
                value = Math.floor(100 * value + 0.5) / 100;
            }
            return `<span class="str">${str}</span> = <b>${value}</b>`;
        });
    };
});
exports.dicerolls = dicerolls;
