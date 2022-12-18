import { isWritableStore } from '@typhonjs-svelte/lib/store';

export function isFocused(node, storeFocused)
{
   let localFocused = false;

   function setFocused(current)
   {
      localFocused = current;

      if (isWritableStore(storeFocused)) { storeFocused.set(localFocused); }
   }

   function onFocus()
   {
      setFocused(true);
   }

   function onBlur()
   {
      setFocused(false);
   }

   function activateListeners()
   {
      node.addEventListener('focus', onFocus);
      node.addEventListener('blur', onBlur);
   }

   function removeListeners()
   {
      node.removeEventListener('focus', onFocus);
      node.removeEventListener('blur', onBlur);
   }

   activateListeners();

   return {
      update: (newStoreFocused) =>  // eslint-disable-line no-shadow
      {
         storeFocused = newStoreFocused;
         setFocused(localFocused);
      },

      destroy: () => removeListeners()
   };
}
