<script>
   import { TJSIconButton } from '#standard/component/button';

   /** @type {import('#standard/store/fvtt/settings').TJSGameSettingsWithUI.Data} */
   export let uiSettings;

   const resetButton = {
      icon: 'fas fa-arrow-rotate-left',
      onPress: () => uiSettings?.resetCurrent()
   }
</script>

<section>
   <TJSIconButton button={resetButton} />
</section>

<style lang=scss>
   section {
      --tjs-icon-button-diameter: 1.5rem;

      display: flex;
      justify-content: end;
      align-items: center;
      height: 2rem;
      min-height: 2rem;
      z-index: 10;

      padding-right: 1rem;

      background: var(--tjs-settings-menu-background, var(--tjs-component-background-alt));
      border-bottom: var(--tjs-component-border);
      filter: drop-shadow(0px 3px 3px var(--tjs-component-color-shadow));
   }
</style>
