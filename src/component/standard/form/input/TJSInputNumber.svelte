<script>
   /**
    * A number input type.
    *
    * --tjs-input-appearance
    * --tjs-input-background
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-box-shadow-focus
    * --tjs-input-box-shadow-focus-visible
    * --tjs-input-caret-color
    * --tjs-input-cursor
    * --tjs-input-flex
    * --tjs-input-height
    * --tjs-input-padding
    * --tjs-input-placeholder-color
    * --tjs-input-outline-focus-visible
    * --tjs-input-outline-offset
    * --tjs-input-overflow
    * --tjs-input-text-align
    * --tjs-input-transition-focus-visible
    * --tjs-input-value-invalid-color
    * --tjs-input-width
    *
    * --tjs-input-number-appearance
    * --tjs-input-number-background
    * --tjs-input-number-border
    * --tjs-input-number-border-radius
    * --tjs-input-number-box-shadow-focus
    * --tjs-input-number-box-shadow-focus-visible
    * --tjs-input-number-caret-color
    * --tjs-input-number-cursor
    * --tjs-input-number-flex
    * --tjs-input-number-height
    * --tjs-input-number-outline-focus-visible
    * --tjs-input-number-outline-offset
    * --tjs-input-number-overflow
    * --tjs-input-number-padding
    * --tjs-input-number-placeholder-color
    * --tjs-input-number-text-align
    * --tjs-input-number-transition-focus-visible
    * --tjs-input-number-value-invalid-color
    * --tjs-input-number-width
    *
    * Webkit unique variables:
    * --tjs-input-number-webkit-inner-spin-button-opacity
    * --tjs-input-number-webkit-outer-spin-button-opacity
    */

   import { writable }      from '#svelte/store';

   import { applyStyles }   from '#runtime/svelte/action/dom';

   import { localize }      from '#runtime/svelte/helper';

   import {
      isReadableStore,
      isWritableStore }     from '#runtime/svelte/store';

   import { isObject }      from '#runtime/util/object';

   export let input = void 0;
   export let disabled = void 0;
   export let options = void 0;
   export let max = void 0;
   export let min = void 0;
   export let placeholder = void 0;
   export let step = void 0;
   export let store = void 0;
   export let storeIsValid = void 0;
   export let styles = void 0;
   export let efx = void 0;

   const localOptions = {
      blurOnEnterKey: true,
      cancelOnEscKey: false
   }

   let inputEl;

   $: disabled = isObject(input) && typeof input.disabled === 'boolean' ? input.disabled :
    typeof disabled === 'boolean' ? disabled : false;

   $: {
      options = isObject(input) && isObject(input.options) ? input.options :
       isObject(options) ? options : {};

      if (typeof options?.blurOnEnterKey === 'boolean') { localOptions.blurOnEnterKey = options.blurOnEnterKey; }
      if (typeof options?.cancelOnEscKey === 'boolean') { localOptions.cancelOnEscKey = options.cancelOnEscKey; }
   }

   $: max = isObject(input) && typeof input.max === 'number' ? input.max :
    typeof max === 'number' ? max : void 0;

   $: min = isObject(input) && typeof input.min === 'number' ? input.min :
    typeof min === 'number' ? min : void 0;

   $: placeholder = isObject(input) && typeof input.placeholder === 'string' ? localize(input.placeholder) :
    typeof placeholder === 'string' ? localize(placeholder) : void 0;

   $: step = isObject(input) && typeof input.step === 'number' ? input.step :
    typeof step === 'number' ? step : void 0;

   $: store = isObject(input) && isWritableStore(input.store) ? input.store :
    isWritableStore(store) ? store : writable(void 0);

   $: storeIsValid = isObject(input) && isReadableStore(input.storeIsValid) ? input.storeIsValid :
    isReadableStore(storeIsValid) ? storeIsValid : writable(true);

   $: storeIsValid = isObject(input) && isReadableStore(input.storeIsValid) ? input.storeIsValid :
    isReadableStore(storeIsValid) ? storeIsValid : writable(true);

   $: styles = isObject(input) && isObject(input.styles) ? input.styles :
    typeof styles === 'object' ? styles : void 0;

   $: efx = isObject(input) && typeof input.efx === 'function' ? input.efx :
    typeof efx === 'function' ? efx : () => {};

   /** @type {number|null} */
   let initialValue;

   /**
    * Save initial value on focus. Convert to number or null the same way that Svelte does for binding `value`.
    */
   function onFocusIn()
   {
      if (localOptions.cancelOnEscKey)
      {
         initialValue = inputEl.value === '' ? null : globalThis.parseFloat(inputEl.value);
      }
   }

   /**
    * Blur input on enter key down.
    *
    * @param {KeyboardEvent} event -
    */
   function onKeyDown(event)
   {
      if (localOptions.blurOnEnterKey && event.code === 'Enter')
      {
         event.preventDefault();
         event.stopPropagation();

         inputEl.blur();
         return;
      }

      if (event.code === 'Escape')
      {
         if (localOptions.cancelOnEscKey && (initialValue === null || typeof initialValue === 'number'))
         {
            event.preventDefault();
            event.stopPropagation();

            store.set(initialValue);
            initialValue = void 0;
            inputEl.blur();
         }
      }
   }
</script>

<div class=tjs-input-container use:efx use:applyStyles={styles}>
    <input class=tjs-input
           type=number
           bind:this={inputEl}
           bind:value={$store}
           class:is-value-invalid={!$storeIsValid}
           max={max}
           min={min}
           step={step}
           {placeholder}
           {disabled}
           on:focusin={onFocusIn}
           on:keydown={onKeyDown}
    />
</div>

<style>
    .tjs-input-container {
        display: block;
        pointer-events: none;
        overflow: var(--tjs-input-number-overflow, var(--tjs-input-overflow, hidden));
        transform-style: preserve-3d;

        background: var(--tjs-input-number-background, var(--tjs-input-background));
        border-radius: var(--tjs-input-number-border-radius, var(--tjs-input-border-radius));
        flex: var(--tjs-input-number-flex, var(--tjs-input-flex));
        margin: var(--tjs-input-number-margin, var(--tjs-input-margin));
        height: var(--tjs-input-number-height, var(--tjs-input-height));
        width: var(--tjs-input-number-width, var(--tjs-input-width));
    }

    .is-value-invalid {
        color: var(--tjs-input-number-value-invalid-color, var(--tjs-input-value-invalid-color, red));
    }

    input {
        pointer-events: initial;
        display: inline-block;
        position: relative;

        appearance: var(--tjs-input-number-appearance, var(--tjs-input-appearance, inherit));

        background: transparent;

        border: var(--tjs-input-number-border, var(--tjs-input-border));
        border-radius: var(--tjs-input-number-border-radius, var(--tjs-input-border-radius));

        width: 100%;
        height: 100%;

        padding: var(--tjs-input-number-padding, var(--tjs-input-padding, initial));

        color: inherit;
        caret-color: var(--tjs-input-number-caret-color, var(--tjs-input-caret-color));
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        outline-offset: var(--tjs-input-number-outline-offset, var(--tjs-input-outline-offset));
        text-align: var(--tjs-input-number-text-align, var(--tjs-input-text-align));

        cursor: var(--tjs-input-number-cursor, var(--tjs-input-cursor, text));

        transform: translateZ(1px);
    }

    input:focus {
        box-shadow: var(--tjs-input-number-box-shadow-focus, var(--tjs-input-box-shadow-focus, unset));
    }

    input:focus-visible {
        box-shadow: var(--tjs-input-number-box-shadow-focus-visible, var(--tjs-input-box-shadow-focus-visible, unset));
        outline: var(--tjs-input-number-outline-focus-visible, var(--tjs-input-outline-focus-visible));
        transition: var(--tjs-input-number-transition-focus-visible, var(--tjs-input-transition-focus-visible));
    }

    input::placeholder {
        color: var(--tjs-input-number-placeholder-color, var(--tjs-input-placeholder-color, inherit));
    }

    /* For Webkit */
    input::-webkit-inner-spin-button {
        opacity: var(--tjs-input-number-webkit-inner-spin-button-opacity, inherit);
    }

    input::-webkit-outer-spin-button {
        opacity: var(--tjs-input-number-webkit-outer-spin-button-opacity, inherit);
    }
</style>
