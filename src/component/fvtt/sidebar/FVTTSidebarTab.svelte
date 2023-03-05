<script>
   /**
    * Export the main anchor element so that FVTTSidebarControl can adjust the sidebar width.
    *
    * @type {HTMLAnchorElement}
    */
   export let anchorEl;
   export let sidebarData = void 0;
</script>

<svelte:options accessors={true} />

<!-- svelte-ignore a11y-missing-attribute -->
<a bind:this={anchorEl}
   class=item
   data-tab={sidebarData.id}
   data-tooltip={sidebarData.tooltip}
   alt={sidebarData.tooltip}>
   <i class={sidebarData.icon}></i>
</a>
