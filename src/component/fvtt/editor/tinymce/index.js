export { default as TJSTinyMCE } from './TJSTinyMCE.svelte';
export *                         from './TinyMCEHelper.js';

/**
 * @typedef {object} TJSTinyMCEOptions
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
 * @property {foundry.abstract.Document}   [document] Set to a Foundry document to load and save content from it.
 * Requires `fieldName` to be set.
 *
 * @property {boolean}   [editable] Prevents editing and hides button. When set to false any active editor
 * is cancelled. Default: user is GM or when a document is assigned the user has ownership.
 *
 * @property {boolean}   [enrichContent=true] When set to false content won't be enriched by `TextEditor.enrichHTML`.
 *
 * @property {fvtt.EnrichmentOptions} [enrichOptions] Additional `TextEditor.enrichHTML` options.
 *
 * @property {string}    [fieldName] A field name to load and save to / from associated document. IE `a.b.c`.
 *
 * @property {Object<FontFamilyDefinition>}    [fonts] An additional object defining module / custom fonts to load
 * specific to this editor.
 *
 * @property {'all'|'end'|'start'}   [initialSelection='start'] Initial selection range; 'all', 'end' or 'start'.
 *
 * @property {string}    [keyCode='Enter'] Defines the key event code to activate the editor when focused.
 *
 * @property {number}    [maxCharacterLength] When defined as an integer greater than 0 this limits the max
 * characters that can be entered.
 *
 * @property {object}    [mceConfig] User defined TinyMCE config object. Please see TinyMCE documentation and also
 * take into consideration that there are differences between Foundry v9 (TinyMCE v5) and Foundry v10+ (TinyMCE v6).
 * Note: There are several pre-made configurations available in {@link TinyMCEHelper}. If not defined
 * {@link TinyMCEHelper.configStandard} is used.
 *
 * @property {boolean}   [preventEnterKey=false] When true this prevents enter key from creating a new line /
 * paragraph.
 *
 * @property {boolean}   [preventPaste=false] Prevents pasting content into the editor.
 *
 * @property {boolean}   [saveOnBlur=false] When true any loss of focus / blur from the editor saves the editor
 * state.
 *
 * @property {boolean}   [saveOnEnterKey=false] When true saves the editor state when the enter key is pressed.
 * This is useful when configuring the editor for single line entry. For an automatic setup for single line entry
 * refer to {@link TinyMCEHelper.optionsSingleLine}.
 *
 * @property {Object<string, string>}   [styles] Additional CSS property names and values to set as inline styles.
 * This is useful for dynamically overriding any built in styles and in particular setting CSS variables supported.
 */
