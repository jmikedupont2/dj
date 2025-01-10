// custom.d.ts
interface Window {
    new_image: (a: string, c: number, b: number) => CanvasRenderingContext2D;
    rgb2hex: (a: number, c: number, b: number) => string;
    color2rgb: (a: string) => number[];
    hsv2hex: (a: number[]) => string;
    rgb2hsv: (a: number[]) => number[];
    hsv2rgb: (a: number[]) => number[];
    set_pixel: (a: CanvasRenderingContext2D, c: number, b: number, d: string) => void;
    cache_pixels: (a: boolean) => void;
    draw_pixels: (a: CanvasRenderingContext2D) => void;
    draw_line: (a: CanvasRenderingContext2D, c: number, b: number, d: number, e: number, f: string) => void;
    fill_rect: (a: CanvasRenderingContext2D, c: number, b: number, d: number, e: number, f: string) => void;
    stroke_rect: (a: CanvasRenderingContext2D, c: number, b: number, d: number, e: number, f: string) => void;
    draw_string: (a: CanvasRenderingContext2D, c: string, b: number, d: number, e: string, f: string) => void;
    draw_image: (a: CanvasRenderingContext2D, c: HTMLImageElement, b: number, d: number) => void;
    save_canvas: (a: HTMLCanvasElement, c: string) => void;
}