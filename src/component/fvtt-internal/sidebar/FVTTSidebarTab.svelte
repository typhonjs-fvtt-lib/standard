<script>
   /**
    * INTERNAL USE ONLY: Provides the wrapper component for mounting a custom Svelte sidebar; used by
    * `FVTTSidebarControl`.
    */

   import { popoverTooltip } from '#runtime/svelte/action/dom/tooltip';

   /**
    * Export the main anchor element so that FVTTSidebarControl can adjust the sidebar width.
    *
    * @type {HTMLAnchorElement}
    */
   export let anchorEl;

   /**
    * Bound sidebar tab component making it accessible from {@link FVTTSidebarEntry}.
    */
   export let component = void 0;

   /**
    * Sidebar configuration data.
    */
   export let sidebarData = void 0;
</script>

<svelte:options accessors={true} />

<li>
   <!-- svelte-ignore a11y-role-supports-aria-props -->
   <button bind:this={anchorEl}
           type=button
           class={`ui-control plain icon ${typeof sidebarData?.icon === 'string' ? sidebarData.icon : ''}`}
           class:svelte-icon={sidebarData.iconSvelteConfig !== void 0}
           use:popoverTooltip={{ ariaLabel: true, tooltip: sidebarData.tooltip }}
           data-action=tab
           data-tab={sidebarData.id}
           data-group=primary
           role=tab
           aria-pressed=false
           aria-controls={sidebarData.id}>
      {#if sidebarData.iconSvelteConfig !== void 0}
         <svelte:component bind:this={component}
                           this={sidebarData.iconSvelteConfig.class}
                           {...(sidebarData.iconSvelteConfig.props ?? {})} />
      {/if}
   </button>
   <div class="notification-pip"></div>
</li>

<style>
   button.svelte-icon {
      padding: 0;
      margin: 0;
   }
</style>
