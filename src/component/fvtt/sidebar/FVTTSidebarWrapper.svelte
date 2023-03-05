<script>
   export let sidebarData = void 0;

   export let sidebarComponent = void 0;

   $: sidebarClass = sidebarData?.svelteConfig?.class;
   $: sidebarProps = sidebarData?.svelteConfig?.props ?? {};
</script>

<svelte:options accessors={true} />

<section class={`tab sidebar-tab ${sidebarData.id}`} id={sidebarData.id} data-tab={sidebarData.id}>
   <svelte:component bind:this={sidebarComponent} this={sidebarClass} {...sidebarProps} />
</section>
