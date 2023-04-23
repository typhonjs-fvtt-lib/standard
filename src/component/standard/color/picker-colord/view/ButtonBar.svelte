<script>
   import { getContext }        from '#svelte';

   import { ClipboardAccess }   from '#runtime/svelte/util';

   import { ripple }            from '#standard/action';

   import TJSIconButton         from '../../../button/TJSIconButton.svelte';
   import TJSToggleIconButton   from '../../../button/TJSToggleIconButton.svelte';

   import TJSColordButton       from '../TJSColordButton.svelte';

   import { EyeDropper }        from '../model/EyeDropper.js';

   const internalState = getContext('#tjs-color-picker-state');
   const buttonState = internalState.buttonState;

   const {
      hasAddons,
      hasEyeDropper} = internalState.stores;

   const { currentColorString } = internalState.colorState.stores;

   /**
    * Copy current color string to clipboard.
    *
    * TODO Eventbus: If / when an app eventbus is added trigger UI notification message
    */
   function onPress()
   {
      ClipboardAccess.writeText($currentColorString);
   }
</script>

<section>
    <TJSColordButton on:press={onPress}
                     color={$currentColorString}
                     efx={ripple({ keyCode: 'Space' })}
                     keyCode={'Space'}
    />

    {#if $hasEyeDropper}
        <TJSIconButton button={EyeDropper.buttonData(internalState.colorState)} efx={ripple({ keyCode: 'Space' })} />
    {/if}

    {#if $hasAddons}
        {#each $buttonState as button}
            {#if button.isToggle}
                <TJSToggleIconButton {button} efx={ripple({ keyCode: 'Space' })} keyCode={'Space'} />
            {:else}
                <TJSIconButton {button} efx={ripple({ keyCode: 'Space' })} keyCode={'Space'} />
            {/if}
        {/each}
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
