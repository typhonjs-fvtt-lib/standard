<script>
   import {
      getContext,
      onDestroy,
      setContext }               from '#svelte';

   import { writable }           from '#svelte/store';

   import { getStackingContext } from '#runtime/util/browser';

   export let containerEl = void 0;
   export let inputEl = void 0;

   const application = getContext('#external')?.application;

   /** @type {import('svelte/store').Writable<Window>} */
   const activeWindow = application?.reactive?.storeUIState?.activeWindow ?? writable(globalThis);

   setContext('#activeWindow', activeWindow);

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isOpen,
      isPopup
   } = internalState.stores;

   $: if ($isPopup && $isOpen && containerEl)
   {
      getActiveWindow().document.body.addEventListener('pointerdown', onPointerDown, { capture: true });

      // Focus containerEl on next tick so that potential tab navigation in popup mode can be traversed in reverse.
      setTimeout(() => containerEl.focus(), 0);
   }

   // Sanity case to remove listener when `options.isPopup` state changes externally.
   $: if (!$isPopup) { getActiveWindow().document.body.removeEventListener('pointerdown', onPointerDown); }

   onDestroy(() => getActiveWindow().document.body.removeEventListener('pointerdown', onPointerDown));

   /**
    * @returns {Window} Returns the active window.
    */
   function getActiveWindow()
   {
      return $activeWindow;
   }

   /**
    * Handles pointerdown events in popup mode that reach `document.body` to detect when the user clicks away from the
    * popup in order to close it.
    *
    * @param {PointerEvent}   event -
    */
   function onPointerDown(event)
   {
      // Early out if pointer down on container element or child element of wrapper.
      if (containerEl !== null && (event.target === containerEl || containerEl.contains(event.target))) { return; }

      // Remove listener.
      getActiveWindow().document.body.removeEventListener('pointerdown', onPointerDown);

      if ($isPopup)
      {
         // Close picker / popup.
         $isOpen = false;
      }
   }

   /**
    * Handles pointerdown events and focuses the main container programmatically. This allows key events to be captured
    * in popup mode even when interactions where interactions are pointer driven. The container focus is not shown
    * visually.
    */
   function onPointerDownLocal()
   {
      if (containerEl) { containerEl.focus(); }
   }

   /**
    * Provides a custom transition allowing inspection of the element to change positioning styles based on the
    * height / width of the element and the containing stacking context element. This allows the picker when in popup
    * mode to position in the most visible way inside the stacking context / app.
    *
    * TODO: Modify to use future TRL popup API to move popup outside of stacking context / app window.
    *
    * @param {HTMLElement} node - Container element.
    *
    * @returns {object} A minimal transition object is returned.
    */
   function updatePosition(node)
   {
      // Clear any explicit absolute positioning styles when not in popup mode.
      if (!$isPopup)
      {
         node.style.top = null;
         node.style.bottom = null;
         node.style.left = null;
         node.style.right = null;

         return { delay: 0, duration: 0 };
      }

      // Find parent stacking context. This usually is `window-app` or it could be the browser window.
      const result = getStackingContext(node.parentElement);

      if (!(result?.node instanceof HTMLElement))
      {
         console.warn(`'TJSColordPicker.updatePosition warning: Could not locate parent stacking context element.`);
         return { delay: 0, duration: 0 };
      }

      const stackingContextRect = result?.node.getBoundingClientRect();

      const nodeRect = node.getBoundingClientRect();
      const inputRect = inputEl.getBoundingClientRect();

      // Check to make sure that the menu width does not exceed the right side of the stacking context element.
      // If not open to the right.
      if (inputRect.x + nodeRect.width < stackingContextRect.right)
      {
         node.style.left = `0`;
         node.style.removeProperty('right');
      }
      else // Open left.
      {
         node.style.right = `0`;
         node.style.removeProperty('left');
      }

      let applyTop;

      // Test if popup fits inside stacking context downward.
      if (inputRect.y + inputRect.height + nodeRect.height > (stackingContextRect.y + stackingContextRect.height))
      {
         // Only adjust to top if it actually fits upward otherwise apply top / downward
         applyTop = inputRect.y - nodeRect.height <= stackingContextRect.y;
      }
      else
      {
         applyTop = true;
      }

      if (applyTop)
      {
         node.style.removeProperty('bottom');
         node.style.top = `${inputRect.height}px`;
      }
      else
      {
         node.style.removeProperty('top');
         node.style.bottom = `${inputRect.height}px`;
      }

      return { delay: 0, duration: 0 };
   }
</script>

<!-- Conditional is required to trigger transition to correct positioning when in popup mode -->
{#if $isOpen}
<main class=tjs-color-picker-main-layout
      in:updatePosition|global
      on:pointerdown|stopPropagation={onPointerDownLocal}
      class:isOpen={$isOpen}
      class:isPopup={$isPopup}
      bind:this={containerEl}
      tabindex=-1
      role={$isPopup ? 'dialog' : 'none'}
      aria-label="color picker">

   <div class=tjs-color-picker-container>
      <svelte:component this={$components.wrapper} />
   </div>
</main>
{/if}

<style>
   div {
      /* External variable then fallback to `options.width` set in TJSColordPicker */
      width: var(--tjs-color-picker-width, var(--_tjs-color-picker-width-option, 235px));

      container: tjs-color-picker-container / inline-size;
   }

   main {
      display: none;

      padding: var(--tjs-color-picker-padding, var(--_tjs-color-picker-padding-option, 0));
   }

   main:focus {
      outline: transparent;
   }

   .isOpen {
      display: block;
   }

   .isPopup {
      position: absolute;
      z-index: 2;
   }
</style>
