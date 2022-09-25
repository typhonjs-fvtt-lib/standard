export class TJSProseMirrorMenu extends ProseMirror.ProseMirrorMenu
{
   async _insertImagePrompt()
   {
      console.log(`! TJSProseMirrorMenu - _insertImagePrompt`);
      return super._insertImagePrompt();
   }

   async _insertLinkPrompt() {
      console.log(`! TJSProseMirrorMenu - _insertLinkPrompt`);
      return super._insertLinkPrompt();
   }
}
