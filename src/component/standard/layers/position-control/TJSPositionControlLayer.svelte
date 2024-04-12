<script>
   /**
    * TODO: Add description
    *
    * @componentDocumentation
    */
   import {
      getContext,
      onDestroy,
      onMount,
      setContext }            from '#svelte';
   import { writable }        from '#svelte/store';

   import PositionControl     from './control/PositionControl.svelte';
   import { ControlsStore }   from './ControlsStore.js';

   import { selection }       from './selection.js';

   const [controlsStore, selectedDragAPI] = ControlsStore.create();

   /**
    * @type {ControlsStore}
    */
   export let controls = controlsStore;

   export let components = void 0;

   export let enabled = true;
   export let boundingRect = void 0;
   export let validate = true;

   setContext('#pclControls', controls);
   setContext('#pclSelectedDragAPI', selectedDragAPI);

   const application = getContext('#external')?.application;

   const applicationActiveWindow = application?.reactive?.storeUIState?.activeWindow ?? writable(globalThis);

   /** @type {Window} */
   let activeWindow = $applicationActiveWindow;

   let ctrlKey = false;

   $: controls.boundingRect = boundingRect;
   $: controls.validate = validate
   $: controls.updateComponents(components);

   /**
    * When the active window changes register key event listeners to new window.
    */
   $: if (activeWindow !== $applicationActiveWindow)
   {
      activeWindow.removeEventListener('keydown', onKeyDown, true);
      activeWindow.removeEventListener('keyup', onKeyUp, true);

      activeWindow = $applicationActiveWindow;

      activeWindow.addEventListener('keydown', onKeyDown, true);
      activeWindow.addEventListener('keyup', onKeyUp, true);
   }

   onDestroy(() =>
   {
      activeWindow.removeEventListener('keydown', onKeyDown, true);
      activeWindow.removeEventListener('keyup', onKeyUp, true);
   });

   onMount(() =>
   {
      activeWindow.addEventListener('keydown', onKeyDown, true);
      activeWindow.addEventListener('keyup', onKeyUp, true);
   });

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

{#if enabled}
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div use:selection={{ active: ctrlKey, width: 4 }}
     on:mousedown|capture={onMouseDown}
     on:selection:end={onSelectionEnd}
     role=region>
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
