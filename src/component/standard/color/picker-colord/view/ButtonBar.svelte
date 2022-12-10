<script>
   import { getContext }    from 'svelte';

   import { ripple }        from '@typhonjs-fvtt/svelte-standard/action';

   import TJSIconButton     from '../../../button/TJSIconButton.svelte';
   import TJSColordButton   from '../TJSColordButton.svelte';

   import { EyeDropper }    from '../model/EyeDropper.js';

   const internalState = getContext('#tjs-color-picker-state');

   const { currentColor } = internalState.colorState.stores;
   const { hasEyeDropper } = internalState.stores;
</script>

<section>
    <TJSColordButton color={$currentColor} efx={ripple()} />
    {#if $hasEyeDropper}
        <TJSIconButton button={EyeDropper.buttonData(internalState.colorState)} efx={ripple()} />
    {/if}
</section>

<style>
    section {
        display: flex;
        flex: 1;

        background: var(--tjs-color-picker-overlay-background, rgba(0, 0, 0, 0.1));
        border: var(--tjs-input-number-border, var(--tjs-input-border));
        border-radius: 0.25em;

        --tjs-icon-button-border: var(--tjs-input-border);
        --tjs-icon-button-border-width: 2px;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            padding: min(4px, 1.5cqw);
            gap: min(8px, 2cqw);
        }
    }

    @container tjs-color-picker-container (min-width: 235px) {
        section {
            font-size: calc(0.175em + 5cqi);
        }
    }
</style>
