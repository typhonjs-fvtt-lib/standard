import { FoundryStyles }   from '#runtime/svelte/application';
import { StyleManager }    from '#runtime/util/dom/style';
import { isObject }        from '#runtime/util/object';

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
         version: '0.1.0',
         layerName: 'variables.tjs-standard-vars',
         rules: {
            // Ideally `:root` would be used, but Foundry defines dark them CSS vars in `body`. For scoping reasons
            // `body` must be used to make these core vars accessible to TRL CSS vars.
            themeDark: 'body, .themed.theme-dark',
            themeLight: '.themed.theme-light'
         }
      });

      // Early out if the style manager version is outdated.
      if (!manager?.isConnected) { return; }

      const themeDarkRoot = manager.get('themeDark');
      const themeLight = manager.get('themeLight');

      this.#initialized = true;

      // -------------------------------------------------------------------------------------------------------------

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

      // -------------------------------------------------------------------------------------------------------------

      /**
       * Assign all TyphonJS CSS variables to Foundry defaults.
       */

      themeDarkRoot.setProperties({
         '--tjs-action-ripple-background': 'linear-gradient(64.5deg, rgba(245, 116, 185, 1) 40%, rgba(89, 97, 223, 1) 60%)',

         '--tjs-icon-button-background-hover': 'rgba(255, 255, 255, 0.05)',
         '--tjs-icon-button-background-selected': 'rgba(255, 255, 255, 0.1)',
      });

      themeLight.setProperties({
         '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)',

         '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.10)',
         '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.20)',
      });

      // -------------------------------------------------------------------------------------------------------------

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
            resolve: ['.themed.theme-dark input:focus', '.themed.theme-dark input']
         });

         themeDarkRoot.setProperties({
            '--tjs-input-height': props.height ?? 'var(--input-height)',
            '--tjs-input-padding': props.padding ?? '0px 0.5rem',
            '--tjs-input-width': props.width ?? '100%',
            '--tjs-input-border-radius': props.borderRadius ?? '4px',
            '--tjs-input-transition': props.transition ?? 'outline-color 0.5s',

            // Color / theme related.
            '--tjs-input-background': props.background ?? 'var(--color-cool-4)',
            '--tjs-input-outline': props.outline ?? 'transparent solid 1px',
            '--tjs-input-outline-focus': propsFocus.outline ?? '2px solid var(--color-cool-3)',
            '--tjs-input-outline-offset-focus': propsFocus.outlineOffset ?? '-2px',

            // Set default values that are only to be referenced and not set.
            '--_tjs-default-input-height': props.height ?? 'var(--input-height)',

            // Set directly / no lookup:
            '--tjs-input-checkbox-border': 'none',
            '--tjs-input-range-border': 'none',
         });
      }

      // -------------------------------------------------------------------------------------------------------------

      {
         /**
          * Input range specific variables for track and thumb,
          */
         const propsTrack = FoundryStyles.ext.get('input[type="range"]::-webkit-slider-runnable-track', {
            camelCase: true
         });

         const propsTrackFocus = FoundryStyles.ext.get('input[type="range"]:focus::-webkit-slider-runnable-track', {
            camelCase: true
         });

         const propsThumb = FoundryStyles.ext.get('input[type="range"]::-webkit-slider-thumb', {
            camelCase: true
         });

         const propsThumbFocus = FoundryStyles.ext.get('input[type="range"]:focus::-webkit-slider-thumb', {
            camelCase: true
         });

         if (isObject(propsTrack))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-track-box-shadow': propsTrack.boxShadow ?? '1px 1px 1px #000000, 0px 0px 1px #0d0d0d'
            });
         }

         if (isObject(propsTrackFocus))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-track-box-shadow-focus': propsTrackFocus.boxShadow ?? '1px 1px 1px #000000, 0px 0px 1px #0d0d0d'
            });
         }

         if (isObject(propsThumb))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-thumb-box-shadow': propsThumb.boxShadow ?? '0 0 5px var(--color-shadow-primary)'
            });
         }

         if (isObject(propsThumbFocus))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-thumb-box-shadow-focus': propsThumbFocus.boxShadow ?? '0 0 5px var(--color-shadow-primary)'
            });
         }
      }

      themeDarkRoot.setProperties({
         // `popup` is for components that are slightly elevated, but connected to an application;
         // see: TJSMenu / TJSContextMenu / TJSColordPicker
         '--tjs-default-popup-background': 'var(--color-text-dark-header, #23221d)',
         '--tjs-default-popup-border': '1px solid var(--color-border-dark, #000)',
         '--tjs-default-popup-box-shadow': '0 0 2px var(--color-shadow-dark, #000)',
         '--tjs-default-popup-primary-color': 'var(--color-text-light-primary, #b5b3a4)',
         '--tjs-default-popup-highlight-color': 'var(--color-text-light-highlight, #f0f0e0)',

         // `popover` is for components that are elevated and independent; see: TJSContextMenu
         '--tjs-default-popover-border': '1px solid var(--color-border-dark, #000)',
         '--tjs-default-popover-box-shadow': '0 0 10px var(--color-shadow-dark, #000)',
      });

      // Light Theme overrides ---------------------------------------------------------------------------------------

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
            resolve: ['.themed.theme-light input:focus', '.themed.theme-light input']
         });

         themeLight.setProperties({
            // Color / theme related.
            '--tjs-input-background': props.background ?? 'rgba(0, 0, 0, 0.1)',
            '--tjs-input-border': props.border ?? '1px solid red',
            '--tjs-input-outline': props.outline ?? 'var(--color-warm-2)',
            '--tjs-input-outline-focus': propsFocus.outline ?? '2px solid var(--color-warm-2)',
            '--tjs-input-outline-offset-focus': propsFocus.outlineOffset ?? '-2px',
         });
      }

      // Handle `PopOut!` module hooks to allow applications to pop out to their own browser window ------------------

      Hooks.on('PopOut:loading', (app, popout) =>
      {
         // Clone and load the `standard` library CSS variables into the new window document regardless of the app type.
         popout.document.addEventListener('DOMContentLoaded',
          () => manager.clone({ document: popout.document, force: true }));
      });
   }
}

FVTTConfigure.initialize();
