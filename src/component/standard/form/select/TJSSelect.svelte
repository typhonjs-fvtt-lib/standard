<script>
   /**
    * --tjs-input-appearance
    * --tjs-input-background
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-box-shadow-focus
    * --tjs-input-box-shadow-focus-visible
    * --tjs-input-cursor
    * --tjs-input-flex
    * --tjs-input-height
    * --tjs-input-outline-focus-visible
    * --tjs-input-outline-offset
    * --tjs-input-overflow
    * --tjs-input-text-overflow
    * --tjs-input-transition-focus-visible
    * --tjs-input-width
    *
    * --tjs-select-appearance
    * --tjs-select-background
    * --tjs-select-border
    * --tjs-select-border-radius
    * --tjs-select-box-shadow-focus
    * --tjs-select-box-shadow-focus-visible
    * --tjs-select-cursor
    * --tjs-select-flex
    * --tjs-select-height
    * --tjs-select-outline-focus-visible
    * --tjs-select-outline-offset
    * --tjs-select-overflow
    * --tjs-select-text-overflow
    * --tjs-select-transition-focus-visible
    * --tjs-select-width
    *
    * --tjs-select-option-background; fallback: --tjs-default-popup-background; default: #23221d
    * --tjs-select-option-color; fallback: --tjs-default-popup-primary-color; default: #b5b3a4
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

   import { onMount }         from '#svelte';
   import { writable }        from '#svelte/store';

   import { applyStyles }     from '#runtime/svelte/action/dom';
   import { isWritableStore } from '#runtime/util/store';
   import { isObject }        from '#runtime/util/object';

   export let select = void 0;
   export let selected = void 0;
   export let options = void 0;
   export let store = void 0;
   export let styles = void 0;
   export let efx = void 0;

   $: selected = isObject(select) && typeof select.selected === 'string' ? select.selected :
    typeof selected === 'string' ? selected : void 0;
   $: options = isObject(select) && Array.isArray(select.options) ? select.options :
    Array.isArray(options) ? options : [];
   $: store = isObject(select) && isWritableStore(select.store) ? select.store :
    isWritableStore(store) ? store : writable(void 0);
   $: styles = isObject(select) && isObject(select.styles) ? select.styles :
    isObject(styles) ? styles : void 0;
   $: efx = isObject(select) && typeof select.efx === 'function' ? select.efx :
    typeof efx === 'function' ? efx : () => {};

   onMount(() =>
   {
      // On mount verify that the current store value is included in options otherwise check the `selected` value if set
      // and if this initial value is in the list of options then set it as the default option.
      if (selected && store && !options.includes($store) && options.includes(selected)) { store.set(selected); }
   });
</script>

<div on:change class=tjs-select-container use:efx use:applyStyles={styles}>
   <!-- Please see note at top / above on why on:change is used over `bind:value={$store}`. -->
   <select on:change class=tjs-select bind:value={$store}>
      {#each options as option}
         <option class=tjs-select-option value={option.value}>
            {option.label}
         </option>
      {/each}
   </select>
</div>

<style>
   .tjs-select-container {
      pointer-events: none;
      display: block;
      overflow: var(--tjs-select-overflow, var(--tjs-input-overflow, hidden));
      transform-style: preserve-3d;

      background: var(--tjs-select-background, var(--tjs-input-background));
      border-radius: var(--tjs-select-border-radius, var(--tjs-input-border-radius));
      flex: var(--tjs-select-flex, var(--tjs-input-flex));
      margin: var(--tjs-select-margin, var(--tjs-input-margin));
      height: var(--tjs-select-height, var(--tjs-input-height));
      width: var(--tjs-select-width, var(--tjs-input-width));
   }

   select {
      pointer-events: initial;
      display: inline-block;
      position: relative;

      appearance: var(--tjs-select-appearance, var(--tjs-input-appearance, inherit));

      background: transparent;

      border: var(--tjs-select-border, var(--tjs-input-border));
      border-radius: var(--tjs-select-border-radius, var(--tjs-input-border-radius));

      width: 100%;
      height: 100%;

      padding: var(--tjs-select-padding, var(--tjs-input-padding, initial));

      color: inherit;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      outline-offset: var(--tjs-select-outline-offset, var(--tjs-input-outline-offset));
      text-align: var(--tjs-select-text-align, var(--tjs-input-text-align));
      text-overflow: var(--tjs-select-text-overflow, var(--tjs-input-text-overflow, ellipsis));

      cursor: var(--tjs-select-cursor, var(--tjs-input-cursor));

      transform: translateZ(1px);
   }

   select option {
      background: var(--tjs-select-option-background, var(--tjs-default-popup-background, #23221d));
      color: var(--tjs-select-option-color, var(--tjs-default-popup-primary-color, #b5b3a4));
   }

   select:focus {
      box-shadow: var(--tjs-select-box-shadow-focus, var(--tjs-input-box-shadow-focus, unset));
   }

   select:focus-visible {
      box-shadow: var(--tjs-select-box-shadow-focus-visible, var(--tjs-input-box-shadow-focus-visible, unset));
      outline: var(--tjs-select-outline-focus-visible, var(--tjs-input-outline-focus-visible));
      transition: var(--tjs-select-transition-focus-visible, var(--tjs-input-transition-focus-visible));
   }
</style>
