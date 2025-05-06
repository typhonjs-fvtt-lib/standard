<script>
   /**
    * INTERNAL USE ONLY: Provides the wrapper component for mounting a custom Svelte sidebar in the default popout
    * application; used by `FVTTSidebarControl`.
    */

   import { setContext }       from '#svelte';

   import { ApplicationShell } from '#runtime/svelte/component/application';

   /**
    * Application Shell contract.
    */
   export let elementRoot = void 0;

   /**
    * Bound sidebar tab component making it externally accessible.
    */
   export let component = void 0;

   /**
    * Sidebar configuration data.
    */
   export let sidebarData = void 0;

   // Sets a context attribute indicating that this is the popout version of the sidebar.
   setContext('#sidebarPopout',  true);

   $: sidebarClass = sidebarData?.svelteConfig?.class;
   $: sidebarProps = sidebarData?.svelteConfig?.props ?? {};
</script>

<svelte:options accessors={true} />

<ApplicationShell bind:elementRoot stylesContent={{ padding: 0 }}>
   <svelte:component bind:this={component} this={sidebarClass} {...sidebarProps} />
</ApplicationShell>
