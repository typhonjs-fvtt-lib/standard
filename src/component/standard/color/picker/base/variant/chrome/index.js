import { default as ChromePickerIndicator }  from './PickerIndicator.svelte';
import { default as ChromePickerWrapper }    from './PickerWrapper.svelte';
import { default as ChromeSliderIndicator }  from './SliderIndicator.svelte';
import { default as ChromeSliderWrapper }    from './SliderWrapper.svelte';
import { default as ChromeWrapper }          from './Wrapper.svelte';

/**
 * The `chrome` style layout components.
 *
 * @type {PickerComponents}
 */
export const components = {
   alphaIndicator: ChromeSliderIndicator,
   alphaWrapper: ChromeSliderWrapper,
   pickerIndicator: ChromePickerIndicator,
   pickerWrapper: ChromePickerWrapper,
   sliderIndicator: ChromeSliderIndicator,
   sliderWrapper: ChromeSliderWrapper,
   wrapper: ChromeWrapper
};
