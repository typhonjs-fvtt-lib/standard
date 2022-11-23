import { default as ChromePickerIndicator }  from './PickerIndicator.svelte';
import { default as ChromeSliderIndicator }  from './SliderIndicator.svelte';
import { default as ChromeWrapper }          from './Wrapper.svelte';

/**
 * The `chrome` style layout components.
 *
 * @type {PickerComponents}
 */
export const components = {
   alphaIndicator: ChromeSliderIndicator,
   pickerIndicator: ChromePickerIndicator,
   sliderIndicator: ChromeSliderIndicator,
   wrapper: ChromeWrapper
};
