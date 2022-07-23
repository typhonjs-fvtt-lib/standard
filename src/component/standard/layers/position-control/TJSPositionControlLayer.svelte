<script>
   import { setContext }      from 'svelte';

   import PositionControl     from './control/PositionControl.svelte';
   import { ControlsStore }   from './ControlsStore.js';

   import { selection }       from './selection.js';

   const [controlsStore, selectedDragAPI] = new ControlsStore();

   export let controls = controlsStore;

   export let components = void 0;

   export let active = true;
   export let boundingRect = void 0;
   export let validate = true;

   setContext('pclControls', controls);
   setContext('pclSelectedDragAPI', selectedDragAPI);

   $: controls.boundingRect = boundingRect;
   $: controls.validate = validate
   $: controls.updateComponents(components);

   let ctrlKey = false;

   function onKeyDown(event)
   {
      if (event.key === 'Control' && !event.repeat) { ctrlKey = true; controls.enabled = true; }
   }

   function onKeyUp(event)
   {
      if (event.key === 'Control' && !event.repeat) { ctrlKey = false; controls.enabled = false; }
   }

   function onMouseDown(event)
   {
      if (!event.ctrlKey) { controls.selected.clear(); }
   }

   function onSelectionEnd(event)
   {
      const rect = event.detail.rect;

      for (const control of $controls)
      {
         const position = control.position;

         const top = position.top;
         const left = position.left;
         const bottom = top + position.height;
         const right = left + position.width;

         // AABB -> AABB overlap test.
         const xOverlap = Math.max(0, Math.min(right, rect.right) - Math.max(left, rect.left))
         const yOverlap = Math.max(0, Math.min(bottom, rect.bottom) - Math.max(top, rect.top));

         if (xOverlap > 0 && yOverlap > 0)
         {
            controls.selected.add(control, false);
         }
         else
         {
            if (!event.detail.shiftKey) { controls.selected.remove(control); }
         }
      }
   }
</script>

<svelte:body on:keydown|capture={onKeyDown} on:keyup|capture={onKeyUp} />

{#if active}
<div use:selection={{ active: ctrlKey, width: 4 }}
     on:mousedown|capture={onMouseDown}
     on:selection:end={onSelectionEnd}>
   {#each $controls as control (control.id)}
      <PositionControl {control} />
   {/each}
   <slot />
</div>
{:else}
   <slot />
{/if}

<style>
   div {
      width: 100%;
      height: 100%;
   }
</style>
