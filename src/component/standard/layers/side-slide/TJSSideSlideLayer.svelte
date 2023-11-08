<script>
   import { applyStyles }  from '#runtime/svelte/action/dom';

   import TJSSideSlideItem from './TJSSideSlideItem.svelte';

   export let items = [];

   export let duration = 200;
   export let top = '0';
   export let side = void 0;
   export let styles = {};
   export let zIndex = '10';

   let allStyles;

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
   {#each items as item}
      <TJSSideSlideItem {item} {duration} {side} />
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
