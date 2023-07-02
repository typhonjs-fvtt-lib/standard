export { default as TJSScrollContainer } from './TJSScrollContainer.svelte';

/**
 * @typedef {object} TJSScrollContainerData
 *
 * @property {import('svelte').SvelteComponent} [class] A svelte component class used as the content component when
 * there is no slotted component defined.
 *
 * @property {object} [props] An object to apply to any data defined Svelte component when there is no slotted
 * component defined.
 *
 * @property {import('svelte/store').Writable<number>} [scrollTop] A Svelte store that serializes the scroll top
 * position of the scrollable container.
 *
 * @property {Record<string, string>}  [styles] Inline styles to assign to the container.
 */
