<script>
   /**
    * --tjs-settings-section-background
    * --tjs-settings-section-border
    * --tjs-settings-section-border-radius
    * --tjs-settings-section-padding
    * --tjs-settings-section-margin-bottom
    */

   import { onDestroy }    from 'svelte';

   import {
      applyScrolltop,
      applyStyles }        from '@typhonjs-svelte/lib/action';

   import { isSvelteComponent } from '@typhonjs-svelte/lib/util';

   import { TJSSvgFolder } from '../folder/index.js';

   import SettingEntry     from './SettingEntry.svelte';

   /** @type {TJSGameSettings} */
   export let settings = void 0;

   /** @type {object[]} */
   export let sections = [];

   /** @type {TJSSettingsCreateOptions} */
   export let options = void 0;

   /** @type {object} */
   export let styles = void 0;

   const uiSettings = settings.uiControl.create(options);

   onDestroy(() => uiSettings.destroy());
</script>

<main class=tjs-settings>
   <slot name=settings-header {settings} {options} {uiSettings} />
   <div class=scrollable use:applyScrolltop={uiSettings.storeScrollbar} use:applyStyles={styles}>
      {#if uiSettings.topLevel.length}
         <section class=tjs-settings-section>
            {#each uiSettings.topLevel as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </section>
      {/if}
      {#each uiSettings.folders as folder}
      <section class=tjs-settings-section>
         <TJSSvgFolder label={folder.name} store={folder.store}>
            {#each folder.settings as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </TJSSvgFolder>
      </section>
      {/each}
      {#each sections as section}
         <section class=tjs-settings-section>
            <TJSSvgFolder label={section.label} store={section.store}>
               <svelte:component this={section.class} {...(typeof section.props === 'object' ? section.props : {})}/>

               <svelte:fragment slot=summary-end>
                  {#if isSvelteComponent(section?.summaryEnd?.class)}
                     <svelte:component this={section.summaryEnd.class} {...(typeof section?.summaryEnd?.props === 'object' ? section.summaryEnd.props : {})}/>
                  {/if}
               </svelte:fragment>
            </TJSSvgFolder>
         </section>
      {/each}
   </div>
   <slot name=settings-footer {settings} {options} {uiSettings} />
</main>

<style>
   main {
      display: flex;
      flex-direction: column;
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

      scrollbar-width: thin;  /* For Firefox */
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
