<script>
   import {
      getContext,
      onDestroy } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isOpen,
      isPopup
   } = internalState.stores;

   let containerEl;

   $: if ($isPopup && $isOpen && containerEl) { document.body.addEventListener('pointerdown', onPointerDown); }

   // Sanity case to remove listener when `options.isPopup` state changes externally.
   $: if (!$isPopup) { document.body.removeEventListener('pointerdown', onPointerDown); }

   onDestroy(() => document.body.removeEventListener('pointerdown', onPointerDown));

   /**
    * Handles pointerdown events in popup mode that reach `document.body` to detect when the user clicks away from the
    * popup in order to close it.
    *
    * @param {PointerEvent}   event -
    */
   function onPointerDown(event)
   {
      // Early out if pointer down on container element or child element of wrapper.
      if (event.target === containerEl || containerEl.contains(event.target)) { return; }

      // Remove listener.
      document.body.removeEventListener('pointerdown', onPointerDown);

      // Close picker / popup.
      $isOpen = false;
   }

   /**
    * Handles pointerdown events and focuses the main container programmatically. This allows key events to be captured
    * in popup mode even when interactions where interactions are pointer driven. The container focus is not shown
    * visually.
    */
   function onPointerDownLocal()
   {
      containerEl.focus();
   }
</script>

<main>
   <div bind:this={containerEl}
        class=tjs-color-picker-container
        class:isOpen={$isOpen}
        class:isPopup={$isPopup}
        on:pointerdown|stopPropagation={onPointerDownLocal}
        tabindex=-1
        role={$isPopup ? 'dialog' : 'none'}
        aria-label="color picker">
      <svelte:component this={$components.wrapper} />
   </div>
</main>

<style>
   div {
      display: none;

      /* External variable then fallback to `options.width` set in TJSColordPicker */
      width: var(--tjs-color-picker-width, var(--_tjs-color-picker-width-option, 235px));

      container: tjs-color-picker-container / inline-size;
   }

   div:focus {
      outline: transparent;
   }

   main {
      padding: var(--tjs-color-picker-padding, var(--_tjs-color-picker-padding-option, 0));
   }

   .isOpen {
      display: block;
   }

   .isPopup {
      position: absolute;
      z-index: 2;
   }
</style>
