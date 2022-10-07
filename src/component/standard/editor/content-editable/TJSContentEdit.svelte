<script>
   /**
    * Provides a reactive wrapper for direct content editable elements. Allows editing Foundry document data or
    * directly from content prop. Automatic HTML enrichment occurs for the content when saved.
    *
    * There are no required props, but the following are available to set.
    * `content` - Provides an initial content string; you can bind to `content` from a parent component to get reactive
    *             updates when `content` changes. Two way binding.
    *
    * `enrichedContent` - Provides the enriched content via {@link TextEditor.enrichHTML} when `content` changes.
    *             You can bind to `enrichedContent` from a parent component to get reactive updates though it is not
    *             recommended to change `enrichedContent` externally. One way binding.
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
    * `editor:enrichedContent` - Fired when content is enriched. Access data from `event.detail.enrichedContent`.
    * `editor:save` - Fired when editing is saved. Access the content from `event.detail.content`.
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
    * --tjs-editor-overflow - auto
    * --tjs-editor-width - 100%
    *
    * `.editor` HTMLDivElement; properties available when activated:
    * ---------------------------------
    * --tjs-editor-active-box-shadow, unset; Foundry default: 0 0 5px var(--color-shadow-primary)
    * --tjs-editor-active-outline - unset
    * --tjs-editor-active-overflow - unset; When inactive the editor overflow is auto; when active overflow is unset.
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
    * --tjs-editor-edit-right - 5px
    * --tjs-editor-edit-top - 0
    *
    * Various TinyMCE `tox` toolbar elements; Defines the toolbar / menu.
    * ---------------------------------
    * --tjs-editor-menu-item-background-active - #dee0e2 - This targets the auxiliary TMCE menus.
    * --tjs-editor-toolbar-background - rgba(0, 0, 0, 0.1)
    * --tjs-editor-toolbar-border-radius - 6px
    * --tjs-editor-toolbar-button-background - none
    * --tjs-editor-toolbar-button-background-hover - var(--color-hover-bg, #f0f0e0))
    * --tjs-editor-toolbar-button-color - var(--color-text-dark-primary, #191813)
    * --tjs-editor-toolbar-chevron-active - var(--color-text-dark-primary, #191813))
    * --tjs-editor-toolbar-chevron-inactive - var(--color-text-light-7, #888))
    * --tjs-editor-toolbar-padding - 0 2px
    * --tjs-editor-toolbar-separator-border - 1px solid var(--color-text-light-3, #ccc)
    * --tjs-editor-toolbar-select-background - var(--color-control-bg, #d9d8c8)
    * --tjs-editor-toolbar-width - 100%
    */

   /**
    * @typedef {object} TJSTinyMCEOptions
    *
    * @property {boolean}   [button=true] - Provides an edit button to start editing. When button is false editing is
    *           always enabled.
    *
    * @property {boolean}   [clickToEdit=false] - When true the edit button is not shown and a click on the editor
    *           content initializes the editor.
    *
    * @property {boolean}   [editable=true] - Prevents editing and hides button. When set to false any active editor
    *           is cancelled.
    *
    * @property {foundry.abstract.Document}   [document] - Set to a Foundry document to load and save content from it.
    *           Requires `fieldName` to be set.
    *
    * @property {{ sanitizeWithVideo: function }}   [DOMPurify] - The DOMPurify export from
    *           `@typhonjs-fvtt/runtime/dompurify`. Sanitizes content client side. Note: TinyMCE already does essential
    *           `<script>` sanitization, so this is just an extra option that is available as an extra precaution.
    *
    * @property {string}    [fieldName] - A field name to load and save to / from associated document. IE `a.b.c`.
    *
    * @property {Object<FontFamilyDefinition>}    [fonts] - An additional object defining module / custom fonts to load
    *           specific to this editor.
    *
    * @property {number}    [maxCharacterLength] - When defined as an integer greater than 0 this limits the max
    *           characters that can be entered.
    *
    * @property {object}    [mceConfig] - User defined TinyMCE config object. Please see TinyMCE documentation and also
    *           take into consideration that there are differences between Foundry v9 (TinyMCE v5) and
    *           Foundry v10+ (TinyMCE v6). Note: There are several pre-made configurations available in
    *           {@link TinyMCEHelper}. If not defined {@link TinyMCEHelper.configStandard} is used.
    *
    * @property {boolean}   [preventEnterKey=false] - When true this prevents enter key from creating a new line /
    *           paragraph.
    *
    * @property {boolean}   [preventPaste=false] - Prevents pasting content into the editor.
    *
    * @property {boolean}   [saveOnBlur=false] - When true any loss of focus / blur from the editor saves the editor
    *           state.
    *
    * @property {boolean}   [saveOnEnterKey=false] - When true saves the editor state when the enter key is pressed.
    *           This is useful when configuring the editor for single line entry. For an automatic setup for single
    *           line entry refer to {@link TinyMCEHelper.optionsSingleLine}.
    *
    * @property {Object<string, string>}   [styles] - Additional CSS property names and values to set as inline styles.
    *           This is useful for dynamically overriding any built in styles and in particular setting CSS variables
    *           supported.
    */

   import {
      createEventDispatcher,
      onDestroy,
      tick
   }                        from 'svelte';

   import { applyStyles }   from '@typhonjs-svelte/lib/action';

   import { TJSDocument }   from '@typhonjs-fvtt/svelte/store';

   import { CEImpl }        from './CEImpl.js';
   import {FVTTVersion} from "../../../internal/FVTTVersion";

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

   /**
    * Defines a regex to check for the shape of a raw Foundry document UUID.
    *
    * @type {RegExp}
    */
   const s_UUID_REGEX = /(\.).*([a-zA-Z0-9]{16})/;

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument();

   /** @type {boolean} */
   let clickToEdit;

   /** @type {boolean} */
   let editable;

   /** @type {boolean} */
   let editorActive = false;

   /** @type {boolean} */
   let editorButton;

   /** @type {HTMLDivElement} */
   let editorEl;

   /** @type {number} */
   let maxCharacterLength;

   /**
    * Respond to changes in `options.editable`.
    */
   $:
   {
      editable = typeof options.editable === 'boolean' ? options.editable : true;
      if (!editable) { destroyEditor(); }
   }

   /**
    * When `options.editable` & `options.clickToEdit` is true and the editor is not active enable clickToEdit.
    */
   $: clickToEdit = !editorActive && editable &&
       (typeof options.clickToEdit === 'boolean' ? options.clickToEdit : false);

   /**
    * When `options.button` & `options.editable` is true and the editor is not active and `clickToEdit` is false
    * enable the edit button.
    */
   $: editorButton = !editorActive && editable && (typeof options.button === 'boolean' ? options.button : true) &&
       !clickToEdit;

   /**
    * Updates maxCharacterLength; this does not reactively alter content or the active editor content.
    *
    * TODO: It would be nice to provide reactive updates to content when maxCharacterLength changes, but that is
    * problematic w/ mixed text & HTML content without a lot of potential work.
    */
   $: maxCharacterLength = Number.isInteger(options.maxCharacterLength) && options.maxCharacterLength >= 0 ?
       options.maxCharacterLength : void 0;

   /**
    * Respond to changes in `options.document`
    */
   $: if (options.document !== void 0)
   {
      if (!(options.document instanceof foundry.abstract.Document))
      {
         throw new TypeError(`TJSContentEdit error: 'options.document' is not a Foundry document.`);
      }

      if (typeof options.fieldName !== 'string')
      {
         throw new TypeError(
          `TJSContentEdit error: 'options.document' is defined, but 'options.fieldName' is not a string.`);
      }

      // Remove any existing editor if document changes.
      if (options.document !== $doc)
      {
         enrichedContent = '';
         content = '';
         destroyEditor();
      }

      doc.set(options.document);
   }
   else
   {
      // Remove any existing editor if there was a document set, but now it is removed.
      if ($doc)
      {
         enrichedContent = '';
         content = '';
         destroyEditor();
      }

      doc.set(void 0);
   }

   // If there is a valid document then retrieve content from `fieldName` otherwise use `content` string.
   $:
   {
      content = $doc !== void 0 ? foundry.utils.getProperty($doc, options.fieldName) :
       typeof content === 'string' ? content : '';

      // Avoid double trigger of reactive statement as enriching content is async.
      onContentChanged(content);
   }

   /**
    * Separated into a standalone method so applying async value to enriched content doesn't double trigger a reactive
    * statement twice.
    *
    * @param {string}   content - Content prop.
    *
    * @returns {Promise<void>}
    */
   async function onContentChanged(content)
   {
      if (typeof content === 'string')
      {
         enrichedContent = await TextEditor.enrichHTML(content, { async: true, secrets: true });
         dispatch('editor:enrichedContent', { enrichedContent });
      }
   }

   /**
    * When the component is destroyed if the editor is active then save editor content otherwise destroy editor.
    */
   onDestroy(() =>
   {
      // Handle the case when the component is destroyed / IE application closed, but the editor isn't saved.
      if (editorActive)
      {
         saveEditor();
      }
      else
      {
         destroyEditor();
      }
   });

   /**
    * Destroys any active editor.
    */
   function destroyEditor(fireCancel = true)
   {
      if (editorActive)
      {
         // Post on next micro-task to allow any event propagation for `Escape` key to trigger first.
         setTimeout(() => editorActive = false, 0);

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
      editorActive = true;

      // Editor is now active; wait until the template updates w/ new bound `editorEl`.
      await tick();

      // CEImpl.selectAll(editorEl);
      CEImpl.setSelectionEnd(editorEl);

      editorEl.focus();

      dispatch('editor:start');
   }

   /**
    * The editor is always saved on loss of focus / blur unless `options.saveOnBlur` is false. If `saveOnBlur` is false
    * the content editable / editor remains open, but will lose focus. Generally this is undesirable.
    *
    * @param {FocusEvent} event -
    */
   function onBlur(event)
   {
      if (typeof options.saveOnBlur === 'boolean' && !options.saveOnBlur) { return; }

      if (editorActive) { saveEditor(); }
   }

   /**
    * Potentially handles initializing the editor when it is not active and `options.clickToEdit` is true.
    *
    * @param {MouseEvent}   event -
    */
   function onClick(event)
   {
      if (!editorActive && clickToEdit)
      {
         initEditor();
      }
   }

   /**
    * Handles parsing the drop event if it is a valid document content link then it is inserted at cursor.
    *
    * @param {DragEvent}   event -
    */
   async function onDrop(event)
   {
      try
      {
         const linkOptions = options.document instanceof foundry.abstract.Document ? { relative: options.document } :
          {};

         const link = await TextEditor.getContentLink(JSON.parse(event.dataTransfer.getData('text/plain')),
          linkOptions);

         if (typeof link === 'string') { CEImpl.insertTextAtCursor(link); }
      }
      catch (err) { /**/ }
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
         let preventDefault = false;

         if (event.key === 'Escape')
         {
            destroyEditor();
            preventDefault = true;
         }
         else if (event.key === 'Enter' && typeof options.saveOnEnterKey === 'boolean' && options.saveOnEnterKey)
         {
            saveEditor();
            preventDefault = true;
         }
         else if (event.key === 's' && (event.ctrlKey || event.metaKey))
         {
            saveEditor();
            preventDefault = true;
         }

         if (preventDefault)
         {
            event.preventDefault();
            event.stopPropagation();
         }
      }
   }

   /**
    * Inserts any pasted text content at the current cursor position. No rich content is supported / only plain text.
    *
    * For Foundry v10 and above the pasted text is examined for the shape of a raw UUID and if detected attempts to
    * retrieve the document and if found will generate a proper document link from it. You can get the raw UUID by
    * context-clicking the icon in the app header bar for various documents.
    *
    * @param {ClipboardEvent}   event -
    */
   function onPaste(event)
   {
      let text = event.clipboardData.getData('text/plain');

      if (typeof text === 'string')
      {
         // Check if pasted test matches the shape of a UUID. If so do a lookup and if a document is retrieved build
         // a UUID.
         if (FVTTVersion.isV10 && s_UUID_REGEX.test(text))
         {
            const uuidDoc = globalThis.fromUuidSync(text);
            if (uuidDoc)
            {
                text = `@UUID[${text}]{${uuidDoc.name}}`;
            }
         }

         CEImpl.insertTextAtCursor(text);
      }

      event.preventDefault()
   }

   /**
    * Saves the editor contents to the associated document or updates content directly.
    */
   function saveEditor()
   {
      if (editorActive)
      {
         let data = editorEl.innerHTML;
         const saving = content !== data;

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
            if ($doc && options.fieldName)
            {
               $doc.update({ [options.fieldName]: data });
            }
            else // Otherwise save to content.
            {
               content = data;
            }

            dispatch('editor:save', { content: data });
         }

         destroyEditor(!saving);
      }
   }
</script>

{#if editorActive}
    <div bind:this={editorEl}
         class="editor tjs-contenteditable editor-active"
         contenteditable=true
         use:applyStyles={options.styles}
         on:blur={onBlur}
         on:drop|preventDefault|stopPropagation={onDrop}
         on:keydown|capture={onKeydown}
         on:paste|preventDefault={onPaste}>
        {@html content}
    </div>
{:else}
    <div bind:this={editorEl}
         class="editor tjs-contenteditable"
         use:applyStyles={options.styles}>
        {@html enrichedContent}
        {#if editorButton}
            <a class=editor-edit on:click={() => initEditor()}><i class="fas fa-edit"></i></a>
        {/if}
    </div>
{/if}

<style>
    .tjs-contenteditable {
        background: var(--tjs-editor-background, none);
        border: var(--tjs-editor-border, none);
        border-radius: var(--tjs-editor-border-radius, 0);
        height: var(--tjs-editor-height, 100%);
        margin: var(--tjs-editor-margin, 0);
        width: var(--tjs-editor-width, 100%);

        color: var(--tjs-editor-content-color, #000);
        font-family: var(--tjs-editor-content-font-family, "Signika");
        font-size: var(--tjs-editor-content-font-size, 10.5pt);
        line-height: var(--tjs-editor-content-line-height, 1.2);
        padding: var(--tjs-editor-content-padding, 3px 0 0 0);

        /* For Firefox. */
        scrollbar-width: thin;
    }

    /**
     * This class is added to editor when `editorActive` is true and unsets overflow allowing content to be scrollable
     * keeping the menu bar always visible at the top of the component.
     */
    .editor-active {
        box-shadow: var(--tjs-editor-active-box-shadow, unset);
        outline: var(--tjs-editor-active-outline, unset);
        overflow: var(--tjs-editor-active-overflow, auto);
    }

    .editor-edit {
        right: var(--tjs-editor-edit-right, 5px);
        top: var(--tjs-editor-edit-top, 0);
    }
</style>
