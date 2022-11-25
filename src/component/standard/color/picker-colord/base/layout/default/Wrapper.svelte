<script>
   import { getContext }    from 'svelte';

   import {
      Alpha,
      Picker,
      Slider } from '../../index.js';

   import NewSlider from "../../slider/NewSlider.svelte";

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isAlpha,
      isTextInput,
      sliderHorizontal
   } = internalState.stores;

   sliderHorizontal.set(false);
</script>

<div class=tjs-color-picker-wrapper-default>
    <Picker />
<!--    <Slider />-->
    <NewSlider />
    {#if $isAlpha}
        <Alpha />
    {/if}
    {#if $isTextInput}
        <svelte:component this={$components.textInput} />
    {/if}
</div>

<style>
    @import 'wrapper.css';

    /*@container tjs-color-picker-container (min-width: 0) {*/
    /*    .tjs-color-picker .tjs-color-picker-wrapper-default {*/
    /*        border-radius: var(--tjs-color-picker-wrapper-border-radius, max(4px, 2cqw));*/
    /*        padding: var(--tjs-color-picker-wrapper-padding, max(3px, 2cqw));*/
    /*    }*/

    /*    !* First two direct children (picker / first slider) margin *!*/
    /*    .tjs-color-picker .tjs-color-picker-wrapper-default > div:nth-child(-n+2)  {*/
    /*        margin: var(--tjs-color-picker-picker-margin, 0 max(3px, 2.5cqw) 0 0);*/
    /*    }*/

    /*    .tjs-color-picker .tjs-color-picker-wrapper-default .tjs-picker-wrapper {*/
    /*        width: var(--tjs-color-picker-picker-width, 75cqw);*/
    /*        height: var(--tjs-color-picker-picker-height, 75cqw);*/

    /*        border-radius: var(--tjs-color-picker-picker-border-radius, max(4px, 2cqw));*/
    /*    }*/

    /*    .tjs-color-picker .tjs-color-picker-wrapper-default .tjs-slider-wrapper {*/
    /*        width: var(--tjs-color-picker-slider-width, max(10px, 5cqw));*/
    /*        height: var(--tjs-color-picker-slider-height, 75cqw);*/
    /*    }*/

    /*    .tjs-color-picker .tjs-color-picker-wrapper-default .tjs-slider {*/
    /*        padding: max(2px, 1cqw) 0 max(2px, 1cqw) 0;*/
    /*    }*/

    /*    .tjs-color-picker .tjs-color-picker-wrapper-default .tjs-slider.horizontal {*/
    /*        padding: 0 max(2px, 1cqw) 0 max(2px, 1cqw);*/
    /*    }*/

    /*    !***/
    /*     * slider indicator relative to entire container vs slider as independent container.*/
    /*     * These values are the static values when slider width is clamped above to 10px.*/
    /*     *!*/
    /*    .tjs-color-picker .tjs-color-picker-wrapper-default .tjs-slider-indicator {*/
    /*        border: max(2px, 1cqw) solid white;*/
    /*        border-radius: max(7px, 3.5cqw);*/
    /*        margin-left: min(-2px, -1cqw);*/

    /*        outline-width: max(2px, 1cqw);*/

    /*        width: max(14px, 7cqw);*/
    /*        height: max(14px, 7cqw);*/
    /*    }*/
    /*}*/
</style>
