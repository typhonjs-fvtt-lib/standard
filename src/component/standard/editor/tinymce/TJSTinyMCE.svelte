<script>
   /**
    * Provides a reactive wrapper for Foundry ProseMirror editor support. Allows editing Foundry document data or
    * directly from content prop. Automatic HTML enrichment occurs for the content when saved.
    *
    * There are no required props, but the following are available to set.
    * `content` - Provides an initial content string; you can bind to `content` from a parent component to get reactive
    *             updates when `content` changes.
    *
    * `options` - Defines the options object for this component and is passed on to the Foundry ProseMirror support.
    *
    * `options.button` - [default: true] Provides an edit button to start editing. When button is false editing is
    *                    always enabled.
    *
    * `options.editable` - [default: true] Prevents editing and hides button. When set to false any active editor is
    *                     cancelled.
    *
    * `options.document` - Set to a Foundry document to load and save content from it. Requires `fieldName` to be set.
    *
    * `options.DOMPurify` - The DOMPurify export from `@typhonjs-fvtt/runtime/dompurify`. Sanitizes content client side.
    *                       Note: ProseMirror already does essential `<script>` sanitization, so this is just an extra
    *                       option that is available as an extra precaution.
    *
    * `options.fieldName` - [string] A field name to load and save to / from associated document. IE `a.b.c`.
    *
    * Notable options passed onto TinyMCE instance.
    * ---------------------------------
    *
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
    * When not editing editor overflow is set to auto, but when active overflow is unset:
    * --tjs-editor-active-overflow - unset
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
    * --tjs-editor-edit-right - 5px
    * --tjs-editor-edit-top - 0
    */

   import {
      createEventDispatcher,
      onDestroy,
      onMount,
      tick
   }                        from 'svelte';

   import { TJSDocument }   from '@typhonjs-fvtt/svelte/store';

   /** @type {string} */
   export let content = '';

   /** @type {string} */
   export let enrichedContent = '';

   /**
    * Provides the options object that can be reactively updated. See documentation above.
    *
    * @type {{ button: boolean, editoble: boolean, document: foundry.abstract.Document, DOMPurify: { sanitizeWithVideo: function }, fieldName: string, mceConfig: object }}
    */
   export let options = {};

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument();

   let editable = true;

   /** @type {HTMLDivElement} */
   let editorContentEl;

   /** @type {Editor} TinyMCE Editor */
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
    * When `options.button` & `options.editable` is true and the editor is not enable the edit button.
    */
   $: editorButton = !editorActive && editable && (typeof options.button === 'boolean' ? options.button : true);

   /**
    * Respond to changes in `options.document`
    */
   $: if (options.document !== void 0)
   {
      if (!(options.document instanceof foundry.abstract.Document))
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
      if (content)
      {
         enrichedContent = await TextEditor.enrichHTML(content, { async: true });
         dispatch('editor:enrichedContent', { enrichedContent });
      }
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
    * If `options.editable` is true and `options.button` is false then start the editor on mount.
    */
   onMount(() => { if (editable && !editorButton) { initEditor(); } });

   /**
    * Destroys any active editor.
    */
   function destroyEditor(fireCancel = true)
   {
      if (editor)
      {
console.log(`! TJSTinyMCE - destroyEditor - 0`)
         setTimeout(() =>
         {
            editor.destroy();
            editorContentEl.innerText = '';

            editor = void 0;

            console.log(`! TJSTinyMCE - destroyEditor - 1`)
            // Post on next micro-task to allow any event propagation for `Escape` key to trigger first.
            setTimeout(() =>
            {
               editorActive = false;
               console.log(`! TJSTinyMCE - destroyEditor - next micro-task - editorFalse`)
            }, 0);

            if (fireCancel) { dispatch('editor:cancel'); }

            console.log(`! TJSTinyMCE - destroyEditor - 2`)
         }, 0);
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
      const remove = editorButton;

      const mceConfig = {
         ...(options.mceConfig ?? {}),
         engine: 'tinymce',
         target: editorContentEl,
         save_onsavecallback: () => saveEditor(),
         height: '100%'
      }

      editorActive = true;

      // Editor is now active; wait until the template updates w/ new bound `editorContentEl`.
      await tick();

      editor = await TextEditor.create(mceConfig, content);

      // Close the editor on 'esc' key pressed; reset content; invoke the registered Foundry save callback with
      // a deferral via setTimeout.
      editor.on('keydown', ((e) =>
      {
         if (e.keyCode === 27)
         {
            editor.resetContent(content);
            setTimeout(() => saveEditor(), 0);
         }
      }));

      // const mceToxEl = editorEl.querySelector('.tox-tinymce');
      // if (mceToxEl)
      // {
      //    mceToxEl.style.borderRadius = '0'
      // }
      //
      // const mceEditorHeaderEl = editorEl.querySelector('.tox-editor-header');
      // if (mceEditorHeaderEl)
      // {
      //    mceEditorHeaderEl.style = 'background: none; padding: 0; width: var(--tjs-editor-toolbar-width, 100%)';
      //    // mceEditorHeaderEl.style.background = 'none'
      //    // mceEditorHeaderEl.style.padding = '0';
      //    // mceEditorHeaderEl.style.width = 'var(tjs-editor-toolbar-width, 100%)';
      // }
      //
      // const mceToolbarOverlordEl = editorEl.querySelector('.tox-toolbar-overlord')
      // if (mceToolbarOverlordEl)
      // {
      //    mceToolbarOverlordEl.style.background = 'none';
      //
      //    const mceToolbarPrimaryEl = mceToolbarOverlordEl.querySelector('.tox-toolbar__primary');
      //    if (mceToolbarPrimaryEl)
      //    {
      //       mceToolbarPrimaryEl.style = 'background: var(--tjs-editor-toolbar-background, rgba(0, 0, 0, 0.1)); ' +
      //        'border-radius: var(--tjs-editor-toolbar-border-radius, 6px)';
      //
      //       // mceToolbarPrimaryEl.style.background = 'var(tjs-editor-toolbar-background, rgba(0, 0, 0, 0.1))';
      //       // mceToolbarPrimaryEl.style.borderRadius = 'var(tjs-editor-toolbar-border-radius, 6px)';
      //    }
      // }


      dispatch('editor:start');
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
      if (editorActive && (event.key === 'Escape' || (event.key === 's' && event.ctrlKey)))
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   function saveEditor({ remove = typeof options.button === 'boolean' ? options.button : true } = {})
   {
      // Remove the editor
      if (editor)
      {
console.log(`! TJSTinyMCE - saveEditor - 0`)
         let data = editor.getContent();

         // editor.isDirty() doesn't appear to work as desired.
         if (data !== content)
         {
console.log(`! TJSTinyMCE - saveEditor - 1`)
            let data = editor.getContent();

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

console.log(`! TJSTinyMCE - saveEditor - 2`)

            dispatch('editor:save', { content: data });
         }

         if (remove) { destroyEditor(false); }
      }
   }
</script>

<div bind:this={editorEl}
     class="editor tinymce tjs-editor"
     class:editor-active={editorActive}
     on:keydown={onKeydown}>
    {#if editorButton}
        <a class=editor-edit on:click={() => initEditor()}><i class="fas fa-edit"></i></a>
    {/if}
    <div bind:this={editorContentEl}
         class=editor-content>
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
        margin: var(--tjs-editor-margin, 0);
        width: var(--tjs-editor-width, 100%);

        /* For Firefox. */
        scrollbar-width: thin;
    }

    .editor-content {
        padding: var(--tjs-editor-content-padding, 0 0 0 0.25em);
    }

    /**
     * This class is added to editor when `editorActive` is true and unsets overflow allowing content to be scrollable
     * keeping the menu bar always visible at the top of the component.
     */
    .editor-active {
        overflow: var(--tjs-editor-active-overflow, hidden);
    }

    .editor-edit {
        right: var(--tjs-editor-edit-right, 5px);
        top: var(--tjs-editor-edit-top, 0);
    }

    .tjs-editor :global(.tox-tinymce) {
        border-radius: 0;
    }

    .tjs-editor :global(.tox:not(.tox-tinymce-inline) .tox-editor-header) {
        background: none;
        padding: 0;
        width: var(--tjs-editor-toolbar-width, 100%);
    }

    .tjs-editor :global(.tox-toolbar-overlord) {
        background: none;
    }

    .tjs-editor :global(.tox-toolbar__primary) {
        background: var(--tjs-editor-toolbar-background, rgba(0, 0, 0, 0.1));
        border-radius: var(--tjs-editor-toolbar-border-radius, 6px);
    }

    .tjs-editor :global(.tox .tox-toolbar__group) {
        width: auto;
        padding: 0 2px;
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn) {
        padding: 0;
        margin: 2px 0;
        min-width: 34px;
        width: fit-content;
    }

    .tjs-editor :global(.tox.tox-tinymce .tox-tbtn.tox-tbtn--select) {
        font-size: 14px;
    }
</style>
