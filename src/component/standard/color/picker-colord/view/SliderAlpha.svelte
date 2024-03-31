<script>
   import { getContext }    from '#svelte';
   import { writable }      from '#svelte/store';

   import { clamp }         from '#runtime/math/util';
   import { isFocused }     from '#runtime/svelte/action/dom';

   import {
      keyforward,
      KeyStore }            from '#runtime/svelte/store/dom';

   import { easeInOutSin }  from '../util/transition.js';

   const internalState = getContext('#tjs-color-picker-state');
   const sliderConstraint = getContext('#tjs-color-picker-slider-constraint');
   const sliderHorizontal = getContext('#tjs-color-picker-slider-horizontal');

   const { components } = internalState.stores;
   const { alpha } = internalState.colorState.stores;

   const stylesSliderIndicator = {}

   /**
    * Capture all arrow keys.
    *
    * @type {KeyStore}
    */
   const keyStore = new KeyStore(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']);

   /**
    * Specific keys for either horizontal / vertical based on slider orientation to check.
    *
    * @type {string[]}
    */
   const targetKeys = sliderHorizontal ? ['ArrowRight', 'ArrowLeft'] : ['ArrowDown', 'ArrowUp'];

   /** @type {HTMLDivElement} */
   let sliderEl = void 0;

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

   /** @type {number} */
   let pos = void 0;

   // When there is a change to keys monitored invoke `move`.
   $: move($keyStore);

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
    * @param {number}    constraint -
    */
   function onClick(constraint)
   {
      const rect = sliderEl.getBoundingClientRect();
      const size = sliderHorizontal ? rect.width : rect.height;
      const boundedPos = clamp(constraint, 0, size);

      $alpha = boundedPos / size;
   }

   /**
    * @param {KeyStore} keys -
    */
   function move(keys)
   {
      if (keys.anyPressed(targetKeys))
      {
         if (!focusMovementIntervalId)
         {
            focusMovementCounter = 0;

            focusMovementIntervalId = window.setInterval(() =>
            {
               const focusMovementFactor = easeInOutSin(++focusMovementCounter);

               const movement = sliderHorizontal ? keys.value('ArrowRight') - keys.value('ArrowLeft') :
                keys.value('ArrowDown') - keys.value('ArrowUp');

               $alpha = clamp(internalState.colorState.alpha + movement * focusMovementFactor, 0, 1);
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
         sliderEl.setPointerCapture(event.pointerId);
         onClick(sliderHorizontal ? event.offsetX : event.offsetY);
      }
   }

   /**
    * @param {PointerEvent} event -
    */
   function onPointerUp(event)
   {
      isPointerDown = false;
      sliderEl.releasePointerCapture(event.pointerId);
   }

   /**
    * @param {PointerEvent} event -
    */
   function onPointerMove(event)
   {
      if (isPointerDown)
      {
         const rect = sliderEl.getBoundingClientRect();
         onClick(sliderHorizontal ? event.clientX - rect.left : event.clientY - rect.top);
      }
   }

   /**
    * @param {WheelEvent}   event -
    */
   function onWheel(event)
   {
      if (event.deltaY !== 0)
      {
         $alpha = clamp(event.deltaY > 0 ? $alpha + 0.01 : $alpha - 0.01, 0, 1);
      }
   }
</script>

<svelte:component this={$components.alphaWrapper}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div bind:this={sliderEl}
         class=tjs-color-picker-slider
         tabindex=0
         class:horizontal={sliderHorizontal}
         on:pointerdown|preventDefault={onPointerDown}
         on:pointermove|preventDefault|stopPropagation={onPointerMove}
         on:pointerup|preventDefault|stopPropagation={onPointerUp}
         on:wheel|preventDefault|stopPropagation={onWheel}
         aria-label="transparency picker (arrow keyboard navigation)"
         aria-valuemin={0}
         aria-valuemax={100}
         aria-valuenow={Math.round(pos)}
         aria-valuetext="{pos?.toFixed()}%"
         use:isFocused={focused}
         use:keyforward={keyStore}
    >
        <svelte:component this={$components.alphaIndicator} focused={$focused} styles={stylesSliderIndicator} />
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
        touch-action: none;
    }
</style>
