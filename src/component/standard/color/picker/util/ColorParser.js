import { getFormat } from '@typhonjs-fvtt/runtime/color/colord';

/**
 * Provides generic color model utilities.
 */
export class ColorParser
{
   /**
    * Valid CSS <angle> units.
    * https://developer.mozilla.org/en-US/docs/Web/CSS/angle
    *
    * @type {Record<string, number>}
    */
   static #ANGLE_UNITS = {
      grad: 360 / 400,
      turn: 360,
      rad: 360 / (Math.PI * 2)
   }

   /**
    * Parses the given color object or string returning the color model format and storage type.
    *
    * @param {object|string}color -
    *
    * @returns {{ format: 'hex'|'hsl'|'hsv'|'rgb', type: 'object'|'string' }|undefined} Color format data.
    */
   static getColorFormat(color)
   {
console.log(`!! ColorParser - getColorFormat - 0 - color: `, color)
      const format = getFormat(color);
console.log(`!! ColorParser - getColorFormat - 1 - format: `, format)

      if (!format) { return void 0; }

      return {
         format,
         type: typeof color
      }
   }

   /**
    * Processes and clamps a degree (angle) value properly.
    * Any `NaN` or `Infinity` will be converted to `0`.
    * Examples: -1 => 359, 361 => 1
    *
    * @param {number}   degrees - Degree value to clamp
    *
    * @returns {number}
    */
   static clampHue(degrees)
   {
      degrees = isFinite(degrees) ? degrees % 360 : 0;
      return degrees > 0 ? degrees : degrees + 360;
   }

   /**
    * @param {string} value - Hue numerical component
    *
    * @param {string} [unit='deg'] - Hue unit if available.
    */
   static parseHue(value, unit = 'deg')
   {
      return Number(value) * (this.#ANGLE_UNITS[unit] ?? 1);
   }
}
