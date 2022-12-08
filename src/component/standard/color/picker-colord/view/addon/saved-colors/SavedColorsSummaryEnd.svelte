<script>
   import { TJSIconButton } from '../../../../../button/index.js';

   import { ripple }        from '../../../../../../../action/index.js';

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
      // Open details content.
      sectionEl.dispatchEvent(new CustomEvent('open', { bubbles: true }))
   }

   function onDeleteAll()
   {
      // Close details content.
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
        gap: 0.25em;
        margin-left: auto;
    }
</style>
