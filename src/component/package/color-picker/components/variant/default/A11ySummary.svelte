<script>
   // import type { A11yColor } from '$lib/type/types';

   /**
    * TODO: DEFINE TYPE
    *
    * @type {Array<A11yColor>}
    */
   export let a11yColors = void 0;

   /** @type {string} */
   /* svelte-ignore unused-export-let */
   export let hex = void 0;

   $: count = a11yColors.map(getNumberOfGradeFailed).reduce((acc, c) => acc + c);

   $: message = count
    ? `⚠️ ${count} contrast grade${count && 's'} fail`
     : 'Contrast grade information';

   /**
    * TODO: DEFINE TYPE
    *
    * @param {AllyColor}   opts -
    *
    * @param {number}      opts.contrast -
    *
    * @param {string}      opts.size -
    *
    * @returns {number} ?
    */
   function getNumberOfGradeFailed({ contrast, size })
   {
      if (!contrast) { return 2; }

      if (size === 'large')
      {
         return contrast < 3 ? 2 : contrast < 4.5 ? 1 : 0;
      }
      else
      {
         return contrast < 4.5 ? 2 : contrast < 7 ? 1 : 0;
      }
   }

</script>

{message}
