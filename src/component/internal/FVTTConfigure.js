import { SvelteApp }  from '#runtime/svelte/application';
import { TJSStyleManager }    from '#runtime/util/dom/style';
import { isObject }           from '#runtime/util/object';

import { FoundryStyles }      from '#standard/fvtt';

/**
 * Provides global CSS variable configuration based on Foundry styles loaded.
 */
class FVTTConfigure
{
   static #initialized = false;

   static initialize()
   {
      if (this.#initialized) { return; }

      const cssVariables = new TJSStyleManager({ docKey: '#__tjs-root-styles', version: 1.1 });

      this.#initialized = true;

      // -------------------------------------------------------------------------------------------------------------

      /**
       * Assign all TyphonJS thematic CSS variables.
       */

      cssVariables.setProperties({
         // For components w/ transparent background checkered pattern.
         '--tjs-checkerboard-background-dark': 'rgb(205, 205, 205)',
         '--tjs-checkerboard-background-10': `url('data:image/svg+xml;utf8,<svg preserveAspectRatio="none"  viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="5" fill="transparent" /><rect x="5" y="5" width="5" height="5" fill="transparent" /><rect x="5" y="0" width="5" height="5" fill="white" /><rect x="0" y="5" width="5" height="5" fill="white" /></svg>') 0 0 / 10px 10px, var(--tjs-checkerboard-background-dark, rgb(205, 205, 205))`
      }, false);

      // -------------------------------------------------------------------------------------------------------------

      /**
       * Assign all TyphonJS CSS variables to Foundry defaults.
       */

      cssVariables.setProperties({
         '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)'
      }, false);

      // -------------------------------------------------------------------------------------------------------------

      cssVariables.setProperties({
         '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.10)',
         '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.20)',
      }, false);

      {
         /**
          * All input related components including: TJSSelect,
          */
         const props = FoundryStyles.getProperties('input[type="text"], input[type="number"]');

         if (isObject(props))
         {
            cssVariables.setProperties({
               '--tjs-input-background': 'background' in props ? props.background : 'rgba(0, 0, 0, 0.05)',
               '--tjs-input-border': 'border' in props ? props.border : '1px solid var(--color-border-light-tertiary)',
               '--tjs-input-border-radius': 'border-radius' in props ? props['border-radius'] : '3px',
               '--tjs-input-height': 'height' in props ? props.height : 'var(--form-field-height)',
               '--tjs-input-min-width': 'min-width' in props ? props['min-width'] : '20px',
               '--tjs-input-padding': 'padding' in props ? props['padding'] : '1px 3px',
               '--tjs-input-width': 'width' in props ? props.width : 'calc(100% - 2px)',

               // Set default values that are only to be referenced and not set.
               '--_tjs-default-input-height': 'height' in props ? props.height : 'var(--form-field-height)',

               // Set directly / no lookup:
               '--tjs-input-border-color': 'var(--color-border-light-tertiary)',
            }, false);
         }
      }

      {
         /**
          * Input range specific variables for track and thumb,
          */
         const propsTrack = FoundryStyles.getProperties('input[type="range"]::-webkit-slider-runnable-track');
         const propsTrackFocus = FoundryStyles.getProperties('input[type="range"]:focus::-webkit-slider-runnable-track');

         const propsThumb = FoundryStyles.getProperties('input[type="range"]::-webkit-slider-thumb');
         const propsThumbFocus = FoundryStyles.getProperties('input[type="range"]:focus::-webkit-slider-thumb');

         if (isObject(propsTrack))
         {
            cssVariables.setProperties({
               '--tjs-input-range-slider-track-box-shadow': 'box-shadow' in propsTrack ? propsTrack['box-shadow'] : '1px 1px 1px #000000, 0px 0px 1px #0d0d0d'
            }, false);
         }

         if (isObject(propsTrackFocus))
         {
            cssVariables.setProperties({
               '--tjs-input-range-slider-track-box-shadow-focus': 'box-shadow' in propsTrackFocus ? propsTrackFocus['box-shadow'] : '1px 1px 1px #000000, 0px 0px 1px #0d0d0d'
            }, false);
         }

         if (isObject(propsThumb))
         {
            cssVariables.setProperties({
               '--tjs-input-range-slider-thumb-box-shadow': 'box-shadow' in propsThumb ? propsThumb['box-shadow'] : '0 0 5px var(--color-shadow-primary)'
            }, false);
         }

         if (isObject(propsThumbFocus))
         {
            cssVariables.setProperties({
               '--tjs-input-range-slider-thumb-box-shadow-focus': 'box-shadow' in propsThumbFocus ? propsThumbFocus['box-shadow'] : '0 0 5px var(--color-shadow-primary)'
            }, false);
         }
      }

      cssVariables.setProperties({
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

      // Handle `PopOut!` module hooks to allow applications to popout to their own browser window -------------------

      Hooks.on('PopOut:loading', (app, popout) =>
      {
         if (app instanceof SvelteApp)
         {
            // Clone and load `svelte-standard` CSS variables into new window document.
            popout.document.addEventListener('DOMContentLoaded', () => cssVariables.clone(popout.document));
         }
      });
   }
}

FVTTConfigure.initialize();
