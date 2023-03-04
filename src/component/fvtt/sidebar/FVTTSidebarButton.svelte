<script>
   export let elementRoot;
   export let sidebar = void 0;
</script>

<svelte:options accessors={true} />

<!-- svelte-ignore a11y-missing-attribute -->
<a bind:this={elementRoot}
   class=item
   data-tab={sidebar.id}
   data-tooltip={sidebar.tooltip}
   alt={sidebar.tooltip}>
   <i class={sidebar.icon}></i>
</a>
