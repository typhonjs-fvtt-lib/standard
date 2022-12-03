 <script>
   import {
      getContext,
      setContext }  from 'svelte';

   import {
      Picker,
      SliderAlpha,
      SliderHue,
      TextInput }   from '../../index.js';

   setContext('#tjs-color-picker-constraint', { width: 75, height: 75 });
   setContext('#tjs-color-picker-slider-constraint', 75);
   setContext('#tjs-color-picker-slider-horizontal', false);

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isAlpha,
      isTextInput,
   } = internalState.stores;
</script>

<div class=tjs-color-picker-wrapper>
    <section>
        <Picker />
        <SliderHue />
        {#if $isAlpha}
            <SliderAlpha />
        {/if}
    </section>
    {#if $isTextInput}
        <TextInput />
    {/if}
</div>

<style>
    section {
        display: flex;
    }

    .tjs-color-picker-wrapper {
        display: flex;
        flex-direction: column;

        background: var(--tjs-color-picker-wrapper-background, white);
        border: var(--tjs-color-picker-wrapper-border, 1px solid black);
        margin: var(--tjs-color-picker-wrapper-margin, 0);

        width: max-content;
        height: max-content;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            gap: max(7px, 3.5cqw);
            margin-right: max(4px, 2cqw)
        }

        .tjs-color-picker-wrapper {
            border-radius: max(4px, 2cqw);
            gap: max(4px, 2.5cqw);
            padding: 2cqw;
        }
    }
</style>
