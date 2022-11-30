<script>
   import {
      getContext,
      setContext }  from 'svelte';

   import {
      Alpha,
      Picker,
      Slider } from '../../index.js';

   import NewSlider from "../../slider/NewSlider.svelte";

   setContext('#tjs-color-picker-constraint', { width: 100, height: 77 });
   setContext('#tjs-color-picker-slider-constraint', 90);
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
<!--    <Slider />-->
    <section>
        <NewSlider />
        {#if $isAlpha}
            <Alpha />
        {/if}
        {#if $isTextInput}
            <svelte:component this={$components.textInput} />
        {/if}
    </section>
</div>

<style>
    /*section {*/
    /*    padding: 4px;*/
    /*}*/

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

    @container tjs-color-picker-container (min-width: 0) {
        /*border-radius: var(--tjs-color-picker-picker-border-radius, max(4px, 2cqw));*/

        .tjs-color-picker-wrapper {
            border-radius: var(--tjs-color-picker-wrapper-border-radius, max(4px, 2cqw));
            /*padding: var(--tjs-color-picker-wrapper-padding, max(3px, 2cqw));*/
        }

        /* First two direct children (picker / first slider) margin */
        /*.tjs-color-picker-wrapper > div:nth-child(-n+2) {*/
        /*    margin: var(--tjs-color-picker-picker-margin, 0 max(3px, 2.5cqw) 0 0);*/
        /*}*/
    }
    /*@import 'wrapper.css';*/
</style>
