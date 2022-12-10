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

   setContext('#tjs-color-picker-constraint', { width: 100, height: 77 });
   setContext('#tjs-color-picker-slider-constraint', 98);
   setContext('#tjs-color-picker-slider-horizontal', true);

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      hasAddons,
      hasAlpha,
      hasButtonBar,
      hasTextInput,
   } = internalState.stores;
</script>

<div class=tjs-color-picker-wrapper>
    <Picker />
    <div class=tjs-color-picker-wrapper-body>
        <section class=sliders>
            <SliderHue />
            {#if $hasAlpha}
                <SliderAlpha />
            {/if}
        </section>
        <section class=extra
                 class:display-none={!($hasAddons || $hasTextInput || $hasButtonBar)}>
            {#if $hasTextInput}
                <TextInput />
            {/if}
            {#if $hasButtonBar}
                <ButtonBar />
            {/if}
            {#if $hasAddons}
                <AddOnPanel />
            {/if}
        </section>
    </div>
</div>

<style>
    .tjs-color-picker-wrapper {
        flex-direction: column;
        display: flex;

        background: var(--tjs-color-picker-wrapper-background, white);
        border: var(--tjs-color-picker-wrapper-border, 1px solid black);
        margin: var(--tjs-color-picker-wrapper-margin, 0);

        width: 100%;
        height: max-content;

        --tjs-icon-button-diameter: 2em;
    }

    .extra, .sliders, .tjs-color-picker-wrapper-body {
        display: flex;
        flex-direction: column;
    }

    .extra.display-none {
        display: none;
    }

    @container tjs-color-picker-container (width >= 115px) {
        /* Add a margin to slider section when text input is visible */
        .sliders {
            margin-bottom: max(4px, 2cqw)
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

    @container tjs-color-picker-container (min-width: 0) {
        .extra {
            gap: max(2px, 2.5cqw);
        }

        .sliders {
            gap: max(7px, 3.5cqw);
        }

        .tjs-color-picker-wrapper {
            border-radius: max(4px, 2cqw);
            gap: max(2px, 2.5cqw);
        }

        .tjs-color-picker-wrapper-body {
            gap: max(4px, 2.5cqw);
            padding: max(3px, 2cqw);
        }
    }

    @container tjs-color-picker-container (0 <= width < 235px) {
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
