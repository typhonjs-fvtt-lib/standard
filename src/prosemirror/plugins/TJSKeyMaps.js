// Protect for absent global `ProseMirror` on Foundry v9.
const ProseMirrorKeyMaps = globalThis.ProseMirror ? ProseMirror.ProseMirrorKeyMaps : class {};

/**
 * Provides an additional key mapping to `Escape` to destroy / cancel the active editor.
 */
export class TJSKeyMaps extends ProseMirrorKeyMaps
{
   #onQuit;

   /**
    * @param {Schema}   schema - The ProseMirror schema to build keymaps for.

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

   /**
    * Swaps the Foundry default `Escape` / selectParentNode to `Mod-p` and enables `onQuit` function for `Escape`.
    *
    * @returns {Object<ProseMirrorCommand>}
    */
   buildMapping()
   {
      const mapping = super.buildMapping()

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
