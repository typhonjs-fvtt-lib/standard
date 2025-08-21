import { ThemeObserver }   from '#runtime/svelte/application';
import { isIterable }      from '#runtime/util/object';

import { TJSContextMenu as TJSContextMenuBase } from '@typhonjs-svelte/standard-base/application/menu';

/**
 * Provide an override to determine nearest `.themed.theme-<NAME>` from `event` target on Foundry for dynamic
 * theming of context menu.
 *
 * @privateRemarks
 * The type declarations are copied for this package from `standard-base`.
 */
export class TJSContextMenu extends TJSContextMenuBase
{
   /**
    * Provide an override to determine nearest `.themed.theme-<NAME>` from `event` target on Foundry for dynamic
    * theming of context menu.
    *
    * @param {object} options -
    */
   static create(options)
   {
      if (!ThemeObserver.hasThemedClasses(options?.classes))
      {
         const themeClasses = ThemeObserver.nearestThemed(options?.event?.target);

         options.classes = isIterable(options?.classes) ? new Set([...themeClasses, ...options.classes]) :
          themeClasses;
      }

      super.create(options);
   }
}
