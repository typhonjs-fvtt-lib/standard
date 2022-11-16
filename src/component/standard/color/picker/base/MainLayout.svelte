<script>
   import { getContext } from 'svelte';

   import {
      Alpha,
      Picker,
      Slider } from './index.js';

   const internalState = getContext('#tjs-color-picker-state');

   const {
      components,
      isAlpha,
      isTextInput
   } = internalState.stores;
</script>

<svelte:component this={$components.wrapper}>
   <Picker />
   <Slider />
   {#if $isAlpha}
      <Alpha />
   {/if}
   {#if $isTextInput}
      <svelte:component this={$components.textInput} />
   {/if}
</svelte:component>
