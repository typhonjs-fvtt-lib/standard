<script>
   import {
      getContext,
      setContext }            from '#svelte'

   import { applyPosition }   from '#runtime/svelte/store/position'

   import { draggable }       from './draggable.js';

   import ResizeControl       from './resize/ResizeControl.svelte';
   import SelectedBorder      from './SelectedBorder.svelte';

   export let control = void 0;

   setContext('#pcControl', control)

   const controls = getContext('#pclControls');
   const selectedDragAPI = getContext('#pclSelectedDragAPI');

   const { enabled } = controls.stores;

   const { resizing, selected } = control.stores;

   const onDrag = controls.selected.onDrag;

   // Must store position as control is a store and will trigger updates to applyPosition action.
   const position = control.position;

   function onClick(event)
   {
      // Only handle click events when <ctrl> key pressed.
      if (!event.ctrlKey) { return; }

      // Remove selection if <ctrl> key is pressed.
      if ($selected)
      {
         controls.selected.remove(control);
      }
      else // Add control to selection if <ctrl> key is pressed otherwise set control as only selected item.
      {
         controls.selected.add(control);
      }
   }

   function onPointerDown(event)
   {
      // If already selected set as primary control.
      if ($selected && !event.ctrlKey) { controls.selected.setPrimary(control); }
   }
</script>
<div use:applyPosition={position}
     use:draggable={{ active: $selected && !$enabled }}
     on:click={onClick}
     on:pointerdown={onPointerDown}
     on:draggable:start={selectedDragAPI.onStart}
     on:draggable:move={selectedDragAPI.onMove}
     class:enabled={$enabled || $selected}
     class:cursor-default={$enabled && !$resizing}
     class:cursor-grab={$selected && !$enabled}
     role=presentation
>
    {#if $selected}
       <ResizeControl />
       <SelectedBorder />
    {/if}
</div>

<style>
   div {
      position: absolute;
      z-index: 999999;
      pointer-events: none;
   }

   .cursor-default {
      cursor: default;
   }

   .cursor-grab {
      cursor: grab;
   }

   .enabled {
      pointer-events: auto;
   }
</style>
