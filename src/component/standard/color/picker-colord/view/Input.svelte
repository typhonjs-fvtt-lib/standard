<script>
   import { getContext } from '#svelte';

   export let inputEl = void 0;

   const internalState = getContext('#tjs-color-picker-state');
   const colorState = internalState.colorState;

   /**
    * Handles opening / closing popup; when opening saves current color on initial open.
    */
   function onClick()
   {
      if (!internalState.isOpen) { colorState.savePopupColor(); }

      internalState.swapIsOpen();
   }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div bind:this={inputEl}
     class=tjs-color-picker-input
     on:click={onClick}
     role=button
     tabindex=0>
    <div class=tjs-color-picker-input-inner />
</div>

<style>
    .tjs-color-picker-input {
        margin: var(--tjs-color-picker-input-margin, 0);
        padding: var(--tjs-color-picker-input-padding, 0);
        flex-shrink: 0;

        border: none;
        width: var(--tjs-color-picker-input-width, 32px);
        height: var(--tjs-color-picker-input-height, var(--tjs-input-height, 26px));

        cursor: var(--tjs-color-picker-input-cursor, pointer);

        background: var(--tjs-checkerboard-background-10);
        border-radius: var(--tjs-color-picker-input-border-radius, var(--tjs-input-border-radius, 0.25em));
        clip-path: var(--tjs-color-picker-input-clip-path, none);

        transition: var(--tjs-color-picker-input-transition, var(--tjs-input-transition));
    }

    .tjs-color-picker-input:focus {
        clip-path: var(--tjs-color-picker-input-clip-path-focus, none);
    }

    .tjs-color-picker-input:focus-visible {
        outline: var(--tjs-color-picker-input-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
    }

    .tjs-color-picker-input:hover {
        clip-path: var(--tjs-color-picker-input-clip-path-hover, none);
    }

    .tjs-color-picker-input-inner {
        width: 100%;
        height: 100%;
        background: var(--_tjs-color-picker-current-color-hsla);

        border: var(--tjs-color-picker-input-border, var(--tjs-input-border, 1px solid gray));
        border-radius: var(--tjs-color-picker-input-border-radius, var(--tjs-input-border-radius, 0.25em));
    }
</style>
