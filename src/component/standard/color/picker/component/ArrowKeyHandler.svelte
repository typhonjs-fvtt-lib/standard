<script>
   // import type { SupportedKeys } from '../util/store';

   import { keyPressed } from '../util/store.js';

   /**
    * Note: e.key as SupportedKeys
    *
    * @param {KeyboardEvent}   e -
    */
   function keyup(e)
   {
      if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key))
      {
         $keyPressed[e.key] = 0;
         $keyPressed = $keyPressed;
      }
   }

   /**
    * Note: e.key as SupportedKeys
    *
    * @param {KeyboardEvent}   e -
    */
   function keydown(e)
   {
      if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key))
      {
         if (!e.repeat)
         {
            $keyPressed[e.key] = 1;
            $keyPressed = $keyPressed;
         }
      }
   }
</script>

<svelte:window on:keyup={keyup} on:keydown={keydown} />
