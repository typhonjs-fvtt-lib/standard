<script>
   import { getContext }    from '#svelte';
   import { writable }      from '#svelte/store';

   import { clamp }         from '#runtime/math/util';
   import { isFocused }     from '#runtime/svelte/action/dom';

   import {
      keyforward,
      KeyStore }            from '#runtime/svelte/store/dom';

   import { easeInOutSin }  from '../util/transition.js';

   /** @type {HTMLDivElement} */
   export let pickerEl = void 0;

   const internalState = getContext('#tjs-color-picker-state');
   const constraint = getContext('#tjs-color-picker-constraint');

   const { components } = internalState.stores;
   const { sv } = internalState.colorState.stores;

   const stylesPickerIndicator = {
      background: 'var(--_tjs-color-picker-current-color-hsl)'
   }

   /**
    * @type {KeyStore}
    */
   const keyStore = new KeyStore(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']);

   /** @type {boolean} */
   let isPointerDown = false;

   /**
    * @type {Writable<boolean>}
    */
   let focused = writable(false);

   /** @type {number | undefined} */
   let focusMovementIntervalId = void 0;

   /** @type {number} */
   let focusMovementCounter = void 0;

   /** @type {{ x: number, y: number }} */
   let pos = { x: 100, y: 0 };

   // When there is a change to keys monitored invoke `move`.
   $: move($keyStore);

   $: if (typeof $sv.s === 'number' && typeof $sv.v === 'number' && pickerEl)
   {
      pos = { x: $sv.s, y: 100 - $sv.v };

      // Take into account the margin-left
      stylesPickerIndicator.left = `calc(${(pos.x / 100)} * ${constraint.width}cqw - max(6px, 3.5cqw))`;
      stylesPickerIndicator.top = `calc(${(pos.y / 100)} * ${constraint.height}cqw - max(6px, 3.5cqw))`;
   }

   /**
    * @param {{ offsetX: number; offsetY: number }}    e -
    */
   function onClick(e)
   {
      const pointer = { x: e.offsetX, y: e.offsetY };
      const rect = pickerEl.getBoundingClientRect();

      let width = rect.width;
      let height = rect.height;

      $sv = {
         s: clamp(pointer.x / width, 0, 1) * 100,
         v: clamp((height - pointer.y) / height, 0, 1) * 100
      };
   }

   /**
    * @param {KeyStore} keys
    */
   function move(keys)
   {
      if (keys.anyPressed())
      {
         if (!focusMovementIntervalId)
         {
            focusMovementCounter = 0;
            focusMovementIntervalId = window.setInterval(() =>
            {
               let focusMovementFactor = easeInOutSin(++focusMovementCounter);

               $sv = {
                  s: clamp($sv.s + (keys.value('ArrowRight') - keys.value('ArrowLeft')) * focusMovementFactor * 100,
                   0, 100),

                  v: clamp($sv.v + (keys.value('ArrowUp') - keys.value('ArrowDown')) * focusMovementFactor * 100,
                   0, 100)
               };
            }, 10);
         }
      }
      else if (focusMovementIntervalId)
      {
         clearInterval(focusMovementIntervalId);
         focusMovementIntervalId = void 0;
      }
   }

   /**
    * @param {PointerEvent} event -
    */
   function onPointerDown(event)
   {
      if (event.button === 0)
      {
         isPointerDown = true;
         pickerEl.setPointerCapture(event.pointerId);
         onClick(event);
      }
   }

   /**
    * @param {PointerEvent} event -
    */
   function onPointerUp(event)
   {
      isPointerDown = false;
      pickerEl.releasePointerCapture(event.pointerId);
   }

   /**
    * @param {PointerEvent} event -
    */
   function onPointerMove(event)
   {
      if (isPointerDown)
      {
         const rect = pickerEl.getBoundingClientRect();

         onClick({
            offsetX: clamp(event.clientX - rect.left, 0, rect.width),
            offsetY: clamp(event.clientY - rect.top, 0, rect.height)
         });
      }
   }
</script>

<svelte:component this={$components.pickerWrapper} {focused}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class=picker
         tabindex=0
         bind:this={pickerEl}
         on:pointerdown|preventDefault={onPointerDown}
         on:pointermove|preventDefault|stopPropagation={onPointerMove}
         on:pointerup|preventDefault|stopPropagation={onPointerUp}
         aria-label="saturation and brightness picker (arrow keyboard navigation)"
         aria-valuemin={0}
         aria-valuemax={100}
         aria-valuetext="saturation {pos.x?.toFixed()}%, brightness {pos.y?.toFixed()}%"
         use:isFocused={focused}
         use:keyforward={keyStore}
    >
        <svelte:component this={$components.pickerIndicator} focused={$focused} styles={stylesPickerIndicator} />
    </div>
</svelte:component>

<style>
    .picker {
        position: relative;
        width: 100%;
        height: 100%;
        outline: none;
        user-select: none;
        touch-action: none;

        background: linear-gradient(#ffffff00, #000000ff), linear-gradient(0.25turn, #ffffffff, #00000000),
         var(--_tjs-color-picker-current-color-hsl-hue);
    }
</style>
