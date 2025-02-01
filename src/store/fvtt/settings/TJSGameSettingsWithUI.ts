import { TJSGameSettings }       from '#runtime/svelte/store/fvtt/settings';

import { UIControlImpl }         from './UIControlImpl';

import type {
   Readable,
   Writable }                    from 'svelte/store';

import type { MinimalWritable }  from '#runtime/svelte/store/util';
import type { WebStorage }       from '#runtime/svelte/store/web-storage';
import type { TJSSvelte }        from '#runtime/svelte/util';

/**
 * Extends {@link TJSGameSettings} with UI control for working with
 * {@link #standard/component/fvtt/settings!TJSSettingsEdit} and
 * {@link #standard/component/fvtt/settings!TJSSettingsSwap}
 * components. Instead of extending `TJSGameSettings` simply extend `TJSGameSettingsWithUI` instead when creating
 * reactive game settings that utilize the above components.
 *
 * There are additional game settings options for separating settings into folders. Please see
 * {@link TJSGameSettingsWithUI.Options.ExtraProps}.
 */
class TJSGameSettingsWithUI extends TJSGameSettings<TJSGameSettingsWithUI.Options.ExtraProps>
{
   /**
    */
   readonly #uiControl: TJSGameSettingsWithUI.UIControl;

   /**
    * Creates the TJSGameSettingsWithUI instance.
    *
    * @param namespace - The namespace for all settings.
    */
   constructor(namespace: string)
   {
      super(namespace);

      this.#uiControl = new UIControlImpl(this);
   }

   override register(setting: TJSGameSettingsWithUI.Options.GameSetting): void
   {
      if (setting?.folder !== void 0 && typeof setting.folder !== 'string')
      {
         throw new TypeError(`TJSGameSettingsWithUI - register: 'folder' attribute is not a string.`);
      }

      super.register(setting);
   }

   /**
    * @returns The associated UIControl.
    */
   get uiControl(): TJSGameSettingsWithUI.UIControl
   {
      return this.#uiControl;
   }
}

declare namespace TJSGameSettingsWithUI {
   export namespace Data {
      export type Folder = {
         label: string;
         settings: UISetting.Data[];
         store?: MinimalWritable<boolean>;
      };

      export interface Section extends TJSSvelte.Config.Embed {
         folder?: SectionFolder;
         styles?: { [key: string]: string | null };
      }

      export type SectionFolder = {
         label: string;
         store?: MinimalWritable<boolean>;
         summaryEnd?: TJSSvelte.Config.Embed;
         styles?: { [key: string]: string | null };
      };
   }

   export type Data = {
      /**
       * Sorted folders with associated settings and label.
       */
      folders: Data.Folder[];

      /**
       * Top level settings data.
       */
      topLevel: UISetting.Data[];

      /**
       * Custom sections.
       */
      sections: Data.Section[];

      /**
       * The store for `applyScrolltop`.
       */
      storeScrollbar: Writable<number>;

      /**
       * The bound destroy callback function for received of `TJSGameSettingsWithUI.Data` instance.
       */
      destroy?: Function;
   };

   export namespace Options {
      export type Create = {
         /**
          * Defines the effects added to TJS components; ripple by default.
          */
         efx?: string;

         /**
          * TRL WebStorage (session) instance to serialize folder state and scrollbar position.
          */
         storage?: WebStorage;
      };

      export interface CustomSection extends TJSSvelte.Config.Embed {
         /**
          * Inline styles for the section element.
          */
         styles?: { [key: string]: string | null };

         /**
          * A folder label or CustomSectionFolder object.
          */
         folder?: string | CustomSectionFolder;
      }

      export type CustomSectionFolder = {
         /**
          * The folder label.
          */
         label: string;

         /**
          * A Svelte component config object defining TJSSvgFolder summary end component.
          */
         summaryEnd?: TJSSvelte.Config.Embed;

         /**
          * Inline styles for the `TJSSvgFolder`; useful for setting CSS variables.
          */
         styles?: { [key: string]: string | null };
      };

      /**
       * Defines extra props that are available to set for game setting with UI options and data.
       */
      export interface ExtraProps {
         /**
          * The name of the `TJSSvgFolder` to put this setting in to group them.
          */
         folder?: string;
      }

      /**
       * Defines the game setting with UI options for {@link TJSGameSettings.register}.
       */
      export interface GameSetting extends TJSGameSettings.Options.GameSetting<ExtraProps> {}
   }

   export namespace UISetting {
      export type Data = {
         id: string;
         namespace: string;
         folder?: string;
         key: string;
         name: string;
         hint: string;
         type: string;
         componentType: string;
         filePicker?: string;
         range?: { min: number, max: number, step: number };
         store: MinimalWritable<unknown>;
         initialValue: any;
         scope: 'client' | 'world';
         requiresReload?: boolean;
         buttonData?: ButtonData;
         inputData?: InputData;
         selectData?: SelectData;
      };

      export type ButtonData = {
         efx?: Function;
         icon: string;
         styles?: { [key: string]: string | null }
         title: string;
      };

      export type InputData = {
         efx?: Function;
         store: MinimalWritable<unknown>;
         type: string;
      };

      export type SelectData = {
         efx?: Function;
         options: { value: string, label: string }[];
         store: MinimalWritable<unknown>;
         type: string;
      };
   }

   /**
    * Controls preparation and processing of registered game settings w/ TJSGameSettings. Game settings are parsed
    * for UI display by TJSSettingsEdit. The store `showSettings` is utilized in TJSSettingsSwap component to provide
    * an easy way to flip between settings component or any main slotted component.
    */
   export interface UIControl
   {
      /**
       * @returns Returns the managed stores.
       */
      get stores(): {
         showSettings: Readable<boolean>;
      };

      /**
       * @returns Current `showSettings` state.
       */
      get showSettings(): boolean;

      /**
       * Sets current `showSettings` state.
       *
       * @param showSettings - New `showSettings` state.
       */
      set showSettings(showSettings: boolean);

      /**
       * Adds a custom section / folder defined by the provided TJSSettingsCustomSection options object.
       *
       * @param options - The configuration object for the custom section.
       */
      addSection(options: Options.CustomSection): void;

      /**
       * Creates the UISettingsData object by parsing stored settings in
       *
       * @param [options] - Optional parameters.
       *
       * @returns Parsed UI settings data.
       */
      create(options?: Options.Create): TJSGameSettingsWithUI.Data;

      /**
       * Convenience method to swap `showSettings`.
       *
       * @returns New `showSettings` state.
       */
      swapShowSettings(): boolean;
   }
}

export {
   TJSGameSettingsWithUI
}
