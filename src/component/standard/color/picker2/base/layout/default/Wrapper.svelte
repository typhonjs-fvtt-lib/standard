<script>
   import { getContext }    from 'svelte';

   const { isOpen, isPopup, sliderHorizontal } = getContext('#tjs-color-picker-state').stores;

   sliderHorizontal.set(false);

   let wrapperEl;

   $: if ($isPopup && $isOpen && wrapperEl) { document.body.addEventListener('pointerdown', onPointerDown); }

   function onPointerDown(event)
   {
      // Early out if pointer down on wrapper element or child element of wrapper.
      if (event.target === wrapperEl || wrapperEl.contains(event.target)) { return; }

      // Remove listener.
      document.body.removeEventListener('pointerdown', onPointerDown);

      // Close picker / popup.
      $isOpen = false;
   }

   // Sanity case to remove listener when `options.isPopup` state changes externally.
   $: if (!$isPopup) { document.body.removeEventListener('pointerdown', onPointerDown); }
</script>

<div class=wrapper
     bind:this={wrapperEl}
     class:isOpen={$isOpen}
     class:isPopup={$isPopup}
     role={$isPopup ? 'dialog' : void 0}
     aria-label="color picker"
>
    <slot />
</div>

<style>
    div {
        background: var(--tjs-color-picker-wrapper-background, white);
        padding: var(--tjs-color-picker-wrapper-padding, 8px 5px 5px 8px);
        margin: var(--tjs-color-picker-wrapper-margin, 0);
        border: var(--tjs-color-picker-wrapper-border, 1px solid black);
        border-radius: var(--tjs-color-picker-wrapper-border-radius, 12px);
        display: none;
        height: var(--tjs-color-picker-wrapper-height, max-content);
        width: var(--tjs-color-picker-wrapper-width, max-content);
    }

    .isOpen {
        display: block;
    }

    .isPopup {
        position: absolute;
        z-index: 2;
    }
</style>
