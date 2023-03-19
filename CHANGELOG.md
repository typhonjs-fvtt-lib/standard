# Changelog
## Release 0.0.22 (minor)
- Added `svelte-ignore` for new Svelte a11y warnings in TJSMenu / TJSContextMenu despite proper roles assigned.

## Release 0.0.21 (minor)
- Refined `FVTTSidebarControl`:
  - Better error handling; a failure to load one sidebar doesn't cause others to fail.
  - New `condition` field to define a boolean or function returning a boolean to conditionally add the sidebar.
  - New `mergeAppImpl` for `add` / `replace` to provide a base implementation for the "app" added to `globalThis.ui`.

## Release 0.0.20 (minor)
- Updated `FVTTSidebarControl` with new `remove` and `replace` methods to remove / replace existing Foundry sidebars. 

## Release 0.0.19 (minor)
- Corrected external inclusion of ProseMirror library that caused incompatibility w/ Foundry version.

- New `FVTTSidebarControl` found in `@typhonjs-fvtt/svelte-standard/application` to add custom Svelte based 
  sidebar panels to the Foundry sidebar.

## Release 0.0.18 (super-major)
- Significantly refined all existing components (double the amount of commits in `svelte-standard`)
  - Keyboard navigation and activation baked into components. 
  - Data defined callback `onClick` now `onPress`. Handling both pointer / key interaction.
  - New `on:press` event binding exposed on relevant components.

- Editor components finished: 
  - TJSContentEdit fully up to par w/ config options of TJSTinyMCE
  - TJSProseMirror handles most of the same config options, but not single line support (use TJSContentEdit).

- Increased coherency of CSS variables across components.
  - CSS default variables (used across all components when text is focused / hovered):
    - `--tjs-default-text-shadow-focus-hover` -> default value:  '0 0 8px var(--color-shadow-primary)'
  - Undefined universal CSS variables for focus visible support / keyboard navigation:
    - `--tjs-default-outline-focus-visible`: Define `outline` for focused components.
    - `--tjs-default-transition-focus-visible`: Optional `transition` to apply.
    - `--tjs-default-box-shadow-focus-visible`: Optional box-shadow to apply instead of outline.

- New TJSLiveGameSettings (Create dynamic live binding derived store for game settings)

- New HSV / sRGB color picker component (complete, but pending container query support in Svelte).
  - Will be exposed in near future update when Svelte CQ PR is accepted.

## Release 0.0.17 (minor)
- Refined TJSGameSettings / TJSSettingsEdit
  - Ability to add custom component section; see `TJSGameSettings.addSection`
  - Documentation added.

## Release 0.0.16 (minor)
- Moved ProseMirror plugins to `@typhonjs-fvtt/svelte-standard/prosemirror/plugins` sub-package to be able to bundle 
  extra PM resources.

## Release 0.0.15 (major)
- Initial release of TJSTinyMCE and TJSContentEdit editor components.
  - Note: TJSTinyMCE is fully developed and next release will bring as much feature parity to TJSProseMirror and 
    TJSContentEdit from the "gold standard" MCE editor. 


- Added TJSGameSettings in `store` sub-export.
- Added TJSSettingsEdit / TJSSettingsSwap components
  - This allows reactive editing of game settings from directly inside apps.
  - Group settings into logical folders. 
  - Support for `requireReload`
  

- Refined TJSSvgFolder & TJSIconFolder to hide slotted components when not visible improving performance for lists of 
  many instances.

## Release 0.0.14 (minor)
- Made small mistake; rebuild. No new changes.

## Release 0.0.12 (minor)
- Had to package up `prosemirror-dev-tooling` in `@typhonjs-fvtt/svelte-standard/dev-tools/prosemirror`.

## Release 0.0.11 (medium)
- Refined TJSProseMirror component.
- Added developer mode for TJSProseMirror imported from `@typhonjs-fvtt/svelte-standard/component/dev`.
- TJSProseMirror now exports `enrichedContent` prop / new event `editor:enrichedContent`.

## Release 0.0.10 (medium)
- Added TJSProseMirror component providing ProseMirror editing for `Foundry v10+`.

## Release 0.0.9 (minor)
- Small mod to TJSToggleLabel to only potentially render `left` or `right` slot when `comp` or `text` prop not defined.

## Release 0.0.8 (minor)
- Fix for unintentional "double bubble" of click / close events on TJSIconButton, TJSToggleIconButton, and 
  TJSToggleLabel.

## Release 0.0.7 (minor)
- Fix for CSS variable initialization when a route prefix is enabled.

## Release 0.0.6 (minor)
- Fix Vite teething issues.

## Release 0.0.5 (medium)
- Added TJSToggleLabel component
  - Acts like TJSToggleIconButton allowing a TJSMenu to be nested, but the trigger is a label
  - several options too many to list.

- TJSMenu updated
  - Can now embed a content component w/ a slot. 
  - before and after slots
  - Items list can now have `image`, `separator: 'hr'` for a separator, `class` for a Svelte component.

- Fixed issues w/ TJSInput; started separating support w/ TJSInputText.

## Release 0.0.4 (minor)
- Fix `tjs-input-cursor` CSS variable to be `inherit`

## Release 0.0.3 (minor)
- Hardened TJSContextMenu / TJSMenu to close on scroll wheel events and clicks outside browser window.

- Added CSS variable for TJSInput / placeholder. 

- Finetuned a few other components.

## Release 0.0.2
- Updated components
  - TJSIconFolder / TJSSvgFolder
    - Options: 'chevron only click', 'no keyboard / spacebar open'
    - Fixed click detect with child / slotted components
    
  - Add TJSIconButton; basic icon button.
 
  - TJSMenu; better positioning / absolute in relative parent.
  
  - TJSInput
    - fixed efx / rippleFocus multiple clicks issue
    - Options: 'blurOnKeyEnter', 'cancelOnEscKey', 'clearOnEscKey'


- Stores
  - Added ArrayObjectStore, CrudArrayObjectStore, WorldSettingArrayStore

## Release 0.0.1
- Refined TJSIconFolder / TJSSvgFolder
  - slotted components can now be interacted with and not cause folder open / close on click.

- TJSPositionControlLayer
  - A layer to add to rendering position based components for interactive editing (many features!)
  - Export JSON configuration of controlled components
  
## Release 0.0.0
- Initial alpha release
  - Initial support for add on Svelte components and resources.
