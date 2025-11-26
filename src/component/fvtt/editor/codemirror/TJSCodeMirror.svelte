<script>
   /**
    * Provides a reactive wrapper for Foundry CodeMirror editor support. Allows editing Foundry document data or
    * directly from `content` prop.
    *
    * ### Props
    * There are no required props, but the following are available to set:
    *
    * - `content` - Provides an initial content string; you can bind to `content` from a parent component to get
    * reactive updates when `content` changes. Two-way binding. `content` is updated after editing finishes.
    *
    * - `options` - Defines the options object for this component some of which are passed onto the Foundry CodeMirror
    * support. Please review all the options defined below {@link TJSCodeMirrorOptions}.
    *
    * ### Events
    *
    * There are five events fired when the editor is canceled, saved, and started:
    *
    * - `editor:cancel` - Fired when editing is canceled by a user action or reactive response to document changes.
    *
    * - `editor:document:deleted` - Fired when the edited document is deleted. Access the document from
    *  `event.detail.document`.
    *
    * - `editor:save` - Fired when editing is saved. Access the content from `event.detail.content`.
    *
    * - `editor:start` - Fired when editing is started.
    *
    * ### CSS Variables
    *
    * The following CSS variables control the associated styles with the default values:
    *
    * ```
    * `.tjs-editor` HTMLDivElement:
    * ---------------------------------
    * --tjs-editor-background - none
    * --tjs-editor-border - none
    * --tjs-editor-border-radius - 0
    * --tjs-editor-height - 100%
    * --tjs-editor-margin - 0
    * --tjs-editor-overflow - auto
    * --tjs-editor-transition
    * --tjs-editor-width - 100%
    *
    * `.tjs-editor` HTMLDivElement; properties available when activated:
    * ---------------------------------
    * --tjs-editor-active-box-shadow, unset
    * --tjs-editor-active-outline - unset
    * --tjs-editor-active-overflow - unset
    *
    * `.editor` HTMLDivElement; properties available when inactive, but manually focused:
    * ---------------------------------
    * --tjs-editor-inactive-box-shadow-focus-visible - fallback: --tjs-default-box-shadow-focus-visible
    * --tjs-editor-inactive-outline-focus-visible - fallback: --tjs-default-outline-focus-visible; default: revert
    * --tjs-editor-inactive-transition-focus-visible - fallback: --tjs-default-transition-focus-visible
    *
    * `.editor` HTMLDivElement; properties available when inactive, but hovered:
    * ---------------------------------
    * --tjs-editor-inactive-box-shadow-hover - unset
    * --tjs-editor-inactive-outline-hover - unset
    *
    * .editor-edit; Defines the position of the edit button from top / right absolute positioning:
    * ---------------------------------
    * --tjs-editor-edit-button-right - 3px
    * --tjs-editor-edit-button-top - 3px
    * ```
    * @componentDocumentation
    */

   import {
      createEventDispatcher,
      getContext,
      onDestroy,
      onMount,
      tick }               from '#svelte';

   import { writable }     from '#svelte/store';

   import { applyStyles }  from '#runtime/svelte/action/dom/style';
   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isDocument }   from '#runtime/types/fvtt-shim/guard';
   import {
      isObject,
      safeAccess }         from '#runtime/util/object';
   import { CrossRealm }   from '#runtime/util/realm';

   /** @type {string} */
   export let content = '';

   /**
    * Provides the options object that can be reactively updated. See documentation above.
    *
    * @type {import('./index').TJSCodeMirrorOptions}
    */
   export let options = {};

   const s_CM_ALLOWED_LANGUAGES = new Set(['html', 'javascript', 'json', 'markdown', 'plain']);

   const application = getContext('#external')?.application;

   const applicationActiveWindow = application?.reactive?.storeUIState?.activeWindow ?? writable(globalThis);

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument({ delete: onDocumentDeleted });

   /** @type {Window} */
   let activeWindow = $applicationActiveWindow;

   /** @type {boolean} */
   let clickToEdit;

   /** @type {HTMLCodeMirrorElement} */
   let codeMirrorEl;

   /** @type {boolean} */
   let editable = true;

   /** @type {boolean} */
   let editorActive = false;

   /** @type {boolean} */
   let editorButton;

   /** @type {HTMLDivElement} */
   let editorEl;

   /**
    * Stores the initial editor content when editing begins. If editing is cancelled the CM web component is updated
    * w/ this initial value unless content changed externally.
    *
    * @type {string}
    */
   let initialEditContent = '';

   /**
    * CM indentation.
    *
    * @type {number}
    */
   let indent = 0;

   /** @type {string} */
   let keyCode;

   /** @type {boolean} */
   let keyFocused = false;

   /**
    * CM language support.
    *
    * @type {string}
    */
   let language = 'plain';

   /**
    * CM no wrap option.
    *
    * @type {boolean}
    */
   let nowrap = false;

   /**
    * When the active window changes the editor needs to be saved for better PM / plugin support.
    */
   $: if (activeWindow !== $applicationActiveWindow)
   {
      if (editorActive) { saveEditor(); }
      activeWindow = $applicationActiveWindow;
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
   $: editorButton = editable && (typeof options?.button === 'boolean' ? options.button : true) &&
    !clickToEdit;

   /**
    * CM line indentation.
    */
   $:
   {
      indent = Number.isInteger(options?.indent) && options?.indent >= 0 && options?.indent <= 8 ? options.indent : 0;
      if (codeMirrorEl) { codeMirrorEl.indent = indent; }
   }

   /**
    * CM line indentation.
    */
   $:
   {
      language = typeof options?.language === 'string' && s_CM_ALLOWED_LANGUAGES.has(options?.language) ? options.language : 'plain';
      if (codeMirrorEl) { codeMirrorEl.language = language; }
   }

   /**
    * Allows another KeyboardEvent.code to be used to activate the editor.
    */
   $: keyCode = typeof options?.keyCode === 'string' ? options.keyCode : 'Enter';

   /**
    * CM no wrap support.
    */
   $:
   {
      nowrap = typeof options?.nowrap === 'boolean' ? options.nowrap : false;
      if (codeMirrorEl) { codeMirrorEl.nowrap = nowrap; }
   }

   /**
    * Respond to changes in `options.document`
    */
   $: if (options?.document !== void 0)
   {
      if (!isDocument(options.document))
      {
         throw new TypeError(`TJSCodeMirror error: 'options.document' is not a Foundry document.`);
      }

      if (typeof options?.fieldName !== 'string')
      {
         throw new TypeError(
          `TJSCodeMirror error: 'options.document' is defined, but 'options.fieldName' is not a string.`);
      }

      if (options.document !== $doc)
      {
         // Remove any existing editor if document changes.
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
         content = '';

         destroyEditor();

         doc.set(void 0);
      }
   }

   // If there is a valid document then retrieve content from `fieldName` otherwise use `content` string.
   $:
   {
      content = $doc !== void 0 && typeof options?.fieldName === 'string' ? safeAccess($doc, options.fieldName) :
       typeof content === 'string' ? content : '';

      // Avoid double trigger of reactive statement as enriching content is async.
      onContentChanged(content);
   }

   $: if (codeMirrorEl) { codeMirrorEl.disabled = !editorActive; }

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

      // Ensure TJSDocument is unlinked.
      doc.destroy();
   });

   /**
    * If `editable` is true and `options.button` && `options.clickToEdit` is false then start the editor on
    * mount.
    */
   onMount(() =>
   {
      codeMirrorEl.language = language;
      codeMirrorEl.indent = indent;
      codeMirrorEl.nowrap = nowrap;

      onContentChanged(content);

      if (editable && !editorButton && !clickToEdit) { initEditor(); }
   });

   /**
    * Destroys any active editor.
    *
    * @param {object} [options] -
    *
    * @param {boolean} [options.cancelled] - When true, reset initial content before editing / fire cancelled event.
    */
   function destroyEditor({ cancelled = true } = {})
   {
      if (editorActive)
      {
         editorActive = false;

         if (cancelled)
         {
            // There is a possibility that document data / content could have changed externally.
            const actualContent = initialEditContent !== content ? content : initialEditContent;

            if (codeMirrorEl) { codeMirrorEl._setValue(actualContent); }

            initialEditContent = '';

            dispatch('editor:cancel');
         }

         // If the editor was initialized by keyboard action then focus it after a short delay to allow the template
         // to update.
         if (keyFocused)
         {
            keyFocused = false;

            setTimeout(() =>
            {
               if (CrossRealm.browser.isHTMLElement(editorEl) && editorEl?.isConnected) { editorEl.focus(); }
            }, 100);
         }
      }
   }

   /**
    * Initializes editor.
    *
    * @returns {Promise<void>}
    */
   async function initEditor()
   {
      initialEditContent = typeof content === 'string' ? content : '';

      editorActive = true;

      // Editor is now active; wait until the template updates.
      await tick();

      codeMirrorEl.scrollTo(0, 0);

      // Focus CM editor.
      codeMirrorEl.querySelector('.cm-content')?.focus();

      dispatch('editor:start');
   }

   /**
    * Separated into a standalone method.
    *
    * @param {string}   content - Content prop.
    */
   function onContentChanged(content)
   {
      if (typeof content !== 'string') { return; }

      if (!editorActive && codeMirrorEl)
      {
         codeMirrorEl._setValue(content);
      }
   }

   /**
    * Handles cleaning up the editor state after any associated document has been deleted.
    *
    * @param {fvtt.ClientDocument} document - The deleted document.
    */
   function onDocumentDeleted(document)
   {
      if (isObject(options)) { options.document = void 0; }

      destroyEditor();

      dispatch('editor:document:deleted', { document });

      content = '';
   }

   /**
    * Handles edit / save button depending on editor state.
    */
   function onEditSaveButton()
   {
      if (editorActive)
      {
         saveEditor();
      }
      else
      {
         initEditor();
      }
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
      if (editorActive)
      {
         if (event.code === 'Escape')
         {
            destroyEditor();

            event.preventDefault();
            event.stopPropagation();
         }
         else if ((event.code === 'KeyS' && (event.ctrlKey || event.metaKey)))
         {
            saveEditor();

            event.preventDefault();
            event.stopPropagation();
         }
      }
      else
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
   }

   /**
    * Potentially handles initializing the editor when it is not active and `options.clickToEdit` is true.
    */
   function onPointerdown()
   {
      if (!editorActive && clickToEdit)
      {
         initEditor();
      }
   }

   /**
    * Saves the editor contents to the associated document or updates content directly.
    */
   function saveEditor()
   {
      if (editorActive)
      {
         const editContent = codeMirrorEl._getValue();

         // Save to document if available
         if ($doc && typeof options?.fieldName === 'string')
         {
            $doc.update({ [options.fieldName]: editContent })
         }
         else // Otherwise save to content.
         {
            content = editContent;
         }

         dispatch('editor:save', { content: editContent });

         destroyEditor({ cancelled: false });
      }
   }
</script>

<!-- Passing enrichedContent to the mount secret buttons action causes it to run when the content changes. -->
<div bind:this={editorEl}
     class="tjs-editor tjs-code-mirror {Array.isArray(options?.classes) ? options.classes.join(' ') : ''}"
     class:click-to-edit={clickToEdit}
     class:editor-active={editorActive}
     use:applyStyles={options?.styles}
     on:pointerdown={onPointerdown}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     role=textbox
     tabindex=0>
   {#if editorButton}
      <!-- svelte-ignore a11y-missing-attribute a11y-click-events-have-key-events -->
      <a class=editor-edit on:click={onEditSaveButton} role=button tabindex=-1><i class={`fas ${editorActive ? 'fa-floppy-disk-circle-arrow-right' : 'fa-edit'}`}></i></a>
   {/if}
   <code-mirror bind:this={codeMirrorEl} class="source-editor" managed disabled></code-mirror>
</div>

<style>
   .tjs-editor {
      display: var(--tjs-editor-display, flex);
      flex-direction: var(--tjs-editor-flex-direction, column);

      /* Note CM editor has Foundry style for min-height as well. */
      min-height: var(--tjs-editor-min-height, 150px);

      background: var(--tjs-editor-background, none);
      border: var(--tjs-editor-border, none);
      border-radius: var(--tjs-editor-border-radius, 0);
      height: var(--tjs-editor-height, 100%);
      margin: var(--tjs-editor-margin, 0);
      outline-offset: var(--tjs-editor-outline-offset, 0.25em);
      overflow: var(--tjs-editor-overflow, auto);
      position: relative;
      transition: var(--tjs-editor-transition);
      width: var(--tjs-editor-width, 100%);
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
   .tjs-editor:not(.editor-active):focus-visible {
      box-shadow: var(--tjs-editor-inactive-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
      outline: var(--tjs-editor-inactive-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
      transition: var(--tjs-editor-inactive-transition-focus-visible, var(--tjs-default-transition-focus-visible));
   }

   /**
    * Override Foundry core style for click to edit / pointer.
    */
   .tjs-editor:not(.editor-active).click-to-edit code-mirror:disabled :global(.cm-editor) {
      cursor: var(--tjs-cursor-text, text);
   }

   /**
    * Defines cursor and box-shadow / outline when the editor is inactive and hovered, but not manually focused.
    */
   .tjs-editor:not(.editor-active):not(:focus-visible):hover {
      box-shadow: var(--tjs-editor-inactive-box-shadow-hover);
      outline: var(--tjs-editor-inactive-outline-hover);
   }

   .editor-edit {
      right: var(--tjs-editor-edit-button-right, 3px);
      top: var(--tjs-editor-edit-button-top, 3px);
      z-index: 10;

      display: none;
      font-size: 1.25em;
      position: absolute;
      background: var(--tjs-editor-edit-button-background, var(--menu-background));
      border: 1px solid var(--color-border-dark-1);
      border-radius: 4px;
      padding: 1px 2px;
      box-shadow: 0 0 1px var(--color-shadow-dark);
   }

   .tjs-editor:hover .editor-edit {
      display: inline-block;
   }
</style>
