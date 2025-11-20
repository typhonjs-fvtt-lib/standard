<script>
   /**
    * `TJSSettingsEdit` provides the main Svelte component to display and modify settings registered with
    * `TJSGameSettingsWithUI`. Refer to the documentation in `TJSGameSettings.register` and
    * `TJSGameSettings.registerAll`. Adding custom defined sections is accomplished with
    * `TJSGameSettingsWithUI.uiControl.addSection`. You must pass an instance of `TJSGameSettingsWithUI` as the
    * `settings` prop.
    *
    * Note: to group settings into specific folders instead of a single top level section use the `folder` option when
    * registering settings with TJSGameSettings. Also, please refer to the extra folder options described by
    * `TJSGameSettingsWithUI.uiControl.addSection`.
    *
    * The other prop `options` is an object instance defined by `TJSSettingsCreateOptions`. This allows you to
    * associate a `TJSWebStorage` instance that automatically will track open / closed state of any section
    * folders configured along with the scrolling position of the scrollbar.
    *
    * `TJSSettingsEdit` supports two additional named slots `settings-header` and `settings-footer` allowing you to
    * set Svelte components as a fixed header and / or footer to the main scrollable settings content.
    *
    * When `TJSSettingsEdit` is displayed the UI display data is generated from `TJSGameSettingsWithUI.uiControl`
    * automatically. When the `TJSSettingsEdit` component is destroyed any settings registered for UI display will be
    * checked for `requiresReload` setting option. If the setting has changed while `TJSSettingsEdit` is displayed a
    * modal dialog is opened to inform the user that a setting changed that requires reloading.
    *
    * Note: `TJSSettingsEdit` uses the {@link #runtime/svelte/action/dom/style!padToBorder} action and this is
    * always enabled thus `TJSSettingsEdit is positioned within visual borders.
    *
    * If you need an easy to use slotted component that allows swapping from the main slot and `TJSSettingsEdit` please
    * refer to {@link TJSSettingsSwap}.
    *
    * ### CSS Variables
    *
    * CSS variables available include the following options:
    *
    * ```
    * Top level 'main' element:
    * --tjs-settings-edit-section-background - none
    *
    * Scrollable div element:
    * --tjs-settings-edit-gap - 0.75rem
    * --tjs-settings-edit-padding - 0
    * --tjs-settings-edit-scrollbar-gutter - auto
    *
    * Each section element for a grouping of settings:
    * --tjs-settings-edit-section-background - none
    * --tjs-settings-edit-section-border - none
    * --tjs-settings-edit-section-border-radius - 0
    * --tjs-settings-edit-section-padding - 0.5em
    * ```
    * @componentDocumentation
    */

   import { onDestroy }          from '#svelte';

   import {
      applyStyles,
      padToVisualEdgeInsets }    from '#runtime/svelte/action/dom/style';
   import { TJSScrollContainer } from '#runtime/svelte/component/container';
   import { TJSSvelte }          from '#runtime/svelte/util';
   import { isObject }           from '#runtime/util/object';

   import { TJSSvgFolder }       from '#standard/component/folder';

   import SettingEntry           from './SettingEntry.svelte';
   import SettingEntryDataField  from './SettingEntryDataField.svelte';
   import SettingsHeader         from './SettingsHeader.svelte';

   /** @type {import('#standard/store/fvtt/settings').TJSGameSettingsWithUI} */
   export let settings = void 0;

   /** @type {import('#standard/store/fvtt/settings').TJSGameSettingsWithUI.Options.Create} */
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

<main class="tjs-settings-edit tjs-content-vars"
      use:padToVisualEdgeInsets={{ parent: { excludeClasses: ['tjs-scroll-container'] } }}
      use:applyStyles={styles}>
   <SettingsHeader />
   <TJSScrollContainer scrollTop={uiSettings.storeScrollbar}>
      {#if uiSettings.topLevel.length}
         <section class="tjs-settings-edit-section tjs-settings-edit-content">
            {#each uiSettings.topLevel as setting (setting.key)}
               {#if setting.dataFieldEl}
                  <SettingEntryDataField {setting} />
               {:else}
                  <SettingEntry {setting} />
               {/if}
            {/each}
         </section>
      {/if}
      {#each uiSettings.folders as folder}
         <section class=tjs-settings-edit-section>
            <TJSSvgFolder label={folder.label} store={folder.store}>
               <section class=tjs-settings-edit-content>
                  {#each folder.settings as setting (setting.key)}
                     {#if setting.dataFieldEl}
                        <SettingEntryDataField {setting} />
                     {:else}
                        <SettingEntry {setting} />
                     {/if}
                  {/each}
               </section>
            </TJSSvgFolder>
         </section>
      {/each}
      {#each uiSettings.sections as section}
         <section class=tjs-settings-edit-section use:applyStyles={section.styles}>
            {#if section.folder}
               <TJSSvgFolder folder={section.folder}>
                  <svelte:component this={section.class} {...(isObject(section.props) ? section.props : {})}/>

                  <svelte:fragment slot=summary-end>
                     {#if TJSSvelte.config.isConfigEmbed(section?.folder?.summaryEnd)}
                        <svelte:component this={section.folder.summaryEnd.class} {...(isObject(section?.folder?.summaryEnd?.props) ? section.folder.summaryEnd.props : {})}/>
                     {/if}
                  </svelte:fragment>
               </TJSSvgFolder>
            {:else}
               <svelte:component this={section.class} {...(isObject(section.props) ? section.props : {})}/>
            {/if}
         </section>
      {/each}
   </TJSScrollContainer>
   <slot name=settings-footer {settings} {options} {uiSettings} />
</main>

<style>
   main {
      --tjs-scroll-container-padding: var(--tjs-settings-edit-padding, var(--tjs-scrollbar-gutter-stable-padding, 1rem));
      --tjs-scroll-container-gap: var(--tjs-settings-edit-gap, 0.75rem);
      --tjs-scroll-container-scrollbar-gutter: stable;

      --tjs-folder-contents-border-top-open: var(--tjs-settings-edit-folder-border-top-open, var(--tjs-content-border-thicker));
      --tjs-folder-contents-margin: none;
      --tjs-folder-contents-padding: none;
      --tjs-folder-summary-width: 100%;
      --tjs-folder-summary-margin: var(--tjs-settings-edit-folder-summary-margin, 0);

      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      height: 100%;

      background: var(--tjs-settings-edit-background, none);
   }

   section.tjs-settings-edit-section {
      background: var(--tjs-settings-edit-section-background, var(--tjs-component-background));
      border: var(--tjs-settings-edit-section-border, var(--tjs-content-border-thicker));
      border-radius: var(--tjs-settings-edit-section-border-radius, var(--tjs-component-border-radius));
   }

   section.tjs-settings-edit-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      padding: var(--tjs-settings-edit-section-padding, 0.5rem);
   }
</style>
