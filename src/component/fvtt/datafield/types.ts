import type { MinimalWritable } from '#runtime/svelte/store/util';

/**
 * Configuration options for {@link TJSDataField}.
 *
 * @template T - Input value type accepted by the associated {@link fvtt!FormInputConfig}.
 */
interface TJSDataFieldOptions<T = unknown>
{
   /**
    * The associated Foundry DataField.
    */
   datafield?: fvtt.DataField;

   /**
    * Whether the associated input is enabled.
    *
    * @defaultValue `true`
    */
   enabled?: boolean;

   /**
    * Optional configuration used when constructing a DataField form group.
    */
   groupConfig?: fvtt.FormGroupConfig;

   /**
    * Optional configuration used when constructing the associated DataField input element.
    */
   inputConfig?: fvtt.FormInputConfig<T>;

   /**
    * Callback invoked when DataField validation fails while processing user input or synchronizing an existing store
    * value with a changed DataField.
    */
   onValidationFailure?: TJSDataFieldValidationCallback;

   /**
    * When true and the effective DataField changes, synchronize the store to that field’s initial value. When no
    * valid DataField is available, synchronize the store to undefined.
    *
    * When false, the existing store value is preserved across DataField changes whenever it remains compatible with
    * the new DataField. Otherwise, the store is synchronized to the initial value of the new DataField.
    *
    * @defaultValue `false`
    */
   resetInitial?: boolean;

   /**
    * Writable store synchronized with the DataField value.
    *
    * The component automatically updates the store when user input changes and reacts to external store updates by
    * synchronizing with the hosted DataField.
    */
   store?: MinimalWritable<unknown>;
}

/**
 * Callback invoked when DataField validation fails.
 *
 * @param err - Foundry validation failure returned by the DataField.
 *
 * @param context - Context identifying the origin of the failure.
 */
type TJSDataFieldValidationCallback =
 (err: fvtt.DataModelValidationFailure, context: TJSDataFieldValidationContext) => void;

/**
 * Additional context describing the origin of a DataField validation failure.
 */
interface TJSDataFieldValidationContext
{
   /**
    * Source of the validation failure.
    *
    * - `'user'` indicates validation failed while processing user input.
    * - `'sync'` indicates validation failed while synchronizing the component with the current store value.
    */
   source: 'user' | 'sync';
}

export {
   TJSDataFieldValidationCallback,
   TJSDataFieldValidationContext,
   TJSDataFieldOptions };
