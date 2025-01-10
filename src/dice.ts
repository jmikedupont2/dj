// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// dice.ts
//
// written by drow <drow@bin.sh>
// http://creativecommons.org/licenses/by-nc/3.0/
'use strict';

// Extend the Window interface to include our custom properties
interface CustomWindow extends Window {
    roll_dice: (a: string) => number;
    roll_dice_fp: (a: string) => number;
    roll_dice_str: (a: string) => string;
    roll_dice_det: (a: string) => string;
}

const dicerolls = ((k: CustomWindow, l: (arg0: CustomWindow) => void) => l(k))(window as unknown as CustomWindow, (k: CustomWindow) => {
    function l(a: string): string {
        let c = q(a);
        c = p(c);
        console.log(JSON.stringify(c));
        return c.string.replace(/\{(\w+)\}/g, (b: string, d: string) => c[d].value);
    }

    function q(a: string): { [key: string]: any } {
        let c: { [key: string]: any } = { string: a };
        [
            {
                regex: /(\d*)d(\d+)/, fn: (b: string, d: string, h: string) => {
                    let rollCount = parseInt(d, 10) || 1;
                    let dieFaces = parseInt(h, 10);
                    let isD20 = rollCount === 1 && dieFaces === 20;
                    let rollId = m();
                    let rollResult: { [key: string]: any } = {
                        n: rollCount,
                        d: dieFaces,
                        d20: isD20,
                        vx: [],
                        sx: [],
                        value: 0,
                        roll_die: () => Math.floor(Math.random() * rollResult.d) + 1,
                        fmt_die: (g: number) => rollResult.d20 && g === 1 ? `<b class="miss">${g}</b>` : rollResult.d20 && g === 20 ? `<b class="crit">${g}</b>` : g === 1 || g === rollResult.d ? `<b>${g}</b>` : g,
                        sum: (g: number[]) => g.reduce((n, r) => n + r),
                        fmt_pool: (g: string[]) => `${rollResult.n}d${rollResult.d} (${g.join(', ')})`
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
                regex: /(\d+\.\d+|\d+)/, fn: (b: string, d: string) => {
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

    function p(a: { [key: string]: any }): { [key: string]: any } {
        [
            {
                regex: /([a-z]*)\(([^()]+)\)/, fn: (c: string, b: string, d: string) => {
                    a.string = d;
                    a = p(a);
                    let resultId = m();
                    a.string = a.string.replace(/\{(\w+)\}/, (f: string, e: string) => {
                        let value = a[e].value;
                        let str = `${b}(${a[e].str})`;
                        if (b === 'avg') {
                            if (a[e].n && a[e].d) {
                                value = a[e].n * (a[e].d + 1) / 2;
                            }
                        } else if (b === 'int') {
                            value = Math.floor(value);
                        } else if (b === 'round') {
                            value = Math.floor(value + 0.5);
                        } else if (b === 'sqrt') {
                            value = Math.sqrt(value);
                        } else if ((b === 'adv' || b === 'dis') && a[e].d20) {
                            let roll = a[e].roll_die();
                            let formattedRoll = a[e].fmt_die(roll);
                            if ((b === 'adv' && roll > a[e].vx[0]) || (b === 'dis' && roll < a[e].vx[0])) {
                                value = roll;
                                str = `${b}(${a[e].fmt_pool([`<s>${a[e].sx[0]}</s>`, formattedRoll])})`;
                            } else {
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
                regex: /\{(\w+)\}\s*(\*|\/|%)\s*\{(\w+)\}/, fn: (c: string, b: string, d: string, h: string) => {
                    let resultId = m();
                    let value: number;
                    value = 0; // Initialize value to 0 or any default value
                    let str = `${a[b].str} ${d} ${a[h].str}`;
                    if (d === '*') {
                        value = a[b].value * a[h].value;
                    } else if (d === '/') {
                        value = a[b].value / a[h].value;
                    } else if (d === '%') {
                        value = a[b].value % a[h].value;
                    }
                    a[resultId] = { value, str };
                    return `{${resultId}}`;
                }
            },
            {
                regex: /\{(\w+)\}\s*(\+|\-)\s*\{(\w+)\}/, fn: (c: string, b: string, d: string, h: string) => {
                    let resultId = m();
                    let value: number;
                    let str = `${a[b].str} ${d} ${a[h].str}`;
                    if (d === '+') {
                        value = a[b].value + a[h].value;
                    } else if (d === '-') {
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

    function m(): string {
        let randomValue = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        let chars: string[] = [];
        while (randomValue > 0) {
            chars.push(String.fromCharCode(97 + randomValue % 26));
            randomValue = Math.floor(randomValue / 26);
        }
        return chars.join('');
    }

    k.roll_dice = function (a: string): number { return parseInt(l(a)); };
    k.roll_dice_fp = function (a: string): number { return parseFloat(l(a)); };
    k.roll_dice_str = l;
    k.roll_dice_det = function (a: string): string {
        let c = q(a);
        c = p(c);
        console.log(JSON.stringify(c));
        return c.string.replace(/\{(\w+)\}/g, (b: string, d: string) => {
            let str = c[d].str;
            let value = c[d].value;
            if (!Number.isInteger(value)) {
                value = Math.floor(100 * value + 0.5) / 100;
            }
            return `<span class="str">${str}</span> = <b>${value}</b>`;
        });
    };
});
export { dicerolls };