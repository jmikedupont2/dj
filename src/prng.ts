// prng.ts (1-48)
'use strict';

interface CustomWindow extends Window {
    set_prng_seed?: (a: number | string) => number;
    random?: (a: number) => number;
    random_fp?: () => number;
}

const prng = ((c: CustomWindow, callback: (arg0: CustomWindow, arg1: any) => void): {
    set_prng_seed: (a: number | string) => number;
    random: (a: number) => number;
    random_fp: () => number
} => {
    let b = Date.now();

    function e(a: number): number {
        b = 1103515245 * b + 12345;
        b &= 2147483647;
        return a > 1 ? (b >> 8) % a : 0;
    }

    c.set_prng_seed = function (a: number | string): number {
        if (typeof a === 'number') {
            b = Math.floor(a);
        } else if (typeof a === 'string') {
            let d = 42;
            for (let f = 0; f < a.length; f++) {
                d = (d << 5) - d + a.charCodeAt(f);
                d &= 2147483647;
            }
            b = d;
        } else {
            b = Date.now();
        }
        return b;
    };

    c.random = e;
    c.random_fp = function (): number {
        return e(32768) / 32768;
    };

    // Return the functions you want to export
    return {
        set_prng_seed: c.set_prng_seed,
        random: c.random,
        random_fp: c.random_fp
    };
})(window as unknown as CustomWindow, () => { });

// Named exports
export const set_prng_seed = prng.set_prng_seed;
export const random = prng.random;
export const random_fp = prng.random_fp;