export class CEImpl
{
   static insertTextAtCursor(text)
   {
      if (typeof globalThis.getSelection !== 'function') { return; }

      const selection = globalThis.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);

      for (let position = 0; position !== text.length; position++)
      {
         selection.modify('move', 'right', 'character');
      }
   }

   /**
    * Sets the initial selection based on `options.initialSelection`.
    *
    * @param {HTMLDivElement} editorEl - `.editor` element.
    *
    * @param {string}   initialSelection - Initial selection option.
    *
    * @param {string}   defaultValue - Default value if initialSelection is invalid.
    */
   static setInitialSelection(editorEl, initialSelection, defaultValue)
   {
      const type = initialSelection === 'all' || initialSelection === 'end' || initialSelection === 'start' ?
       initialSelection : defaultValue;

      // Sanity check.
      if (!editorEl || typeof globalThis.getSelection !== 'function') { return; }

      const selection = document.getSelection();
      const range = document.createRange();

      switch (type)
      {
         case 'all':
            range.selectNodeContents(editorEl);
            selection.removeAllRanges();
            selection.addRange(range);
            break;

         case 'end':
            const lastElementChild = editorEl.lastElementChild;
            if (lastElementChild)
            {
               range.setStartAfter(lastElementChild);
               range.setEndAfter(lastElementChild);
               selection.removeAllRanges();
               selection.addRange(range);
            }
            break;

         case 'start':
            const firstElementChild = editorEl.firstElementChild;
            if (firstElementChild)
            {
               range.setStart(firstElementChild, 0);
               range.setEnd(firstElementChild, 0);
               selection.removeAllRanges();
               selection.addRange(range);
            }
            break;
      }
   }
}
