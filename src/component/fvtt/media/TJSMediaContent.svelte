<script>
   /**
    * Provides an initial implementation to display image or video content from a given file path.
    *
    * Note: currently this component is available in the `standard/component/fvtt` sub-path export and after it is
    * revisited to add in more comprehensive support for URLs it will be moved to `standard/component`.
    *
    * You can either set the `filepath` prop or use {@link TJSFileSlotButton} and embed TJSMediaContent as a child.
    * A `filepath` context / store will be examined if it exists to obtain a file path to load.
    *
    * The following CSS variables control the associated styles with the default values.
    *
    * ---------------------------------
    *
    * --tjs-media-content-background - transparent
    * --tjs-media-content-border - none
    * --tjs-media-content-border-radius - 0
    * --tjs-media-content-diameter - When defined used for height / width.
    * --tjs-media-content-height - 100px
    * --tjs-media-content-object-fit - contain
    * --tjs-media-content-width - 100px
    */

   import { getContext }      from 'svelte';

   import { clamp }           from '#runtime/math/util';
   import { isWritableStore } from '#runtime/util/store';
   import { isObject }        from '#runtime/util/object';

   import { AssetValidator }  from './AssetValidator.js';

   /**
    * The `filepath` store potentially set from a parent component like `TJSFileSlotButton`.
    *
    * @type {import('svelte/store').Writable<string>}
    */
   const storeFilepath = getContext('filepath');

   /**
    * Only process image / video assets from AssetValidator / skip audio.
    *
    * @type {Set<string>}
    */
   const mediaTypes = new Set(['img', 'video']);

   export let media = void 0;

   /**
    * Prop for filepath media content.
    *
    * @type {string}
    */
   export let filepath = void 0;

   /**
    * Alternate image text.
    *
    * @type {string}
    */
   export let imgAlt = void 0;

   /**
    * A title for the media element.
    *
    * @type {string}
    */
   export let title = void 0;

   /**
    * Automatically start video playback; default: true
    *
    * @type {boolean}
    */
   export let videoAutoplay = void 0;

   /**
    * Automatically loop video; default: true
    *
    * @type {boolean}
    */
   export let videoLoop = void 0;

   /**
    * Play video on pointer hover.
    *
    * @type {boolean}
    */
   export let videoPlayOnHover = void 0;

   /**
    * Mute video playback audio; default: true
    *
    * @type {boolean}
    */
   export let videoMuted = void 0;

   /**
    * Video playback rate - clamped internally between 0 - 2.
    *
    * @type {number}
    */
   export let videoPlaybackRate = void 0;

   /**
    * TODO: provide type
    */
   export let defaultMedia = {
      elementType: 'img',
      filepath: 'icons/svg/mystery-man.svg',
      valid: true
   };

   let parsed = void 0;

   let videoEl;

   // ----------------------------------------------------------------------------------------------------------------

   $: filepath = isObject(media) && typeof media.filepath === 'string' ? media.filepath :
    typeof filepath === 'string' ? filepath : void 0;

   $: imgAlt = isObject(media) && typeof media.imgAlt === 'string' ? media.imgAlt :
    typeof imgAlt === 'string' ? imgAlt : void 0;

   $: videoAutoplay = isObject(media) && typeof media.videoAutoplay === 'boolean' ? media.videoAutoplay :
    typeof videoAutoplay === 'boolean' ? videoAutoplay : true;

   $: videoLoop = isObject(media) && typeof media.videoLoop === 'boolean' ? media.videoLoop :
    typeof videoLoop === 'boolean' ? videoLoop : true;

   $: videoMuted = isObject(media) && typeof media.videoMuted === 'boolean' ? media.videoMuted :
    typeof videoMuted === 'boolean' ? videoMuted : true;

   $: title = isObject(media) && typeof media.title === 'string' ? media.title :
    typeof title === 'string' ? title : void 0;

   $: {
      videoPlayOnHover = isObject(media) && typeof media.videoPlayOnHover === 'boolean' ? media.videoPlayOnHover :
       typeof videoPlayOnHover === 'boolean' ? videoPlayOnHover : false;

      videoAutoplay = !videoPlayOnHover;

      // Start / pause current play state based on `videoPlayOnHover`.
      if (videoPlayOnHover) { videoEl?.pause(); }
      else { videoEl?.play(); }
   }

   $: {
      const playbackRate = isObject(media) && typeof media.videoPlaybackRate === 'number' ? media.videoPlaybackRate :
       typeof videoPlaybackRate === 'number' ? videoPlaybackRate : void 0;

      // Ensure playback rate is clamped between 0.1 - 4.
      videoPlaybackRate = typeof playbackRate === 'number' ? clamp(playbackRate, 0.1, 4) : 1;
   }

   $: if (videoEl) { videoEl.playbackRate = videoPlaybackRate; }

   /**
    * First attempt to use the filepath prop or fallback to the store from context then parse the
    * media type.
    */
   $: {
      const mediaTarget = filepath ?? (isWritableStore(storeFilepath) ? $storeFilepath : void 0);

      const result = AssetValidator.parseMedia({ filepath: mediaTarget, mediaTypes });

      // Validate that the result is a valid format / type otherwise fallback to `defaultMedia`.
      parsed = result?.valid ? result : defaultMedia;
   }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Handle starting the video player when `videoPlayerOnHover` is enabled.
    */
   function onPointerenter()
   {
      if (typeof videoPlayOnHover === 'boolean' && videoPlayOnHover) { videoEl.play(); }
   }

   /**
    * Handle pausing the video player when `videoPlayerOnHover` is enabled.
    */
   function onPointerleave()
   {
      if (typeof videoPlayOnHover === 'boolean' && videoPlayOnHover) { videoEl.pause(); }
   }
</script>

<div class=tjs-media-content>
    {#key parsed}
       {#if parsed?.elementType === 'img'}
          <img src={parsed.filepath} alt={imgAlt} title={title} />
       {:else if parsed?.elementType === 'video'}
          <video bind:this={videoEl}
                 on:pointerenter={onPointerenter}
                 on:pointerleave={onPointerleave}
                 autoplay={videoAutoplay}
                 loop={videoLoop}
                 muted={videoMuted}
                 title={title}>
             <source src={parsed.filepath} type={`video/${parsed.extension}`}>

             <!-- Potentially use the default asset if an image as a fallback. -->
             <slot name=video-fallback>
                {#if defaultMedia?.elementType === 'img'}
                   <img src={defaultMedia?.filepath} alt="Video not loaded" />
                {/if}
             </slot>
          </video>
       {/if}
    {/key}
</div>

<style>
   div {
      display: block;

      height: var(--tjs-media-content-diameter, var(--tjs-media-content-height, 100px));
      width: var(--tjs-media-content-diameter, var(--tjs-media-content-width, 100px));

      background: var(--tjs-media-content-background, transparent);
      border: var(--tjs-media-content-border, none);
      border-radius: var(--tjs-media-content-border-radius, 0);
   }

   video, img {
      position: relative;
      background: transparent;
      border: none;
      object-fit: var(--tjs-media-content-object-fit, contain);

      width: 100%;
      height: 100%;
   }
</style>
