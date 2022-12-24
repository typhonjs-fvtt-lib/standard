import { SvelteApplication } from '#runtime/svelte/application';

import {
   cssVariables,
   FoundryStyles }   from '../internal/index.js';     // TODO: Figure out better build to use #internal again.

// import 'container-query-polyfill';

export *             from './button/index.js';
export *             from './color/index.js';
export *             from './editor/index.js';
export *             from './folder/index.js';
export *             from './form/index.js';
export *             from './label/index.js';
export *             from './layers/index.js';
export *             from './menu/index.js';
export *             from './settings/index.js';

// -------------------------------------------------------------------------------------------------------------------

// Conditional import for container query polyfill (Firefox).
// if (!('container' in document.documentElement.style))
// {
//    import('https://cdn.skypack.dev/container-query-polyfill');
// }

// -------------------------------------------------------------------------------------------------------------------

/**
 * Assign all TyphonJS thematic CSS variables.
 */

cssVariables.setProperties({
   // For components w/ transparent background checkered pattern.
   '--tjs-checkerboard-background-dark': 'rgb(205, 205, 205)',
   '--tjs-checkerboard-background-10': `url('data:image/svg+xml;utf8,<svg preserveAspectRatio="none"  viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="5" fill="transparent" /><rect x="5" y="5" width="5" height="5" fill="transparent" /><rect x="5" y="0" width="5" height="5" fill="white" /><rect x="0" y="5" width="5" height="5" fill="white" /></svg>') 0 0 / 10px 10px, var(--tjs-checkerboard-background-dark, rgb(205, 205, 205))`
}, false);

// -------------------------------------------------------------------------------------------------------------------

/**
 * Assign all TyphonJS CSS variables to Foundry defaults.
 */

cssVariables.setProperties({
   '--tjs-anchor-text-shadow-focus-hover': '0 0 8px var(--color-shadow-primary)',
   '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)'
}, false);

// -------------------------------------------------------------------------------------------------------------------

cssVariables.setProperties({
   '--tjs-icon-button-background': 'none',
   '--tjs-icon-button-background-focus': 'var(--tjs-icon-button-background-hover)',
   '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.10)',
   '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.20)',
   '--tjs-icon-button-border-radius': '50%',
   '--tjs-icon-button-diameter': '2em',
   '--tjs-icon-button-transition': 'background 0.2s ease-in-out, clip-path 0.2s ease-in-out'
}, false);

{
   /**
    * All input related components including: TJSSelect,
    */
   const props = FoundryStyles.getProperties('input[type="text"], input[type="number"]');

   if (typeof props === 'object')
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
         '--tjs-input-border-width': '1px',
         '--tjs-input-value-invalid-color': 'red'
      }, false);
   }
}

{
   /**
    * Select options related: TJSSelect,
    */
   const props = FoundryStyles.getProperties('option, optgroup');

   if (typeof props === 'object')
   {
      cssVariables.setProperties({
         '--tjs-select-option-background': 'background' in props ? props.background : 'var(--color-bg-option)'
      }, false);
   }
}

cssVariables.setProperties({
   '--tjs-label-transition': 'background 200ms linear'
}, false);

cssVariables.setProperties({
   '--tjs-menu-border': '1px solid var(--color-border-dark, #000)',
   '--tjs-menu-box-shadow': '0 0 2px var(--color-shadow-dark, #000)',
   '--tjs-menu-color': 'var(--color-text-light-primary, #EEE)',
   '--tjs-menu-item-hover-text-shadow-color': 'var(--color-text-hyperlink, red)',
}, false);

// Handle `PopOut!` module hooks to allow applications to popout to their own browser window -------------------------

Hooks.on('PopOut:loading', (app, popout) =>
{
   if (app instanceof SvelteApplication)
   {
      // Clone and load `svelte-standard` CSS variables into new window document.
      popout.document.addEventListener('DOMContentLoaded', () => cssVariables.clone(popout.document));
   }
});
