<script>
   import { getContext }    from '#svelte';
   import { writable }      from '#svelte/store';

   import { isFocused }     from '#runtime/svelte/action/dom';

   const internalState = getContext('#tjs-color-picker-state');

   const { firstFocusEl, isPopup } = internalState.stores;

   const focused = writable(false);

   /**
    * Handle forwarding on focus to any first focusable element set when in popup mode.
    */
   $: if ($isPopup && $focused && $firstFocusEl instanceof HTMLElement)
   {
      $firstFocusEl.focus();
   }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div class=tjs-color-picker-last-focus
     tabindex=0
     use:isFocused={focused} />

<style>
    div:focus {
        outline: transparent;
    }
</style>
