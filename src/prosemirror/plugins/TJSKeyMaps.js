// Protect for absent global `ProseMirror` on Foundry v9.
const ProseMirrorKeyMaps = globalThis.ProseMirror ? globalThis.ProseMirror.ProseMirrorKeyMaps : class {};

/**
 * Provides an additional key mapping to `Escape` to destroy / cancel the active editor.
 */
export class TJSKeyMaps extends ProseMirrorKeyMaps
{
   /** @type {Function} */
   #onQuit;

   /**
    * @param {globalThis.Schema}   schema - The ProseMirror schema to build keymaps for.
    *
    * @param {object}   [options] - Additional options to configure the plugin's behaviour.
    *
    * @param {Function} [options.onSave] - A function to call when Ctrl+S is pressed.
    *
    * @param {Function} [options.onQuit] - A function to call when Ctrl+Q is pressed.
    */
   constructor(schema, options)
   {
      super(schema, options);

      if (typeof options.onQuit === 'function') { this.#onQuit = options.onQuit; }
   }

   // eslint-disable-next jsdoc/check-types
   /**
    * Swaps the Foundry default `Escape` / selectParentNode to `Mod-p` and enables `onQuit` function for `Escape`.
    *
    * @returns { {[key: string]: globalThis.ProseMirrorCommand} } ProseMirror keymap data.
    */
   buildMapping()
   {
      const mapping = super.buildMapping();

      // Add onQuit callback if defined.
      if (this.#onQuit)
      {
         // Swap Foundry core mapping for `Escape` / selectParentNode to `Mod-p`.
         if (mapping['Escape']) { mapping['Mod-p'] = mapping['Escape']; }

         mapping['Escape'] = () => this.#onQuit();
      }

      return mapping;
   }
}
