<script>
   import { getContext } from 'svelte';

   const control = getContext('#pcControl');

   const { isPrimary, selected } = control.stores;
</script>

<div class="border"
     class:selected={$selected && !$isPrimary}
     class:primary={$selected && $isPrimary}
/>

<style>
   div.border {
      position: absolute;
      pointer-events: none;
      top: -2px;
      left: -2px;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
      clip-path: polygon(0% 0%, 0% 100%, 2px 100%, 2px 2px, calc(100% - 2px) 2px, calc(100% - 2px) calc(100% - 2px), 2px calc(100% - 2px), 2px 100%, 100% 100%, 100% 0%);
      background-size: 200% auto;
      animation: shine 1.5s linear infinite;
   }

   .selected {
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.3) 35%, rgba(21, 204, 247, 0.95) 45%, rgba(64, 208, 245, 0.95) 55%, rgba(255, 255, 255, 0.3) 70%, rgba(255, 255, 255, 0.3) 100%);
      border: dotted 2px lightblue;
   }

   .primary {
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.3) 35%, rgba(250, 197, 99, 0.95) 45%, rgba(255, 215 , 0, 0.95) 55%, rgba(255, 255, 255, 0.3) 70%, rgba(255, 255, 255, 0.3) 100%);
      border: dotted 2px yellow;
   }

   @keyframes shine {
      to {
         background-position: 200% center;
      }
   }
</style>
