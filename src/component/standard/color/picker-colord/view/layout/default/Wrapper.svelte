<script>
   import {
      getContext,
      onMount,
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
      firstFocusEl,
      hasAddons,
      hasAlpha,
      hasButtonBar,
      hasTextInput,
      isOpen,
      isPopup,
      padding,
      width,
   } = internalState.stores;

   /** @type {HTMLElement} */
   let pickerEl, wrapperEl;

   // Set first focusable element for cyclic focus traversal in popup mode.
   onMount(() => $firstFocusEl = pickerEl);

   /**
    * This is a bit of magic number adjustment of internal `padding` store to compensate for the container width
    * adjustment given that this layout below ~185px the container query layout expands the width of the sliders
    * which expands the inner wrapper beyond the optional `width` amount. A padding offset is calculated from the
    * parent container and this wrapper. This allows automatic adjustment to align container without a manual
    * external padding option.
    *
    * Note: `requestAnimationFrame` is used for Firefox support where `getBoundingClientRect` does not always return
    * the correct results right after mount. They are correct by the `rAF` callback. Also, the use of adding / removing
    * `width-100` class for 100% or without `max-content` is used over inline styles as for a currently unknown reason
    * if you modify inline styles Svelte triggers the reactive statement again.
    */
   $: if ($isOpen) {
      requestAnimationFrame(() =>
      {
         const parentRect = wrapperEl.parentElement.getBoundingClientRect();
         const wrapperRect = wrapperEl.getBoundingClientRect();

         const widthNum = Number.parseFloat($width);

         if (widthNum > 185 && parentRect.width >= wrapperRect.width)
         {
            wrapperEl.classList.add('width-100');
            $padding = `0`;
         }
         else
         {
            wrapperEl.classList.remove('width-100');
            $padding = `0 calc(${wrapperRect.width}px - ${parentRect.width}px) 0 0`;
         }
      });
   }
</script>

<div bind:this={wrapperEl}
     class="tjs-color-picker-wrapper width-100"
     class:pop-up={$isPopup}>
    <section class=main>
        <Picker bind:pickerEl />
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
<svelte:component this={$components.focusWrap} />

<style>
    .main {
        display: flex;
    }

    .tjs-color-picker-wrapper.width-100 {
        width: 100%;
    }

    .extra {
        display: flex;
        flex-direction: column;
    }

    .extra.display-none {
        display: none;
    }

    .tjs-color-picker-wrapper {
        display: flex;
        flex-direction: column;

        background: var(--tjs-color-picker-wrapper-background, var(--tjs-default-popup-background, #23221d));
        border: var(--tjs-color-picker-wrapper-border, var(--tjs-default-popup-border, 1px solid black));
        color: var(--tjs-color-picker-wrapper-primary-color, var(--tjs-default-popup-primary-color, #b5b3a4));
        margin: var(--tjs-color-picker-wrapper-margin, 0);

        width: max-content;
        height: max-content;

        --tjs-icon-button-diameter: 2em;
    }

    .tjs-color-picker-wrapper.pop-up {
        box-shadow: var(--tjs-color-picker-wrapper-box-shadow, var(--tjs-default-popup-box-shadow, 0 0 2px #000));
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
            border-radius: max(var(--tjs-color-picker-wrapper-border-radius, var(--tjs-default-popup-border-radius, 5px)), 2cqw);
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
