<script>
   /**
    * A generic input type has issues w/ 2-way binding w/ Svelte.
    * https://github.com/sveltejs/svelte/issues/3921
    *
    * A "hack" is used to set the type on the input element: `{...{ type }}`
    *
    * Only use this component for text inputs presently. More work to come.
    *
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-background
    * --tjs-input-cursor
    * --tjs-input-height
    * --tjs-input-padding
    * --tjs-input-placeholder-color;
    * --tjs-input-text-align
    * --tjs-input-width
    *
    * --tjs-input-text-border
    * --tjs-input-text-border-radius
    * --tjs-input-text-background
    * --tjs-input-text-cursor
    * --tjs-input-text-height
    * --tjs-input-text-padding
    * --tjs-input-text-placeholder-color
    * --tjs-input-text-text-align
    * --tjs-input-text-width
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
      blurOnEnterKey: true,
      cancelOnEscKey: false,
      clearOnEscKey: false
   }

   let inputEl;

   $: {
      type = isObject(input) && typeof input.type === 'string' ? input.type :
       typeof type === 'string' ? type : 'text';

      switch (type)
      {
         case 'email':
         case 'password':
         case 'search':
         case 'text':
         case 'url':
            break;

         default:
            throw new Error(
             `'TJSInputText only supports text input types: 'email', 'password', 'search', 'text', 'url'.`);
      }
   }

   $: disabled = isObject(input) && typeof input.disabled === 'boolean' ? input.disabled :
    typeof disabled === 'boolean' ? disabled : false;

   $: {
      options = isObject(input) && isObject(input.options) ? input.options :
       isObject(options) ? options : {};

      if (typeof options?.blurOnEnterKey === 'boolean') { localOptions.blurOnEnterKey = options.blurOnEnterKey; }
      if (typeof options?.cancelOnEscKey === 'boolean') { localOptions.cancelOnEscKey = options.cancelOnEscKey; }
      if (typeof options?.clearOnEscKey === 'boolean') { localOptions.clearOnEscKey = options.clearOnEscKey; }
   }

   $: placeholder = isObject(input) && typeof input.placeholder === 'string' ? localize(input.placeholder) :
    typeof placeholder === 'string' ? localize(placeholder) : void 0;

   $: store = isObject(input) && isWritableStore(input.store) ? input.store :
    isWritableStore(store) ? store : writable(void 0);

   $: styles = isObject(input) && isObject(input.styles) ? input.styles :
    typeof styles === 'object' ? styles : void 0;

   $: efx = isObject(input) && typeof input.efx === 'function' ? input.efx :
    typeof efx === 'function' ? efx : () => {};

   let initialValue;

   function onFocusIn(event)
   {
      initialValue = localOptions.cancelOnEscKey ? inputEl.value : void 0;
   }

   /**
    * Blur input on enter key down.
    *
    * @param {KeyboardEvent} event -
    */
   function onKeyDown(event)
   {
      if (localOptions.blurOnEnterKey && event.key === 'Enter') { inputEl.blur(); return; }

      if (event.key === 'Escape')
      {
         if (localOptions.cancelOnEscKey && typeof initialValue === 'string')
         {
            store.set(initialValue);
            initialValue = void 0;
            inputEl.blur();
         }
         else if (localOptions.clearOnEscKey)
         {
            store.set('');
            inputEl.blur();
         }
      }
   }
</script>

<div class=tjs-input-container use:efx use:applyStyles={styles}>
    <input class=tjs-input
           {...{ type }}
           bind:this={inputEl}
           bind:value={$store}
           use:autoBlur
           {placeholder}
           {disabled}
           on:focusin={onFocusIn}
           on:keydown={onKeyDown}
    />
</div>

<style>
    .tjs-input-container {
        pointer-events: none;
        background: var(--tjs-input-text-background, var(--tjs-input-background));
        border-radius: var(--tjs-input-text-border-radius, var(--tjs-input-border-radius));
        display: block;
        overflow: hidden;
        height: var(--tjs-input-text-height, var(--tjs-input-height));
        width: var(--tjs-input-text-width, var(--tjs-input-width));
        transform-style: preserve-3d;
    }

    input {
        pointer-events: initial;
        display: inline-block;
        position: relative;
        overflow: hidden;

        background: transparent;

        border: var(--tjs-input-text-border, var(--tjs-input-border));
        border-radius: var(--tjs-input-text-border-radius, var(--tjs-input-border-radius));

        text-align: var(--tjs-input-text-text-align, var(--tjs-input-text-align));

        width: 100%;
        height: 100%;

        padding: var(--tjs-input-text-padding, var(--tjs-input-padding, initial));

        color: inherit;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;

        cursor: var(--tjs-input-text-cursor, var(--tjs-input-cursor, text));

        transform: translateZ(1px);
    }

    input::placeholder {
        color: var(--tjs-input-text-placeholder-color, var(--tjs-input-placeholder-color, inherit));
    }
</style>
