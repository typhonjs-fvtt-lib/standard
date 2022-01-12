<script>
   /**
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-background
    * --tjs-input-cursor
    * --tjs-input-height
    * --tjs-input-width
    *
    * --tjs-comp-select-border
    * --tjs-comp-select-border-radius
    * --tjs-comp-select-background
    * --tjs-comp-select-cursor
    * --tjs-comp-select-height
    * --tjs-comp-select-width
    */

   import { onMount }      from 'svelte';
   import { writable }     from 'svelte/store';
   import { applyStyles }  from '@typhonjs-svelte/lib/action';
   import { autoBlur }     from '@typhonjs-fvtt/svelte-standard/action';

   export let select;
   export let selected;
   export let options;
   export let store;
   export let styles;
   export let efx;

   $: selected = typeof select === 'object' && typeof select.selected === 'string' ? select.selected :
    typeof selected === 'string' ? selected : void 0;
   $: options = typeof select === 'object' && Array.isArray(select.options) ? select.options :
    Array.isArray(options) ? options : [];
   $: store = typeof select === 'object' && typeof select.store === 'object' ? select.store :
    typeof store === 'object' ? store : writable(void 0);
   $: styles = typeof select === 'object' && typeof select.styles === 'object' ? select.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof select === 'object' && typeof select.efx === 'function' ? select.efx :
    typeof efx === 'function' ? efx : () => {};

   onMount(() =>
   {
      // On mount verify that the current store value is included in options otherwise check the `selected` value if set
      // and if this initial value is in the list of options then set it as the default option.
      if (selected && store && !options.includes($store) && options.includes(selected)) { store.set(selected); }
   });
</script>

<div class=tjs-select-container use:efx use:applyStyles={styles}>
<select class=tjs-select bind:value={$store} use:autoBlur>
   {#each options as option}
      <option class=tjs-select-option value={option}>
         {option}
      </option>
   {/each}
</select>
</div>

<style>
   .tjs-select-container {
      background: var(--tjs-comp-select-background, var(--tjs-input-background));
      border-radius: var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));
      display: block;
      overflow: hidden;
      height: var(--tjs-comp-select-height, var(--tjs-input-height));
      width: var(--tjs-comp-select-width, var(--tjs-input-width));
      transform-style: preserve-3d;
   }

   select {
      display: inline-block;
      position: relative;
      overflow: hidden;

      background: transparent;

      border: var(--tjs-comp-select-border, var(--tjs-input-border));
      border-radius: var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));

      width: 100%;
      height: 100%;

      color: inherit;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;

      cursor: var(--tjs-comp-select-cursor, var(--tjs-input-cursor));

      transform: translateZ(1px);
   }

   select option {
      background: var(--tjs-comp-select-background, var(--tjs-input-background));
      color: inherit;
   }
</style>
