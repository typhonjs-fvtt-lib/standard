// import { FoundryStyles }   from '#runtime/svelte/application';
import { TJSStyleManager } from '#runtime/util/dom/style';
import { isObject }        from '#runtime/util/object';

// TODO: SWAP BACK TO TRL VERSION
import { FoundryStyles } from './FoundryStyles.js';

/**
 * Provides global CSS variable configuration based on Foundry styles loaded.
 */
class FVTTConfigure
{
   static #initialized = false;

   static initialize()
   {
      if (this.#initialized) { return; }

      // Remove `0.2.x` and below root styles. -- REMOVE AT `0.5.0`
      document?.['#__tjs-root-styles']?.remove?.();

      const manager = new TJSStyleManager({
         id: '__tjs-standard-vars',
         version: 1,
         layerName: 'variables.tjs-standard-vars',
         rules: {
            // Ideally `:root` would be used, but Foundry defines dark them CSS vars in `body`. For scoping reasons
            // `body` must be used to make these core vars accessible to TRL CSS vars.
            themeDark: 'body, .themed.theme-dark',
            themeLight: '.themed.theme-light'
         }
      });

      // Early out if the style manager version is outdated.
      if (!manager.isConnected) { return; }

      const themeDarkRoot = manager.get('themeDark');
      const themeLight = manager.get('themeLight');

      // TODO THIS IS A TEST / REMOVE
      themeLight.setProperties({
         '--tjs-input-background': 'red',
      }, false);

      this.#initialized = true;

      // -------------------------------------------------------------------------------------------------------------

      /**
       * Assign all TyphonJS thematic CSS reversals for core Foundry styles.
       */
      themeDarkRoot.setProperties({
         // For checkbox Foundry core styles override.
         '--tjs-input-checkbox-appearance': 'none',
      }, false);

      // TODO: Consider input component focus / focus-visible support
      // themeDarkRoot.setProperties({
      //    // For checkbox Foundry core styles override.
      //    '--tjs-input-outline': '1px solid transparent',
      //    // '--tjs-input-outline-focus': '2px solid var(--input-focus-outline-color)',
      //    '--tjs-input-outline-focus': '2px solid red',
      //    '--tjs-input-outline-offset': '-1px',
      //    '--tjs-input-outline-offset-focus': '-2px',
      //    '--tjs-input-transition': 'outline-color 0.5s',
      //    // '--tjs-input-transition-focus': 'outline-color 0.5s',
      //    // '--tjs-input-transition-focus-visible': 'outline-color 0.5s',
      // }, false);

      /*
      outline: 2px solid var(--input-focus-outline-color);
    outline-offset: -2px;
       */
      /**
       * Assign all TyphonJS thematic CSS variables.
       */

      themeDarkRoot.setProperties({
         // For components w/ transparent background checkered pattern.
         '--tjs-checkerboard-background-dark': 'rgb(205, 205, 205)',
         '--tjs-checkerboard-background-10': `url('data:image/svg+xml;utf8,<svg preserveAspectRatio="none"  viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="5" fill="transparent" /><rect x="5" y="5" width="5" height="5" fill="transparent" /><rect x="5" y="0" width="5" height="5" fill="white" /><rect x="0" y="5" width="5" height="5" fill="white" /></svg>') 0 0 / 10px 10px, var(--tjs-checkerboard-background-dark, rgb(205, 205, 205))`
      }, false);

      // -------------------------------------------------------------------------------------------------------------

      /**
       * Assign all TyphonJS CSS variables to Foundry defaults.
       */

      themeDarkRoot.setProperties({
         '--tjs-action-ripple-background': 'linear-gradient(64.5deg, rgba(245, 116, 185, 1) 40%, rgba(89, 97, 223, 1) 60%)',

         '--tjs-icon-button-background-hover': 'rgba(255, 255, 255, 0.05)',
         '--tjs-icon-button-background-selected': 'rgba(255, 255, 255, 0.1)',
      }, false);

      themeLight.setProperties({
         '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)',

         '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.10)',
         '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.20)',
      }, false);

      // -------------------------------------------------------------------------------------------------------------

      {
         /**
          * All input related components including: TJSSelect,
          */
         const props = FoundryStyles.get('input[type="text"]', { resolve: '.themed.theme-dark input' });

         const propsFocus = FoundryStyles.get(['input[type="text"]', 'input[type="text"]:focus'], {
            resolve: ['.themed.theme-dark input:focus', '.themed.theme-dark input']
         });

         console.log(`!!! FVTTConfigure - initialize - props: \n${JSON.stringify(props, null, 2)}`);
         console.log(`!!! FVTTConfigure - initialize - propsFocus: \n${JSON.stringify(propsFocus, null, 2)}`);

         themeDarkRoot.setProperties({
            // TODO: VERIFY
            '--tjs-input-height': 'height' in props ? props['height'] : 'var(--input-height)',
            '--tjs-input-padding': 'padding' in props ? props['padding'] : '0px 0.5rem',
            '--tjs-input-width': 'width' in props ? props.width : '100%',
            '--tjs-input-border-radius': 'border-radius' in props ? props['border-radius'] : '4px',
            '--tjs-input-transition': 'transition' in props ? props['transition'] : 'outline-color 2.5s', // 'outline-color 0.5s'

            // Color / theme related.
            '--tjs-input-background': 'background' in props ? props['background'] : 'var(--color-cool-4)',
            '--tjs-input-outline': 'outline' in props ? props['outline'] : 'red solid 1px',
            '--tjs-input-outline-focus': 'outline' in propsFocus ? propsFocus['outline'] : 'red solid 2px', // '2px solid var(--color-cool-3)'
            '--tjs-input-outline-offset-focus': 'outline-offset' in propsFocus ? propsFocus['outline-offset'] : '-5px', // '-2px'

            // TODO: VERIFY or REMOVE
            // '--tjs-input-border': 'border' in props ? props.border : '1px solid var(--input-border-color)',
            // '--tjs-input-border-color': 'var(--input-border-color)',
            // '--tjs-input-min-width': 'min-width' in props ? props['min-width'] : '20px',

            // Set default values that are only to be referenced and not set.
            '--_tjs-default-input-height': 'height' in props ? props['height'] : 'var(--input-height)',

            // Set directly / no lookup:
         }, false);
      }

      {
         /**
          * Input range specific variables for track and thumb,
          */
         const propsTrack = FoundryStyles.get('input[type="range"]::-webkit-slider-runnable-track');
         const propsTrackFocus = FoundryStyles.get('input[type="range"]:focus::-webkit-slider-runnable-track');

         const propsThumb = FoundryStyles.get('input[type="range"]::-webkit-slider-thumb');
         const propsThumbFocus = FoundryStyles.get('input[type="range"]:focus::-webkit-slider-thumb');

         if (isObject(propsTrack))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-track-box-shadow': 'box-shadow' in propsTrack ? propsTrack['box-shadow'] : '1px 1px 1px #000000, 0px 0px 1px #0d0d0d'
            }, false);
         }

         if (isObject(propsTrackFocus))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-track-box-shadow-focus': 'box-shadow' in propsTrackFocus ? propsTrackFocus['box-shadow'] : '1px 1px 1px #000000, 0px 0px 1px #0d0d0d'
            }, false);
         }

         if (isObject(propsThumb))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-thumb-box-shadow': 'box-shadow' in propsThumb ? propsThumb['box-shadow'] : '0 0 5px var(--color-shadow-primary)'
            }, false);
         }

         if (isObject(propsThumbFocus))
         {
            themeDarkRoot.setProperties({
               '--tjs-input-range-slider-thumb-box-shadow-focus': 'box-shadow' in propsThumbFocus ? propsThumbFocus['box-shadow'] : '0 0 5px var(--color-shadow-primary)'
            }, false);
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
      }, false);

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
