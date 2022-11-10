<script>
   import { getContext }   from 'svelte';

   import { colord }       from '@typhonjs-fvtt/runtime/color/colord';

   const internalState = getContext('#cp-state');

   const { isAlpha } = internalState.stores;

   const {
      hue,
      sv,
      alpha,
      textState } = internalState.colorState.stores;

   /** @type {RegExp} */
   const HEX_COLOR_REGEX = /^#?([A-F0-9]{6}|[A-F0-9]{8})$/i;

   /** @type {['HEX', 'RGB', 'HSV']} */
   const modes = ['HEX', 'RGB', 'HSV'];

   /** @type {number} */
   let mode = 0;

   $: a = $alpha === undefined ? 1 : Math.round($alpha * 100) / 100;

   $: hsv = $textState.hsv.data;

   const { r, g, b } = textState.rgb.stores;

   let hex;

   $: {
      const colordInstance = colord({ h: $hue, s: $sv.s, v: $sv.v, a: $alpha });
      hex = colord({ h: $hue, s: $sv.s, v: $sv.v, a: $alpha }).toHex();
   }

   function updateAlpha(e)
   {
      const newAlpha = parseFloat(e.target.value);
      const isValid = newAlpha >= 0 && newAlpha <= 1;

      if (isValid) { $alpha = newAlpha; }
   }

   /**
    * @param {InputEvent} e -
    */
   function updateHex(e)
   {
      const value = e.target.value;

      if (HEX_COLOR_REGEX.test(value))
      {
         const newHsv = colord(value).toHsv();

         $hue = newHsv.h;
         $sv = { s: newHsv.s, v: newHsv.v };
         $alpha = newHsv.a
      }
   }

   /**
    * @param {string}    property -
    *
    * @returns {(function(InputEvent): void)|*}
    */
   function updateHsv(property)
   {
      return function (e)
      {
         let isValid = false;

         switch (property)
         {
            case 'h':
               isValid = textState.hsv.isValidHue(e.target.value);
               break;

            case 's':
            case 'v':
               isValid = textState.hsv.isValidSV(e.target.value);
               break;
         }

         if (isValid) { textState.hsv[property] = e.target.value; }
      };
   }
</script>

<div class=text-input>
    {#if mode === 0}
        <div class=input-container>
            <input value={hex} on:input={updateHex} style="flex: 3"/>
            {#if $isAlpha}
                <input aria-label="hexadecimal color"
                       bind:value={a}
                       type=number
                       min=0
                       max=1
                       step=0.01
                       on:input={updateAlpha}
                />
            {/if}
        </div>
    {:else if mode === 1}
        <div class=input-container>
            <input aria-label="red chanel color"
                   bind:value={$r}
                   type=number
                   min=0
                   max=255
            />
            <input aria-label="green chanel color"
                   bind:value={$g}
                   type=number
                   min=0
                   max=255
            />
            <input aria-label="blue chanel color"
                   bind:value={$b}
                   type=number
                   min=0
                   max=255
            />
            {#if $isAlpha}
                <input aria-label="transparency chanel color"
                       value={a}
                       type=number
                       min=0
                       max=1
                       step=0.01
                       on:input={updateAlpha}
                />
            {/if}
        </div>
    {:else}
        <div class=input-container>
            <input aria-label="hue chanel color"
                   value={hsv.h}
                   type=number
                   min=0
                   max=360
                   on:input={updateHsv('h')}
            />
            <input aria-label="saturation chanel color"
                   value={hsv.s}
                   type=number
                   min=0
                   max=100
                   on:input={updateHsv('s')}
            />
            <input aria-label="brightness chanel color"
                   value={hsv.v}
                   type=number
                   min=0
                   max=100
                   on:input={updateHsv('v')}
            />
            {#if $isAlpha}
                <input aria-label="transparency chanel color"
                       value={a}
                       type=number
                       min=0
                       max=1
                       step=0.01
                       on:input={updateAlpha}
                />
            {/if}
        </div>
    {/if}
    <button aria-label="change inputs to {modes[(mode + 1) % 3]}"
            on:click={() => (mode = (mode + 1) % 3)}>{modes[mode]}
    </button>
</div>

<style>
    input[type="number"] {
        appearance: auto;
    }

    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: inner-spin-button;
        opacity: 1
    }

    .text-input {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 10px 5px 5px;
    }

    .input-container {
        display: flex;
        flex: 1;
        gap: 10px;
    }

    input,
    button {
        flex: 1;
        border: none;
        background-color: #eee;
        padding: 0;
        border-radius: 5px;
        height: 30px;
        line-height: 30px;
        text-align: center;
    }

    input {
        width: 5px;
    }

    button {
        cursor: pointer;
        flex: 1;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: #ccc;
    }

    input:focus,
    button:focus {
        outline: none;
    }

    :global(.has-been-tabbed) input:focus-visible,
    :global(.has-been-tabbed) button:focus-visible {
        outline: 2px solid var(--tjs-color-picker-focus-color, red);
        outline-offset: 2px;
    }
</style>
