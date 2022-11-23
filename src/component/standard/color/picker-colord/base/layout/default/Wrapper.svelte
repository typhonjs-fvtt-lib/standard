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

   sliderHorizontal.set(false);
</script>

<div class=tjs-color-picker-wrapper-default>
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
    /*    background: var(--tjs-color-picker-wrapper-background, white);*/
    /*    border: var(--tjs-color-picker-wrapper-border, 1px solid black);*/
    /*    border-radius: var(--tjs-color-picker-wrapper-border-radius, 12px);*/
    /*    margin: var(--tjs-color-picker-wrapper-margin, 0);*/

    /*    width: 100%;*/
    /*    height: max-content;*/
    /*}*/
</style>
