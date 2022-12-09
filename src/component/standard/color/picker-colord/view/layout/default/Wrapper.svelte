 <script>
   import {
      getContext,
      setContext }  from 'svelte';

   import {
      AddOnPanel,
      ButtonBar,
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
      hasAlpha,
      hasButtonBar,
      hasTextInput,
      paddingOffset
   } = internalState.stores;
</script>

<div class=tjs-color-picker-wrapper>
    <section class=main>
        <Picker />
        <SliderHue />
        {#if $hasAlpha}
            <SliderAlpha />
        {/if}
    </section>
    <section class=extra>
        {#if $hasTextInput}
            <TextInput />
        {/if}
        {#if $hasButtonBar}
            <ButtonBar />
        {/if}
        <AddOnPanel />
    </section>
</div>

<style>
    .main {
        display: flex;
    }

    .extra {
        display: flex;
        flex-direction: column;
    }

    .tjs-color-picker-wrapper {
        display: flex;
        flex-direction: column;

        background: var(--tjs-color-picker-wrapper-background, white);
        border: var(--tjs-color-picker-wrapper-border, 1px solid black);
        margin: var(--tjs-color-picker-wrapper-margin, 0);

        width: max-content;
        height: max-content;

        --tjs-icon-button-diameter: 2em;
    }

    @container tjs-color-picker-container (min-width: 0) {
        .extra {
            gap: max(2px, 2.5cqw);
        }

        .main {
            gap: max(7px, 3.5cqw);
            margin-right: max(4px, 2cqw)
        }

        .tjs-color-picker-wrapper {
            border-radius: max(4px, 2cqw);
            gap: max(4px, 2.5cqw);
            padding: 2cqw;
        }
    }

    @container tjs-color-picker-container (width < 115px) {
        .extra {
            display: none;
        }
    }

    @container tjs-color-picker-container (min-width: 115px) {
        .extra {
            display: flex;
        }
    }

    @container tjs-color-picker-container (width < 235px) {
        .tjs-color-picker-wrapper {
            --tjs-input-height: max(8px, 8px + 7.65cqi);

            font-size: max(0.35em, 0.35em + 3.885cqi);
        }
    }

    @container tjs-color-picker-container (min-width: 235px) {
        .tjs-color-picker-wrapper {
            --tjs-input-height: var(--_tjs-default-input-height);  /* 26px */

            font-size: 1em;
        }
    }
</style>
