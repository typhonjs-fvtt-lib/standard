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
    /*@import 'wrapper.css';*/
</style>
