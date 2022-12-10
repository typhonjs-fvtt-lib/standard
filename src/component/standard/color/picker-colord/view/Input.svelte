<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');
</script>

<div class=tjs-color-picker-input
     on:click={() => internalState.swapIsOpen()}
     on:keypress={() => internalState.swapIsOpen()}
     role=button>
    <div class=tjs-color-picker-input-inner />
</div>

<style>
    .tjs-color-picker-input {
        margin: 0;
        padding: 0;
        border: none;
        width: var(--tjs-color-picker-input-width, 32px);
        height: var(--tjs-color-picker-input-height, var(--tjs-input-height, 26px));
        flex-shrink: 0;
        cursor: pointer;

        background: var(--tjs-checkerboard-background-10);
        border-radius: var(--tjs-color-picker-input-border-radius, var(--tjs-input-border-radius, 0.25em));
    }

    .tjs-color-picker-input-inner {
        width: 100%;
        height: 100%;
        background: var(--_tjs-color-picker-current-color-hsla);

        border: var(--tjs-color-picker-input-border, var(--tjs-input-border, 1px solid gray));
        border-radius: var(--tjs-color-picker-input-border-radius, var(--tjs-input-border-radius, 0.25em));
    }

    /*:global(.has-been-tabbed) label:focus-within {*/
    /*    outline: 2px solid var(--tjs-color-picker-focus-color, red);*/
    /*    outline-offset: 2px;*/
    /*}*/
</style>
