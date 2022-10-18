<script>
   import TJSSettingsEdit from './TJSSettingsEdit.svelte';

   export let settings = void 0;

   const showSettings = settings.control.stores.showSettings;
</script>

{#if $showSettings}
    <TJSSettingsEdit {settings} />
{:else}
    <slot/>
{/if}
