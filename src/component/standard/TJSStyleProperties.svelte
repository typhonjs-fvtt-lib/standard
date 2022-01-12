<script>
   /**
    * StylesProperties is a slotted component that simply wraps the slot in a DIV element and uses `applyStyles` to
    * load the prop `styles` into inline styles. `styles` is an object with `property / value` pairs.
    *
    * This is useful if you need to set local CSS variables for a group of children components for instance rather than
    * direct CSS props.
    */

   import { applyStyles } from '@typhonjs-svelte/lib/action';

   export let styles;
</script>

<div use:applyStyles={styles}>
    <slot/>
</div>
