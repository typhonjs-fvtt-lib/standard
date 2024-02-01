<script>
   /**
    * @svelteComponent
    *
    * TJSSettingsEdit provides the main Svelte component to display and modify settings registered with
    * {@link TJSGameSettings}. Refer to the documentation in {@link TJSGameSettings.register} and
    * {@link TJSGameSettings.registerAll}. Adding custom defined sections is accomplished with
    * {@link TJSGameSettings.addSection}. You must pass an instance of TJSGameSettings as the `settings` prop.
    *
    * Note: to group settings into specific folders instead of a single top level section use the `folder` option when
    * registering settings with TJSGameSettings. Also please refer to the extra folder options described by
    * {@link TJSGameSettings.addSection}.
    *
    * The other prop `options` is an object instance defined by {@link TJSSettingsCreateOptions}. This allows you to
    * associate a {@link TJSWebStorage} instance that automatically will track open / closed state of any section
    * folders configured along with the scrolling position of the scrollbar.
    *
    * TJSSettingsEdit supports two additional named slots `settings-header` and `settings-footer` allowing you to
    * set Svelte components as a fixed header and / or footer to the main scrollable settings content.
    *
    * When TJSSettingsEdit is displayed the UI display data is generated from {@link TJSGameSettings.uiControl}
    * automatically. When the TJSSettingsEdit component is destroyed any settings registered for UI display will be
    * checked for `requiresReload` setting option. If the setting has changed while TJSSettingsEdit is displayed a
    * modal dialog is opened to inform the user that a setting changed that requires reloading.
    *
    * If you need an easy to use slotted component that allows swapping from the main slot and TJSSettingsEdit please
    * refer to {@link TJSSettingsSwap}.
    *
    * ### CSS Variables
    *
    * CSS variables available include the following options:
    *
    * ```
    * Top level 'main' element:
    * --tjs-settings-section-background - none
    *
    * Scrollable div element:
    * --tjs-settings-padding - 0
    *
    * Each section element for a grouping of settings:
    * --tjs-settings-section-background - none
    * --tjs-settings-section-border - none
    * --tjs-settings-section-border-radius - 0
    * --tjs-settings-section-margin-bottom - 0.75em
    * --tjs-settings-section-padding - 0.5em
    * ```
    * @componentDocumentation
    */

   import { onDestroy }          from '#svelte';

   import {
      applyScrolltop,
      applyStyles }              from '#runtime/svelte/action/dom';

   import { isSvelteComponent }  from '#runtime/svelte/util';
   import { isObject }           from '#runtime/util/object';

   import { TJSSvgFolder }       from '../folder/index.js';

   import SettingEntry           from './SettingEntry.svelte';

   /** @type {import('#runtime/svelte/store/fvtt/settings').TJSGameSettings} */
   export let settings = void 0;

   /** @type {import('#runtime/svelte/store/fvtt/settings').TJSSettingsCreateOptions} */
   export let options = void 0;

   /**
    * Optional inline styles applied to the main element; useful for setting CSS variables.
    *
    * @type {object}
    */
   export let styles = void 0;

   const uiSettings = settings.uiControl.create(options);

   onDestroy(() => uiSettings.destroy());
</script>

<main class=tjs-settings use:applyStyles={styles}>
   <slot name=settings-header {settings} {options} {uiSettings} />
   <div class=scrollable use:applyScrolltop={uiSettings.storeScrollbar}>
      {#if uiSettings.topLevel.length}
         <section class=tjs-settings-section>
            {#each uiSettings.topLevel as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </section>
      {/if}
      {#each uiSettings.folders as folder}
      <section class=tjs-settings-section>
         <TJSSvgFolder label={folder.label} store={folder.store}>
            {#each folder.settings as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </TJSSvgFolder>
      </section>
      {/each}
      {#each uiSettings.sections as section}
         <section class=tjs-settings-section use:applyStyles={section.styles}>
            {#if section.folder}
               <TJSSvgFolder folder={section.folder}>
                  <svelte:component this={section.class} {...(isObject(section.props) ? section.props : {})}/>

                  <svelte:fragment slot=summary-end>
                     {#if isSvelteComponent(section?.folder?.summaryEnd?.class)}
                        <svelte:component this={section.folder.summaryEnd.class} {...(isObject(section?.folder?.summaryEnd?.props) ? section.folder.summaryEnd.props : {})}/>
                     {/if}
                  </svelte:fragment>
               </TJSSvgFolder>
            {:else}
               <svelte:component this={section.class} {...(isObject(section.props) ? section.props : {})}/>
            {/if}
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
