<script>
   export let sidebar = void 0;

   $: sidebarClass = sidebar?.svelteConfig?.class;
   $: sidebarProps = sidebar?.svelteConfig?.props ?? {};
</script>

<!--<section class="{{cssClass}} directory flexcol" id="{{cssId}}" data-tab="{{tabName}}">-->
<section class={`tab sidebar-tab ${sidebar.id}`} id={`${sidebar.id}-id`} data-tab={`${sidebar.id}`}>
   <svelte:component this={sidebarClass} {...sidebarProps} />
</section>
