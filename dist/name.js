"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// name.ts
//
// written by drow <drow@bin.sh>
// http://creativecommons.org/licenses/by-nc/3.0/
const types_1 = require("./types");
'use strict';
let chain_cache = {};
function generate_name(b) {
    let a;
    return (a = markov_chain(b)) ? markov_name(a) : '';
}
function markov_chain(b) {
    let a;
    if (a = chain_cache[b]) {
        return a;
    }
    if (a = types_1.name_set[b]) {
        if (a = construct_chain(a)) {
            return chain_cache[b] = a;
        }
    }
    return false;
}
function construct_chain(b) {
    let a = {};
    for (let c = 0; c < b.length; c++) {
        let g = b[c].split(/\s+/);
        a = incr_chain(a, 'parts', g.length);
        for (let f = 0; f < g.length; f++) {
            let d = g[f];
            a = incr_chain(a, 'name_len', d.length);
            let e = d.substr(0, 1);
            a = incr_chain(a, 'initial', e);
            for (d = d.substr(1); d.length > 0;) {
                let h = d.substr(0, 1);
                a = incr_chain(a, e, h);
                d = d.substr(1);
                e = h;
            }
        }
    }
    return scale_chain(a);
}
function incr_chain(b, a, c) {
    if (b[a]) {
        if (b[a][c]) {
            b[a][c]++;
        }
        else {
            b[a][c] = 1;
        }
    }
    else {
        b[a] = {};
        b[a][c] = 1;
    }
    return b;
}
function scale_chain(b) {
    let a = {};
    Object.keys(b).forEach(c => {
        a[c] = 0;
        Object.keys(b[c]).forEach(d => {
            let e = Math.floor(Math.pow(b[c][d], 1.3));
            b[c][d] = e;
            a[c] += e;
        });
    });
    b.table_len = a;
    return b;
}
function markov_name(b) {
    let a = select_link(b, 'parts');
    let c = [];
    for (let d = 0; d < parseInt(a, 10); d++) {
        let g = select_link(b, 'name_len');
        let f = select_link(b, 'initial');
        let e = f;
        while (e.length < parseInt(g, 10)) {
            f = select_link(b, f);
            e += f;
        }
        c.push(e);
    }
    return c.join(' ');
}
function select_link(b, a) {
    let c = random(b.table_len[a]);
    let d = 0;
    return Object.keys(b[a]).filter(e => {
        d += b[a][e];
        return c < d;
    })[0];
}
function random(max) {
    return Math.floor(Math.random() * max);
}
