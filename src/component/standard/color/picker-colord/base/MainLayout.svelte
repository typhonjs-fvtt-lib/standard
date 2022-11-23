<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isOpen,
      isPopup,
      isAlpha,
      isTextInput
   } = internalState.stores;

   let containerEl;

   $: if ($isPopup && $isOpen && containerEl) { document.body.addEventListener('pointerdown', onPointerDown); }

   function onPointerDown(event)
   {
      // Early out if pointer down on wrapper element or child element of wrapper.
      if (event.target === containerEl || containerEl.contains(event.target)) { return; }

      // Remove listener.
      document.body.removeEventListener('pointerdown', onPointerDown);

      // Close picker / popup.
      $isOpen = false;
   }

   // Sanity case to remove listener when `options.isPopup` state changes externally.
   $: if (!$isPopup) { document.body.removeEventListener('pointerdown', onPointerDown); }
</script>

<div bind:this={containerEl}
     class=tjs-color-picker-container
     class:isOpen={$isOpen}
     class:isPopup={$isPopup}
     role={$isPopup ? 'dialog' : 'none'}
     aria-label="color picker">
   <svelte:component this={$components.wrapper} />
</div>

<style>
   div {
      display: none;

      width: var(--tjs-color-picker-container-width, 275px);

      container-type: inline-size;
      container-name: tjs-color-picker-container;
   }

   .isOpen {
      display: block;
   }

   .isPopup {
      position: absolute;
      z-index: 2;
   }
</style>
