<script>
   import { getContext }   from 'svelte';

   import { colord }       from '@typhonjs-fvtt/runtime/color/colord';

   const internalState = getContext('#cp-state');

   const { isAlpha } = internalState.stores;

   const {
      hue,
      sv,
      alpha,
      rgbInt } = internalState.colorState.stores;

   /** @type {RegExp} */
   const HEX_COLOR_REGEX = /^#?([A-F0-9]{6}|[A-F0-9]{8})$/i;

   /** @type {['HEX', 'RGB', 'HSV']} */
   const modes = ['HEX', 'RGB', 'HSV'];

   /** @type {number} */
   let mode = 0;

   $: h = Math.round($hue);
   $: s = Math.round($sv.s);
   $: v = Math.round($sv.v);
   $: a = $alpha === undefined ? 1 : Math.round($alpha * 100) / 100;

   let rgb;

   $: {
      rgb = $rgbInt.rgb;
// console.log(`!! TextInput - $: rgbInt - rgb: `, rgb)
   }

   // let hex, rgb;
   let hex;

   $: {
      // const colordInstance = colord({ h, s, v, a });
      const colordInstance = colord({ h: $hue, s: $sv.s, v: $sv.v, a: $alpha });
      hex = colord({ h: $hue, s: $sv.s, v: $sv.v, a: $alpha }).toHex();

      // const newRGB = $outputColord.toRgb();
      // rgb = { r: Math.round(newRGB.r), g: Math.round(newRGB.g), b: Math.round(newRGB.b) }

// console.log(`!! TextInput - $:rgb: `, rgb)
      // rgb = colord({ h: $hue, s: $sv.s, v: $sv.v }).toRgb();
   }

   function updateAlpha(e)
   {
      const newAlpha = parseFloat(e.target.value);
      if (newAlpha >= 0 && newAlpha <= 1) { $alpha = newAlpha; }
   }

   /**
    * @param {InputEvent} e -
    */
   function updateHex(e)
   {
      const value = e.target.value;

      if (HEX_COLOR_REGEX.test(value))
      {
         const newHSV = colord(value).toHsv();

         $hue = newHSV.h;
         $sv = { s: newHSV.s, v: newHSV.v };
         $alpha = newHSV.a
      }
   }

   /**
    * @param {string}    property -
    *
    * @returns {(function(InputEvent): void)|*}
    */
   function updateRgb(property)
   {
      return function (e)
      {
         const value = parseFloat(e.target.value);

         // console.log(`!! TextInput - updateRgb - 0 - value: `,  value);

         rgbInt[property] = value;

//          if (value >= 0 && value <= 255)
//          {
// console.log(`!! TextInput - updateRgb - 0 - value: `,  value);
// console.log(`!! TextInput - updateRgb - 1 - rgb: `,  rgb);
//             const newRGB = {...rgb, [property]: value};
// console.log(`!! TextInput - updateRgb - 2 - newRGB: `,  newRGB);
//
//             rgb
//
//             // const newHSV = colord(newRGB).toHsv()
//
// // console.log(`!! TextInput - updateRgb - 3 - newHSV: `,  newHSV);
// // console.log(`!! TextInput - updateRgb - 4 - reverse RGB: `,  colord(newHSV).toRgb());
//
//             // $hue = newHSV.h;
//             // $sv = { s: newHSV.s, v: newHSV.v };
//             // $alpha = newHSV.a
//          }

         // $hsv = colord(rgb).toHsv();
      };
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
         const newHSV = { h, s, v, a, [property]: parseFloat(e.target.value) };

         switch (property)
         {
            case 'h':
               $hue = newHSV.h
               break;

            case 's':
            case 'v':
               $sv = { s: newHSV.s, v: newHSV.v };
               break;
         }

         // $hue = newHSV.h;
         // $sv = { s: newHSV.s, v: newHSV.v };
         // $alpha = newHSV.a

         // const newHSV = colord(rgb).toHsv()
         // $hsv = {h, s, v, a, [property]: parseFloat(e.target.value)};
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
                   value={rgb.r}
                   type=number
                   min=0
                   max=255
                   on:input={updateRgb('r')}
            />
            <input aria-label="green chanel color"
                   value={rgb.g}
                   type=number
                   min=0
                   max=255
                   on:input={updateRgb('g')}
            />
            <input aria-label="blue chanel color"
                   value={rgb.b}
                   type=number
                   min=0
                   max=255
                   on:input={updateRgb('b')}
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
                   value={h}
                   type=number
                   min=0
                   max=360
                   on:input={updateHsv('h')}
            />
            <input aria-label="saturation chanel color"
                   value={s}
                   type=number
                   min=0
                   max=100
                   on:input={updateHsv('s')}
            />
            <input aria-label="brightness chanel color"
                   value={v}
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
