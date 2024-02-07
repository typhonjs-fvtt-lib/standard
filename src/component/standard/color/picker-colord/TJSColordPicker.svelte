<script>
   /**
    * TODO: Finish documentation.
    *
    * Events:
    * - color: current color
    *
    * @componentDocumentation
    */

   import {
      createEventDispatcher,
      getContext,
      onDestroy,
      setContext }              from '#svelte';

   import { colord }            from '#runtime/color/colord';

   import { applyStyles }       from '#runtime/svelte/action/dom';

   import {
      A11yHelper,
      ClipboardAccess }         from '#runtime/util/browser';

   import { isObject }          from '#runtime/util/object';

   import { isWritableStore }   from '#runtime/util/store';

   import { InternalState }     from './model/index.js';

   import {
      Input,
      MainLayout }              from './view/index.js'

   /**
    * color properties
    *
    * @type {import('.').TJSColordPickerColor}
    */
   export let color = void 0;

   /**
    * User settable options / customization properties.
    *
    * @type {import('../../').TJSColordPickerOptions}
    */
   export let options = void 0;

   const dispatch = createEventDispatcher();

   const external = getContext('#external');

   const internalState = new InternalState(color, options, external?.sessionStorage);

   setContext('#tjs-color-picker-state', internalState);

   const {
      components,
      firstFocusEl,
      inputName,
      isPopup,
      padding,
      width
   } = internalState.stores;

   const colorState = internalState.colorState;

   const {
      currentColor,
      currentColorString,
      hslString,
      hslHueString,
      hslaString,
   } = colorState.stores;

   // Provides options to `A11yHelper.getFocusableElements` to ignore FocusWrap by CSS class.
   const s_IGNORE_CLASSES = { ignoreClasses: ['tjs-color-picker-last-focus'] };

   onDestroy(() => internalState.destroy());

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   $: externalStore = isObject(options) && isWritableStore(options.store) ? options.store : void 0;

   // When options changes update internal state.
   $: internalState.updateOptions(options);

   // Set changes in internal color state to external prop. Set any optional store and dispatch an event.
   $: {
      const newColor = $currentColor;
      color = newColor;

      // Note: We must store `$currentColor` in a temporary variable to use below otherwise this reactive block will
      // be triggered by external changes in color.

      // If any external store is set in options then set current color.
      if (externalStore) { externalStore.set(newColor); }

      // Dispatch `on:color` event for current color.
      dispatch('color', { color: newColor });
   }

   // When `color` prop changes detect if it is an external change potentially updating internal state.
   $: if (!colord($currentColor).isEqual(color))
   {
      colorState.updateExternal(color);
   }

   // When any `externalStore` from `options` changes detect any external change potentially updating internal state.
   $: if (externalStore && !colord($currentColor).isEqual($externalStore))
   {
      colorState.updateExternal($externalStore);
   }

   /** @type {HTMLDivElement} */
   let containerEl = void 0;

   /** @type {HTMLDivElement} */
   let inputEl = void 0;

   /** @type {HTMLSpanElement} */
   let spanEl = void 0;

   /**
    * Copy `currentColorString` to clipboard.
    *
    * TODO Eventbus: If / when an app eventbus is added trigger UI notification message.
    *
    * @returns {Promise<void>}
    */
   async function handleCopy()
   {
      const copyColor = $currentColorString;
      if (typeof copyColor === 'string')
      {
         await ClipboardAccess.writeText(copyColor);
      }
   }

   /**
    * Handle pasting any valid color from secure context (localhost / HTTPS).
    *
    * @returns {Promise<void>}
    */
   async function handlePaste()
   {
      const newColor = await ClipboardAccess.readText();
      if (colord(newColor).isValid()) { colorState.setColor(newColor); }
   }

   /**
    * Special capture handling of keydown events for specific actions.
    *
    * Support copy, cut, paste.
    *
    * When in popup mode like `Esc` to reset color to initial state when popped up and `Enter` to close the picker
    * container. `Shift-Tab` when the `firstFocusEl` is the active element the last focusable element that is not
    * `FocusWrap` is focused.
    *
    * @param {KeyboardEvent}    event -
    */
   function onKeydown(event)
   {
      // Handle cut / copy / paste directly to circumvent external key listeners.
      switch(event.code)
      {
         // Handle copying current color to clipboard.
         case 'KeyC':
         case 'KeyX':
            // Note: Do not perform action if the active element is TJSInput.
            if (document.activeElement?.classList.contains('tjs-input')) { break; }

            if (event.ctrlKey || event.metaKey)
            {
               handleCopy();

               event.preventDefault();
               event.stopImmediatePropagation();
            }
            break;

         case 'KeyV':
            if (event.ctrlKey || event.metaKey)
            {
               // Note: Do not perform action if the active element is TJSInput.
               if (document.activeElement?.classList.contains('tjs-input')) { break; }

               handlePaste();

               event.preventDefault();
               event.stopImmediatePropagation();
            }
            break;
      }

      // The handling below is for popup mode, so exit now otherwise.
      if (!$isPopup) { return; }

      switch (event.code)
      {
         case 'Enter':
            const isOpen = internalState.isOpen;

            // Save initial color when popup opens.
            if (!isOpen) { colorState.savePopupColor(); }

            internalState.swapIsOpen();

            event.preventDefault();
            event.stopImmediatePropagation();

            // If previously open and now closed focus the picker input element.
            if (isOpen) { inputEl.focus(); }
            break;

         case 'Escape':
            // Reset color to initial value when popped out.
            if (internalState.isOpen)
            {
               const initialPopupColor = colorState.getPopupColor();
               if (!colord($currentColor).isEqual(initialPopupColor))
               {
                  // Reset to initial popup color.
                  colorState.setColor(initialPopupColor);
               }
               else
               {
                  // Current color is the same as initial so close popup.
                  internalState.isOpen = false;
                  inputEl.focus();
               }

               event.preventDefault();
               event.stopImmediatePropagation();
            }
            break;

         case 'Space':
            // Capture any space key from propagating; space is used in popup mode to select buttons.
            event.preventDefault();
            event.stopPropagation();

            break;

         case 'Tab':
            // If the popup is open and `Shift-Tab` is pressed and the active element is the first focus element
            // or container element then search for the last focusable element that is not `FocusWrap` to traverse
            // internally in the container.
            if (internalState.isOpen && event.shiftKey &&
             (containerEl === document.activeElement || $firstFocusEl === document.activeElement))
            {
               // Collect all focusable elements from `elementRoot` and ignore TJSFocusWrap.
               const lastFocusEl = A11yHelper.getLastFocusableElement(containerEl, s_IGNORE_CLASSES);
               if (lastFocusEl instanceof HTMLElement) { lastFocusEl.focus(); }

               event.preventDefault();
               event.stopImmediatePropagation();
            }
            break;
      }
   }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<span bind:this={spanEl}
      class=tjs-color-picker
      on:keydown={onKeydown}
      style:--_tjs-color-picker-current-color-hsl={$hslString}
      style:--_tjs-color-picker-current-color-hsl-hue={$hslHueString}
      style:--_tjs-color-picker-current-color-hsla={$hslaString}
      style:--_tjs-color-picker-width-option={$width}
      style:--_tjs-color-picker-padding-option={$padding}
      use:applyStyles={styles}
      role=region>
    <input name={$inputName} type=hidden value={$currentColorString}/>
    {#if $isPopup}
        <Input bind:inputEl />
    {/if}
    <MainLayout bind:containerEl {inputEl} />
</span>

<style>
    span {
        position: relative;
    }
</style>
