<script>
   /** @type {string} */
   export let textColor = void 0;

   /** @type {string} */
   export let bgColor = void 0;

   /** @type {string | undefined} */
   export let ph = void 0;

   /** @type {number} */
   export let contrast = 1;

   /** @type {'normal' | 'large' | undefined} */
   export let size = void 0;

   $: inlineStyle = `color: ${textColor}; background-color: ${bgColor}`;
</script>

<div class=a11y-single-notice>
    <p class=lorem
       class:large={size === 'large'}
       style={inlineStyle}
    >
        {ph || 'Lorem Ipsum'}
    </p>
    <div class=score>
        <p>contrast: {contrast >= 10 ? contrast.toFixed(1) : contrast}</p>
        <span class=grade class:grade-ok={contrast > (size === 'large' ? 3 : 4.5)}>AA</span>
        <span class=grade class:grade-ok={contrast > (size === 'large' ? 4.5 : 7)}>AAA</span>
    </div>
</div>

<style>
    .a11y-single-notice {
        display: flex;
        align-items: center;
        margin: 4px 0;
        gap: 12px;
        height: 48px;
    }

    .large {
        font-size: 22px;
    }

    .score {
        width: 95px;
        flex-shrink: 0;
        margin-bottom: 10px;
    }

    .score p {
        margin-bottom: 2px;
    }

    .grade {
        border-radius: 50px;
        padding: 2px 8px;
        background-color: orange;
        font-weight: bold;
    }

    .grade-ok {
        background-color: green;
        color: white;
    }

    p {
        margin: 0;
    }

    .lorem {
        flex: 1;
        text-align: center;
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid black;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
</style>
