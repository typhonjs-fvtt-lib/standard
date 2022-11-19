<script>
   import { getContext }    from 'svelte';

   import {
      keyPressed,
      keyPressedCustom }   from '../util/store.js';

   import { easeInOutSin } from '../util/transition.js';

   const internalState = getContext('#tjs-color-picker-state');

   const hue = internalState.colorState.stores.hue;

   const { components, sliderHorizontal } = internalState.stores;

   /** @type {HTMLDivElement} */
   let slider = void 0;

   /** @type {boolean} */
   let isMouseDown = false;

   /** @type {number} */
   let pos = 0;

   /** @type {boolean} */
   let focused = false;

   /** @type {number | undefined} */
   let focusMovementIntervalId = void 0;

   /** @type {number} */
   let focusMovementCounter = void 0;

   $: if (typeof $hue === 'number' && slider) { pos = (100 * $hue) / 360; }

   /**
    * @param {number}    pos -
    */
   function onClick(pos)
   {
      const size = $sliderHorizontal ? slider.getBoundingClientRect().width : slider.getBoundingClientRect().height;
      const boundedPos = Math.max(0, Math.min(size, pos));

      $hue = (boundedPos / size) * 360;
   }

   /**
    * @param {MouseEvent}    e -
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
         onClick($sliderHorizontal ? e.clientX - slider.getBoundingClientRect().left :
          e.clientY - slider.getBoundingClientRect().top);
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab')
      {
         focused = !!document.activeElement?.isSameNode(slider);
      }

      if (!e.repeat && focused)
      {
         move();
      }
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

               const movement = $sliderHorizontal ? $keyPressed.ArrowRight - $keyPressed.ArrowLeft :
                $keyPressed.ArrowDown - $keyPressed.ArrowUp;

               $hue = Math.min(360, Math.max(0, internalState.colorState.hue + movement * 360 * focusMovementFactor));
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
      onClick($sliderHorizontal ? e.changedTouches[0].clientX - slider.getBoundingClientRect().left :
       e.changedTouches[0].clientY - slider.getBoundingClientRect().top);
   }
</script>

<svelte:window
        on:mouseup={mouseUp}
        on:mousemove={mouseMove}
        on:keyup={keyup}
        on:keydown={keydown}
/>

<svelte:component this={$components.sliderWrapper} {focused}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
            class=slider
            tabindex=0
            class:horizontal={$sliderHorizontal}
            bind:this={slider}
            on:mousedown|preventDefault|stopPropagation={mouseDown}
            on:touchstart={touch}
            on:touchmove|preventDefault|stopPropagation={touch}
            on:touchend={touch}
            aria-label="hue picker (arrow keyboard navigation)"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round($hue)}
    >
        <svelte:component this={$components.sliderIndicator} {pos} />
    </div>
</svelte:component>

<style>
    .slider {
        position: relative;
        width: 100%;
        height: 100%;
        background: linear-gradient(var(--_tjs-color-picker-slider-gradient));
        outline: none;
        user-select: none;

        --_tjs-color-picker-slider-gradient: #ff0000, #ffff00 17.2%, #ffff00 18.2%, #00ff00 33.3%, #00ffff 49.5%,
        #00ffff 51.5%, #0000ff 67.7%, #ff00ff 83.3%, #ff0000;
    }

    .horizontal {
        background: linear-gradient(0.25turn, var(--_tjs-color-picker-slider-gradient));
    }
</style>
