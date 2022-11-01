<script>
   // import type { Components } from '$lib/type/types';

   import { colord }        from '@typhonjs-fvtt/runtime/color/colord';

   import {
      keyPressed,
      keyPressedCustom }    from '../util/store.js';

   import { easeInOutSin }  from '../util/transition.js';

   /**
    * TODO: DEFINE TYPE
    *
    * @type {Components}
    */
   export let components = void 0;

   /** @type {number} */
   export let h = void 0;

   /** @type {number} */
   export let s = void 0;

   /** @type {number} */
   export let v = void 0;

   /** @type {boolean} */
   /* svelte-ignore unused-export-let */
   export let isOpen = void 0;

   /** @type {boolean} */
   export let toRight = void 0;

   /** @type {boolean} */
   export let isDark = void 0;

   /** @type {HTMLDivElement} */
   let picker = void 0;

   /** @type {boolean} */
   let isMouseDown = false;

   /** @type {boolean} */
   let focused = false;

   /** @type {number | undefined} */
   let focusMovementIntervalId = void 0;

   /** @type {number} */
   let focusMovementCounter = void 0;

   /** @type {string} */
   let colorBg = void 0;

   /** @type {{ x: number, y: number }} */
   let pos = {x: 100, y: 0};

   $: if (typeof h === 'number')
   { colorBg = colord({h, s: 100, v: 100, a: 1}).toHex(); }

   $: if (typeof s === 'number' && typeof v === 'number' && picker)
   {
      pos = {
         x: s,
         y: 100 - v
      };
   }

   $: inlineStyle = `--_tjs-color-picker-background: ${colorBg};`;

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
      let width = picker.getBoundingClientRect().width;
      let height = picker.getBoundingClientRect().height;

      s = clamp(mouse.x / width, 0, 1) * 100;
      v = clamp((height - mouse.y) / height, 0, 1) * 100;
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
            offsetX: Math.max(
             0,
             Math.min(
              picker.getBoundingClientRect().width,
              e.clientX - picker.getBoundingClientRect().left
             )
            ),
            offsetY: Math.max(
             0,
             Math.min(
              picker.getBoundingClientRect().height,
              e.clientY - picker.getBoundingClientRect().top
             )
            )
         });
      }
   }

   /**
    * @param {MouseEvent}    e -
    */
   function mouseDown(e)
   {
      if (!e.target.isSameNode(picker))
      { focused = false; }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab')
      { focused = !!document.activeElement?.isSameNode(picker); }

      if (!e.repeat && focused)
      { move(); }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keydown(e)
   {
      if (focused && $keyPressedCustom.ArrowVH)
      {
         e.preventDefault();
         if (!e.repeat)
         { move(); }
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
               s = Math.min(
                100,
                Math.max(
                 0,
                 s + ($keyPressed.ArrowRight - $keyPressed.ArrowLeft) * focusMovementFactor * 100
                )
               );
               v = Math.min(
                100,
                Math.max(
                 0,
                 v + ($keyPressed.ArrowUp - $keyPressed.ArrowDown) * focusMovementFactor * 100
                )
               );
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
         offsetX: e.changedTouches[0].clientX - picker.getBoundingClientRect().left,
         offsetY: e.changedTouches[0].clientY - picker.getBoundingClientRect().top
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

<svelte:component this={components.pickerWrapper} {focused} {toRight}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class=picker
         tabindex=0
         bind:this={picker}
         on:mousedown|preventDefault|stopPropagation={pickerMouseDown}
         on:touchstart={touch}
         on:touchmove|preventDefault|stopPropagation={touch}
         on:touchend={touch}
         style={inlineStyle}
         aria-label="saturation and brightness picker (arrow keyboard navigation)"
         aria-valuemin={0}
         aria-valuemax={100}
         aria-valuetext="saturation {pos.x?.toFixed()}%, brightness {pos.y?.toFixed()}%"
    >
        <svelte:component
                this={components.pickerIndicator}
                {pos}
                {isDark}
                hex={colord({ h, s, v, a: 1 }).toHex()}
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
         var(--_tjs-color-picker-background);
    }
</style>
