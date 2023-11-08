<script>
   import { setContext }   from '#svelte';
   import { writable }     from '#svelte/store';

   import { applyStyles }  from '#runtime/svelte/action/dom';

   import TJSSideSlideItem from './TJSSideSlideItem.svelte';

   /**
    * An array of side slide items including icon (Font awesome string) and a Svelte configuration object.
    *
    * You may provide a `condition` boolean or function to hide the item. This is useful for adding items / panels
    * only visible for the GM amongst other conditional tests.
    *
    * @type {({
    *    condition?: boolean | (() => boolean)
    *    icon: string,
    *    svelte: import('#runtime/svelte/util').TJSSvelteConfig
    * }[])}
    */
   export let items = [];

   /**
    * Duration of transition effect.
    *
    * @type {number}
    */
   export let duration = 200;

   /**
    * A valid CSS value for the `top` positioning attribute for the top of the side slide layer.
    *
    * @type {string}
    */
   export let top = '0';

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
    */
   export let zIndex = '10';

   // Provides a store for all items to share and use to increment the item container z-index when pointer enters the
   // item icon. This allows each item that is being shown to always be on top regardless of item order.
   setContext('#side-slide-layer-item-z-index', writable(1))

   let allStyles;

   let filteredItems = [];

   $: {
      const newItems = [];

      for (const item of items)
      {
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
            allStyles = { left: 0, right: null, top, 'z-index': zIndex, ...styles }
            break;

         case 'right':
            allStyles = { left: null, right: 0, top, 'z-index': zIndex, ...styles }
            break;

         default:
            throw new Error(`'side' prop must be either 'left' or 'right'`);
      }
   }
</script>

<section class=tjs-side-slide-layer use:applyStyles={allStyles}>
   {#each filteredItems as item (item.icon)}
      <TJSSideSlideItem {item} {duration} {side} {stayOpen} />
   {/each}
</section>

<style>
   section {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: var(--tjs-side-slide-layer-item-gap, 2px);

      --tjs-side-slide-layer-item-diameter: 30px;
   }
</style>
