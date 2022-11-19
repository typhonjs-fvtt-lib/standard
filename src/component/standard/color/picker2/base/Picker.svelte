<script>
   import { getContext }    from 'svelte';

   import {
      keyPressed,
      keyPressedCustom }    from '../util/store.js';

   import { easeInOutSin }  from '../util/transition.js';

   const internalState = getContext('#tjs-color-picker-state');

   const { components } = internalState.stores;
   const { sv } = internalState.colorState.stores;

   /** @type {HTMLDivElement} */
   let pickerEl = void 0;

   /** @type {boolean} */
   let isMouseDown = false;

   /** @type {boolean} */
   let focused = false;

   /** @type {number | undefined} */
   let focusMovementIntervalId = void 0;

   /** @type {number} */
   let focusMovementCounter = void 0;

   /** @type {{ x: number, y: number }} */
   let pos = { x: 100, y: 0 };

   $: if (typeof $sv.s === 'number' && typeof $sv.v === 'number' && pickerEl)
   {
      pos = { x: $sv.s, y: 100 - $sv.v };
   }

   /**
    * @param {number}    value -
    * @param {number}    min -
    * @param {number}    max -
    *
    * @returns {number} Clamped value.
    */
   function clamp(value, min, max)
   {
      return Math.min(Math.max(min, value), max);
   }

   /**
    * @param {{ offsetX: number; offsetY: number }}    e -
    */
   function onClick(e)
   {
      let mouse = {x: e.offsetX, y: e.offsetY};
      let width = pickerEl.getBoundingClientRect().width;
      let height = pickerEl.getBoundingClientRect().height;

      $sv = {
         s: clamp(mouse.x / width, 0, 1) * 100,
         v: clamp((height - mouse.y) / height, 0, 1) * 100
      };

      // s = clamp(mouse.x / width, 0, 1) * 100;
      // v = clamp((height - mouse.y) / height, 0, 1) * 100;
   }

   /**
    * @param {MouseEvent}    e -
    */
   function pickerMouseDown(e)
   {
      if (e.button === 0)
      {
         isMouseDown = true;
         onClick(e);
      }
   }

   /**
    *
    */
   function mouseUp()
   {
      isMouseDown = false;
   }

   /**
    * @param {MouseEvent}    e -
    */
   function mouseMove(e)
   {
      if (isMouseDown)
      {
         onClick({
            offsetX: Math.max(0, Math.min(pickerEl.getBoundingClientRect().width,
              e.clientX - pickerEl.getBoundingClientRect().left)),

            offsetY: Math.max(0, Math.min(pickerEl.getBoundingClientRect().height,
              e.clientY - pickerEl.getBoundingClientRect().top))
         });
      }
   }

   /**
    * @param {MouseEvent}    e -
    */
   function mouseDown(e)
   {
      if (!e.target.isSameNode(pickerEl)) { focused = false; }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab') { focused = !!document.activeElement?.isSameNode(pickerEl); }

      if (!e.repeat && focused) { move(); }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keydown(e)
   {
      if (focused && $keyPressedCustom.ArrowVH)
      {
         e.preventDefault();
         if (!e.repeat) { move(); }
      }
   }

   /**
    *
    */
   function move()
   {
      if ($keyPressedCustom.ArrowVH)
      {
         if (!focusMovementIntervalId)
         {
            focusMovementCounter = 0;
            focusMovementIntervalId = window.setInterval(() =>
            {
               let focusMovementFactor = easeInOutSin(++focusMovementCounter);

               $sv = {
                  s: Math.min(100, Math.max(0, s + ($keyPressed.ArrowRight - $keyPressed.ArrowLeft) *
                   focusMovementFactor * 100)),

                  v: Math.min(100, Math.max(0, v + ($keyPressed.ArrowUp - $keyPressed.ArrowDown) *
                   focusMovementFactor * 100))
               };

               // $hsv.s = Math.min(100, Math.max(0, s + ($keyPressed.ArrowRight - $keyPressed.ArrowLeft) *
               //  focusMovementFactor * 100));
               //
               // $hsv.v = Math.min(100, Math.max(0, v + ($keyPressed.ArrowUp - $keyPressed.ArrowDown) *
               //  focusMovementFactor * 100));
            }, 10);
         }
      }
      else if (focusMovementIntervalId)
      {
         clearInterval(focusMovementIntervalId);
         focusMovementIntervalId = undefined;
      }
   }

   /**
    * @param {TouchEvent}    e -
    */
   function touch(e)
   {
      e.preventDefault();

      onClick({
         offsetX: e.changedTouches[0].clientX - pickerEl.getBoundingClientRect().left,
         offsetY: e.changedTouches[0].clientY - pickerEl.getBoundingClientRect().top
      });
   }
</script>

<svelte:window
        on:mouseup={mouseUp}
        on:mousedown={mouseDown}
        on:mousemove={mouseMove}
        on:keyup={keyup}
        on:keydown={keydown}
/>

<svelte:component this={$components.pickerWrapper} {focused}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class=picker
         tabindex=0
         bind:this={pickerEl}
         on:mousedown|preventDefault|stopPropagation={pickerMouseDown}
         on:touchstart={touch}
         on:touchmove|preventDefault|stopPropagation={touch}
         on:touchend={touch}

         aria-label="saturation and brightness picker (arrow keyboard navigation)"
         aria-valuemin={0}
         aria-valuemax={100}
         aria-valuetext="saturation {pos.x?.toFixed()}%, brightness {pos.y?.toFixed()}%"
    >
        <svelte:component
                this={$components.pickerIndicator}
                {pos}
        />
    </div>
</svelte:component>

<style>
    .picker {
        position: relative;
        width: 100%;
        height: 100%;
        outline: none;
        user-select: none;

        background: linear-gradient(#ffffff00, #000000ff), linear-gradient(0.25turn, #ffffffff, #00000000),
         var(--_tjs-color-picker-current-color-hsl-hue);
    }
</style>
