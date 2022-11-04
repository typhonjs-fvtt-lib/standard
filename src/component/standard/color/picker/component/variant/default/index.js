import { default as PickerIndicator }  from './PickerIndicator.svelte';
import { default as PickerWrapper }    from './PickerWrapper.svelte';
import { default as SliderIndicator }  from './SliderIndicator.svelte';
import { default as SliderWrapper }    from './SliderWrapper.svelte';
import { default as TextInput }        from './TextInput.svelte';
import { default as Wrapper }          from './Wrapper.svelte';

export const components = {
   sliderIndicator: SliderIndicator,
   pickerIndicator: PickerIndicator,
   alphaIndicator: SliderIndicator,
   pickerWrapper: PickerWrapper,
   sliderWrapper: SliderWrapper,
   alphaWrapper: SliderWrapper,
   textInput: TextInput,
   wrapper: Wrapper
};
