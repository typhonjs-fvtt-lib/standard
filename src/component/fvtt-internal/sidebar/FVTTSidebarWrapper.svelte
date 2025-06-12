<script>
   import { setContext } from 'svelte';

   /**
    * INTERNAL USE ONLY: Provides the wrapper component for mounting a custom Svelte sidebar; used by
    * `FVTTSidebarControl`.
    */

   /**
    * Bound mounted sidebar component making it accessible from {@link FVTTSidebarEntry}.
    */
   export let component = void 0;

   /**
    * Sidebar configuration data.
    */
   export let sidebarData = void 0;

   $: sidebarClass = sidebarData?.svelteConfig?.class;
   $: sidebarProps = sidebarData?.svelteConfig?.props ?? {};
</script>

<svelte:options accessors={true} />

<section id={sidebarData.id}
         class={`tab sidebar-tab ${sidebarData.id}-sidebar directory flexcol`}
         data-tab={sidebarData.id}
         data-group=primary>
   <svelte:component bind:this={component} this={sidebarClass} {...sidebarProps} />
</section>

<style>
   section:global(.active) {
      display: flex;
   }
</style>
