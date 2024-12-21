<script>
   /**
    * INTERNAL USE ONLY: Provides the wrapper component for mounting a custom Svelte sidebar; used by
    * `FVTTSidebarControl`.
    */

   /**
    * Bound mounted sidebar component making it accessible from {@link TJSSidebarEntry}.
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

<section class={`tab sidebar-tab ${sidebarData.id}-sidebar directory flexcol`} id={sidebarData.id} data-tab={sidebarData.id}>
   <svelte:component bind:this={component} this={sidebarClass} {...sidebarProps} />
</section>
