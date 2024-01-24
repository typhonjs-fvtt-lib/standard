export { default as TJSProseMirror }   from './TJSProseMirror.svelte';

/**
 * @typedef {object} TJSProseMirrorOptions
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
 * @property {boolean}   [collaborate=false] Enables ProseMirror collaboration; requires a document to be set.
 *
 * @property {foundry.abstract.Document}   [document] Set to a Foundry document to load and save content from it.
 * Requires `fieldName` to be set.
 *
 * @property {{ sanitizeWithVideo: function }}   [DOMPurify] The DOMPurify export from
 * `#runtime/security/client/dompurify`. Sanitizes content client side. Note: TinyMCE already does essential
 * `<script>` sanitization, so this is just an extra option that is available as an extra precaution.
 *
 * @property {boolean}   [editable] Prevents editing and hides button. When set to false any active editor
 * is cancelled. Default: user is GM or when a document is assigned the user has ownership.
 *
 * @property {boolean}   [enrichContent=true] When set to false content won't be enriched by `TextEditor.enrichHTML`.
 *
 * @property {globalThis.EnrichmentOptions} [enrichOptions] Additional `TextEditor.enrichHTML` options.
 *
 * @property {string}    [fieldName] A field name to load and save to / from associated document. IE `a.b.c`.
 *
 * @property {'all'|'end'|'start'}   [initialSelection='start'] Initial selection range; 'all', 'end' or 'start'.
 *
 * @property {string}    [keyCode='Enter'] Defines the key event code to activate the editor when focused.
 *
 * @property {Record<string, ProseMirror.Plugin>}    [plugins] Additional ProseMirror plugins to load.
 *
 * @property {boolean}   [menuCompact] Initializes the ProseMirror editor with a compact menu.
 *
 * @property {Record<string, string>}   [styles] Additional CSS property names and values to set as inline styles.
 * This is useful for dynamically overriding any built in styles and in particular setting CSS variables supported.
 */

/**
 * @typedef {object} PMEditorExtra Defines extra data passed to TJSEditorOptions ProseMirror plugin.
 *
 * @property {string} initialSelectionDefault The default value if `options.initialSelection is not defined.
 */
