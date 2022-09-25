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
    * `options.fieldName` - [string] A field name to load and save to / from associated document. IE `a.b.c`.
    *
    * Notable options passed onto Foundry ProseMirror support.
    * ---------------------------------
    *
    * `options.collaborate` - [boolean: false] When a `document` and `fieldName` is provided set this to true to enable
    *                         collaborative editing.
    *
    * `options.plugins` - [object] An additional set of plugins to load.
    *
    *
    * Events: There are three events fired when the editor is canceled, saved, and started.
    * ---------------------------------
    * `editor:cancel` - Fired when editing is canceled by a user action or reactive response to document changes.
    * `editor:save` - Fired when editing is saved. You can access the content from `event.detail.content`.
    * `editor:start` - Fired when editing is started.
    *
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
    *
    * .editor-edit; Defines the position of the edit button from top / right absolute positioning:
    * --tjs-editor-edit-right - 5px
    * --tjs-editor-edit-top - 0
    */

   import {
      createEventDispatcher,
      onDestroy,
      onMount,
      tick
   }                        from 'svelte';

   import { TJSDocument }   from '@typhonjs-fvtt/runtime/svelte/store';

   import { applyDevTools } from 'prosemirror-dev-toolkit';

   import * as Plugins      from '../../standard/editor/plugins';

   export let content = '';
   export let options = {};

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument();

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

   let enrichedContent = '';

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
   $: content = $doc !== void 0 ? foundry.utils.getProperty($doc, options.fieldName) :
    typeof content === 'string' ? content : '';

   // Enrich content when it changes.
   $: if (content) { TextEditor.enrichHTML(content, { async: true }).then((enriched) => enrichedContent = enriched); }

   onDestroy(() => destroyEditor());

   /**
    * If `options.editable` is true and `options.button` is false then start the editor on mount.
    */
   onMount(() =>
   {
      if (editable && !editorButton) { initEditor(); }
   });

   /**
    * Destroys any active editor.
    */
   function destroyEditor(fireCancel = true)
   {
      if (editor)
      {
         editor.destroy();
         editor = void 0;
         editorActive = false;

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
      const remove = editorButton;

      const editorOptions = {
         ...options,

         plugins: {
            menu: Plugins.TJSProseMirrorMenu.build(ProseMirror.defaultSchema, {
               destroyOnSave: remove,
               onSave: () => saveEditor({ remove })
            }),
            keyMaps: Plugins.TJSProseMirrorKeyMaps.build(ProseMirror.defaultSchema, {
               onSave: () => saveEditor({ remove }),
               onQuit: () => destroyEditor()
            }),
            ...options.plugins
         }
      };

      editorActive = true;

      // Editor is now active; wait until the template updates w/ new bound `editorContentEl`.
      await tick();

      editor = await ProseMirrorEditor.create(editorContentEl, content, editorOptions);

      applyDevTools(editor.view);

      // `.editor-container` div is added automatically; add inline style to set margin to 0.
      const containerEl = editorEl.querySelector('.editor-container');
      if (containerEl) { containerEl.style = 'margin: var(--tjs-editor-container-margin, 0)'; }

      dispatch('editor:start');
   }

   function saveEditor({ remove = true } = {})
   {
      // Remove the editor
      if (remove && editor)
      {
         if (editor.isDirty())
         {
            const data = ProseMirror.dom.serializeString(editor.view.state.doc);

            // Save to document if available
            if ($doc && options.fieldName)
            {
               $doc.update({ [options.fieldName]: data })
            }
            else // Otherwise save to content.
            {
               content = data;
            }

            dispatch('editor:save', { content });
         }

         destroyEditor(false);
      }
   }
</script>

<div bind:this={editorEl}
     class="editor prosemirror"
     class:editor-active={editorActive}>
    {#if editorButton}
        <a class=editor-edit on:click={() => initEditor()}><i class="fas fa-edit"></i></a>
    {/if}
    {#if editorActive}
        <div bind:this={editorContentEl}
             class=editor-content
             data-edit=text
             data-engine=prosemirror
             data-collaborate=false>
        </div>
    {:else}
        {@html enrichedContent}
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
    }

    /**
     * This class is added to editor when `editorActive` is true and unsets overflow allowing content to be scrollable
     * keeping the menu bar always visible at the top of the component.
     */
    .editor-active {
        overflow: var(--tjs-editor-active-overflow, unset);
    }

    .editor-content {
        overflow: var(--tjs-editor-content-overflow, auto);
    }

    .editor-edit {
        right: var(--tjs-editor-edit-right, 5px);
        top: var(--tjs-editor-edit-top, 0);
    }
</style>
