<script>
   /**
    * Provides a reactive wrapper for Foundry CodeMirror editor support. Allows editing Foundry document data or
    * directly from content prop.
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
    * `.editor` HTMLDivElement:
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
    * w/ this initial value.
    *
    * @type {string}
    */
   let initialEditContent = '';

   /** @type {string} */
   let keyCode;

   /** @type {boolean} */
   let keyFocused = false;

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
   $: editorButton = !editorActive && editable && (typeof options?.button === 'boolean' ? options.button : true) &&
    !clickToEdit;

   /**
    * Allows another KeyboardEvent.code to be used to activate the editor.
    */
   $: keyCode = typeof options?.keyCode === 'string' ? options.keyCode : 'Enter';

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

      // TODO: Likely cleanup / destroy TJSDocument here.
   });

   /**
    * If `editable` is true and `options.button` && `options.clickToEdit` is false then start the editor on
    * mount.
    */
   onMount(() =>
   {
      // TODO: Setup initial CM web component settings.

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
      console.log(`!!! TJSCodeMirror - destroyEditor - cancelled: ${cancelled}`);

      if (editorActive)
      {
         editorActive = false;

         if (cancelled)
         {
            if (codeMirrorEl) { codeMirrorEl._setValue(initialEditContent); }

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
      console.log(`!!! TJSCodeMirror - initEditor`);

      initialEditContent = content;

      editorActive = true;

      // Editor is now active; wait until the template updates.
      await tick();

      codeMirrorEl.scrollTo(0, 0);

      // Focus CM editor.
      codeMirrorEl.querySelector('.cm-content')?.focus();

      dispatch('editor:start');
   }

   /**
    * Potentially handles initializing the editor when it is not active and `options.clickToEdit` is true.
    */
   function onClick()
   {
      console.log(`!!! TJSCodeMirror - onClick - 0 - clickToEdit: ${clickToEdit}`);

      if (!editorActive && clickToEdit)
      {
         initEditor();
      }
   }

   /**
    * Separated into a standalone method.
    *
    * @param {string}   content - Content prop.
    */
   function onContentChanged(content)
   {
      console.log(`!!! TJSCodeMirror - onContentChanged - content: `, content);

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
      console.log(`!!! TJSCodeMirror - onDocumentDeleted - document: `, document);

      if (isObject(options)) { options.document = void 0; }

      destroyEditor();

      dispatch('editor:document:deleted', { document });

      content = '';
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
    * Saves the editor contents to the associated document or updates content directly.
    */
   function saveEditor()
   {
      console.log(`!!! TJSCodeMirror - saveEditor`);

      if (editorActive)
      {
         const editContent = codeMirrorEl._getValue();

         console.log(`!!! TJSCodeMirror - saveEditor - editContent: `, editContent);

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
     on:click={onClick}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     role=textbox
     tabindex=0>
   {#if editorButton}
      <!-- svelte-ignore a11y-missing-attribute a11y-click-events-have-key-events -->
      <a class=editor-edit on:click={() => initEditor()} role=button tabindex=-1><i class="fas fa-edit"></i></a>
   {/if}
   <code-mirror bind:this={codeMirrorEl} class="source-editor" managed disabled></code-mirror>
</div>

<style>
   .tjs-editor {
      display: var(--tjs-editor-display, flex);
      flex-direction: var(--tjs-editor-flex-direction, column);
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

   /* Controls whether the editor content text is selectable when the editor is inactive. */
   .tjs-editor:not(.editor-active) .source-editor {
      user-select: var(--tjs-editor-inactive-user-select-hover, text);
   }
</style>
