<script>
   /**
    * @privateRemarks
    * TODO: Add description
    *
    * @componentDocumentation
    */
   import SectionColor  from './sections/SectionColor.svelte';

   export let themeStore = void 0;

   // Stores the components for theme entry `options.type`
   const types = {
      color: SectionColor
   };

   const components = themeStore.stores.components;
</script>

<div>
   {#each $components as options}
      <svelte:component this={types[options.type]} {options} />
   {/each}
</div>
