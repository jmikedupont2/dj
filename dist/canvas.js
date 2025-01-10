"use strict";
// canvas2.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.color2rgb = color2rgb;
exports.hsv2rgb = hsv2rgb;
exports.set_pixel = set_pixel;
exports.fill_rect = fill_rect;
exports.new_image = new_image;
exports.rgb2hex = rgb2hex;
exports.hsv2hex = hsv2hex;
exports.rgb2hsv = rgb2hsv;
exports.cache_pixels = cache_pixels;
exports.draw_pixels = draw_pixels;
exports.draw_line = draw_line;
exports.stroke_rect = stroke_rect;
exports.draw_string = draw_string;
exports.draw_image = draw_image;
exports.save_canvas = save_canvas;
// Declare the $ function for selecting canvas elements
const $ = (id) => document.getElementById(id);
// State variables
const m = {};
let n = false;
let k = {};
//Exported functions
function toHex(a, c, b) {
    const d = '#' + [
        ('00' + a.toString(16)).slice(-2),
        ('00' + c.toString(16)).slice(-2),
        ('00' + b.toString(16)).slice(-2)
    ].join('');
    m[d] = [a, c, b, 255];
    return d;
}
function color2rgb(a) {
    if (m[a]) {
        return m[a];
    }
    let c;
    const b = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(a)
        || /^#([0-9a-f])([0-9a-f])([0-9a-f])/i.exec(a);
    if (b) {
        c = [parseInt(b[1], 16), parseInt(b[2], 16), parseInt(b[3], 16), 255];
    }
    else {
        const rgbMatch = /^rgb\((\d+),(\d+),(\d+)\)/i.exec(a);
        if (rgbMatch) {
            c = [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10), 255];
        }
        else {
            c = [0, 0, 0, 255];
        }
    }
    m[a] = c;
    return c;
}
function hsv2rgb(a) {
    const c = a[0];
    const b = a[2] / 100;
    const aVal = a[1] / 100 * b;
    const d = aVal * (1 - Math.abs(c / 60 % 2 - 1));
    const e = b - aVal;
    let eColor = 0, fColor = 0, hColor = 0; // set variables so typescript knows that they are assigned, though logic assures it
    if (c < 60) {
        eColor = aVal;
        fColor = d;
    }
    else if (c < 120) {
        eColor = d;
        fColor = aVal;
    }
    else if (c < 180) {
        fColor = aVal;
        hColor = d;
    }
    else if (c < 240) {
        fColor = d;
        hColor = aVal;
    }
    else if (c < 300) {
        eColor = d;
        hColor = aVal;
    }
    else {
        eColor = aVal;
        hColor = d;
    }
    eColor = Math.min(Math.max(Math.floor(255 * (eColor + e)), 0), 255);
    fColor = Math.min(Math.max(Math.floor(255 * (fColor + e)), 0), 255);
    hColor = Math.min(Math.max(Math.floor(255 * (hColor + e)), 0), 255);
    return [eColor, fColor, hColor];
}
function set_pixel(a, c, b, d) {
    if (n) {
        if (k[d]) {
            k[d].push([c, b]);
        }
        else {
            k[d] = [[c, b]];
        }
    }
    else {
        fill_rect(a, c, b, c, b, d);
    }
}
function fill_rect(a, c, b, d, e, f) {
    a.fillStyle = f;
    a.fillRect(c, b, d - c + 1, e - b + 1); //ensure the rectangle includes the end coordinates.
}
function new_image(a, c, b) {
    const canvas = $(a);
    if (!canvas) {
        throw new Error(`Canvas element with ID ${a} not found.`);
    }
    canvas.width = c;
    canvas.height = b;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        throw new Error(`Failed to get 2D context for canvas '${a}'.`);
    }
    if (ctx) {
        fill_rect(ctx, 0, 0, c, b, '#ffffff');
    }
    return ctx;
}
;
function rgb2hex(a, c, b) {
    const d = `#${(a | 0).toString(16).padStart(2, '0')}${(c | 0).toString(16).padStart(2, '0')}${(b | 0).toString(16).padStart(2, '0')}`;
    m[d] = [a, c, b, 255];
    return d;
}
function hsv2hex(a) {
    const rgb = hsv2rgb(a);
    return toHex(rgb[0], rgb[1], rgb[2]);
}
;
function rgb2hsv(a) {
    const c = a[0] / 255;
    const b = a[1] / 255;
    const d = a[2] / 255;
    const max = Math.max(c, b, d);
    const e = max - Math.min(c, b, d);
    const hue = (Math.floor(60 * (0 === e ? 0 : max === c ? (b - d) / e % 6 : max === b ? (d - c) / e + 2 : (c - b) / e + 4)) + 360) % 360;
    const saturation = Math.min(Math.max(Math.floor(100 * (0 === max ? 0 : e / max)), 0), 100);
    const value = Math.min(Math.max(Math.floor(100 * max), 0), 100);
    return [hue, saturation, value];
}
;
function cache_pixels(a) {
    n = a;
}
;
function draw_pixels(a) {
    const c = a.canvas.width;
    const b = a.getImageData(0, 0, c, a.canvas.height);
    Object.keys(k).forEach(d => {
        const e = color2rgb(d);
        k[d].forEach(f => {
            const index = f[1] * c + f[0] << 2;
            for (let h = 0; h < 4; h++) {
                b.data[index + h] = e[h];
            }
        });
    });
    a.putImageData(b, 0, 0);
    n = false;
    k = {};
}
;
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
;
function stroke_rect(a, c, b, d, e, f) {
    a.strokeStyle = f;
    a.strokeRect(c, b, d - c + 1, e - b + 1); //ensure the rectangle includes the end coordinates.
}
;
function draw_string(a, c, b, d, e, f) {
    a.textBaseline = 'middle';
    a.textAlign = 'center';
    a.font = e;
    a.fillStyle = f;
    a.fillText(c, b, d);
}
;
function draw_image(a, c, b, d) {
    a.drawImage(c, b, d);
}
;
function save_canvas(a, c) {
    const dataURL = a.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const link = document.createElement('a');
    if ('string' === typeof link.download) { //checks if the download attribute is supported
        link.href = dataURL;
        link.download = c;
        link.click();
    }
    else {
        window.location.assign(dataURL);
    }
}
;
