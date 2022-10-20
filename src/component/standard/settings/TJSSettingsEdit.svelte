<script>
   /**
    * --tjs-settings-section-background
    * --tjs-settings-section-border
    * --tjs-settings-section-border-radius
    * --tjs-settings-section-padding
    * --tjs-settings-section-margin-bottom
    */

   import { onDestroy }    from 'svelte';

   import { applyStyles }  from '@typhonjs-svelte/lib/action';

   import { TJSSvgFolder } from '../folder/index.js';

   import SettingEntry     from './SettingEntry.svelte';

   /** @type {TJSGameSettings} */
   export let settings = void 0;

   /** @type {TJSSettingsCreateOptions} */
   export let options = void 0;

   /** @type {object} */
   export let styles = void 0;

   const uiSettings = settings.uiControl.create(options);

   onDestroy(() => uiSettings.destroy());
</script>

<main class=tjs-settings>
   <div class=scrollable use:applyStyles={styles}>
      {#if uiSettings.topLevel.length}
         <section class=tjs-settings-section>
            {#each uiSettings.topLevel as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </section>
      {/if}
      {#each uiSettings.folders as folder}
      <section class=tjs-settings-section>
         <TJSSvgFolder label={folder.name}>
            {#each folder.settings as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </TJSSvgFolder>
      </section>
      {/each}
   </div>
</main>

<style>
   main {
      display: flex;
      height: 100%;
      background: var(--tjs-settings-background, none);
   }

   .scrollable {
      display: flex;
      flex: 1;
      flex-direction: column;
      flex-wrap: nowrap;
      min-height: 0;
      overflow: hidden auto;
      padding: var(--tjs-settings-padding, 0);
   }

   section {
      background: var(--tjs-settings-section-background, none);
      border: var(--tjs-settings-section-border, none);
      border-radius: var(--tjs-settings-section-border-radius, 0);
      padding: var(--tjs-settings-section-padding, 0.5em);
   }

   section:not(:last-child) {
      margin-bottom: var(--tjs-settings-section-margin-bottom, 0.75em);
   }
</style>
