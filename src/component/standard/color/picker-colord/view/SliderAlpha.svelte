<script>
   import { getContext }    from 'svelte';

   import { keyPressed, keyPressedCustom }  from '../util/store.js';
   import { easeInOutSin }                  from '../util/transition.js';

   const internalState = getContext('#tjs-color-picker-state');
   const sliderConstraint = getContext('#tjs-color-picker-slider-constraint');
   const sliderHorizontal = getContext('#tjs-color-picker-slider-horizontal');

   const { components } = internalState.stores;
   const { alpha } = internalState.colorState.stores;

   const stylesSliderIndicator = {}

   /** @type {HTMLDivElement} */
   let sliderEl = void 0;

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

   $: if (typeof $alpha === 'number' && sliderEl) { pos = 100 * $alpha; }

   $: if (sliderHorizontal)
   {
      // max(6px, 4cqw) comes from SliderWrapper section padding offset.
      stylesSliderIndicator.left = `calc(${(pos / 100)} * calc(${
       sliderConstraint}cqw - max(12px, 7cqw) - max(6px, 4cqw)))`;

      stylesSliderIndicator.top = null;
   }
   else
   {
      stylesSliderIndicator.left = null;
      stylesSliderIndicator.top = `calc(${(pos / 100)} * calc(${sliderConstraint}cqw - max(12px, 7cqw)))`;
   }

   /**
    * @param {number}    pos -
    */
   function onClick(pos)
   {
      const size = sliderHorizontal ? sliderEl.getBoundingClientRect().width : sliderEl.getBoundingClientRect().height;
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
         onClick(sliderHorizontal ? e.offsetX : e.offsetY);
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
         onClick(sliderHorizontal ? e.clientX - sliderEl.getBoundingClientRect().left :
          e.clientY - sliderEl.getBoundingClientRect().top);
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab') { focused = !!document.activeElement?.isSameNode(sliderEl); }

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
               const movement = sliderHorizontal
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

      onClick(sliderHorizontal ? e.changedTouches[0].clientX - sliderEl.getBoundingClientRect().left
       : e.changedTouches[0].clientY - sliderEl.getBoundingClientRect().top);
   }
</script>

<svelte:window
        on:mouseup={mouseUp}
        on:mousemove={mouseMove}
        on:keyup={keyup}
        on:keydown={keydown}
/>

<svelte:component this={$components.alphaWrapper}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div bind:this={sliderEl}
         class=tjs-color-picker-slider
         tabindex=0
         class:horizontal={sliderHorizontal}
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
        <svelte:component this={$components.alphaIndicator} {focused} styles={stylesSliderIndicator} />
    </div>
</svelte:component>

<style>
    .tjs-color-picker-slider:after {
        position: absolute;
        content: '';
        inset: 0;
        background: linear-gradient(#00000000, var(--_tjs-color-picker-current-color-hsl));

        border: var(--tjs-input-number-border, var(--tjs-input-border));
        border-radius: var(--tjs-color-picker-slider-border-radius, max(4px, 2.5cqw));

        z-index: 0;
    }

    .horizontal:after {
        background: linear-gradient(0.25turn, #00000000, var(--_tjs-color-picker-current-color-hsl));
    }

    .tjs-color-picker-slider {
        position: relative;
        width: 100%;
        height: 100%;


        background: var(--tjs-checkerboard-background-10);
        box-shadow: var(--tjs-color-picker-slider-box-shadow);

        border-radius: var(--tjs-color-picker-slider-border-radius, max(4px, 2.5cqw));

        outline: none;
        user-select: none;
    }
</style>
