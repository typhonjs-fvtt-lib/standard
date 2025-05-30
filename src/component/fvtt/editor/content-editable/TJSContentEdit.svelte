<script>
   /**
    * Provides a reactive wrapper for direct content editable elements. Allows editing Foundry document data or
    * directly from content prop. Automatic HTML enrichment occurs for the content when saved.
    *
    * ### Props
    * There are no required props, but the following are available to set:
    * - `content` - Provides an initial content string; you can bind to `content` from a parent component to get reactive
    *             updates when `content` changes. Two-way binding.
    *
    * - `enrichedContent` - Provides the enriched content via {@link TextEditor.enrichHTML} when `content` changes.
    *             You can bind to `enrichedContent` from a parent component to get reactive updates though it is not
    *             recommended to change `enrichedContent` externally. One-way binding.
    *
    * - `options` - Defines the options object for this component. Please review all the options defined below
    *             {@link TJSContentEditOptions}.
    *
    * ### Events
    * There are five events fired when the editor is canceled, saved, and started:
    *
    * - `editor:cancel` - Fired when editing is canceled by a user action or reactive response to document changes.
    *
    * - `editor:document:deleted` - Fired when the edited document is deleted. Access the document from
    *  `event.detail.document`.
    *
    * - `editor:enrichedContent` - Fired when content is enriched. Access enriched content from
    *  `event.detail.enrichedContent`.
    *
    * - `editor:save` - Fired when editing is saved. Access the content from `event.detail.content`.
    *
    * - `editor:start` - Fired when editing is started.
    *
    * ### CSS Variables
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
    * `.editor` HTMLDivElement; when editing - the content overflow is set to auto:
    * ---------------------------------
    * --tjs-editor-content-color - #000
    * --tjs-editor-content-font-family - "Signika"
    * --tjs-editor-content-font-size - 10.5pt
    * --tjs-editor-content-line-height - 1.2
    * --tjs-editor-content-overflow - auto
    * --tjs-editor-content-padding - 0
    *
    * .editor-edit; Defines the position of the edit button from top / right absolute positioning:
    * ---------------------------------
    * --tjs-editor-edit-button-right - 5px
    * --tjs-editor-edit-button-top - 0
    * ```
    * @componentDocumentation
    */

   import {
      createEventDispatcher,
      onDestroy,
      tick }               from '#svelte';

   import { applyStyles }  from '#runtime/svelte/action/dom/style';
   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';
   import { isDocument }   from '#runtime/types/fvtt-shim/guard';
   import { CrossWindow }  from '#runtime/util/browser';

   import {
      isObject,
      safeAccess }         from '#runtime/util/object';

   import { CEImpl }       from './CEImpl.js';

   import { createMountRevealSecretButtons } from '../common/secrets/createMountRevealSecretButtons.js';

   /** @type {string} */
   export let content = '';

   /** @type {string} */
   export let enrichedContent = '';

   /**
    * Provides the options object that can be reactively updated. See documentation above.
    *
    * @type {import('./index').TJSContentEditOptions}
    */
   export let options = {};

   const dispatch = createEventDispatcher();

   // Provides reactive updates for any associated Foundry document.
   const doc = new TJSDocument({ delete: onDocumentDeleted });

   // Create the action to mount the secret reveal button when a Foundry document is configured.
   const mountRevealSecretButtons = createMountRevealSecretButtons(doc, options);

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

   /** @type {string} */
   let keyCode;

   /** @type {boolean} */
   let keyFocused = false;

   /** @type {number} */
   let maxCharacterLength;

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
    * @privateRemarks
    * TODO: It would be nice to provide reactive updates to content when maxCharacterLength changes, but that is
    * problematic w/ mixed text & HTML content without a lot of potential work.
    */
   $: maxCharacterLength = Number.isInteger(options?.maxCharacterLength) && options?.maxCharacterLength >= 0 ?
    options.maxCharacterLength : void 0;

   /**
    * Respond to changes in `options.document`
    */
   $: if (options?.document !== void 0)
   {
      if (!isDocument(options.document))
      {
         throw new TypeError(`TJSContentEdit error: 'options.document' is not a Foundry document.`);
      }

      if (typeof options?.fieldName !== 'string')
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
      content = $doc !== void 0 && typeof options?.fieldName === 'string' ? safeAccess($doc, options.fieldName) :
       typeof content === 'string' ? content : '';

      // Avoid double trigger of reactive statement as enriching content is async.
      onContentChanged(content, typeof options?.enrichContent === 'boolean' ? options.enrichContent : true);
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
         // Post on next macrotask to allow any event propagation for `Escape` key to trigger first.
         setTimeout(() => editorActive = false, 0);

         // If the editor was initialized by keyboard action then focus it after a short delay to allow the template
         // to update.
         if (keyFocused)
         {
            keyFocused = false;

            setTimeout(() =>
            {
               if (CrossWindow.isHTMLElement(editorEl) && editorEl?.isConnected) { editorEl.focus(); }
            }, 100);
         }

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

      // Set the initial selection; 'all', 'end', 'start'.
      CEImpl.setInitialSelection(editorEl, options?.initialSelection, 'start')

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
      if (typeof options?.saveOnBlur === 'boolean' && !options.saveOnBlur)
      {
         if (editorActive) { destroyEditor(true); }

         return;
      }

      if (editorActive) { saveEditor(); }
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

            const secrets = (globalThis.game.user.isGM || isOwner);

            // Combine any external EnrichmentOptions, but always set `async: true`.
            const enrichOptions = isObject(options?.enrichOptions) ? {
               secrets,
               relativeTo,
               ...options.enrichOptions,
               async: true
            } : { async: true, relativeTo, secrets };

            enrichedContent = await foundry.applications.ux.TextEditor.enrichHTML(content, enrichOptions);
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
    * @param {fvtt.ClientDocument} document - The deleted document.
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
    * Handles parsing the drop event if it is a valid document content link then it is inserted at cursor.
    *
    * @param {DragEvent}   event -
    */
   async function onDrop(event)
   {
      try
      {
         const linkOptions = isDocument(options?.document) ? { relativeTo: options.document } : {};

         const link = await foundry.applications.ux.TextEditor.getContentLink(
          JSON.parse(event.dataTransfer.getData('text/plain')), linkOptions);

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
   function onKeydownActive(event)
   {
      if (editorActive)
      {
         let preventDefault = false;

         switch (event.code)
         {
            case 'Enter':
               if (typeof options?.saveOnEnterKey === 'boolean' && options.saveOnEnterKey)
               {
                  saveEditor();
                  preventDefault = true;
               }
               else if (typeof options?.preventEnterKey === 'boolean' && options.preventEnterKey)
               {
                  preventDefault = true;
               }
               break;

            case 'Escape':
               destroyEditor();
               preventDefault = true;
               break;

            case 'KeyS':
               if (event.ctrlKey || event.metaKey)
               {
                  saveEditor();
                  preventDefault = true;
               }
               break;
         }

         // Prevent key down when limiting max character length, but allow certain control keys through.
         if (maxCharacterLength !== void 0 && editorEl.innerText.length >= maxCharacterLength)
         {
            preventDefault |= CEImpl.isValidKeyForMaxCharacterLength(event);
         }

         if (preventDefault)
         {
            event.preventDefault();
            event.stopPropagation();
         }
      }
   }

   /**
    * Consume / stop propagation of key down when key codes match.
    *
    * @param {KeyboardEvent}    event - A KeyboardEvent.
    */
   function onKeydownInactive(event)
   {
      if (event.code === keyCode)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Handle activating the editor if key codes match.
    *
    * @param {KeyboardEvent}    event - A KeyboardEvent.
    */
   function onKeyupInactive(event)
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
      if (typeof options?.preventPaste === 'boolean' && options.preventPaste)
      {
         event.preventDefault();
         event.stopPropagation();
         return;
      }

      let text = event.clipboardData.getData('text/plain');

      if (typeof text === 'string')
      {
         text = CEImpl.pastePreprocess(editorEl, text, options, maxCharacterLength);

         CEImpl.insertTextAtCursor(text);
      }

      event.preventDefault()
   }

   /**
    * Prevents TRL apps / ApplicationShell focus management from taking focus and saving editor unintentionally.
    */
   function onPointerdown(event)
   {
      if (editorActive) { event.stopPropagation(); }
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

         destroyEditor(!saving);
      }
   }
</script>
<!-- Passing enrichedContent to the mount secret buttons action causes it to run when the content changes. -->
<div class=tjs-editor-wrapper
     use:mountRevealSecretButtons={{ mountRevealButtons: !editorActive && editable, enrichedContent }}>
   {#if editorActive}
       <div bind:this={editorEl}
            class="editor tjs-editor editor-active {Array.isArray(options?.classes) ? options.classes.join(' ') : ''}"
            contenteditable=true
            use:applyStyles={options?.styles}
            on:blur={onBlur}
            on:drop|preventDefault|stopPropagation={onDrop}
            on:keydown={onKeydownActive}
            on:paste|preventDefault={onPaste}
            on:pointerdown={onPointerdown}
            role=textbox
            tabindex=0>
           {@html content}
       </div>
   {:else}
       <div bind:this={editorEl}
            class="editor tjs-editor {Array.isArray(options?.classes) ? options.classes.join(' ') : ''}"
            class:click-to-edit={clickToEdit}
            use:applyStyles={options?.styles}
            on:click={onClick}
            on:keydown={onKeydownInactive}
            on:keyup={onKeyupInactive}
            role=textbox
            tabindex=0>
           {@html enrichedContent}
           {#if editorButton}
               <!-- svelte-ignore a11y-missing-attribute a11y-click-events-have-key-events -->
               <a class=editor-edit on:click={() => initEditor()} role=button tabindex=-1><i class="fas fa-edit"></i></a>
           {/if}
       </div>
   {/if}
</div>

<style>
    .tjs-editor {
        display: var(--tjs-editor-display, flex);
        flex-direction: var(--tjs-editor-flex-direction, column);
        min-height: var(--tjs-editor-min-height, 25px);

        background: var(--tjs-editor-background, none);
        border: var(--tjs-editor-border, none);
        border-radius: var(--tjs-editor-border-radius, 0);
        height: var(--tjs-editor-height, 100%);
        margin: var(--tjs-editor-margin, 0);
        outline-offset: var(--tjs-editor-outline-offset, 0.25em);
        overflow: var(--tjs-editor-content-overflow, var(--tjs-editor-overflow, auto));
        position: relative;
        transition: var(--tjs-editor-transition);
        width: var(--tjs-editor-width, 100%);

        color: var(--tjs-editor-content-color, var(--color-text-primary, #000));
        font-family: var(--tjs-editor-content-font-family, var( --font-body)), "Signika", "Palatino Linotype", sans-serif;
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
        overflow: var(--tjs-editor-active-overflow, auto);
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

       display: none;
       font-size: 1.25em;
       position: absolute;
       background: var(--tjs-editor-edit-button-background, var(--menu-background));
       border: 1px solid var(--color-border-dark-1);
       border-radius: 4px;
       padding: 1px 2px;
       box-shadow: 0 0 1px var(--color-shadow-dark);
    }

    .editor:hover .editor-edit {
       display: inline-block;
    }

    /* Don't add an initial margin top to first paragraph element. */
    .tjs-editor :global(p:first-of-type) {
        margin-top: 0;
    }

    /* Do add an initial margin top to first paragraph element in `section.secret`. */
    .tjs-editor :global(section.secret p:first-of-type) {
        margin-top: 0.5em;
    }
</style>
