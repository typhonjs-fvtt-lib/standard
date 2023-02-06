// TODO: Foundry v10.287 finally added `Plugin`, but is missing `PluginKey` from exports and doesn't include
// `TextSelection`.
import {
   Plugin,
   PluginKey,
   TextSelection }   from 'prosemirror-state';

/**
 * A ProseMirror plugin to handle any of the higher level Svelte component editor options.
 *
 * The following options are handled:
 * - `initialSelection`: Sets the initial cursor / selection range to the start, end, or selects all text.
 */
export class TJSEditorOptions
{
   /** @type {PMEditorExtra} */
   #extra;

   /** @type {TJSProseMirrorOptions} */
   #options;

   /**
    * @param {TJSProseMirrorOptions}   options - Svelte component options.
    *
    * @param {PMEditorExtra}           extra - Extra / default data.
    */
   constructor(options, extra)
   {
      this.#options = options;
      this.#extra = extra;
   }

   /**
    * @param {TJSProseMirrorOptions} options - Svelte component options.
    *
    * @param {PMEditorExtra} extra - Default / extra data.
    *
    * @returns {Plugin<any>} PM Plugin.
    */
   static build(options, extra)
   {
      const instance = new this(options, extra);
      return new Plugin({
         key: new PluginKey('tjsEditorOptions'),
         view: (view) => instance.#initialize(view)
      });
   }

   /**
    * Handles `options.initialSelection`: Sets the initial cursor / selection range to the start, end, or selects
    * all text.
    *
    * @param {EditorView}  view - PM editor view.
    *
    * @param {Transaction} tr - PM Transaction.
    *
    * @param {Node}        doc - PM document.
    */
   #handleInitialSelection(view, tr, doc)
   {
      const initialSelection = this.#options.initialSelection;
      const type = initialSelection === 'all' || initialSelection === 'end' || initialSelection === 'start' ?
       initialSelection : this.#extra.initialSelectionDefault;

      const minPos = TextSelection.atStart(doc).from;
      const maxPos = TextSelection.atEnd(doc).to;

      let transaction;

      switch (type)
      {
         case 'all':
         {
            const resolvedFrom = this.#minMax(0, minPos, maxPos);
            const resolvedEnd = this.#minMax(doc.content.size, minPos, maxPos);
            transaction = tr.setSelection(TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }

         case 'end':
         {
            const resolvedFrom = this.#minMax(doc.content.size, minPos, maxPos);
            const resolvedEnd = this.#minMax(doc.content.size, minPos, maxPos);
            transaction = tr.setSelection(TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }

         case 'start':
         {
            const resolvedFrom = this.#minMax(0, minPos, maxPos);
            const resolvedEnd = this.#minMax(0, minPos, maxPos);
            transaction = tr.setSelection(TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }
      }

      if (transaction)
      {
         const newState = view.state.apply(transaction);
         view.updateState(newState);
      }
   }

   /**
    * Dispatches all Svelte component options actions on editor initialization.
    *
    * Note: We aren't creating a PluginView here! Just using the view callback as an initialization source.
    *
    * @param {EditorView}   view - PM editor view.
    */
   #initialize(view)
   {
      const tr = view.state.tr;
      const doc = tr.doc;

      this.#handleInitialSelection(view, tr, doc);

      // Return empty object / PluginView.
      return {};
   }

   #minMax(value = 0, min = 0, max = 0)
   {
      return Math.min(Math.max(value, min), max);
   }
}
