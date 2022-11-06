<script>
   // import type { Components } from '$lib/type/types';

   import { getContext }    from 'svelte';

   import { keyPressed, keyPressedCustom }  from '../util/store.js';
   import { easeInOutSin }                  from '../util/transition.js';

   /** @type {number} */
   export let a = 1;

   /** @type {string | undefined} */
   export let hex = void 0;

   const { components, sliderVertical } = getContext('#cp-state').stores;

   /** @type {HTMLDivElement} */
   let alpha = void 0;

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

   $: if (typeof a === 'number' && alpha) { pos = 100 * a; }

   $: inlineStyle = `--_tjs-color-picker-alpha-color: ${hex?.substring(0, 7)}`;

   /**
    * @param {number}    pos -
    */
   function onClick(pos)
   {
      const size = $sliderVertical ? alpha.getBoundingClientRect().width : alpha.getBoundingClientRect().height;
      const boundedPos = Math.max(0, Math.min(size, pos));

      a = boundedPos / size;
   }

   /**
    * @param {MouseEvent} e -
    */
   function mouseDown(e)
   {
      if (e.button === 0)
      {
         isMouseDown = true;
         onClick($sliderVertical ? e.offsetX : e.offsetY);
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
         onClick($sliderVertical ? e.clientX - alpha.getBoundingClientRect().left :
          e.clientY - alpha.getBoundingClientRect().top);
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab') { focused = !!document.activeElement?.isSameNode(alpha); }

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
               const movement = $sliderVertical
                ? $keyPressed.ArrowRight - $keyPressed.ArrowLeft
                : $keyPressed.ArrowDown - $keyPressed.ArrowUp;
               a = Math.min(1, Math.max(0, a + movement * focusMovementFactor));
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

      onClick($sliderVertical ? e.changedTouches[0].clientX - alpha.getBoundingClientRect().left
       : e.changedTouches[0].clientY - alpha.getBoundingClientRect().top);
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
    <div class=alpha
         tabindex=0
         class:vertical={$sliderVertical}
         style={inlineStyle}
         bind:this={alpha}
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
        background: linear-gradient(#00000000, var(--_tjs-color-picker-alpha-color));
        z-index: 0;
    }

    .vertical:after {
        background: linear-gradient(0.25turn, #00000000, var(--_tjs-color-picker-alpha-color));
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
