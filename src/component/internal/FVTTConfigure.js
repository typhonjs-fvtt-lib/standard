import { FoundryStyles }   from '#runtime/svelte/application';
import { StyleManager }    from '#runtime/util/dom/style';

/**
 * Provides global CSS variable configuration based on Foundry styles loaded.
 */
class FVTTConfigure
{
   static #initialized = false;

   static initialize()
   {
      if (this.#initialized) { return; }

      // Remove `0.2.x` and below root styles. -- TODO: REMOVE AT `0.5.0`
      document?.['#__tjs-root-styles']?.remove?.();

      const manager = StyleManager.create({
         id: '__tjs-standard-vars',
         version: '0.0.1',
         layerName: 'variables.tjs-standard-vars',
         rules: {
            // Ideally `:root` would be used, but Foundry defines dark them CSS vars in `body`. For scoping reasons
            // `body` must be used to make these core vars accessible to TRL CSS vars.
            themeDark: 'body, .themed.theme-dark',
            themeLight: '.themed.theme-light'
         }
      });

      // Early out if the style manager version is outdated.
      if (!manager?.isConnected)
      {
         this.#initialized = true;
         return;
      }

      this.#initialized = true;

      const themeDarkRoot = manager.get('themeDark');
      const themeLight = manager.get('themeLight');

      // Initialize constants for any theme.
      this.#rootConstants(themeDarkRoot);

      // Initialize TRL action variables.
      this.#actions(themeDarkRoot, themeLight);

      // Initialize TRL button variables.
      this.#buttons(themeDarkRoot, themeLight);

      // TRL form / input components.
      this.#form(themeDarkRoot, themeLight);

      // All popup / menu components.
      this.#popup(themeDarkRoot, themeLight);

      // Handle `PopOut!` module hooks to allow applications to pop out to their own browser window ------------------

      Hooks.on('PopOut:loading', (app, popout) =>
      {
         // Clone and load the `standard` library CSS variables into the new window document regardless of the app type.
         popout.document.addEventListener('DOMContentLoaded',
          () => manager.clone({ document: popout.document, force: true }));
      });
   }

   /**
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeDarkRoot -
    *
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeLight -
    */
   static #actions(themeDarkRoot, themeLight)
   {
      /**
       * Assign all TyphonJS CSS variables to Foundry defaults.
       */

      themeDarkRoot.setProperties({
         '--tjs-action-ripple-background': 'linear-gradient(64.5deg, rgba(245, 116, 185, 1) 40%, rgba(89, 97, 223, 1) 60%)',
      });

      themeLight.setProperties({
         '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)',
      });
   }

   /**
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeDarkRoot -
    *
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeLight -
    */
   static #buttons(themeDarkRoot, themeLight)
   {
      const props = FoundryStyles.ext.get('.themed.theme-dark button');
      const propsLight = FoundryStyles.ext.get('.themed.theme-light button');

      const propsButton = FoundryStyles.ext.get('.themed.theme-light button');

      themeDarkRoot.setProperties({
         // Unique TRL properties.
         '--tjs-icon-button-background-hover': 'rgba(255, 255, 255, 0.15)',
         '--tjs-icon-button-background-selected': 'rgba(255, 255, 255, 0.25)',

         '--tjs-form-button-transition': propsButton?.transition ?? '0.5s',

         '--tjs-icon-button-color': props?.['--button-text-color'] ?? 'var(--color-light-3)',
         '--tjs-icon-button-color-hover': props?.['--button-hover-text-color'] ?? 'var(--color-light-1)'
      });

      themeLight.setProperties({
         // Unique TRL properties.
         '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.15)',
         '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.25)',

         '--tjs-icon-button-color': propsLight?.['--button-text-color'] ?? 'var(--color-dark-1)',
         '--tjs-icon-button-color-hover': 'var(--tjs-icon-button-color)'   // Core light theme doesn't have an appropriate highlight.
      });
   }

   /**
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeDarkRoot -
    *
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeLight -
    */
   static #form(themeDarkRoot, themeLight)
   {
      // Root / dark theme.
      {
         /**
          * All input related components including: TJSSelect,
          */
         const props = FoundryStyles.ext.get('input[type="text"]', {
            camelCase: true,
            resolve: '.themed.theme-dark input'
         });

         const propsFocus = FoundryStyles.ext.get(['input[type="text"]', 'input[type="text"]:focus'], {
            camelCase: true,
            resolve: ['.themed.theme-dark input', '.themed.theme-dark input:focus']
         });

         const propsPlaceholder = FoundryStyles.ext.get('::placeholder', {
            camelCase: true,
            resolve: '.themed.theme-dark input'
         });

         themeDarkRoot.setProperties({
            // Constants across dark / light theme:
            '--tjs-input-height': props?.height ?? 'var(--input-height)',
            '--tjs-input-line-height': props?.lineHeight ?? 'var(--input-height)',
            '--tjs-input-padding': props?.padding ?? '0px 0.5rem',
            '--tjs-input-width': props?.width ?? '100%',
            '--tjs-input-border-radius': props?.borderRadius ?? '4px',

            // Color / theme related.
            '--tjs-input-background': props?.background ?? 'var(--color-cool-4)',
            '--tjs-input-color': props?.color ?? 'var(--color-light-3)',
            '--tjs-input-color-focus': propsFocus?.color ?? 'var(--color-light-1)',
            '--tjs-input-outline': props?.outline ?? 'transparent solid 1px',
            '--tjs-input-outline-focus': propsFocus?.outline ?? '2px solid var(--color-cool-3)',
            '--tjs-input-outline-offset-focus': propsFocus?.outlineOffset ?? '-2px',
            '--tjs-input-placeholder-color': propsPlaceholder?.color ?? 'var(--color-light-5)',
            '--tjs-input-transition': props?.transition ?? 'outline-color 0.5s',

            // Set default values that are only to be referenced and not set.
            '--_tjs-default-input-height': props?.height ?? 'var(--input-height)',

            // Set directly / no lookup:
            '--tjs-input-checkbox-border': 'none',
            '--tjs-input-range-border': 'none',
         });
      }

      // Light theme overrides.

      {
         /**
          * All input related components including: TJSSelect,
          */
         const props = FoundryStyles.ext.get('input[type="text"]', {
            camelCase: true,
            resolve: '.themed.theme-light input'
         });

         const propsFocus = FoundryStyles.ext.get(['input[type="text"]', 'input[type="text"]:focus'], {
            camelCase: true,
            resolve: ['.themed.theme-light input', '.themed.theme-light input:focus']
         });

         const propsPlaceholder = FoundryStyles.ext.get('::placeholder', {
            camelCase: true,
            resolve: '.themed.theme-light input'
         });

         themeLight.setProperties({
            // Color / theme related.
            '--tjs-input-background': props?.background ?? 'rgba(0, 0, 0, 0.1)',
            '--tjs-input-border': props?.border ?? '1px solid var(--color-dark-6)',
            '--tjs-input-color': props?.color ?? 'var(--color-dark-2)',
            '--tjs-input-color-focus': propsFocus?.color ?? 'var(--color-dark-1)',
            '--tjs-input-outline': props?.outline ?? 'var(--color-warm-2)',
            '--tjs-input-outline-focus': propsFocus?.outline ?? '2px solid var(--color-warm-2)',
            '--tjs-input-outline-offset-focus': propsFocus?.outlineOffset ?? '-2px',
            '--tjs-input-placeholder-color': propsPlaceholder?.color ?? 'var(--color-dark-4)',
         });
      }
   }

   /**
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeDarkRoot -
    *
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeLight -
    */
   static #popup(themeDarkRoot, themeLight)
   {
      const propsMenuItem = FoundryStyles.ext.get('#context-menu li.context-item', { camelCase: true });

      const propsMenuDark = FoundryStyles.ext.get('#context-menu', {
         camelCase: true,
         resolve: ['.themed.theme-dark #context-menu']
      });

      const propsMenuItemDark = FoundryStyles.ext.get('#context-menu li.context-item:hover', {
         camelCase: true,
         resolve: ['.themed.theme-dark #context-menu']
      });

      const propsMenuLight = FoundryStyles.ext.get('#context-menu', {
         camelCase: true,
         resolve: ['.themed.theme-light #context-menu']
      });

      const propsMenuItemLight = FoundryStyles.ext.get('#context-menu li.context-item:hover', {
         camelCase: true,
         resolve: ['.themed.theme-light #context-menu']
      });

      themeDarkRoot.setProperties({
         // Direct mapping for TJSContextMenu overrides.
         '--tjs-context-menu-background': 'var(--tjs-menu-background)',
         '--tjs-context-menu-border': 'var(--tjs-menu-border)',
         '--tjs-context-menu-border-radius': 'var(--tjs-menu-border-radius)',
         '--tjs-context-menu-box-shadow': 'var(--tjs-menu-box-shadow)',
         '--tjs-context-menu-color': 'var(--tjs-menu-color)',
         '--tjs-context-menu-font-size': 'var(--tjs-menu-font-size)',

         '--tjs-context-menu-item-background-highlight': 'var(--tjs-menu-item-background-highlight)',
         '--tjs-context-menu-item-border-highlight': 'var(--tjs-menu-item-border-highlight)',
         '--tjs-context-menu-item-color-highlight': 'var(--tjs-menu-item-color-highlight)',

         // Constant applied across dark / light
         '--tjs-menu-item-border': propsMenuItem?.border ?? '1px solid transparent',
         '--tjs-menu-item-line-height': propsMenuItem?.lineHeight ?? '15px',
         '--tjs-menu-item-padding': propsMenuItem?.padding ?? '8px',

         '--tjs-context-menu-item-border': 'var(--tjs-menu-item-border)',
         '--tjs-context-menu-item-line-height': 'var(--tjs-menu-item-line-height)',
         '--tjs-context-menu-item-padding': 'var(--tjs-menu-item-padding)',

         // Dark theme

         '--tjs-menu-background': propsMenuDark?.background ?? 'var(--color-cool-5)',
         '--tjs-menu-border': propsMenuDark?.border ?? '1px solid var(--color-cool-3)',
         '--tjs-menu-border-radius': propsMenuDark?.borderRadius ?? '5px',
         '--tjs-menu-box-shadow': propsMenuDark?.boxShadow ?? 'rgba(0, 0, 0, 0.45) 0px 3px 6px',
         '--tjs-menu-color': propsMenuDark?.color ?? 'var(--color-text-secondary)',
         '--tjs-menu-font-size': propsMenuItem?.fontSize ?? 'var(--font-size-12)',

         '--tjs-menu-item-background-highlight': propsMenuItemDark?.background ?? 'var(--color-dark-1)',
         '--tjs-menu-item-border-highlight': propsMenuItemDark?.border ?? '1px solid var(--color-cool-4)',
         '--tjs-menu-item-color-highlight': propsMenuItemDark?.color ?? 'var(--color-text-emphatic)',

         // `popup` is for components that are slightly elevated, but connected to an application;
         // see: TJSMenu / TJSContextMenu / TJSColordPicker
         '--tjs-default-popup-background': propsMenuDark?.background ?? 'var(--color-cool-5)',
         '--tjs-default-popup-border': propsMenuDark?.border ?? '1px solid var(--color-cool-3)',
         '--tjs-default-popup-box-shadow': propsMenuDark?.boxShadow ?? 'rgba(0, 0, 0, 0.45) 0px 3px 6px',
         '--tjs-default-popup-primary-color': 'var(--color-text-light-primary, #b5b3a4)',
         '--tjs-default-popup-highlight-color': 'var(--color-text-light-highlight, #f0f0e0)',

         // `popover` is for components that are elevated and independent; see: TJSContextMenu
         '--tjs-default-popover-border': propsMenuDark?.border ?? '1px solid var(--color-border-dark, #000)',
         '--tjs-default-popover-box-shadow': '0 0 10px var(--color-shadow-dark, #000)',
      });

      themeLight.setProperties({
         // Direct mapping for TJSContextMenu overrides.
         '--tjs-context-menu-background': 'var(--tjs-menu-background)',
         '--tjs-context-menu-border': 'var(--tjs-menu-border)',
         '--tjs-context-menu-border-radius': 'var(--tjs-menu-border-radius)',
         '--tjs-context-menu-box-shadow': 'var(--tjs-menu-box-shadow)',
         '--tjs-context-menu-color': 'var(--tjs-menu-color)',
         '--tjs-context-menu-font-size': 'var(--tjs-menu-font-size)',

         '--tjs-context-menu-item-border': 'var(--tjs-menu-item-border)',
         '--tjs-context-menu-item-background-highlight': 'var(--tjs-menu-item-background-highlight)',
         '--tjs-context-menu-item-border-highlight': 'var(--tjs-menu-item-border-highlight)',
         '--tjs-context-menu-item-color-highlight': 'var(--tjs-menu-item-color-highlight)',

         '--tjs-menu-background': propsMenuLight?.background ?? '#d9d8c8',
         '--tjs-menu-border': propsMenuLight?.border ?? '1px solid #999',
         '--tjs-menu-border-radius': propsMenuLight?.borderRadius ?? '5px',
         '--tjs-menu-box-shadow': propsMenuLight?.boxShadow ?? 'rgba(0, 0, 0, 0.45) 0px 3px 6px',
         '--tjs-menu-color': propsMenuLight?.color ?? 'var(--color-text-secondary)',

         '--tjs-menu-item-background-highlight': propsMenuItemLight?.background ?? '#f0f0e0',
         '--tjs-menu-item-border-highlight': propsMenuItemLight?.border ?? '1px solid #999',
         '--tjs-menu-item-color-highlight': propsMenuItemLight?.color ?? 'var(--color-text-emphatic)',
      });
   }

   /**
    * @param {import('#runtime/util/dom/style').StyleManager.RuleManager}  themeDarkRoot -
    */
   static #rootConstants(themeDarkRoot)
   {
      /**
       * Assign all TyphonJS thematic CSS reversals for core Foundry styles.
       */
      themeDarkRoot.setProperties({
         // For checkbox Foundry core styles override.
         '--tjs-input-checkbox-appearance': 'none',
      });

      /**
       * Assign all TyphonJS thematic CSS variables.
       */

      themeDarkRoot.setProperties({
         // For components w/ transparent background checkered pattern.
         '--tjs-checkerboard-background-dark': 'rgb(205, 205, 205)',
         '--tjs-checkerboard-background-10': `url('data:image/svg+xml;utf8,<svg preserveAspectRatio="none"  viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="5" fill="transparent" /><rect x="5" y="5" width="5" height="5" fill="transparent" /><rect x="5" y="0" width="5" height="5" fill="white" /><rect x="0" y="5" width="5" height="5" fill="white" /></svg>') 0 0 / 10px 10px, var(--tjs-checkerboard-background-dark, rgb(205, 205, 205))`
      });
   }
}

FVTTConfigure.initialize();
