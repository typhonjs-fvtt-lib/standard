<script>
   import ResizeHitBox     from './ResizeHitBox.svelte';

   import { hitboxData }   from './constants.js';
</script>

{#each hitboxData as data (data.id)}
   <ResizeHitBox {data}/>
{/each}
