export { default as TJSCodeMirror }   from './TJSCodeMirror.svelte';

/**
 * @typedef {object} TJSCodeMirrorOptions
 *
 * @property {boolean}   [button=true] Provides an edit button to start editing. When button is false editing is
 * always enabled.
 *
 * @property {string[]}  [classes] An array of strings to add to the `.editor` element classes. This allows easier
 * setting of CSS variables across a range of various editor components.
 *
 * @property {boolean}   [clickToEdit=false] When true the edit button is not shown and a click on the editor
 * content initializes the editor.
 *
 * @property {fvtt.ClientDocument}   [document] Set to a Foundry document to load and save content from it.
 * Requires `fieldName` to be set.
 *
 * @property {boolean}   [editable] Prevents editing and hides button. When set to false any active editor
 * is cancelled. Default: user is GM or when a document is assigned the user has ownership.
 *
 * @property {string}    [fieldName] A field name to load and save to / from associated document. IE `a.b.c`.
 *
 * @property {string}    [keyCode='Enter'] Defines the key event code to activate the editor when focused.
 *
 * @property {{ [key: string]: string | null }} [styles] Additional CSS property names and values to set as inline
 * styles. This is useful for dynamically overriding any built in styles and in particular setting CSS variables
 * supported.
 */
