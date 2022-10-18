<script>
   /**
    * --tjs-settings-section-background
    * --tjs-settings-section-border
    * --tjs-settings-section-border-radius
    * --tjs-settings-section-padding
    * --tjs-settings-section-margin-bottom
    */

   import { applyStyles }   from '@typhonjs-svelte/lib/action';

   import { TJSSvgFolder }  from '../folder/index.js';

   import SettingEntry      from './SettingEntry.svelte';

   export let settings = void 0;
   export let styles = void 0;

   const uiSettings = settings.control.create();

   // console.log(`! settings: `, settings);
   // console.log(`! parsedSettings: `, uiSettings);
</script>

<main class=tjs-settings>
   <div class=scrollable use:applyStyles={styles}>
      <section>
         {#each uiSettings.topLevel as setting (setting.key)}
            <SettingEntry {setting} />
         {/each}
      </section>
      {#each uiSettings.folders as folder}
      <section>
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
