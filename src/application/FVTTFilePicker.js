import { TJSDialog }          from '#runtime/svelte/application';
import { outroAndDestroy }    from '#runtime/svelte/util';
import { ManagedPromise }     from '#runtime/util/async';
import { nextAnimationFrame } from '#runtime/util/animate';

import { TJSGlassPane }       from '#runtime/svelte/component/core';

import { fade }               from 'svelte/transition';

export class FVTTFilePicker
{
   static #managedPromise = new ManagedPromise();

   static #filepickerApp;

   static get canBrowse()
   {
      return game.world && game.user.can('FILES_BROWSE');
   }

   /**
    * Creates a new Foundry FilePicker app to browse and return a file path selection.
    *
    * @param {FilePickerOptions & { zIndex?: number }} options - FilePicker options with additional `zIndex`
    *        attribute.
    *
    * @returns {Promise<string|null>} The file picker / browse result.
    */
   static async browse(options = {})
   {
      if (!this.canBrowse) { return null; }

      return this.#browseImpl(options);
   }

   /**
    * Creates a new Foundry FilePicker app to browse and return a file path selection.
    *
    * @param {FilePickerOptions} options - FilePicker options with additional `zIndex` attribute.
    *
    * @param {object}            modalOptions - Additional options for glasspane / modal background & transition.
    *
    * @returns {Promise<string>} The file picker / browse result.
    */
   static async browseModal(options = {}, modalOptions = {})
   {
      if (!this.canBrowse) { return null; }

      const gp = new TJSGlassPane({
         target: document.body,
         props: {
            id: 'fvtt-file-picker-glasspane',
            background: modalOptions?.background,
            transition: modalOptions?.transition ?? fade,
            transitionOptions: modalOptions?.transitionOptions ?? { duration: 200 }
         }
      });

      const promise = this.#browseImpl(options, {
         glasspaneId: 'fvtt-file-picker-glasspane',
         zIndex: Number.MAX_SAFE_INTEGER
      });

      promise.finally(() => outroAndDestroy(gp));

      return promise;
   }

   /**
    * Creates a new Foundry FilePicker app to browse and return a file path selection.
    *
    * @param {FilePickerOptions} options - FilePicker options with additional `zIndex` attribute.
    *
    * @param {object} [modOptions] -
    *
    * @param {string} [modOptions.glasspaneId] -
    *
    * @param {number} [modOptions.zIndex] -
    *
    * @returns {Promise<string>} The file picker / browse result.
    */
   static async #browseImpl(options, modOptions = {})
   {
      if (modOptions?.zIndex !== void 0 && !Number.isInteger(modOptions?.zIndex) && modOptions?.zIndex < 0)
      {
         throw new TypeError(`FVTTFilePicker.browse error: 'zIndex' is not a positive integer.`);
      }

      if (this.#filepickerApp)
      {
         this.#filepickerApp._element[0].style.zIndex = -10;
         await this.#filepickerApp.close();
      }

      const promise = this.#managedPromise.create();

      promise.finally(() => this.#filepickerApp = void 0);

      this.#filepickerApp = new ModdedFilePicker({
         popOutModuleDisable: true,
         ...options,
         callback: (result) =>
         {
            this.#managedPromise.resolve(result);
         }
      }, this.#managedPromise, modOptions);

      await this.#filepickerApp.browse();

      // By awaiting for the next animation frame the app has been rendered.
      await nextAnimationFrame(3);

      // Potentially move app inside glasspane.
      if (typeof modOptions?.glasspaneId === 'string')
      {
         let gpEl = document.querySelector(`#${modOptions.glasspaneId} .tjs-glass-pane-background`);
         if (gpEl)
         {
            gpEl.appendChild(this.#filepickerApp.element[0]);
         }
         else
         {
            gpEl = document.querySelector(`#${modOptions.glasspaneId}-glasspane .tjs-glass-pane-background`);
            if (gpEl) { gpEl.appendChild(this.#filepickerApp.element[0]); }
         }

         // For modal dialogs prevent the window header from being draggable.
         const headerEl = this.#filepickerApp._element[0].querySelector('.window-header');
         if (headerEl)
         {
            headerEl.classList.remove('draggable');
            headerEl.addEventListener('pointerdown', (event) => event.stopPropagation(), true);
         }
      }

      if (Number.isInteger(modOptions?.zIndex))
      {
         // Directly modify the zIndex to be above everything else.
         this.#filepickerApp._element[0].style.zIndex = modOptions.zIndex;
      }

      return promise;
   }
}

class ModdedFilePicker extends FilePicker
{
   #createDirectoryApp;
   #glasspaneId;
   #managedPromise;
   #zIndex;

   constructor(options, managedPromise, { glasspaneId, zIndex } = {})
   {
      super(options);

      this.#glasspaneId = glasspaneId;
      this.#managedPromise = managedPromise;
      this.#zIndex = zIndex;
   }

   setPosition(pos = {})
   {
      const currentPos = super.setPosition(pos);

      if (this.#glasspaneId)
      {
         const top = (globalThis.innerHeight - currentPos.height) / 2;

         this._element[0].style.top = `${top}px`;
         this.position.top = top;
         currentPos.top = top;
      }

      return currentPos;
   }

   async close(options)
   {
      // Close any associated create directory dialog.
      this.#createDirectoryApp?.close?.();
      this.#createDirectoryApp = void 0;

      this.#managedPromise.resolve(null);
      this.#managedPromise = void 0;
      return super.close(options);
   }

   /**
    * Present the user with a dialog to create a subdirectory within their currently browsed file storage location.
    *
    * @param {object} source     The data source being browsed
    *
    * @private
    */
   async _createDirectoryDialog(source)
   {
      // Return early if there is an existing create subfolder / directory dialog.
      if (this.#createDirectoryApp) { return; }

      const form = `<form><div class="form-group">
       <label>Directory Name</label>
       <input type="text" name="dirname" placeholder="directory-name" required/>
       </div></form>`;

       let dialogTargetEl;

      // Potentially find any associated glasspane container element and make that dialog Svelte component mount target.
      if (typeof this.#glasspaneId === 'string')
      {
         let gpEl = document.querySelector(`#${this.#glasspaneId} .tjs-glass-pane-background`);
         if (gpEl) { dialogTargetEl = gpEl; }

         gpEl = document.querySelector(`#${this.#glasspaneId}-glasspane .tjs-glass-pane-background`);
         if (gpEl) { dialogTargetEl = gpEl; }
      }

      this.#createDirectoryApp = new TJSDialog({
         draggable: false,
         zIndex: Number.MAX_SAFE_INTEGER,
         title: game.i18n.localize('FILES.CreateSubfolder'),
         content: form,
         focusFirst: true,
         buttons: {
            onYes: {
               icon: 'fas fa-check',
               label: 'Yes',
               onPress: async (application) =>
               {
                  const html = application.elementContent;

                  const dirname = html.querySelector('input').value;
                  const path = [source.target, dirname].filterJoin('/');
                  try
                  {
                     await this.constructor.createDirectory(this.activeSource, path, { bucket: source.bucket });
                  }
                  catch (err)
                  {
                     ui.notifications.error(err.message);
                  }
                  return this.browse(this.target);
               }
            },
            onNo: {
               icon: 'fas fa-times',
               label: 'No'
            }
         }
      }, { dialogTargetEl, popOutModuleDisable: true });

      // Use wait to be able to remove the reference when any result is chosen.
      await this.#createDirectoryApp.wait();
      this.#createDirectoryApp = void 0;
   }
}
