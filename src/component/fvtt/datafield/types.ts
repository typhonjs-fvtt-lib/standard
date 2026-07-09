import type { MinimalWritable } from '#runtime/svelte/store/util';

export interface TJSDataFieldOptions<T = unknown> {
   datafield?: fvtt.DataField | null;

   groupConfig?: fvtt.FormGroupConfig | null;

   inputConfig?: fvtt.FormInputConfig<T> | null;

   /**
    * When true, the store value is reset to the initial value of the data field when the backing Foundry data field
    * input is changed.
    *
    * @default `false`
    */
   resetInitial?: boolean;

   store?: MinimalWritable<unknown>;
}
