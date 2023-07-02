export * from './TextState.js';

/**
 * @typedef {object} ColorStateAccess
 *
 * @property {import('../').ColorStateStores} stores The stores from {@link ColorState}.
 *
 * @property {import('../').ColorStateInternalUpdate} internalUpdate The internal tracking state from
 * {@link ColorState}.
 */

/**
 * @typedef {object} TextStateAccess
 *
 * @property {Function} updateColorInternal Provides access to the #updateColorInternal method.
 */

/**
 * @typedef {object} TextStateStores
 *
 * @property {import('svelte/store').Readable<object>} activeMode The current active text mode config object.
 */
