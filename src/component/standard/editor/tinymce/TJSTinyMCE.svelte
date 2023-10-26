<script>
   /**
    * Provides a reactive wrapper for Foundry TinyMCE editor support. Allows editing Foundry document data or
    * directly from content prop. Automatic HTML enrichment occurs for the content when saved.
    *
    * There are no required props, but the following are available to set.
    * `content` - Provides an initial content string; you can bind to `content` from a parent component to get reactive
    *             updates when `content` changes. Two-way binding.
    *
    * `enrichedContent` - Provides the enriched content via {@link TextEditor.enrichHTML} when `content` changes.
    *             You can bind to `enrichedContent` from a parent component to get reactive updates though it is not
    *             recommended to change `enrichedContent` externally. One-way binding.
    *
    * `options` - Defines the options object for this component and passed on to the Foundry TinyMCE support.
    *             Please review all the options defined below {@link TJSTinyMCEOptions}.
    *
    * Notable options passed onto TinyMCE instance.
    * ---------------------------------
    * `options.mceConfig` - [object] TinyMCE configuration object.
    *
    * Events: There are three events fired when the editor is canceled, saved, and started.
    * ---------------------------------
    * `editor:cancel` - Fired when editing is canceled by a user action or reactive response to document changes.
    *
    * `editor:document:deleted` - Fired when the edited document is deleted. Access the document from
    *                             `event.detail.document`.
    *
    * `editor:enrichedContent` - Fired when content is enriched. Access enriched content from
    *                            `event.detail.enrichedContent`.
    *
    * `editor:save` - Fired when editing is saved. Access the content from `event.detail.content`.
    *
    * `editor:start` - Fired when editing is started.
    *
    * The following CSS variables control the associated styles with the default values.
    *
    * `.editor` HTMLDivElement:
    * ---------------------------------
    * --tjs-editor-background - none
    * --tjs-editor-border - none
    * --tjs-editor-border-radius - 0
    * --tjs-editor-height - 100%
    * --tjs-editor-margin - 0
    * --tjs-editor-transition
    * --tjs-editor-width - 100%
    *
    * `.editor` HTMLDivElement; properties available when activated:
    * ---------------------------------
    * --tjs-editor-active-box-shadow, unset; Foundry default: 0 0 5px var(--color-shadow-primary)
    * --tjs-editor-active-outline - unset
    * --tjs-editor-active-overflow - unset; When inactive the editor overflow is auto; when active overflow is unset.
    *
    * `.editor` HTMLDivElement; properties available when inactive, but manually focused:
    * ---------------------------------
    * --tjs-editor-inactive-box-shadow-focus-visible - fallback: --tjs-default-box-shadow-focus-visible
    * --tjs-editor-inactive-outline-focus-visible - fallback: --tjs-default-outline-focus-visible; default: revert
    * --tjs-editor-inactive-transition-focus-visible - fallback: --tjs-default-transition-focus-visible
    *
    * `.editor` HTMLDivElement; properties available when inactive, but hovered:
    * ---------------------------------
    * --tjs-editor-inactive-cursor-hover - text
    * --tjs-editor-inactive-box-shadow-hover - unset
    * --tjs-editor-inactive-outline-hover - unset
    * --tjs-editor-inactive-user-select-hover - text
    *
    * `.editor-content` HTMLDivElement; when editing - the content overflow is set to auto:
    * ---------------------------------
    * --tjs-editor-content-color - #000
    * --tjs-editor-content-font-family - "Signika"
    * --tjs-editor-content-font-size - 10.5pt
    * --tjs-editor-content-line-height - 1.2
    * --tjs-editor-content-overflow - auto
    * --tjs-editor-content-padding - 0
    *
    * `.editor-container` HTMLDivElement; when editing - removes default margins.
    * ---------------------------------
    * --tjs-editor-container-margin - 0
    *
    * .editor-edit; Defines the position of the edit button from top / right absolute positioning:
    * ---------------------------------
    * --tjs-editor-edit-button-right - 5px
    * --tjs-editor-edit-button-top - 0
    *
    * Various TinyMCE `tox` toolbar elements; Defines the toolbar / menu.
    * ---------------------------------
    * --tjs-editor-menu-item-active-background - #dee0e2 - This targets the auxiliary TMCE menus.
    * --tjs-editor-toolbar-background - rgba(0, 0, 0, 0.1)
    * --tjs-editor-toolbar-border-radius - 6px
    * --tjs-editor-toolbar-button-background - none
    * --tjs-editor-toolbar-button-background-hover - var(--color-hover-bg, #f0f0e0))
    * --tjs-editor-toolbar-button-color - var(--color-text-dark-primary, #191813)
    * --tjs-editor-toolbar-button-disabled-color - rgba(34, 47, 62, .5)
    * --tjs-editor-toolbar-box-shadow - 0 2px 2px -2px rgb(34 47 62 / 10%), 0 8px 8px -4px rgb(34 47 62 / 7%)
    * --tjs-editor-toolbar-chevron-active-color - var(--color-text-dark-primary, #191813))
    * --tjs-editor-toolbar-chevron-inactive-color - var(--color-text-light-7, #888))
    * --tjs-editor-toolbar-padding - 0 2px
    * --tjs-editor-toolbar-separator-border - 1px solid var(--color-text-light-3, #ccc)
    * --tjs-editor-toolbar-select-background - var(--color-control-bg, #d9d8c8)
    * --tjs-editor-toolbar-width - 100%
    */

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
    * @property {{ sanitizeWithVideo: function }}   [DOMPurify] The DOMPurify export from
    * `#runtime/security/client/dompurify`. Sanitizes content client side. Note: TinyMCE already does essential
    * `<script>` sanitization, so this is just an extra option that is available as an extra precaution.
    *
    * @property {boolean}   [editable] Prevents editing and hides button. When set to false any active editor
    * is cancelled. Default: user is GM or when a document is assigned the user has ownership.
    *
    * @property {boolean}   [enrichContent=true] When set to false content won't be enriched by `TextEditor.enrichHTML`.
    *
    * @property {EnrichmentOptions} [enrichOptions] Additional `TextEditor.enrichHTML` options.
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

   import {
      createEventDispatcher,
      getContext,
      onDestroy,
      onMount,
      tick
   }                        from '#svelte';

   import { applyStyles }   from '#runtime/svelte/action/dom';
   import { TJSDocument }   from '#runtime/svelte/store/fvtt/document';
   import { isObject }      from '#runtime/util/object';

   import { FontManager }   from '#standard/fvtt';

   import { TinyMCEHelper } from './TinyMCEHelper.js';
   import { MCEImpl }       from './MCEImpl.js';

   import { createMountRevealSecretButtons } from '../common/secrets/createMountRevealSecretButtons.js';

   /** @type {string} */
   export let content = '';

   /** @type {string} */
   export let enrichedContent = '';

   /**
    * Provides the options object that can be reactively updated. See documentation above.
    *
    * @type {TJSTinyMCEOptions}
    */
   export let options = {};

   const positionStore = getContext('#external').application.position;

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument({ delete: onDocumentDeleted });

   // Create the action to mount the secret reveal button when a Foundry document is configured.
   const mountRevealSecretButtons = createMountRevealSecretButtons(doc, options);

   /** @type {boolean} */
   let clickToEdit;

   /** @type {boolean} */
   let editable = true;

   /** @type {TinyMCE.Editor} TinyMCE Editor */
   let editor;

   /** @type {boolean} */
   let editorActive = false;

   /** @type {boolean} */
   let editorButton;

   /** @type {HTMLDivElement} */
   let editorContentEl;

   /** @type {HTMLDivElement} */
   let editorEl;

   /** @type {string} */
   let keyCode;

   /** @type {boolean} */
   let keyFocused = false;

   /** @type {number} */
   let maxCharacterLength;

   /**
    * TinyMCE doesn't properly close auxiliary dropdown menus w/ Svelte. Manually force a click on toolbar buttons
    * that has an associated auxiliary control when the editor is open and the app position changes; this keeps the MCE
    * toolbar state correct. Then clear out any remaining children of the MCE auxiliary div.
    */
   $: if (editorActive && editorEl && $positionStore)
   {
      // Auxiliary aria selector is different for TinyMCE v5 & v6.
      const ariaSelector = MCEImpl.isV6 ? `.tox-tbtn[aria-controls^='aria-controls_']` :
       `.tox-tbtn[aria-owns^='aria-owns_']`;

      // Perform a click on the active toolbar button to close it; this keeps MCE internal state correct.
      const mceActiveAuxButtonEl = editorEl.querySelector(ariaSelector);
      if (mceActiveAuxButtonEl) { mceActiveAuxButtonEl.click(); }

      // Now remove any other children of the MCE auxiliary div. This is for secondary menus in the `TJS` configuration.
      const auxEl = document.querySelector('.tox.tox-tinymce-aux');
      if (auxEl)
      {
         let child = auxEl.lastElementChild;
         while (child)
         {
            auxEl.removeChild(child);
            child = auxEl.lastElementChild;
         }
      }
   }

   /**
    * Respond to changes in `options.editable`. If `options.editable` is not defined only a GM level user may edit _or_
    * if a Foundry document is associated any user that is the owner of the document.
    */
   $:
   {
      if (typeof options?.editable === 'boolean')
      {
         editable = options.editable;
      }
      else
      {
         // Always editable by GM; otherwise document user ownership if defined. `$doc ?? options.document` is used
         // due to reactive statements resolution so that the first execution always has a potential document reference.
         editable = game.user.isGM || (($doc ?? options.document)?.isOwner ?? false);
      }

      if (!editable) { destroyEditor(); }
   }

   /**
    * When `editable` & `options.clickToEdit` is true and the editor is not active enable clickToEdit.
    */
   $: clickToEdit = !editorActive && editable &&
       (typeof options?.clickToEdit === 'boolean' ? options.clickToEdit : false);

   /**
    * When `options.button` & `editable` is true and the editor is not active and `clickToEdit` is false
    * enable the edit button.
    */
   $: editorButton = !editorActive && editable && (typeof options?.button === 'boolean' ? options.button : true) &&
       !clickToEdit;

   /**
    * Allows another KeyboardEvent.code to be used to activate the editor.
    */
   $: keyCode = typeof options?.keyCode === 'string' ? options.keyCode : 'Enter';

   /**
    * Updates maxCharacterLength; this does not reactively alter content or the active editor content.
    *
    * TODO: It would be nice to provide reactive updates to content when maxCharacterLength changes, but that is
    * problematic w/ mixed text & HTML content without a lot of potential work.
    */
   $: maxCharacterLength = Number.isInteger(options?.maxCharacterLength) && options?.maxCharacterLength >= 0 ?
       options.maxCharacterLength : void 0;

   /**
    * Loads any additional fonts specified. Note that FontManager.loadFonts verifies that a font is already loaded,
    * so it is OK to load additional fonts per component.
    */
   $: if (options?.fonts)
   {
      FontManager.loadFonts({ fonts: options.fonts });
   }

   /**
    * Respond to changes in `options.document`
    */
   $: if (options?.document !== void 0)
   {
      if (!(options.document instanceof globalThis.foundry.abstract.Document))
      {
         throw new TypeError(`TJSTinyMCE error: 'options.document' is not a Foundry document.`);
      }

      if (typeof options?.fieldName !== 'string')
      {
         throw new TypeError(
          `TJSTinyMCE error: 'options.document' is defined, but 'options.fieldName' is not a string.`);
      }

      if (options.document !== $doc)
      {
         // Remove any existing editor if document changes.
         enrichedContent = '';
         content = '';
         destroyEditor();

         doc.set(options.document);
      }
   }
   else
   {
      // Remove any existing editor if there was a document set, but now it is removed.
      if ($doc)
      {
         enrichedContent = '';
         content = '';

         destroyEditor();

         doc.set(void 0);
      }
   }

   // If there is a valid document then retrieve content from `fieldName` otherwise use `content` string.
   $:
   {
      content = $doc !== void 0 && typeof options?.fieldName === 'string' ?
       globalThis.foundry.utils.getProperty($doc, options.fieldName) :
        typeof content === 'string' ? content : '';

      // Avoid double trigger of reactive statement as enriching content is async.
      onContentChanged(content, typeof options?.enrichContent === 'boolean' ? options?.enrichContent : true);
   }

   /**
    * When the component is destroyed if the editor is active then save editor content otherwise destroy editor.
    */
   onDestroy(() =>
   {
      // Handle the case when the component is destroyed / IE application closed, but the editor isn't saved.
      if (editorActive)
      {
         saveEditor({ remove: typeof options?.button === 'boolean' ? options.button : true });
      }
      else
      {
         destroyEditor();
      }
   });

   /**
    * If `editable` is true and `options.button` && `options.clickToEdit` is false then start the editor on mount.
    */
   onMount(() => { if (editable && !editorButton && !clickToEdit) { initEditor(); } });

   /**
    * Destroys any active editor.
    */
   function destroyEditor(fireCancel = true)
   {
      if (editor)
      {
         setTimeout(() =>
         {
            editor?.destroy();
            if (editorContentEl) { editorContentEl.innerText = ''; }

            editor = void 0;

            // Post on next micro-task to allow any event propagation for `Escape` key to trigger first.
            setTimeout(() => editorActive = false, 0);

            // If the editor was initialized by keyboard action then focus it after a short delay to allow the template
            // to update.
            if (keyFocused)
            {
               keyFocused = false;

               setTimeout(() =>
               {
                  if (editorEl instanceof HTMLElement && editorEl?.isConnected) { editorEl.focus(); }
               }, 100);
            }

         }, 0);

         if (fireCancel) { dispatch('editor:cancel'); }
      }
   }

   /**
    * Initializes editor.
    *
    * @returns {Promise<void>}
    */
   async function initEditor()
   {
      // Store any existing setup function.
      const existingSetupFn = options?.mceConfig?.setup;

      const { fonts, fontFormats } = MCEImpl.getFontData(options?.fonts);

      const mceConfig = {
         ...(options?.mceConfig ?? TinyMCEHelper.configStandard()),
         engine: 'tinymce',
         [`${MCEImpl.isV6 ? 'font_family_formats' : 'font_formats'}`]: fontFormats,
         target: editorContentEl,
         save_onsavecallback: () => saveEditor(),
         height: '100%',
         paste_as_text: maxCharacterLength >= 0,    // Pasted content must be text when limiting to a max length;
                                                    // requires `paste` plugin on TinyMCE v5.
      }

      // Turns off TinyMCE v5 drop / paste filtering and insert due to using the 'paste' plugin.
      if (MCEImpl.isV5)
      {
         mceConfig.paste_filter_drop = false;
      }

      // Handle `preventEnterKey` / `saveOnEnterKey`. It's necessary to set this is up in the config / setup hook as
      // this event handler will be invoked before any other event handler is set up.
     mceConfig.setup = (editor) =>
     {
        editor.on('beforeinput', (event) => MCEImpl.beforeInputHandler(editor, event, options, maxCharacterLength));
        editor.on('keydown', (event) => MCEImpl.keydownHandler(editor, event, options, saveEditor, content));

        // Invoke any existing setup function in the config object provided.
        if (typeof existingSetupFn === 'function') { existingSetupFn(editor); }
     };

      /**
       * Handle `preventPaste` option and `maxCharacterLength` limitation on paste.
       * Note: paste_preprocess requires `paste` MCE plugin on TinyMCE v5.
       * Note: first parameter is supposed to be editor, but it is undefined on TinyMCE v5; pass in actual editor.
       */
      mceConfig.paste_preprocess = (unused, args) => MCEImpl.pastePreprocess(editor, args, options,
       maxCharacterLength);

      // Prepends the CSS variable editor content styles to any existing user defined styles to the `content_style`
      // MCE config parameter. This automatically makes sure the properties are the same between the `.editor-content`
      // and the body of the MCE IFrame.
      mceConfig.content_style = `${MCEImpl.setMCEConfigContentStyle(editorContentEl)} ${mceConfig.content_style}`;

      editorActive = true;

      // Editor is now active; wait until the template updates w/ new bound `editorContentEl`.
      await tick();

      editor = await TextEditor.create(mceConfig, content);

      // Set the initial selection; 'all', 'end', 'start'.
      MCEImpl.setInitialSelection(editor, options?.initialSelection, 'start')

      /**
       * Load core fonts into TinyMCE IFrame.
       *
       * @type {HTMLIFrameElement}
       */
      const editorIFrameEl = editorEl.querySelector('.tox-edit-area__iframe');
      if (editorIFrameEl)
      {
         await FontManager.loadFonts({ document: editorIFrameEl.contentDocument, fonts });
      }

      editor.on('blur', (e) => onBlur(e));

      dispatch('editor:start');
   }

   /**
    * Potentially handles saving editor on content blur if `options.saveOnBlur` is true.
    */
   function onBlur()
   {
      if (editorActive && typeof options?.saveOnBlur === 'boolean' && options?.saveOnBlur) { saveEditor(); }
   }

   /**
    * Potentially handles initializing the editor when it is not active and `options.clickToEdit` is true.
    */
   function onClick()
   {
      if (!editorActive && clickToEdit) { initEditor(); }
   }

   /**
    * Separated into a standalone method so applying async value to enriched content doesn't double trigger a reactive
    * statement twice.
    *
    * @param {string}   content - Content prop.
    *
    * @param {boolean}  enrichContent - `options.enrichContent` or default of `true.
    *
    * @returns {Promise<void>}
    */
   async function onContentChanged(content, enrichContent)
   {
      if (typeof content === 'string')
      {
         if (enrichContent)
         {
            // Determine if the document is owned by current user falling back to false if there is no document
            // assigned.
            const isOwner = $doc?.isOwner ?? false;

            // Use any current associated document as the relative location for UUID generation.
            const relativeTo = $doc ?? void 0;

            // Combine any external EnrichmentOptions, but always set `async: true`.
            const enrichOptions = isObject(options?.enrichOptions) ? {
               secrets: globalThis.game.user.isGM || isOwner,
               relativeTo,
               ...options.enrichOptions,
               async: true
            } : { async: true, relativeTo, secrets: globalThis.game.user.isGM || isOwner};

            enrichedContent = await TextEditor.enrichHTML(content, enrichOptions);
         }
         else
         {
            enrichedContent = content;
         }
      }
      else
      {
         enrichedContent = '';
      }

      dispatch('editor:enrichedContent', { enrichedContent });
   }

   /**
    * Handles cleaning up the editor state after any associated document has been deleted.
    *
    * @param {foundry.abstract.Document} document - The deleted document.
    */
   function onDocumentDeleted(document)
   {
      if (isObject(options)) { options.document = void 0; }

      destroyEditor();

      dispatch('editor:document:deleted', { document });

      content = '';
      enrichedContent = '';
   }

   /**
    * Prevents `Escape` key or `Ctrl-s` from propagating when the editor is active preventing the app from being closed.
    * The `Escape` key is used to close the active editor first. Foundry by default when `Ctrl-s` is pressed as of v10
    * scrolls the canvas down which is undesired when saving an editor as well.
    *
    * @param {KeyboardEvent}    event - A keyboard event from `.editor`.
    */
   function onKeydown(event)
   {
      if (editorActive)
      {
         if (event.code === 'Escape' || (event.code === 'KeyS' && (event.ctrlKey || event.metaKey)))
         {
            event.preventDefault();
            event.stopPropagation();
         }
      }
      else
      {
         if (event.code === keyCode)
         {
            event.preventDefault();
            event.stopPropagation();
         }
      }
   }

   /**
    * Handle activating the editor if key codes match.
    *
    * @param {KeyboardEvent}    event - A KeyboardEvent.
    */
   function onKeyup(event)
   {
      if (event.code === keyCode)
      {
         if (!editorActive)
         {
            keyFocused = true;
            initEditor();
         }

         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Saves the editor contents to the associated document or updates content directly.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.remove] - Removes the editor.
    */
   function saveEditor({ remove = typeof options?.button === 'boolean' ? options.button : true } = {})
   {
      // Remove the editor
      if (editor)
      {
         // Retrieve editor content and add IDs to secret blocks.
         let data = MCEImpl.addSecretIDs(editor.getContent());

         const saving = data !== content;

         // editor.isDirty() doesn't appear to work as desired.
         if (saving)
         {
            // Perform client side sanitization if DOMPurify is available in options.
            // TinyMCE does essential `<script>` based sanitization, so this is just an extra option to provide
            // specific sanitization.
            if (options?.DOMPurify && typeof options?.DOMPurify?.sanitizeWithVideo === 'function')
            {
               data = options.DOMPurify.sanitizeWithVideo(data);
            }

            // Save to document if available
            if ($doc && typeof options?.fieldName === 'string')
            {
               $doc.update({ [options.fieldName]: data });
            }
            else // Otherwise save to content.
            {
               content = data;
            }

            dispatch('editor:save', { content: data });
         }

         if (remove) { destroyEditor(!saving); }
      }
   }
</script>

<div bind:this={editorEl}
     class="editor tinymce tjs-editor {Array.isArray(options?.classes) ? options.classes.join(' ') : ''}"
     class:click-to-edit={clickToEdit}
     class:editor-active={editorActive}
     use:applyStyles={options?.styles}
     on:click={onClick}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     on:pointerdown|stopPropagation
     role=textbox
     tabindex=0>
    {#if editorButton}
        <!-- svelte-ignore a11y-missing-attribute a11y-click-events-have-key-events -->
        <a class=editor-edit on:click={() => initEditor()} role=button tabindex=-1><i class="fas fa-edit"></i></a>
    {/if}
    <!-- Passing enrichedContent to the mount secret buttons action causes it to run when the content changes. -->
    <div bind:this={editorContentEl}
         use:mountRevealSecretButtons={{ mountRevealButtons: !editorActive && editable, enrichedContent }}
         class="editor-content tjs-editor-content">
        {#if !editorActive}
            {@html enrichedContent}
        {/if}
    </div>
</div>

<style>
    .tjs-editor {
        background: var(--tjs-editor-background, none);
        border: var(--tjs-editor-border, none);
        border-radius: var(--tjs-editor-border-radius, 0);
        height: var(--tjs-editor-height, 100%);
        outline-offset: var(--tjs-editor-outline-offset, 0.25em);
        margin: var(--tjs-editor-margin, 0);
        transition: var(--tjs-editor-transition);
        width: var(--tjs-editor-width, 100%);

        /* For Firefox. */
        scrollbar-width: thin;
    }

    .editor-content {
        color: var(--tjs-editor-content-color, #000);
        font-family: var(--tjs-editor-content-font-family, "Signika");
        font-size: var(--tjs-editor-content-font-size, 10.5pt);
        line-height: var(--tjs-editor-content-line-height, 1.2);
        padding: var(--tjs-editor-content-padding, 3px 0 0 0);
    }

    /**
     * This class is added to editor when `editorActive` is true and unsets overflow allowing content to be scrollable
     * keeping the menu bar always visible at the top of the component.
     */
    .editor-active {
        box-shadow: var(--tjs-editor-active-box-shadow);
        outline: var(--tjs-editor-active-outline);
        overflow: var(--tjs-editor-active-overflow, hidden);
    }

    /**
     * Defines cursor and box-shadow / outline when the editor is inactive and hovered.
     */
    .tjs-editor:not(.editor-active):focus-visible {
        box-shadow: var(--tjs-editor-inactive-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
        outline: var(--tjs-editor-inactive-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
        transition: var(--tjs-editor-inactive-transition-focus-visible, var(--tjs-default-transition-focus-visible));
    }

    /**
     * Defines cursor and box-shadow / outline when the editor is inactive and hovered, but not manually focused.
     */
    .tjs-editor:not(.editor-active):not(:focus-visible):hover {
        box-shadow: var(--tjs-editor-inactive-box-shadow-hover);
        outline: var(--tjs-editor-inactive-outline-hover);
    }

    /**
     * Defines user-select when the editor is inactive and hovered.
     */
    .tjs-editor:not(.editor-active):hover {
        user-select: var(--tjs-editor-inactive-user-select-hover, text);
    }

    /**
     * Defines cursor when the editor is not active, but configured for click to edit. Give the user some indication
     * via showing the text cursor across the whole editor element.
     */
    .tjs-editor.click-to-edit:not(.editor-active):hover {
        cursor: var(--tjs-editor-inactive-cursor-hover, text);
    }

    .editor-edit {
        right: var(--tjs-editor-edit-button-right, 5px);
        top: var(--tjs-editor-edit-button-top, 0);
    }

    /* Controls whether the editor content text is selectable when the editor is inactive. */
    .tjs-editor:not(.editor-active) .editor-content {
        user-select: var(--tjs-editor-inactive-user-select-hover, text);
    }

    /* Don't add an initial margin top to first paragraph element in `.editor-content`. */
    .tjs-editor .editor-content :global(p:first-of-type) {
        margin-top: 0;
    }

    /* Do add an initial margin top to first paragraph element in `section.secret`. */
    .tjs-editor .editor-content :global(section.secret p:first-of-type) {
        margin-top: 0.5em;
    }

    .tjs-editor :global(div.tox-tinymce) {
        border-radius: 0;
        font-size: 10.5pt;
        padding: var(--tjs-editor-content-padding, 0);
    }

    .tjs-editor :global(.tox:not(.tox-tinymce-inline) .tox-editor-header) {
        background: none;
        box-shadow: unset;
        transition: unset;
        padding: 0;
        width: var(--tjs-editor-toolbar-width, 100%);
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-toolbar-overlord) {
        background: none;
        box-shadow: var(--tjs-editor-toolbar-box-shadow, 0 2px 2px -2px rgb(34 47 62 / 10%), 0 8px 8px -4px rgb(34 47 62 / 7%));
        margin-bottom: 0.25em;

        transition: box-shadow 500ms ease-in-out;
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-toolbar__primary) {
        background: var(--tjs-editor-toolbar-background, rgba(0, 0, 0, 0.1));
        border-radius: var(--tjs-editor-toolbar-border-radius, 6px);
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-toolbar__group) {
        width: auto;
        padding: var(--tjs-editor-toolbar-padding, 0 2px);
    }

    .tjs-editor :global(.tox.tox-tinymce:not([dir=rtl]) .tox-toolbar__group:not(:last-of-type)) {
        border-right: var(--tjs-editor-toolbar-separator-border, 1px solid var(--color-text-light-3, #ccc));
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn) {
        background: var(--tjs-editor-toolbar-button-background, none);
        color: var(--tjs-editor-toolbar-button-color, var(--color-text-dark-primary, #191813));
        padding: 0;
        margin: 2px 0;
        min-width: 34px;
        width: fit-content;
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn svg) {
        fill: var(--tjs-editor-toolbar-button-color, var(--color-text-dark-primary, #191813));
        margin-right: auto;
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn.tox-tbtn--disabled) {
        color: var(--tjs-editor-toolbar-button-disabled-color, rgba(34, 47, 62, .5));
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn.tox-tbtn--disabled svg) {
        fill: var(--tjs-editor-toolbar-button-disabled-color, rgba(34, 47, 62, .5));
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn:hover:not(.tox-tbtn--disabled)) {
        background: var(--tjs-editor-toolbar-button-background-hover, var(--color-hover-bg, #f0f0e0));
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn.tox-tbtn--enabled:not(.tox-tbtn--disabled)) {
        background: var(--tjs-editor-toolbar-button-background-hover, var(--color-hover-bg, #f0f0e0));
    }

    /* Max width for all select buttons */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--select) {
        max-width: 7em;
    }

    /* Explicit size for font format select button */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--select[title="Fonts"]) {
        width: 7em;
    }

    /* Explicit size for font size select button */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--select[title="Font sizes"]) {
        width: 4.5em;
    }

    /* Handles TMCE select button non-active background */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--select) {
        background: var(--tjs-editor-toolbar-select-background, var(--color-control-bg, #d9d8c8));
    }

    /* Handles TMCE select button hovered background */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--select:hover:not(.tox-tbtn--disabled)) {
        background: var(--tjs-editor-toolbar-select-background-hover, var(--color-hover-bg, #f0f0e0));
    }

    /* Handles TMCE select button active background */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--select.tox-tbtn--active:not(.tox-tbtn--disabled)) {
        background: var(--tjs-editor-toolbar-select-background-hover, var(--color-hover-bg, #f0f0e0));
    }

    /* Handles the TMCE select svg container giving a width that works with margin-right: auto for consistent space */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn .tox-tbtn__select-chevron) {
        max-width: 13px;
        margin-right: 2px;
        width: fit-content;
    }

    /* Handles the select chevron inactive color */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn .tox-tbtn__select-chevron svg) {
        fill: var(--tjs-editor-toolbar-chevron-inactive-color, var(--color-text-light-7, #888));
    }

    /* Handles the select chevron active hover color */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn:not(.tox-tbtn--disabled):hover .tox-tbtn__select-chevron svg) {
        fill: var(--tjs-editor-toolbar-chevron-active-color, var(--color-text-dark-primary, #191813));
    }

    /* Handles the select chevron menu active color */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--active:not(.tox-tbtn--disabled) .tox-tbtn__select-chevron svg) {
        fill: var(--tjs-editor-toolbar-chevron-active-color, var(--color-text-dark-primary, #191813));
    }

    /* Handles this components toolbar select button width */
    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn--bespoke .tox-tbtn__select-label) {
        margin-right: auto;
        max-width: 7em;
        width: 7em;
    }

    /* The following styles affect the global / all modules TinyMCE auxiliary menus --------------------------------*/

    /**
     * Handles the "global" TinyMCE auxiliary toolbar select button width; this is displayed separately in the DOM
     * and this CSS will affect all TinyMCE auxiliary toolbar select buttons, but it is better.
     */
    :global(.tox.tox-tinymce-aux .tox-tbtn--bespoke .tox-tbtn__select-label) {
        max-width: 7em;
        width: fit-content;
    }

    :global(.tox.tox-tinymce-aux .tox-collection--list .tox-collection__item--active) {
        background: var(--tjs-editor-menu-item-active-background, #dee0e2);
    }

    /* Removes TMCE highlight for focused button in overflow menu. IE avoid automatic focus of first button */
    :global(.tox.tox-tinymce-aux .tox-tbtn:focus) {
        background: var(--tjs-editor-menu-item-active-background, #dee0e2);
    }

    :global(.tox.tox-tinymce-aux .tox-tbtn:hover:not(.tox-tbtn--disabled)) {
        background: var(--tjs-editor-menu-item-active-background, #dee0e2);
    }

    :global(.tox.tox-tinymce-aux .tox-tbtn.tox-tbtn--enabled:not(.tox-tbtn--disabled)) {
        background: var(--tjs-editor-menu-item-active-background, #dee0e2);
    }
</style>
