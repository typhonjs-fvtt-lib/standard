<script>
   import { getContext }    from 'svelte';

   import { keyPressed, keyPressedCustom }  from '../util/store.js';
   import { easeInOutSin }                  from '../util/transition.js';

   const internalState = getContext('#tjs-color-picker-state');

   const { components, sliderHorizontal } = internalState.stores;
   const { alpha } = internalState.colorState.stores;

   /** @type {HTMLDivElement} */
   let alphaEl = void 0;

   /** @type {boolean} */
   let isMouseDown = false;

   /** @type {boolean} */
   let focused = false;

   /** @type {number | undefined} */
   let focusMovementIntervalId = void 0;

   /** @type {number} */
   let focusMovementCounter = void 0;

   /** @type {number} */
   let pos = void 0;

   $: if (typeof $alpha === 'number' && alphaEl) { pos = 100 * $alpha; }

   /**
    * @param {number}    pos -
    */
   function onClick(pos)
   {
      const size = $sliderHorizontal ? alphaEl.getBoundingClientRect().width : alphaEl.getBoundingClientRect().height;
      const boundedPos = Math.max(0, Math.min(size, pos));

      $alpha = boundedPos / size;
   }

   /**
    * @param {MouseEvent} e -
    */
   function mouseDown(e)
   {
      if (e.button === 0)
      {
         isMouseDown = true;
         onClick($sliderHorizontal ? e.offsetX : e.offsetY);
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
         onClick($sliderHorizontal ? e.clientX - alphaEl.getBoundingClientRect().left :
          e.clientY - alphaEl.getBoundingClientRect().top);
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab') { focused = !!document.activeElement?.isSameNode(alphaEl); }

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
               const focusMovementFactor = easeInOutSin(++focusMovementCounter);
               const movement = $sliderHorizontal
                ? $keyPressed.ArrowRight - $keyPressed.ArrowLeft
                : $keyPressed.ArrowDown - $keyPressed.ArrowUp;
               $alpha = Math.min(1, Math.max(0, internalState.colorState.alpha + movement * focusMovementFactor));
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
    * @param {TouchEvent}    e -
    */
   function touch(e)
   {
      e.preventDefault();

      onClick($sliderHorizontal ? e.changedTouches[0].clientX - alphaEl.getBoundingClientRect().left
       : e.changedTouches[0].clientY - alphaEl.getBoundingClientRect().top);
   }
</script>

<svelte:window
        on:mouseup={mouseUp}
        on:mousemove={mouseMove}
        on:keyup={keyup}
        on:keydown={keydown}
/>

<svelte:component this={$components.alphaWrapper} {focused}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div bind:this={alphaEl}
         class=alpha
         tabindex=0
         class:horizontal={$sliderHorizontal}
         on:mousedown|preventDefault|stopPropagation={mouseDown}
         on:touchstart={touch}
         on:touchmove|preventDefault|stopPropagation={touch}
         on:touchend={touch}
         aria-label="transparency picker (arrow keyboard navigation)"
         aria-valuemin={0}
         aria-valuemax={100}
         aria-valuenow={Math.round(pos)}
         aria-valuetext="{pos?.toFixed()}%"
    >
        <svelte:component this={$components.alphaIndicator} {pos} />
    </div>
</svelte:component>

<style>
    .alpha:after {
        position: absolute;
        content: '';
        inset: 0;
        background: linear-gradient(#00000000, var(--_tjs-color-picker-current-color-hsl));
        z-index: 0;
    }

    .horizontal:after {
        background: linear-gradient(0.25turn, #00000000, var(--_tjs-color-picker-current-color-hsl));
    }

    .alpha {
        position: relative;
        width: 100%;
        height: 100%;
        background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%),
        linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%);
        background-size: 10px 10px;
        background-position: 0 0, 5px 5px;
        outline: none;
        user-select: none;
    }
</style>
