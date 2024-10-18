<script>
   /**
    * INTERNAL USE ONLY: Provides the wrapper component for mounting a custom Svelte sidebar; used by
    * `FVTTSidebarControl`.
    */

   /**
    * Export the main anchor element so that FVTTSidebarControl can adjust the sidebar width.
    *
    * @type {HTMLAnchorElement}
    */
   export let anchorEl;

   /**
    * Bound sidebar tab component making it accessible from {@link TJSSidebarEntry}.
    */
   export let component = void 0;

   /**
    * Sidebar configuration data.
    */
   export let sidebarData = void 0;
</script>

<svelte:options accessors={true} />

<!-- svelte-ignore a11y-missing-attribute a11y-click-events-have-key-events -->
<a bind:this={anchorEl}
   class=item
   on:click={(event) => globalThis?.ui?.sidebar?._onLeftClickTab?.(event)}
   role=tab
   tabindex=0
   data-tab={sidebarData.id}
   data-tooltip={sidebarData.tooltip}
   alt={sidebarData.tooltip}>
   {#if sidebarData.iconSvelteConfig !== void 0}
      <svelte:component bind:this={component}
                        this={sidebarData.iconSvelteConfig.class}
                        {...(sidebarData.iconSvelteConfig.props ?? {})} />
   {:else}
      <i class={sidebarData.icon}></i>
   {/if}
</a>

<style>
   a {
      user-select: none;
      -webkit-tap-highlight-color: var(--tjs-default-webkit-tap-highlight-color, transparent);
   }
</style>
