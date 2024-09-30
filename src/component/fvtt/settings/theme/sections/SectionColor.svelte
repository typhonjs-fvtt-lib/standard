<script>
   import { localize }          from '#runtime/util/i18n';

   import { TJSColordPicker }   from '#standard/component/color/picker';

   export let options = void 0;

   const pickerOptions = {
      isTextInput: false,
      isPopup: false,
      width: 80,
      store: options.store
   }
</script>

<section class=tjs-settings-entry>
   <span>{localize(options.label)}</span>
   <TJSColordPicker options={pickerOptions} />
</section>

<style>
   span {
      color: var(--tjs-settings-entry-label-color, inherit);
      font-size: var(--tjs-settings-entry-label-font-size, inherit);
      line-height: var(--tjs-settings-entry-label-line-height, var(--form-field-height));
      flex: 2;
   }

   section {
      clear: both;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
   }

   section:not(:last-child) {
      margin: var(--tjs-settings-entry-margin, 0 0 1rem 0);
   }
</style>
