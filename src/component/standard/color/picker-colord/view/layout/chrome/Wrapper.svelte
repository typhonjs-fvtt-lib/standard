<script>
   import {
      getContext, onMount,
      setContext
   } from 'svelte';

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
      firstFocusEl,
      hasAddons,
      hasAlpha,
      hasButtonBar,
      hasTextInput,
      isOpen,
      isPopup,
      padding,
      width
   } = internalState.stores;

   /** @type {HTMLElement} */
   let pickerEl, wrapperEl;

   // Set first focusable element for cyclic focus traversal in popup mode.
   onMount(() => $firstFocusEl = pickerEl);

   /**
    * This is a bit of magic number adjustment of internal `padding` store to compensate for the container width
    * adjustment that the default layout sets. In this case just for a sanity case padding needs to be set to '0' if
    * in the case that layout first was the default layout then switched to "chrome".
    */
   $: if (wrapperEl && $isOpen) {
      $padding = `0`;
   }
</script>

<div bind:this={wrapperEl}
     class=tjs-color-picker-wrapper
     class:pop-up={$isPopup}>
    <Picker bind:pickerEl />
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
<svelte:component this={$components.focusWrap} />

<style>
    .tjs-color-picker-wrapper {
        flex-direction: column;
        display: flex;

        background: var(--tjs-color-picker-wrapper-background, var(--tjs-default-popup-background, #23221d));
        border: var(--tjs-color-picker-wrapper-border, var(--tjs-default-popup-border, 1px solid black));
        color: var(--tjs-color-picker-wrapper-primary-color, var(--tjs-default-popup-primary-color, #b5b3a4));
        margin: var(--tjs-color-picker-wrapper-margin, 0);

        width: 100%;
        height: max-content;

        --tjs-icon-button-diameter: 2em;
    }

    .tjs-color-picker-wrapper.pop-up {
        box-shadow: var(--tjs-color-picker-wrapper-box-shadow, var(--tjs-default-popup-box-shadow, 0 0 2px #000));
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
            border-radius: max(var(--tjs-color-picker-wrapper-border-radius, var(--tjs-default-popup-border-radius, 5px)), 2cqw);
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
