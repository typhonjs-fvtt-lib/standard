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
    */
   $: if (wrapperEl && $isOpen) {
      const parentRect = wrapperEl.parentElement.getBoundingClientRect();
      const wrapperRect = wrapperEl.getBoundingClientRect();

      const widthNum = Number.parseFloat($width);

      if (widthNum > 185 && parentRect.width >= wrapperRect.width)
      {
         wrapperEl.style.width = '100%';
         $padding = `0`;
      }
      else
      {
         wrapperEl.style.width = 'max-content';
         $padding = `0 calc(${wrapperRect.width}px - ${parentRect.width}px) 0 0`;
      }
   }
</script>

<div bind:this={wrapperEl} class=tjs-color-picker-wrapper>
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
