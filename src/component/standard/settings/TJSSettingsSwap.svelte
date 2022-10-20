<script>
   import TJSSettingsEdit from './TJSSettingsEdit.svelte';

   /** @type {TJSGameSettings} */
   export let settings = void 0;

   /** @type {TJSSettingsCreateOptions} */
   export let options = void 0;

   const showSettings = settings.uiControl.stores.showSettings;
</script>

{#if $showSettings}
    <TJSSettingsEdit {settings} {options}>
        <slot name=settings-header slot=settings-header {settings} {options} {uiSettings} let:uiSettings />
        <slot name=settings-footer slot=settings-footer {settings} {options} {uiSettings} let:uiSettings />
    </TJSSettingsEdit>
{:else}
    <slot/>
{/if}
