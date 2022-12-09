<script>
   import { getContext }    from 'svelte';

   import TJSColordButton   from '../../../TJSColordButton.svelte';

   const internalState = getContext('#tjs-color-picker-state');
   const colorState = internalState.colorState;

   const savedColorState = internalState.addOnState.get('saved-colors').savedColorsState;
</script>

<section>
    {#each $savedColorState as color (color)}
        <TJSColordButton {color}
                         on:click={() => colorState.setColor(color)}
                         on:contextmenu={() => savedColorState.deleteColor(color)} />
    {/each}
</section>

<style>
    section {
        width: inherit;

        display: grid;
        border-top: 1px solid gray;

        --tjs-icon-button-border-radius: 0.25em;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            --tjs-icon-button-diameter: clamp(10px, 5cqw, 14px);

            padding: min(4px, 1.5cqw);

            grid-template-columns: 10% 10% 10% 10% 10% 10% 10% 10%;
            grid-template-rows: 14px;
            column-gap: 3%;
            row-gap: 2cqw;
        }
    }
</style>
