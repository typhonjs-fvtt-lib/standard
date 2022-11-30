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

    @container tjs-color-picker-container (min-width: 0) {
        .tjs-color-picker-wrapper-default {
            border-radius: var(--tjs-color-picker-wrapper-border-radius, max(4px, 2cqw));
            padding: var(--tjs-color-picker-wrapper-padding, max(3px, 2cqw));
        }

        /* First two direct children (picker / first slider) margin */
        .tjs-color-picker-wrapper-default > div:nth-child(-n+2)  {
            margin: var(--tjs-color-picker-picker-margin, 0 max(3px, 2.5cqw) 0 0);
        }


        /*.tjs-color-picker-wrapper-default .tjs-slider {*/
        /*    padding: max(2px, 1cqw) 0 max(2px, 1cqw) 0;*/
        /*}*/

        /*.tjs-color-picker-wrapper-default .tjs-slider.horizontal {*/
        /*    padding: 0 max(2px, 1cqw) 0 max(2px, 1cqw);*/
        /*}*/
    }
</style>
