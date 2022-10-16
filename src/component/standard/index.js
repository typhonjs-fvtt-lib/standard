import { SvelteApplication } from '@typhonjs-fvtt/runtime/svelte/application';

import {
   cssVariables,
   FoundryStyles }   from '../internal/index.js';     // TODO: Figure out better build to use #internal again.

export *             from './button/index.js';
export *             from './editor/index.js';
export *             from './folder/index.js';
export *             from './form/index.js';
export *             from './label/index.js';
export *             from './layers/index.js';
export *             from './menu/index.js';
export *             from './settings/index.js';

/**
 * Assign all TyphonJS CSS variables to Foundry defaults.
 */

cssVariables.set({
   '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)'
});

// -------------------------------------------------------------------------------------------------------------------

cssVariables.set({
   '--tjs-icon-button-background': 'none',
   '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.10)',
   '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.20)',
   '--tjs-icon-button-border-radius': '50%',
   '--tjs-icon-button-clip-path': 'none',
   '--tjs-icon-button-diameter': '2em',
   '--tjs-icon-button-transition': 'background 200ms linear, clip-path 200ms linear'
});

{
   /**
    * All input related components including: TJSSelect,
    */
   const props = FoundryStyles.getProperties('input[type="text"], input[type="number"]');

   if (typeof props === 'object')
   {
      cssVariables.set({
         '--tjs-input-background': 'background' in props ? props.background : 'rgba(0, 0, 0, 0.05)',
         '--tjs-input-border': 'border' in props ? props.border : '1px solid var(--color-border-light-tertiary)',
         '--tjs-input-border-radius': 'border-radius' in props ? props['border-radius'] : '3px',
         '--tjs-input-height': 'height' in props ? props.height : 'var(--form-field-height)',
         '--tjs-input-min-width': 'min-width' in props ? props['min-width'] : '20px',
         '--tjs-input-width': 'width' in props ? props.width : 'calc(100% - 2px)'
      });
   }
}

cssVariables.set({
   '--tjs-label-transition': 'background 200ms linear'
});

cssVariables.set({
   '--tjs-menu-border': '1px solid var(--color-border-dark, #000)',
   '--tjs-menu-box-shadow': '0 0 2px var(--color-shadow-dark, #000)',
   '--tjs-menu-color': 'var(--color-text-light-primary, #EEE)',
   '--tjs-menu-item-hover-text-shadow-color': 'var(--color-text-hyperlink, red)',
});

// Handle `PopOut!` module hooks to allow applications to popout to their own browser window -------------------------

Hooks.on('PopOut:loading', (app, node, popout) =>
{
   if (app instanceof SvelteApplication)
   {
      app.position.enabled = false;

      // Clone and load `svelte-standard` CSS variables into new window document.
      popout.document.addEventListener('DOMContentLoaded', () => cssVariables.clone(popout.document));
   }
});

Hooks.on('PopOut:popin', (app) =>
{
   if (app instanceof SvelteApplication) { app.position.enabled = true; }
});

Hooks.on('PopOut:close', (app) =>
{
   if (app instanceof SvelteApplication) { app.position.enabled = true; }
});
