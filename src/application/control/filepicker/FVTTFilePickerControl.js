import { fade }               from 'svelte/transition';

import { TJSDialog }          from '#runtime/svelte/application';
import { TJSGlassPane }       from '#runtime/svelte/component/application';
import { TJSSvelteUtil }      from '#runtime/svelte/util';
import { nextAnimationFrame } from '#runtime/util/animate';
import { A11yHelper }         from '#runtime/util/a11y';
import { ManagedPromise }     from '#runtime/util/async';
import {
   isIterable,
   isObject }                 from '#runtime/util/object';

/**
 * Provides managed control of the Foundry {@link globalThis.FilePicker} app simplifying asynchronous use cases. While the stock
 * FilePicker provides a callback it is not easy to make it asynchronous given that a user can close the app.
 * FVTTFilePickerControl enables a fully asynchronous workflow controlling one FilePicker instance at a time. When
 * {@link FVTTFilePickerControl.browse} is invoked any previous FilePicker instance is closed and Promise resolved.
 *
 * Additionally, the file picker app is modified to work in modal context w/ TJSGlassPane along with any managing
 * associated dialog instances displayed. A very powerful capability is to display a modal FilePicker app instance.
 *
 * For extended options available for {@link FVTTFilePickerControl.browse} see {@link FVTTFilePickerBrowseOptions}.
 * It is highly recommended that you provide a unique CSS ID for each file picker instance invoked.
 * A use case where you should use FVTTFilePickerControl is to invoke {@link FVTTFilePickerControl.close}
 * in an `onDestroy` Svelte callback to close any open file picker apps associated w/ UI layout components you design.
 *
 * A demo example is available in `essential-svelte-esm`:
 * {@link https://github.com/typhonjs-fvtt-demo/essential-svelte-esm}
 *
 * Several ready-made Svelte components are available that are designed around FVTTFilePickerControl.
 *
 * Please see the following Svelte components that can be imported from `#standard/component/fvtt/filepicker/button`:
 * @see TJSFileButton - A standard form button element.
 * @see TJSFileIconButton - Uses TJSIconButton for display.
 * @see TJSFileSlotButton - Provides a slotted button where you can provide any containing content.
 */
export class FVTTFilePickerControl
{
   /**
    * Provides the event constructor names to duck type against. This is necessary for when HTML nodes / elements are
    * moved to another browser window as `instanceof` checks will fail.
    *
    * @type {Set<string>}
    */
   static #eventTypesAll = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   static #managedPromise = new ManagedPromise();

   /** @type {TJSFilePicker} */
   static #filepickerApp;

   /**
    * @returns {boolean} Test if the current user can browse files.
    */
   static get canBrowse()
   {
      return game.world && game.user.can('FILES_BROWSE');
   }

   /**
    * Brings any non-modal / glasspane file picker to top. Returning if it is the active file picker.
    *
    * @param {string} [id] - The ID of the file picker app.
    *
    * @returns {boolean} Whether the file picker app is brought to top.
    */
   static bringToTop(id)
   {
      // Handle the case when no `id` is defined and potentially bring any file picker app to top.
      if (id === void 0 && this.#filepickerApp)
      {
         // Only invoke `bringToTop` if the file picker app is not contained in a glasspane.
         if (!this.#filepickerApp?.hasGlasspane) { this.#filepickerApp?.bringToTop?.(); }
         return true;
      }

      if (typeof id !== 'string')
      {
         throw new TypeError(`FVTTFilePickerControl.bringToTop error: 'id' is not a string.`);
      }

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
    * @param {FVTTFilePickerBrowseOptions} [options] - FVTTFilePickerControl browse options. This may also include any
    *        Application options.
    *
    * @param {KeyboardEvent | MouseEvent} [event] - An event to inspect for focus management when a modal file picker
    *        is launched.
    *
    * @returns {Promise<string|null>} The file picker / browse result.
    */
   static async browse(options = {}, event)
   {
      if (!this.canBrowse) { return null; }

      return this.#browseImpl(options, event);
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
         throw new TypeError(`FVTTFilePickerControl.close error: 'id' is not a string or list of strings.`);
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
    * @param {FVTTFilePickerBrowseOptions} [options] - FVTTFilePickerControl browse options. This may also include any
    *        Application options.
    *
    * @param {KeyboardEvent | MouseEvent} [event] - An event to inspect for focus management when a modal file picker
    *        is launched.

    * @returns {Promise<string | null>} The file picker / browse result.
    */
   static async #browseImpl(options, event)
   {
      if (options?.glasspaneId !== void 0 && typeof options.glasspaneId !== 'string')
      {
         throw new TypeError(`FVTTFilePickerControl.browse error: 'glasspaneId' is not a string.`);
      }

      if (options?.zIndex !== void 0 && !Number.isInteger(options?.zIndex) && options?.zIndex < 0)
      {
         throw new TypeError(`FVTTFilePickerControl.browse error: 'zIndex' is not a positive integer.`);
      }

      if (event !== void 0 && !this.#eventTypesAll.has(event?.constructor?.name))
      {
         throw new TypeError(`FVTTFilePickerControl.browse error: 'event' is not a KeyboardEvent or MouseEvent.`);
      }

      // Store the explicit zIndex / glasspaneId. This may be modified if the file picker is to be modal.
      let glasspaneId = options?.glasspaneId;

      // If there is an existing glasspaneId to promote to then force the z-index to above everything else.
      let zIndex = glasspaneId ? Number.MAX_SAFE_INTEGER : options?.zIndex;

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

      // Handle the case when multiple invocations of `FVTTFilePickerControl.browse` in quick succession. When the managed
      // Promise is still active resolve immediately with no results.
      if (this.#managedPromise.isActive) { return Promise.resolve(null); }

      const promise = this.#managedPromise.create();

      promise.finally(() => this.#filepickerApp = void 0);

      // Handle modal case -------------------------------------------------------------------------------------------

      const modalOptions = isObject(options?.modalOptions) ? options.modalOptions : {};

      // If there is an existing glasspane is specified do not create a new glasspane.
      if (typeof glasspaneId === 'string')
      {
         const gpEl = document.querySelector(`#${glasspaneId}`);
         if (gpEl)
         {
            // Capture and act first on `glasspane:keydown:escape` closing the file picker, but stopping any modal
            // dialog underneath from closing as well.
            gpEl.addEventListener('glasspane:keydown:escape', (event) =>
            {
               event.preventDefault();
               event.stopImmediatePropagation();

               this.#filepickerApp?.close?.();
            }, { capture: true, once: true });

            // If `closeOnInput` is true register a listener on the existing glasspane for the `glasspane:pointerdown`
            // event to close the file picker app.
            if (typeof modalOptions?.closeOnInput === 'boolean' && modalOptions?.closeOnInput)
            {
               gpEl.addEventListener('glasspane:pointerdown', () => this.#filepickerApp?.close?.(), { once: true });
            }
         }
         else
         {
            console.warn(`FVTTFilePickerControl.browse warning: Could not locate glasspane for CSS ID: ${glasspaneId}`);
         }
      }

      // Otherwise if there isn't an existing glasspane specified and `modal` is true then create a new TJSGlassPane
      // component.
      else if (typeof options?.modal === 'boolean' && options.modal)
      {
         glasspaneId = 'fvtt-file-picker-glasspane';

         const gp = new TJSGlassPane({
            target: document.body,
            props: {
               id: glasspaneId,
               background: typeof modalOptions?.background === 'string' ? modalOptions.background : void 0,
               closeOnInput: typeof modalOptions?.closeOnInput === 'boolean' ? modalOptions.closeOnInput : void 0,
               transition: modalOptions?.transition ?? fade,
               transitionOptions: modalOptions?.transitionOptions ?? { duration: 200 },
               styles: isObject(modalOptions?.styles) ? modalOptions?.styles : void 0
            }
         });

         // When `closeOnInput` is true and a click on the glasspane occurs close the file picker app.
         gp.$on('glasspane:close', () => this.#filepickerApp?.close?.());

         // Close the file picker whenever the escape key is pressed.
         gp.$on('glasspane:keydown:escape', () => this.#filepickerApp?.close?.());

         // Destroy the glasspane component when the Promise is resolved.
         promise.finally(() => TJSSvelteUtil.outroAndDestroy(gp));
      }

      // If an event is defined determine a potential focus source. When the file picker app is closed this element
      // resumes focus.
      const focusSource = glasspaneId && event ? A11yHelper.getFocusSource({ event }) : void 0;

      // -------------------------------------------------------------------------------------------------------------

      this.#filepickerApp = new TJSFilePicker({
         popOutModuleDisable: true,
         minimizable: false,
         ...options,
         callback: (result) =>
         {
            this.#managedPromise.resolve(result);
         }
      }, this.#managedPromise, { focusSource, glasspaneId, zIndex });

      await this.#filepickerApp.browse();

      // By awaiting for the next 3 animation frames the app has been rendered. The extra frames provide a buffer.
      await nextAnimationFrame(3);

      // Potentially move app inside glasspane.
      if (typeof glasspaneId === 'string')
      {
         const gpContainerEl = document.querySelector(`#${glasspaneId} .tjs-glass-pane-container`);
         if (gpContainerEl)
         {
            gpContainerEl.appendChild(this.#filepickerApp.element[0]);

            // Focus first input.
            this.#filepickerApp?._element?.[0]?.querySelector('input')?.focus();
         }
         else
         {
            console.warn(`FVTTFilePickerControl.browse warning: Could not locate glasspane for CSS ID: ${glasspaneId}`);
         }

         // For modal dialogs prevent the window header from being draggable.
         const headerEl = this.#filepickerApp._element[0].querySelector('.window-header');
         if (headerEl)
         {
            headerEl.classList.remove('draggable');
            headerEl.addEventListener('pointerdown', (event) => event.stopPropagation(), true);
         }
      }

      // Directly modify the zIndex to be above everything else when supplied.
      if (Number.isInteger(zIndex))
      {
         this.#filepickerApp._element[0].style.zIndex = `${zIndex}`;
      }

      return promise;
   }
}

/**
 * Extends FilePicker to handle resolving the managed Promise on app close, explicitly center the app when shown above
 * a modal / glasspane, and manage any associated dialogs.
 */
class TJSFilePicker extends FilePicker
{
   /** @type {TJSDialog} */
   #createDirectoryApp;

   /** @type {import('#runtime/util/browser').A11yFocusSource} */
   #focusSource;

   /** @type {string} */
   #glasspaneId;

   /** @type {ManagedPromise} */
   #managedPromise;

   /** @type {number} */
   #zIndex;

   constructor(options, managedPromise, { focusSource, glasspaneId, zIndex } = {})
   {
      super(options);

      this.#focusSource = focusSource;
      this.#glasspaneId = glasspaneId;
      this.#managedPromise = managedPromise;
      this.#zIndex = zIndex;
   }

   /**
    * @returns {boolean} Convenience getter for `FVTTFilePickerControl.bringToTop`.
    */
   get hasGlasspane() { return typeof this.#glasspaneId === 'string'; }

   /**
    * Always focus first input when `bringToTop` is invoked.
    */
   bringToTop()
   {
      super.bringToTop();

      // Always focus first input when app is brought to top.
      this?._element?.[0]?.querySelector('input')?.focus();
   }

   /**
    * Overridden close method that resolves the managed Promise w/ null and closes any associated create directory
    * dialog.
    *
    * @param {object}   options - Application close options.
    *
    * @returns {Promise<void>}
    */
   async close(options)
   {
      // Close any associated create directory dialog.
      this.#createDirectoryApp?.close?.();
      this.#createDirectoryApp = void 0;

      this.#managedPromise?.resolve?.(null);
      this.#managedPromise = void 0;

      // Make window content overflow hidden to avoid any scrollbars appearing in default Application close animation.
      const content = this._element?.[0]?.querySelector('.window-content');
      if (content) { content.style.overflow = 'hidden'; }

      await super.close(options);

      // Apply any stored focus options and then remove them from options.
      if (this.#focusSource)
      {
         A11yHelper.applyFocusSource(this.#focusSource);
         this.#focusSource = void 0;
      }
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

      // The initial target is document.body, but if there is a glasspane container the dialog `svelte.target` is set.
      let dialogTargetEl = globalThis.document.body;

      // Potentially find any associated glasspane container element and make that dialog Svelte component mount target.
      if (typeof this.#glasspaneId === 'string')
      {
         const gpContainerEl = document.querySelector(`#${this.#glasspaneId} .tjs-glass-pane-container`);
         if (gpContainerEl)
         {
            dialogTargetEl = gpContainerEl;
         }
         else
         {
            console.warn(`TJSFilePicker._createDirectoryDialog warning: Could not locate glasspane for CSS ID: ${
             this.#glasspaneId}`);
         }
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
               onPress: async ({ application }) =>
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
      }, { svelte: { target: dialogTargetEl }, popOutModuleDisable: true });

      // Use wait to be able to remove the reference when any result is chosen.
      await this.#createDirectoryApp.wait();
      this.#createDirectoryApp = void 0;
   }

   /**
    * Overridden to explicitly center the file picker app when displayed above a modal / glasspane.
    *
    * @param {object}   pos - Position object.
    *
    * @returns {{left: number, top: number, width: number, height: number, scale: number}} Position object.
    */
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
}

/**
 * @typedef {object} FVTTFilePickerBrowseOptions - Foundry {@link globalThis.FilePicker} w/ expanded
 *          FVTTFilePickerControl options.
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
 * @property {Map<string, globalThis.FavoriteFolder>} [favorites] A map of favorite folder configuration objects.
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
 *    styles: { [key: string]: string | null },
 *    transition: import('#runtime/svelte/transition').TransitionFunction,
 *    transitionOptions: { [key: string]: any }
 * })} [modalOptions]                      Options for the modal glasspane / TJSGlasspane component.
 *
 * @property {({ urlString: string }) => void} [onURLString] Optional function invoked when URL string changes.
 *
 * @property {({ urlString: string }) => Promise<boolean>} [onValidateURLString] Optional validation function of
 * selected URL string.
 *
 * @property {import('#runtime/svelte/store/util').MinimalWritable<string>} [store] A minimal writable store that is
 * set with result.
 *
 * @property {number} [zIndex]             Provides an explicit `z-index` for the file picker app.
 */
