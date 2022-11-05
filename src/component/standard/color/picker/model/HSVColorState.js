import { colord } from '@typhonjs-fvtt/runtime/color/colord';

export class HSVColorState
{
   /**
    * Delta time in milliseconds determining
    *
    * @type {number}
    */
   static #delta = 250; //

   #hsv = { h: 0, s: 100, v: 100, a: 1 };

   #rgb = { r: 255, g: 0, b: 0, a: 1 }

   #hex = '#ff0000';

   #color = colord(this.#hex);

   #lastTime = 0;

   get h()
   {
      return this.#hsv.h;
   }

   get s()
   {
      return this.#hsv.s;
   }

   get v()
   {
      return this.#hsv.v;
   }

   get a()
   {
      return this.#hsv.a;
   }

   isExternalUpdate()
   {
      return (globalThis.performance.now() - this.#lastTime) > HSVColorState.#delta;
   }
}
