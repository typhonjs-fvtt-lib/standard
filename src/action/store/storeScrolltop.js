import { tick }      from 'svelte';
import { get }       from 'svelte/store';
import { debounce }  from '@typhonjs-svelte/lib/util';

/**
 * Provides an action to save `scrollTop` of an element with a vertical scrollbar. This action should be used on the
 * scrollable element and must include a writable store that holds the active store for the current `scrollTop` value.
 * You may switch the stores externally and this action will set the `scrollTop` based on the newly set store. This is
 * useful for instance providing a select box that controls the scrollable container.
 *
 * @param {HTMLElement} element - The target scrollable HTML element.
 *
 * @param {object}      store - The host store wrapping another store that is the `scrollTop` target.
 */
export function storeScrolltop(element, store)
{
   let storeScrolltop;

   const unsubscribe = store.subscribe(async (newStore) => {
      storeScrolltop = newStore;

      // If the new store is valid then set the element `scrollTop`.
      if (typeof storeScrolltop === 'object' && typeof storeScrolltop.set === 'function')
      {
         // Wait for any pending updates.
         await tick();

         const value = get(storeScrolltop);

         if (typeof value === 'number') { element.scrollTop = value; }
      }
   })

   /**
    * Save target `scrollTop` to the current set store.
    *
    * @param {Event} event -
    */
   function onScroll(event)
   {
      if (typeof storeScrolltop === 'object' && typeof storeScrolltop.set === 'function')
      {
         storeScrolltop.set(event.target.scrollTop);
      }
   }

   const debounceFn = debounce((e) => onScroll(e), 500);

   element.addEventListener('scroll', debounceFn);

   return {
      destroy: () =>
      {
         element.removeEventListener('scroll', debounceFn);

         unsubscribe();
      }
   };
}
