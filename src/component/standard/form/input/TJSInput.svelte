<script>
   /**
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-background
    * --tjs-input-cursor
    * --tjs-input-height
    * --tjs-input-text-align
    * --tjs-input-width
    *
    * --tjs-comp-input-border
    * --tjs-comp-input-border-radius
    * --tjs-comp-input-background
    * --tjs-comp-input-cursor
    * --tjs-comp-input-height
    * --tjs-comp-input-text-align
    * --tjs-comp-input-width
    */

   import { writable }          from 'svelte/store';

   import {
      applyStyles,
      autoBlur }                from '@typhonjs-svelte/lib/action';
   import { localize }          from '@typhonjs-svelte/lib/helper';
   import { isWritableStore }   from '@typhonjs-svelte/lib/store';
   import { isObject }          from '@typhonjs-svelte/lib/util';

   export let input = void 0;
   export let type;
   export let disabled;
   export let options;
   export let placeholder;
   export let store;
   export let styles;
   export let efx;

   const localOptions = {
      blurOnEnterKey: true
   }

   let inputEl;

   $: type = isObject(input) && typeof input.type === 'string' ? input.type :
    typeof type === 'string' ? type : void 0;

   $: disabled = isObject(input) && typeof input.disabled === 'boolean' ? input.disabled :
    typeof disabled === 'boolean' ? disabled : false;

   $: {
      options = isObject(input) && isObject(input.options) ? input.options :
       isObject(options) ? options : {};

      if (typeof options?.blurOnEnterKey === 'boolean') { localOptions.blurOnEnterKey = options.blurOnEnterKey; }
   }

   $: placeholder = isObject(input) && typeof input.placeholder === 'string' ? localize(input.placeholder) :
    typeof placeholder === 'string' ? localize(placeholder) : void 0;

   $: store = isObject(input) && isWritableStore(input.store) ? input.store :
    isWritableStore(store) ? store : writable(void 0);

   $: styles = isObject(input) && isObject(input.styles) ? input.styles :
    typeof styles === 'object' ? styles : void 0;

   $: efx = isObject(input) && typeof input.efx === 'function' ? input.efx :
    typeof efx === 'function' ? efx : () => {};

   /**
    * Blur input on enter key down.
    *
    * @param {KeyboardEvent} event -
    */
   function onKeyDown(event)
   {
      if (localOptions.blurOnEnterKey && event.key === 'Enter') { inputEl.blur(); }
   }
</script>

<div class=tjs-input-container use:efx use:applyStyles={styles}>
    <input class=tjs-input
           bind:this={inputEl}
           bind:value={$store}
           use:autoBlur
           {placeholder}
           {disabled}
           on:keydown={onKeyDown}
    />
</div>

<style>
    .tjs-input-container {
        background: var(--tjs-comp-input-background, var(--tjs-input-background));
        border-radius: var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));
        display: block;
        overflow: hidden;
        height: var(--tjs-comp-input-height, var(--tjs-input-height));
        width: var(--tjs-comp-input-width, var(--tjs-input-width));
        transform-style: preserve-3d;
    }

    input {
        display: inline-block;
        position: relative;
        overflow: hidden;

        background: transparent;

        border: var(--tjs-comp-input-border, var(--tjs-input-border));
        border-radius: var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));

        text-align: var(--tjs-comp-input-text-align, var(--tjs-input-text-align));

        width: 100%;
        height: 100%;

        color: inherit;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;

        cursor: var(--tjs-comp-input-cursor, var(--tjs-input-cursor));

        transform: translateZ(1px);
    }
</style>
