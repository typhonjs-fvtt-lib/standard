<script>
   /**
    * A generic input type has issues w/ 2-way binding w/ Svelte.
    * https://github.com/sveltejs/svelte/issues/3921
    *
    * A "hack" is used to set the type on the input element: `{...{ type }}`
    *
    * Only use this component for text inputs presently. More work to come.
    *
    * ### CSS Variables:
    * ```
    * --tjs-input-appearance
    * --tjs-input-background
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-border-disabled
    * --tjs-input-box-shadow-focus
    * --tjs-input-box-shadow-focus-visible
    * --tjs-input-caret-color
    * --tjs-input-color
    * --tjs-input-color-disabled
    * --tjs-input-cursor
    * --tjs-input-cursor-disabled
    * --tjs-input-flex
    * --tjs-input-font-family
    * --tjs-input-font-size
    * --tjs-input-height
    * --tjs-input-line-height
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
    * --tjs-input-text-appearance
    * --tjs-input-text-background
    * --tjs-input-text-border
    * --tjs-input-text-border-radius
    * --tjs-input-text-border-disabled
    * --tjs-input-text-box-shadow-focus
    * --tjs-input-text-box-shadow-focus-visible
    * --tjs-input-text-caret-color
    * --tjs-input-text-color
    * --tjs-input-text-color-disabled
    * --tjs-input-text-cursor
    * --tjs-input-text-cursor-disabled
    * --tjs-input-text-flex
    * --tjs-input-text-font-family
    * --tjs-input-text-font-size
    * --tjs-input-text-height
    * --tjs-input-text-line-height
    * --tjs-input-text-outline-focus-visible
    * --tjs-input-text-outline-offset
    * --tjs-input-text-overflow
    * --tjs-input-text-padding
    * --tjs-input-text-placeholder-color
    * --tjs-input-text-text-align
    * --tjs-input-text-transition-focus-visible
    * --tjs-input-text-value-invalid-color
    * --tjs-input-text-width
    * ```
    * @componentDocumentation
    */
   import { writable }     from '#svelte/store';

   import { applyStyles }  from '#runtime/svelte/action/dom';
   import { localize }     from '#runtime/svelte/helper';
   import { isObject }     from '#runtime/util/object';

   import {
      isReadableStore,
      isWritableStore }    from '#runtime/util/store';

   import {
      TJSSlotLabel,
      TJSSlotLabelUtil }   from '../../label';

   export let input = void 0;

   export let disabled = void 0;
   export let label = void 0;
   export let options = void 0;
   export let placeholder = void 0;
   export let readonly = void 0;
   export let store = void 0;
   export let storeIsValid = void 0;
   export let styles = void 0;
   export let type = void 0;

   export let efx = void 0;

   const localOptions = {
      blurOnEnterKey: true,
      cancelOnEscKey: false,
      clearOnEscKey: false
   }

   let inputEl;

   // ----------------------------------------------------------------------------------------------------------------

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

   $: label = isObject(input) && TJSSlotLabelUtil.isValid(input.label) ? input.label :
    TJSSlotLabelUtil.isValid(label) ? label : void 0;

   $: {
      options = isObject(input) && isObject(input.options) ? input.options :
       isObject(options) ? options : {};

      if (typeof options?.blurOnEnterKey === 'boolean') { localOptions.blurOnEnterKey = options.blurOnEnterKey; }
      if (typeof options?.cancelOnEscKey === 'boolean') { localOptions.cancelOnEscKey = options.cancelOnEscKey; }
      if (typeof options?.clearOnEscKey === 'boolean') { localOptions.clearOnEscKey = options.clearOnEscKey; }
   }

   $: placeholder = isObject(input) && typeof input.placeholder === 'string' ? localize(input.placeholder) :
    typeof placeholder === 'string' ? localize(placeholder) : void 0;

   $: readonly = isObject(input) && typeof input.readonly === 'boolean' ? input.readonly :
    typeof readonly === 'boolean' ? readonly : false;

   $: store = isObject(input) && isWritableStore(input.store) ? input.store :
    isWritableStore(store) ? store : writable(void 0);

   $: storeIsValid = isObject(input) && isReadableStore(input.storeIsValid) ? input.storeIsValid :
    isReadableStore(storeIsValid) ? storeIsValid : writable(true);

   $: styles = isObject(input) && isObject(input.styles) ? input.styles :
    isObject(styles) ? styles : void 0;

   $: efx = isObject(input) && typeof input.efx === 'function' ? input.efx :
    typeof efx === 'function' ? efx : () => {};

   // ----------------------------------------------------------------------------------------------------------------

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
      if (localOptions.blurOnEnterKey && event.code === 'Enter')
      {
         event.preventDefault();
         event.stopPropagation();

         inputEl.blur();
         return;
      }

      if (event.code === 'Escape')
      {
         if (localOptions.cancelOnEscKey && typeof initialValue === 'string')
         {
            event.preventDefault();
            event.stopPropagation();

            store.set(initialValue);
            initialValue = void 0;
            inputEl.blur();
         }
         else if (localOptions.clearOnEscKey)
         {
            event.preventDefault();
            event.stopPropagation();

            store.set('');
            inputEl.blur();
         }
      }
   }
</script>

<TJSSlotLabel {label} {disabled}>
   <div class=tjs-input-container use:efx use:applyStyles={styles} on:pointerdown|stopPropagation>
      <input class=tjs-input
             {...{ type }}
             bind:this={inputEl}
             bind:value={$store}
             class:is-value-invalid={!$storeIsValid}
             {placeholder}
             {disabled}
             {readonly}
             on:focusin={onFocusIn}
             on:keydown={onKeyDown}
      />
   </div>
</TJSSlotLabel>

<style>
    .tjs-input-container {
        display: block;
        pointer-events: none;
        transform-style: preserve-3d;

        background: var(--tjs-input-text-background, var(--tjs-input-background));
        border-radius: var(--tjs-input-text-border-radius, var(--tjs-input-border-radius));
        flex: var(--tjs-input-text-flex, var(--tjs-input-flex));
        margin: var(--tjs-input-text-margin, var(--tjs-input-margin));
        height: var(--tjs-input-text-height, var(--tjs-input-height));
        width: var(--tjs-input-text-width, var(--tjs-input-width));
    }

    .is-value-invalid {
        color: var(--tjs-input-text-value-invalid-color, var(--tjs-input-value-invalid-color, red));
    }

    input {
        pointer-events: initial;
        display: inline-block;
        position: relative;

        appearance: var(--tjs-input-text-appearance, var(--tjs-input-appearance, auto));

        background: transparent;

        border: var(--tjs-input-text-border, var(--tjs-input-border));
        border-radius: var(--tjs-input-text-border-radius, var(--tjs-input-border-radius));

        width: 100%;
        height: 100%;

        padding: var(--tjs-input-text-padding, var(--tjs-input-padding, initial));

        color: var(--tjs-input-text-color, var(--tjs-input-color, inherit));
        caret-color: var(--tjs-input-text-caret-color, var(--tjs-input-caret-color));
        font-family: var(--tjs-input-text-font-family, var(--tjs-input-font-family, inherit));
        font-size: var(--tjs-input-text-font-size, var(--tjs-input-font-size, inherit));
        line-height: var(--tjs-input-text-line-height, var(--tjs-input-line-height, inherit));
        outline-offset: var(--tjs-input-text-outline-offset, var(--tjs-input-outline-offset));
        text-align: var(--tjs-input-text-text-align, var(--tjs-input-text-align));

        cursor: var(--tjs-input-text-cursor, var(--tjs-input-cursor, text));

        transform: translateZ(1px);
    }

    input:disabled {
       border: var(--tjs-input-text-border-disabled, var(--tjs-input-border-disabled, none));
       color: var(--tjs-input-text-color-disabled, var(--tjs-input-color-disabled, revert));
       cursor: var(--tjs-input-text-cursor-disabled, var(--tjs-input-cursor-disabled, default));
       pointer-events: none;
    }

    input:focus {
        box-shadow: var(--tjs-input-text-box-shadow-focus, var(--tjs-input-box-shadow-focus, unset));
    }

    input:focus-visible {
        box-shadow: var(--tjs-input-text-box-shadow-focus-visible, var(--tjs-input-box-shadow-focus-visible, unset));
        outline: var(--tjs-input-text-outline-focus-visible, var(--tjs-input-outline-focus-visible));
        transition: var(--tjs-input-text-transition-focus-visible, var(--tjs-input-transition-focus-visible));
    }

    input::placeholder {
        color: var(--tjs-input-text-placeholder-color, var(--tjs-input-placeholder-color, inherit));
    }
</style>
