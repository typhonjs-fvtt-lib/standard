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

   static selectAll(element)
   {
      if (typeof globalThis.getSelection !== 'function') { return; }

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
   }

   static setSelectionEnd(element)
   {
      if (typeof globalThis.getSelection !== 'function') { return; }

      const selection = globalThis.getSelection();
      const range = document.createRange();
      selection.removeAllRanges();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.addRange(range);
   }
}
