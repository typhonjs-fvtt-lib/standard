<script>
   import { getContext }   from '#svelte';

   import { applyStyles }  from '#runtime/svelte/action/dom'

   import { resize }          from './resize.js';
   import { applyResizeData } from './applyResizeData.js';

   export let data = void 0;

   const control = getContext('#pcControl');
   const controls = getContext('#pclControls');

   const capture = () => null;

   function onPointerDown()
   {
      control.resizing = true;
      controls.selected.setPrimary(control);
   }

   function resizeCallback(id, dX, dY, event)
   {
      if (event.shiftKey)
      {
         for (const control of controls.selected.values())
         {
            control.position.set(applyResizeData(id, dX, dY, control));
         }
      }
      else
      {
         control.position.set(applyResizeData(id, dX, dY, control));
      }
   }
</script>

<div use:applyStyles={data.styles}
     use:resize={{ id: data.id, resizeCallback }}
     on:pointerdown|preventDefault|stopPropagation={onPointerDown}
     on:pointermove|preventDefault|stopPropagation={capture}
     on:pointerover|preventDefault|stopPropagation={capture}
     on:pointerup|preventDefault|stopPropagation={() => control.resizing = false}
/>

<style>
   div {
      position: absolute;
   }
</style>
