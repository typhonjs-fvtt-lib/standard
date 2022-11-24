<script>
   import { applyStyles } from '@typhonjs-svelte/lib/action';

   export let focused = false;
   export let styles = void 0;
</script>

<div class=tjs-slider-indicator use:applyStyles={styles} class:focused />
