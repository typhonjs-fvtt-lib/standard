<script>
   import { TJSIconButton } from '#standard/component/button';

   /** @type {import('#standard/store/fvtt/settings').TJSGameSettingsWithUI.Data} */
   export let uiSettings;

   const resetCurrent = {
      icon: 'fas fa-clock-rotate-left',
      tooltip: 'Reset Current Changes',
      onPress: () => uiSettings?.resetCurrent({ confirm: true })
   }

   const resetDefault = {
      icon: 'fas fa-arrow-rotate-left',
      tooltip: 'Reset To Defaults',
      onPress: () => uiSettings?.resetDefault({ confirm: true })
   }
</script>

<section>
   <TJSIconButton button={resetCurrent} />
   <TJSIconButton button={resetDefault} />
</section>

<style lang=scss>
   section {
      --tjs-icon-button-diameter: 1.5rem;

      display: flex;
      justify-content: start;
      align-items: center;
      height: 2rem;
      min-height: 2rem;
      padding: 0 var(--tjs-content-gap-half, 0.5rem);
      gap: 0.75rem;

      background: var(--tjs-settings-edit-toolbar-background, var(--tjs-component-background-alt));
      border-bottom: var(--tjs-settings-edit-toolbar-border-bottom, var(--tjs-component-border));
      filter: var(--tjs-settings-edit-toolbar-filter, drop-shadow(0px 3px 3px var(--tjs-component-color-shadow)));
   }
</style>
