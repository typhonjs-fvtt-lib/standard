<script>
   import TJSSettingsEdit from './TJSSettingsEdit.svelte';

   /** @type {TJSGameSettings} */
   export let settings = void 0;

   /** @type {TJSSettingsCreateOptions} */
   export let options = void 0;

   const showSettings = settings.uiControl.stores.showSettings;
</script>

{#if $showSettings}
    <TJSSettingsEdit {settings} {options} />
{:else}
    <slot/>
{/if}
