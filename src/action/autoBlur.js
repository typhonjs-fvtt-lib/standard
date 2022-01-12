/**
 * Provides an action to blur the element when any pointer down event occurs outside the element. This can be useful
 * for input elements including select to blur / unfocus the element when any pointer down occurs outside the element.
 *
 * @param {HTMLElement}   element - The element to handle automatic blur on focus loss.
 */
export function autoBlur(element)
{
   function blur() { document.body.removeEventListener('pointerdown', onPointerDown); }
   function focus() { document.body.addEventListener('pointerdown', onPointerDown) }

   /**
    * Blur the element if a pointer down event happens outside the element.
    * @param {PointerEvent} event
    */
   function onPointerDown(event)
   {
      if (event.target === element || element.contains(event.target)) { return; }

      element.blur();
   }

   element.addEventListener('blur', blur);
   element.addEventListener('focus', focus);

   return {
      destroy: () =>
      {
         document.body.removeEventListener('pointerdown', onPointerDown);
         element.removeEventListener('blur', blur);
         element.removeEventListener('focus', focus);
      }
   };
}
