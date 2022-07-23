# Changelog
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
