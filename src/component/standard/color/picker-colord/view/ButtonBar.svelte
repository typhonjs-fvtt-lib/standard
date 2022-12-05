<script>
   import { getContext }    from 'svelte';

   import { ripple }        from '@typhonjs-fvtt/svelte-standard/action';

   import TJSIconButton     from '../../../button/TJSIconButton.svelte';

   import { EyeDropper }    from '../model/EyeDropper.js';

   const internalState = getContext('#tjs-color-picker-state');

   const { hasEyeDropper } = internalState.stores;
</script>

<section>
    {#if $hasEyeDropper}
        <TJSIconButton button={EyeDropper.buttonData(internalState.colorState)} efx={ripple()} />
    {/if}
</section>

<style>
    section {
        display: flex;
        flex: 1;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            gap: min(8px, 2cqw);
        }
    }
</style>
