<script>
   import { setContext }       from 'svelte';

   import { ApplicationShell } from '@typhonjs-fvtt/svelte/component/core';

   export let elementRoot = void 0;

   export let sidebarData = void 0;

   export let sidebarComponent = void 0;

   setContext('#sidebarPopout',  true);

   $: sidebarClass = sidebarData?.svelteConfig?.class;
   $: sidebarProps = sidebarData?.svelteConfig?.props ?? {};
</script>

<svelte:options accessors={true} />

<ApplicationShell bind:elementRoot>
   <svelte:component bind:this={sidebarComponent} this={sidebarClass} {...sidebarProps} />
</ApplicationShell>
