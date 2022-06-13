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

   /**
    * Note: A Svelte reactivity bug / issue is worked around below. Due to the several reactive statements over handling
    * props when binding the store directly to the select element the #each block of options causes the compiler to
    * incorrectly invalidate / run the reactive statements again for `options` and `select` on any changes to the select
    * element. Running the `select` reactive statements causes the store statement to be run again causing the store to
    * be unsubscribed and subscribed to. Technically this isn't a problem, but the workaround solution of using an
    * on:change instead of bind in this instance fixes it.
    *
    * @see https://github.com/sveltejs/svelte/issues/4933
    * @see https://dev.to/isaachagoel/svelte-reactivity-gotchas-solutions-if-you-re-using-svelte-in-production-you-should-read-this-3oj3
    */

   import { onMount }         from 'svelte';
   import { writable }        from 'svelte/store';

   import {
      applyStyles,
      autoBlur }              from '@typhonjs-svelte/lib/action';
   import { isWritableStore } from '@typhonjs-svelte/lib/store';

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
   $: store = typeof select === 'object' && isWritableStore(select.store) ? select.store :
    isWritableStore(store) ? store : writable(void 0);
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
   <!-- Please see note at top / above on why on:change is used over `bind:value={$store}`. -->
   <select class=tjs-select bind:value={$store} use:autoBlur>
      {#each options as option}
         <option class=tjs-select-option value={option.value}>
            {option.label}
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
