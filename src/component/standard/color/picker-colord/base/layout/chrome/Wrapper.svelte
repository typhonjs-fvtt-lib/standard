<script>
   import {
      getContext,
      setContext }  from 'svelte';

   import {
      Picker,
      SliderAlpha,
      SliderHue }   from '../../index.js';

   setContext('#tjs-color-picker-constraint', { width: 100, height: 77 });
   setContext('#tjs-color-picker-slider-constraint', 98);
   setContext('#tjs-color-picker-slider-horizontal', true);

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isAlpha,
      isTextInput,
   } = internalState.stores;
</script>

<div class=tjs-color-picker-wrapper>
    <Picker />
    <section>
        <SliderHue />
        {#if $isAlpha}
            <SliderAlpha />
        {/if}
        {#if $isTextInput}
            <svelte:component this={$components.textInput} />
        {/if}
    </section>
</div>

<style>
    .tjs-color-picker-wrapper {
        display: inline-flex;
        flex-direction: column;

        background: var(--tjs-color-picker-wrapper-background, white);
        border: var(--tjs-color-picker-wrapper-border, 1px solid black);
        border-radius: var(--tjs-color-picker-wrapper-border-radius, 8px);
        margin: var(--tjs-color-picker-wrapper-margin, 0);

        width: 100%;
        height: max-content;
    }

    section {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            padding: max(3px, 2cqw);
        }

        .tjs-color-picker-wrapper {
            border-radius: var(--tjs-color-picker-wrapper-border-radius, max(4px, 2cqw));
        }
    }
</style>
