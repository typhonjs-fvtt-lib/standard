<script>
   import { getContext } from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');
</script>

<div class=outer
     on:click={() => internalState.swapIsOpen()}
     on:keypress={() => internalState.swapIsOpen()}
     role=button>
    <div class=inner />
</div>

<style>
    .inner {
        width: 100%;
        height: 100%;
        background: var(--_tjs-color-picker-current-color-hsla);
    }

    .outer {
        margin: 0;
        padding: 0;
        border: none;
        width: 32px;
        height: 26px;   /* Create CSS variable and assign default height to --form-field-height */
        flex-shrink: 0;
        cursor: pointer;

        background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%);
        background-size: 10px 10px;
        background-position: 0 0, 5px 5px;
    }

    /*:global(.has-been-tabbed) label:focus-within {*/
    /*    outline: 2px solid var(--tjs-color-picker-focus-color, red);*/
    /*    outline-offset: 2px;*/
    /*}*/
</style>
