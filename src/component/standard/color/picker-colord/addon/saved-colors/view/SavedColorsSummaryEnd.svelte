<script>
   import { getContext }    from 'svelte';

   import { TJSIconButton } from '../../../../../button/index.js';

   import { ripple }        from '../../../../../../../action/index.js';

   const internalState = getContext('#tjs-color-picker-state');

   const savedColorsState = internalState.addOnState.get('saved-colors').savedColorsState;

   let sectionEl;

   const buttonAdd = {
      icon: 'fas fa-plus',
      efx: ripple(),
      onClickPropagate: false   // Necessary to capture click for Firefox.
   };

   const buttonDeleteAll = {
      icon: 'fas fa-trash',
      efx: ripple(),
      onClickPropagate: false   // Necessary to capture click for Firefox.
   };

   function onAdd()
   {
      internalState.addOnState.get('saved-colors').savedColorsState.addColor();

      // Open details content.
      sectionEl.dispatchEvent(new CustomEvent('open', { bubbles: true }))
   }

   function onDeleteAll()
   {
      savedColorsState.deleteAll();
   }

   // Close details content when saved color state is empty.
   $: if (sectionEl && $savedColorsState.length === 0)
   {
      sectionEl.dispatchEvent(new CustomEvent('close', { bubbles: true }))
   }
</script>

<section bind:this={sectionEl}>
    <TJSIconButton button={buttonAdd} on:click={onAdd} />
    <TJSIconButton button={buttonDeleteAll} on:click={onDeleteAll} />
</section>

<style>
    section {
        display: flex;
        gap: 0.1em;
        margin-left: auto;
    }
</style>
