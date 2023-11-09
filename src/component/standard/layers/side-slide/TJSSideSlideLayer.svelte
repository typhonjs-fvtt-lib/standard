<script>
   /**
    * Provides a component to display an absolutely positioned side layer in a parent element featuring a column of
    * icons that slide out panels defined as Svelte components.
    */

   import { setContext }         from '#svelte';
   import { writable }           from '#svelte/store';
   import { linear }             from '#svelte/easing';

   import { applyStyles }        from '#runtime/svelte/action/dom';
   import { isTJSSvelteConfig }  from '#runtime/svelte/util';
   import {
      isIterable,
      isObject }                 from '#runtime/util/object';

   import TJSSideSlideItem       from './TJSSideSlideItem.svelte';

   /**
    * An iterable list of side slide items including icon (Font awesome string), a Svelte configuration object, and
    * title.
    *
    * You may provide a `condition` boolean or function that returns a boolean to hide the item. This is useful for
    * adding items / panels only visible for the GM amongst other conditional tests.
    *
    * @type {(Iterable<{
    *    condition?: boolean | (() => boolean)
    *    icon: string,
    *    svelte: import('#runtime/svelte/util').TJSSvelteConfig,
    *    title?: string
    * }>)}
    */
   export let items = [];

   /**
    * Duration of transition effect.
    *
    * @type {number}
    */
   export let duration = 200;

   /**
    * Svelte easing function.
    *
    * @type {(time: number) => number}
    */
   export let easing = linear;

   /**
    * Svelte easing function.
    *
    * @type {(time: number) => number}
    */
   export let inEasing = void 0;

   /**
    * Svelte easing function.
    *
    * @type {(time: number) => number}
    */
   export let outEasing = void 0;

   /**
    * A valid CSS value for the `top` positioning attribute for the top of the side slide layer.
    *
    * When top is a number it will be treated as pixels.
    *
    * @type {string | number}
    */
   export let top = 0;

   /**
    * The side in layers parent element to display.
    *
    * @type {'left' | 'right'}
    */
   export let side = void 0;

   /**
    * Always keeps the side panel items open / prevents closure. This is a development flag allowing you to use HMR
    * to develop your side item panel without the need to constantly activate the panel.
    */
   export let stayOpen = false;

   /**
    * Additional inline styles to apply to the side slide layer. Useful for setting CSS variables.
    *
    * @type {Record<string, string>}
    */
   export let styles = {};

   /**
    * The z-index for the side slide layer inside the parent element.
    *
    * @type {number}
    */
   export let zIndex = 10;

   // Provides a store for all items to share and use to increment the item container z-index when pointer enters the
   // item icon. This allows each item that is being shown to always be on top regardless of item order.
   setContext('#side-slide-layer-item-z-index', writable(1))

   let allStyles;

   let filteredItems = [];

   $: {
      if (!isIterable(items))
      {
         throw new TypeError(`'TJSSideSlideLayer error: 'items' prop is not an iterable list.`);
      }

      const newItems = [];

      let cntr = -1;

      for (const item of items)
      {
         cntr++;

         if (!isObject(item))
         {
            throw new TypeError(`TJSSideSlideLayer error: 'items[${cntr}]' is not an object.`)
         }

         if (item.condition !== void 0 && typeof item.condition !== 'boolean' && typeof item.condition !== 'function')
         {
            throw new TypeError(`TJSSideSlideLayer error: 'items[${cntr}].condition' is not a boolean or function.`)
         }

         if (typeof item.icon !== 'string')
         {
            throw new TypeError(`TJSSideSlideLayer error: 'items[${cntr}].icon' is not a string.`)
         }

         if (!isTJSSvelteConfig(item.svelte))
         {
            throw new TypeError(
             `TJSSideSlideLayer error: 'items[${cntr}].svelte' is not a Svelte configuration object.`)
         }

         if (item.title !== void 0 && typeof item.title !== 'string')
         {
            throw new TypeError(`TJSSideSlideLayer error: 'items[${cntr}].title' is not a string.`)
         }

         // Filter on any given condition.
         if (typeof item.condition === 'function' && !item.condition()) { continue; }
         if (typeof item.condition === 'boolean' && !item.condition) { continue; }

         newItems.push(item);
      }

      filteredItems = newItems;
   }

   $: {
      switch (side)
      {
         case 'left':
            allStyles = {
               left: 0,
               right: null,
               top: typeof top === 'number' ? `${top}px` : top,
               'z-index': zIndex,
               ...styles
            };
            break;

         case 'right':
            allStyles = {
               left: null,
               right: 0,
               top: typeof top === 'number' ? `${top}px` : top,
               'z-index': zIndex,
               ...styles
            };
            break;

         default:
            throw new Error(`'side' prop must be either 'left' or 'right'`);
      }
   }

   // Tracks last transition state.
   let oldEasing = linear;

   // Run this reactive block when the last transition state is not equal to the current state.
   $: if (oldEasing !== easing)
   {
      // If transition is defined and not the default transition then set it to both in and out transition otherwise
      // set the default transition to both in & out transitions.
      const newEasing = typeof easing === 'function' ? easing : linear;

      inEasing = newEasing;
      outEasing = newEasing;

      oldEasing = newEasing;
   }

</script>

<section class=tjs-side-slide-layer use:applyStyles={allStyles}>
   {#each filteredItems as item (item.icon)}
      <TJSSideSlideItem {item} {duration} {inEasing} {outEasing} {side} {stayOpen} />
   {/each}
</section>

<style>
   section {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: var(--tjs-side-slide-layer-item-gap, 2px);
      margin: var(--tjs-side-slide-layer-margin, 0);
   }
</style>
