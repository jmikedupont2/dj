// prng.ts (1-48)
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.random_fp = exports.random = exports.set_prng_seed = void 0;
const prng = ((c, callback) => {
    let b = Date.now();
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
            let d = 42;
            for (let f = 0; f < a.length; f++) {
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
})(window, () => { });
// Named exports
exports.set_prng_seed = prng.set_prng_seed;
exports.random = prng.random;
exports.random_fp = prng.random_fp;
