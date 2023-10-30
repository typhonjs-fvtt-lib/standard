import { fade }               from 'svelte/transition';

import { TJSDialog }          from '#runtime/svelte/application';
import { outroAndDestroy }    from '#runtime/svelte/util';
import { ManagedPromise }     from '#runtime/util/async';
import { nextAnimationFrame } from '#runtime/util/animate';
import {
   isIterable,
   isObject }                 from '#runtime/util/object';

import { TJSGlassPane }       from '#runtime/svelte/component/core';

export class FVTTFilePicker
{
   static #managedPromise = new ManagedPromise();

   /** @type {TJSFilePicker} */
   static #filepickerApp;

   static get canBrowse()
   {
      return game.world && game.user.can('FILES_BROWSE');
   }

   /**
    * Brings any non-modal / glasspane file picker to top. Returning if it is the active file picker.
    */
   static bringToTop(id)
   {
      if (typeof id !== 'string') { throw new TypeError(`FVTTFilePicker.bringToTop error: 'id' is not a string.`); }

      let result = false;

      if (this.#filepickerApp && this.#filepickerApp.id === id)
      {
         // Only invoke `bringToTop` if the file picker app is not contained in a glasspane.
         if (!this.#filepickerApp?.hasGlasspane) { this.#filepickerApp?.bringToTop?.(); }

         result = true;
      }

      return result;
   }

   /**
    * Creates a new Foundry FilePicker app to browse and return a file path selection.
    *
    * @param {FVTTFilePickerOptions} options - FVTTFilePicker options.
    *
    * @returns {Promise<string|null>} The file picker / browse result.
    */
   static async browse(options = {})
   {
      if (!this.canBrowse) { return null; }

      return this.#browseImpl(options);
   }

   /**
    * Closes the file picker with optional `id` of a specific file picker app to close. You may also provide a list of
    * app IDs to close. When provided only the file picker app instance with a matching ID will be closed.
    *
    * Note: When `close` is invoked w/ no `id` parameter any current file picker app is closed.
    *
    * @param {string | Iterable<string>}  [id] - Specific IDs to match against any current visible file picker app.
    */
   static close(id)
   {
      if (id !== void 0 && typeof id !== 'string' && !isIterable(id))
      {
         throw new TypeError(`FVTTFilePicker.close error: 'id' is not a string or list of strings.`);
      }

      if (this.#filepickerApp === void 0) { return; }

      let close = false;

      if (id !== void 0)
      {
         if (typeof id === 'string' && this.#filepickerApp?.id === id)
         {
            close = true;
         }
         else if (isIterable(id))
         {
            for (const appId of id)
            {
               if (typeof appId === 'string' && this.#filepickerApp?.id === appId)
               {
                  close = true;
               }
            }
         }
      }
      else
      {
         close = true;
      }

      if (close) { this.#filepickerApp?.close?.(); }
   }

   /**
    * Creates a new Foundry FilePicker app to browse and return a file path selection.
    *
    * @param {FVTTFilePickerOptions} options - FilePicker options with additional `zIndex` attribute.

    * @returns {Promise<string | null>} The file picker / browse result.
    */
   static async #browseImpl(options)
   {
      if (options?.zIndex !== void 0 && !Number.isInteger(options?.zIndex) && options?.zIndex < 0)
      {
         throw new TypeError(`FVTTFilePicker.browse error: 'zIndex' is not a positive integer.`);
      }

      // Store the explicit zIndex / glasspaneId. This may be modified if the file picker is to be modal.
      let zIndex = options?.zIndex;
      let glasspaneId = options?.glasspaneId;

      // Handle the case when an existing file picker app is visible.
      if (this.#filepickerApp)
      {
         const element = this.#filepickerApp?._element?.[0];
         if (element instanceof HTMLElement && element.isConnected)
         {
            // Immediately hide window by setting a negative z-index.
            element.style.zIndex = `${Number.MIN_SAFE_INTEGER}`;
         }

         // Make sure the app is closed and promise is resolved. Execution will continue below.
         await this.#filepickerApp?.close?.();
      }

      // Handle the case when multiple invocations of `FVTTFilePicker.browse` in quick succession. When the managed
      // Promise is still active resolve immediately with no results.
      if (this.#managedPromise.isActive) { return Promise.resolve(null); }

      const promise = this.#managedPromise.create();

      promise.finally(() => this.#filepickerApp = void 0);

      // Handle modal case -------------------------------------------------------------------------------------------

      if (typeof options?.modal === 'boolean' && options.modal)
      {
         const modalOptions = isObject(options?.modalOptions) ? options.modalOptions : {};

         glasspaneId = 'fvtt-file-picker-glasspane';

         const gp = new TJSGlassPane({
            target: document.body,
            props: {
               id: glasspaneId,
               background: typeof modalOptions?.background === 'string' ? modalOptions.background : void 0,
               closeOnInput: typeof modalOptions?.closeOnInput === 'boolean' ? modalOptions.closeOnInput : void 0,
               transition: modalOptions?.transition ?? fade,
               transitionOptions: modalOptions?.transitionOptions ?? { duration: 200 }
            }
         });

         // When `closeOnInput` is true and a click on the glasspane occurs close the file picker app.
         gp.$on('close:glasspane', () => this.#filepickerApp?.close?.());

         // Destroy the glasspane component when the Promise is resolved.
         promise.finally(() => outroAndDestroy(gp));
      }

      // -------------------------------------------------------------------------------------------------------------

      this.#filepickerApp = new TJSFilePicker({
         popOutModuleDisable: true,
         minimizable: false,
         ...options,
         callback: (result) =>
         {
            this.#managedPromise.resolve(result);
         }
      }, this.#managedPromise, { glasspaneId, zIndex });

      await this.#filepickerApp.browse();

      // By awaiting for the next animation frame the app has been rendered.
      await nextAnimationFrame(3);

      // Potentially move app inside glasspane.
      if (typeof glasspaneId === 'string')
      {
         let gpEl = document.querySelector(`#${glasspaneId} .tjs-glass-pane-background`);
         if (gpEl)
         {
            gpEl.appendChild(this.#filepickerApp.element[0]);
         }
         else
         {
            gpEl = document.querySelector(`#${glasspaneId}-glasspane .tjs-glass-pane-background`);
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

      if (Number.isInteger(zIndex))
      {
         // Directly modify the zIndex to be above everything else.
         this.#filepickerApp._element[0].style.zIndex = `${zIndex}`;
      }

      return promise;
   }
}

class TJSFilePicker extends FilePicker
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

   /**
    * @returns {boolean} Convenience getter for `FVTTFilePicker.bringToTop`.
    */
   get hasGlasspane() { return typeof this.#glasspaneId === 'string'; }

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

      this.#managedPromise?.resolve?.(null);
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

      const form = `<form autocomplete=off><div class=form-group>
       <label>Directory Name</label>
       <input type=text name=dirname placeholder=directory-name required/>
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

/**
 * @typedef {object} FVTTFilePickerOptions
 *
 * @property {string} [type='any']         A type of file to target, in 'audio', 'image', 'video', 'imagevideo',
 *                                         'folder', 'font', 'graphics', 'text', or 'any'.
 *
 * @property {string} [current]            The current file path being modified, if any.
 *
 * @property {string} [activeSource=data]  A current file source in 'data', 'public', or 's3'.
 *
 * @property {Function} [callback]         A callback function to trigger once a file has been selected.
 *
 * @property {boolean} [allowUpload=true]  A flag which permits explicitly disallowing upload, true by default.
 *
 * @property {Map<string, FavoriteFolder>} [favorites] A map of favorite folder configuration objects.
 *
 * @property {string} [displayMode]        The picker display mode in FilePicker.DISPLAY_MODES.
 *
 * @property {boolean} [tileSize=false]    Display the tile size configuration.
 *
 * @property {string[]} [redirectToRoot]   Redirect to the root directory rather than starting in the source directory
 *                                         of one of these files.
 *
 * @property {string} [id]                 A specific unique CSS app ID.
 *
 * @property {string} [glasspaneId]        Provide the CSS ID of the glasspane to move the file picker app to after opening.
 *
 * @property {boolean} [modal]             When true a modal file picker will be opened.
 *
 * @property {({
 *    background: string,
 *    closeOnInput: boolean,
 *    transition: import('#runtime/svelte/transition').TransitionFunction,
 *    transitionOptions: Record<string, any>
 * })} [modalOptions]                      Options for the modal glasspane / TJSGlasspane component.
 *
 * @property {import('svelte/store').Writable<string>} [store] A writable Svelte store that is set with result.
 *
 * @property {number} [zIndex]             Provides an explicit `z-index` for the file picker app.
 */
