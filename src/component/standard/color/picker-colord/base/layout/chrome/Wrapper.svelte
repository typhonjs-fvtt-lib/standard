<script>
   import { getContext }    from 'svelte';

   import {
      Alpha,
      Picker,
      Slider } from '../../index.js';

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isAlpha,
      isTextInput,
      sliderHorizontal
   } = internalState.stores;

   sliderHorizontal.set(true);
</script>

<div class=tjs-color-picker-wrapper-chrome>
    <Picker />
    <Slider />
    {#if $isAlpha}
        <Alpha />
    {/if}
    {#if $isTextInput}
        <svelte:component this={$components.textInput} />
    {/if}
</div>

<style>
    @import 'wrapper.css';

    /*div {*/
    /*    !*padding: var(--tjs-color-picker-wrapper-padding, 0 0 3px 0);*!*/

    /*    background: var(--tjs-color-picker-wrapper-background, white);*/
    /*    border: var(--tjs-color-picker-wrapper-border, 1px solid black);*/
    /*    border-radius: var(--tjs-color-picker-wrapper-border-radius, 8px);*/
    /*    margin: var(--tjs-color-picker-wrapper-margin, 0);*/

    /*    height: max-content;*/
    /*    width: 100%;*/

    /*    display: inline-flex;*/
    /*    flex-direction: column;*/
    /*}*/
</style>
