<script>
   /**
    * Provides a reactive wrapper for Foundry ProseMirror editor support. Allows editing Foundry document data or
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
    *             Please review all the options defined below {@link TJSProseMirrorOptions}.
    *
    *
    * Notable options passed onto Foundry ProseMirror support.
    * ---------------------------------
    *
    * `options.collaborate` - [boolean: false] When a `document` and `fieldName` is provided set this to true to enable
    *                         collaborative editing.
    *
    * `options.plugins` - [object] An additional set of ProseMirror plugins to load.
    *
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
    * --tjs-editor-overflow - auto
    * --tjs-editor-width - 100%
    *
    * `.editor` HTMLDivElement; properties available when activated:
    * ---------------------------------
    * --tjs-editor-active-box-shadow, unset; Foundry default: 0 0 5px var(--color-shadow-primary)
    * --tjs-editor-active-outline - unset
    * --tjs-editor-active-overflow - unset; When inactive the editor overflow is auto; when active overflow is unset.
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
    * --tjs-editor-content-overflow - auto
    * --tjs-editor-content-padding - 0 0 0 0.25em
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
    * .editor-menu; Defines the toolbar / menu.
    * ---------------------------------
    * --tjs-editor-toolbar-background - rgba(0, 0, 0, 0.1)
    * --tjs-editor-toolbar-border-radius - 6px
    * --tjs-editor-toolbar-box-shadow - 0 2px 2px -2px rgb(34 47 62 / 10%), 0 8px 8px -4px rgb(34 47 62 / 7%)
    * --tjs-editor-toolbar-padding - 2px 0
    * --tjs-editor-toolbar-width - 100%
    */

   /**
    * @typedef {object} TJSProseMirrorOptions
    *
    * @property {boolean}   [button=true] - Provides an edit button to start editing. When button is false editing is
    *           always enabled.
    *
    * @property {string[]}  [classes] - An array of strings to add to the `.editor` element classes. This allows easier
    *           setting of CSS variables across a range of various editor components.
    *
    * @property {boolean}   [clickToEdit=false] - When true the edit button is not shown and a click on the editor
    *           content initializes the editor.
    *
    * @property {foundry.abstract.Document}   [document] - Set to a Foundry document to load and save content from it.
    *           Requires `fieldName` to be set.
    *
    * @property {{ sanitizeWithVideo: function }}   [DOMPurify] - The DOMPurify export from
    *           `@typhonjs-fvtt/runtime/dompurify`. Sanitizes content client side. Note: TinyMCE already does essential
    *           `<script>` sanitization, so this is just an extra option that is available as an extra precaution.
    *
    * @property {boolean}   [editable=true] - Prevents editing and hides button. When set to false any active editor
    *           is cancelled.
    *
    * @property {boolean}   [enrichContent=true] - When set to false content won't be enriched by
    *           `TextEditor.enrichHTML`.
    *
    * @property {string}    [fieldName] - A field name to load and save to / from associated document. IE `a.b.c`.
    *
    * @property {'all'|'end'|'start'}   [initialSelection='start'] - Initial selection range; 'all', 'end' or 'start'.
    *
    * // @property {Object<FontFamilyDefinition>}    [fonts] - An additional object defining module / custom fonts to load
    * //          specific to this editor.
    *
    * // @property {number}    [maxCharacterLength] - When defined as an integer greater than 0 this limits the max
    * //          characters that can be entered.
    *
    * // @property {boolean}   [preventEnterKey=false] - When true this prevents enter key from creating a new line /
    * //          paragraph.
    *
    * // @property {boolean}   [preventPaste=false] - Prevents pasting content into the editor.
    *
    * // @property {boolean}   [saveOnBlur=false] - When true any loss of focus / blur from the editor saves the editor
    * //          state.
    *
    * // @property {boolean}   [saveOnEnterKey=false] - When true saves the editor state when the enter key is pressed.
    * //          This is useful when configuring the editor for single line entry. For an automatic setup for single
    * //          line entry refer to {@link TinyMCEHelper.optionsSingleLine}.
    *
    * @property {Object<string, string>}   [styles] - Additional CSS property names and values to set as inline styles.
    *           This is useful for dynamically overriding any built in styles and in particular setting CSS variables
    *           supported.
    */

   /**
    * @typedef {object} PMEditorExtra - Defines extra data passed to TJSEditorOptions ProseMirror plugin.
    *
    * @property {string} initialSelectionDefault - The default value if `options.initialSelection is not defined.
    */

   import {
      createEventDispatcher,
      onDestroy,
      onMount,
      tick
   }                        from 'svelte';

   import { applyStyles }   from '@typhonjs-svelte/lib/action';

   import { TJSDocument }   from '@typhonjs-fvtt/svelte/store';

   import { applyDevTools } from '@typhonjs-fvtt/svelte-standard/dev-tools/prosemirror';

   import * as Plugins      from '../../../../prosemirror/plugins/index.js';

   /** @type {string} */
   export let content = '';

   /** @type {string} */
   export let enrichedContent = '';

   /**
    * Provides the options object that can be reactively updated. See documentation above.
    *
    * @type {TJSProseMirrorOptions}
    */
   export let options = {};

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument({ delete: onDocumentDeleted });

   /** @type {boolean} */
   let clickToEdit;

   /** @type {boolean} */
   let editable = true;

   /** @type {HTMLDivElement} */
   let editorContentEl;

   /** @type {ProseMirrorEditor} */
   let editor;

   /** @type {boolean} */
   let editorActive = false;

   /** @type {boolean} */
   let editorButton;

   /** @type {HTMLDivElement} */
   let editorEl;

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
    * Respond to changes in `options.document`
    */
   $: if (options.document !== void 0)
   {
      if (!(options.document instanceof globalThis.foundry.abstract.Document))
      {
         throw new TypeError(`TJSProseMirror error: 'options.document' is not a Foundry document.`);
      }

      if (typeof options.fieldName !== 'string')
      {
         throw new TypeError(
          `TJSProseMirror error: 'options.document' is defined, but 'options.fieldName' is not a string.`);
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

         doc.set(void 0);
      }
   }

   // If there is a valid document then retrieve content from `fieldName` otherwise use `content` string.
   $:
   {
      content = $doc !== void 0 ? globalThis.foundry.utils.getProperty($doc, options.fieldName) :
       typeof content === 'string' ? content : '';

      // Avoid double trigger of reactive statement as enriching content is async.
      onContentChanged(content, typeof options.enrichContent === 'boolean' ? options.enrichContent : true);
   }

   onDestroy(() =>
   {
      // Handle the case when the component is destroyed / IE application closed, but the editor isn't saved.
      if (editorActive)
      {
         saveEditor({ remove: typeof options.button === 'boolean' ? options.button : true });
      }
      else
      {
         destroyEditor();
      }
   });

   /**
    * If `options.editable` is true and `options.button` && `options.clickToEdit` is false then start the editor on
    * mount.
    */
   onMount(() => { if (editable && !editorButton && !clickToEdit) { initEditor(); } });

   /**
    * Destroys any active editor.
    */
   function destroyEditor(fireCancel = true)
   {
      if (editor)
      {
         // Capture error that occurs in Foundry ProseMirrorMenu when `prosemirror-dev-tooling` is active.
         try
         {
            editor.destroy();
         }
         catch (err)
         {
            console.warn(
             `Currently there is a flaw in the Foundry ProseMirrorMenu plugin when closing an app window with an ` +
              `active instance of 'prosemirror-dev-tooling'. To avoid this close any active editors before closing ` +
               `the app.`);

            console.error(err);
         }

         editor = void 0;

         // Post on next micro-task to allow any event propagation for `Escape` key to trigger first.
         setTimeout(() => { editorActive = false; }, 0);

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
      // If editor button is enabled then remove the menu / editing interface on save.
      const remove = typeof options.button === 'boolean' ? options.button : true;

      const editorOptions = {
         ...options,

         plugins: {
            ...ProseMirror.defaultPlugins,

            menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
               destroyOnSave: remove,
               onSave: () => saveEditor({ remove })
            }),

            keyMaps: Plugins.TJSKeyMaps.build(ProseMirror.defaultSchema, {
               onSave: () => saveEditor({ remove }),
               onQuit: () => destroyEditor()
            }),

            tjsPasteRawUUID: Plugins.TJSPasteUUID.build(),

            ...(typeof options.plugins === 'object' ? options.plugins : {}),

            tjsEditorOptions: Plugins.TJSEditorOptions.build(options, {
               initialSelectionDefault: 'start'
            })
         }
      };

      editorActive = true;

      // Editor is now active; wait until the template updates w/ new bound `editorContentEl`.
      await tick();

      editor = await ProseMirrorEditor.create(editorContentEl, content, editorOptions);

      applyDevTools(editor.view, { buttonPosition: 'bottom-right'});

      // `.editor-container` div is added automatically; add inline style to set margin to 0.
      const containerEl = editorEl.querySelector('.editor-container');
      if (containerEl) { containerEl.style = 'margin: var(--tjs-editor-container-margin, 0)'; }

      editor.view.focus();

      dispatch('editor:start');
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
            enrichedContent = await TextEditor.enrichHTML(content, { async: true, secrets: true });
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
      options.document = void 0;

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
      if (editorActive && (event.code === 'Escape' || (event.code === 'KeyS' && (event.ctrlKey || event.metaKey))))
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Saves the editor contents to the associated document or updates content directly.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.remove=true] - Removes the editor.
    */
   function saveEditor({ remove = true } = {})
   {
      if (editor)
      {
         if (editor.isDirty())
         {
            let data = ProseMirror.dom.serializeString(editor.view.state.doc);

            // Perform client side sanitization if DOMPurify is available in options.
            // ProseMirror does essential `<script>` based sanitization, so this is just an extra option to provide
            // specific sanitization.
            if (options?.DOMPurify && typeof options?.DOMPurify?.sanitizeWithVideo === 'function')
            {
               data = options.DOMPurify.sanitizeWithVideo(data);
            }

            // Save to document if available
            if ($doc && options.fieldName)
            {
               $doc.update({ [options.fieldName]: data })
            }
            else // Otherwise save to content.
            {
               content = data;
            }

            dispatch('editor:save', { content: data });
         }

         // Remove the editor
         if (remove) { destroyEditor(false); }
      }
   }
</script>

<div bind:this={editorEl}
     class="editor prosemirror tjs-editor {Array.isArray(options.classes) ? options.classes.join(' ') : ''}"
     class:click-to-edit={clickToEdit}
     class:editor-active={editorActive}
     use:applyStyles={options.styles}
     on:click={onClick}
     on:keydown={onKeydown}
     role=presentation>
    {#if editorButton}
        <!-- svelte-ignore a11y-missing-attribute a11y-click-events-have-key-events -->
        <a class=editor-edit on:click={() => initEditor()} role=button><i class="fas fa-edit"></i></a>
    {/if}
    {#if editorActive}
        <div bind:this={editorContentEl} class=editor-content />
    {:else}
        <div class=editor-enriched>
            {@html enrichedContent}
        </div>
    {/if}
</div>

<style>
    .editor {
        background: var(--tjs-editor-background, none);
        border: var(--tjs-editor-border, none);
        border-radius: var(--tjs-editor-border-radius, 0);
        height: var(--tjs-editor-height, 100%);
        margin: var(--tjs-editor-margin, 0);
        overflow: var(--tjs-editor-overflow, auto);
        width: var(--tjs-editor-width, 100%);

        /* For Firefox. */
        scrollbar-width: thin;
    }

    /**
     * This class is added to editor when `editorActive` is true and unsets overflow allowing content to be scrollable
     * keeping the menu bar always visible at the top of the component.
     */
    .editor-active {
        box-shadow: var(--tjs-editor-active-box-shadow);
        outline: var(--tjs-editor-active-outline);
        overflow: var(--tjs-editor-active-overflow, unset);
    }

    /**
     * Defines cursor and box-shadow / outline when the editor is inactive and hovered.
     */
    .tjs-editor:not(.editor-active):hover {
        box-shadow: var(--tjs-editor-inactive-box-shadow-hover);
        outline: var(--tjs-editor-inactive-outline-hover);
    }

    /**
     * Defines cursor when the editor is not active, but configured for click to edit. Give the user some indication
     * via showing the text cursor across the whole editor element.
     */
    .tjs-editor.click-to-edit:not(.editor-active):hover {
        cursor: var(--tjs-editor-inactive-cursor-hover, text);
    }

    .editor-content {
        overflow: var(--tjs-editor-content-overflow, auto);
        padding: var(--tjs-editor-content-padding, 0 0 0 0.25em);

        /* For Firefox. */
        scrollbar-width: thin;
    }

    .editor-edit {
        right: var(--tjs-editor-edit-button-right, 5px);
        top: var(--tjs-editor-edit-button-top, 0);
    }

    .editor-enriched {
        padding: var(--tjs-editor-content-padding, 0 0 0 0.25em);
    }

    /* Controls whether the editor content text is selectable when the editor is inactive. */
    .tjs-editor:not(.editor-active) .editor-enriched {
        user-select: var(--tjs-editor-inactive-user-select-hover, text);
    }

    /* Don't add an initial margin top to first paragraph element in `.editor-content`. */
    .tjs-editor .editor-container .editor-content :global(p:first-of-type) {
        margin-top: 0;
    }

    .tjs-editor .editor-enriched :global(p:first-of-type) {
        margin-top: 0;
    }

    /* Provides global styles scoped to `.tjs-editor` for dynamic `.editor-menu` element */
    .tjs-editor :global(.editor-menu) {
        background: var(--tjs-editor-toolbar-background, rgba(0, 0, 0, 0.1));
        border-radius: var(--tjs-editor-toolbar-border-radius, 6px);
        box-shadow: var(--tjs-editor-toolbar-box-shadow, 0 2px 2px -2px rgb(34 47 62 / 10%), 0 8px 8px -4px rgb(34 47 62 / 7%));
        margin-bottom: 0.25em;
        padding: var(--tjs-editor-toolbar-padding, 2px 0);
        width: var(--tjs-editor-toolbar-width, 100%);

        transition: box-shadow 500ms ease-in-out;
    }

    /* Removes the awkward 1rem padding from core */
    .tjs-editor :global(.prosemirror.editing-source textarea) {
        padding: 0;
    }
</style>
