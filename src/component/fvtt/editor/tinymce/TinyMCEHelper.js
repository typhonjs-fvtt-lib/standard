import { MCEImpl }   from './MCEImpl.js';

/**
 * Provides custom options for TinyMCE.
 *
 * Please see {@link CONFIG.TinyMCE} for the default Foundry options.
 */
export class TinyMCEHelper
{
   /**
    * Provides a very basic / limited TinyMCE config that limits the ability to apply many styles from the toolbar
    * or with key commands.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.basicFormats=true] - When true, only basic style formats are allowed.
    *
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {string}   [opts.contentStyle=''] - The same content style string for TinyMCE options.
    *
    * @param {boolean}  [opts.fontFormat=true] - Includes font select box.
    *
    * @param {boolean}  [opts.fontSize=false] - Includes font size select box.
    *
    * @param {boolean}  [opts.help=false] - When true include help plugin / toolbar button.
    *
    * @param {boolean}  [opts.stripStyleFormat=true] - Strips any additional style formats added by other modules.
    *
    * @param {boolean}  [opts.styleFormat=true] - Includes style format select box.
    *
    * @param {boolean}  [opts.tjsStyles=false] - Includes extensive TJS styling options.
    *
    * @param {boolean}  [opts.toolbar=true] - Includes the editor toolbar.
    *
    * @returns {object} TinyMCE options
    */
   static configBasic({ basicFormats = true, contentCSS, contentStyle = '', fontFormat = true, fontSize = false,
    help = false, stripStyleFormat = true, styleFormat = true, tjsStyles = false, toolbar = true } = {})
   {
      const style_formats = this.#getStyleFormats(basicFormats, stripStyleFormat,
       tjsStyles ? this.#s_TJS_STYLE_FORMATS : []);

      const toolbarData = `${styleFormat ? `${MCEImpl.isV6 ? 'styles |' : 'styleselect |'}` : ''} ${
       fontFormat ? `${MCEImpl.isV6 ? 'fontfamily |' : 'fontselect |'}` : ''} ${
        fontSize ? `${MCEImpl.isV6 ? 'fontsize |' : 'fontsizeselect |'}` : ''} removeformat | save${
         help ? ' | help' : ''}`;

      const config = {
         content_css: Array.isArray(contentCSS) ? globalThis.CONFIG.TinyMCE.content_css.concat(contentCSS) :
          globalThis.CONFIG.TinyMCE.content_css,
         content_style: contentStyle,
         [`${MCEImpl.isV6 ? 'font_size_formats' : 'fontsize_formats'}`]: this.#s_DEFAULT_FONT_SIZE,
         plugins: `${MCEImpl.isV6 ? '' : 'hr paste'} save ${help ? 'help' : ''} wordcount`,
         style_formats,
         style_formats_merge: false,

         // This allows the manual addition of a style tag in the code editor.
         valid_children: '+body[style]',

         // Note we can include all internal tags as we prefilter the URL to make sure it is for YouTube then use the
         // oembed API to get the embed URL.
         extended_valid_elements: 'iframe[allow|allowfullscreen|frameborder|scrolling|class|style|src|width|height]',
      };

      if (basicFormats)
      { config.formats = this.#s_BASIC_FORMATS; }

      config.toolbar = toolbar ? toolbarData : false;

      return config;
   }

   /**
    * Provides the standard TinyMCE configuration options. This is similar to standard core configuration and the
    * ProseMirror editor.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.basicFormats=false] - When true, only basic style formats are allowed.
    *
    * @param {boolean}  [opts.code=true] - When true include source code editing option.
    *
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {string}   [opts.contentStyle=''] - The same content style string for TinyMCE options.
    *
    * @param {boolean}  [opts.fontFormat=true] - Includes font select box.
    *
    * @param {boolean}  [opts.fontSize=false] - Includes font size select box.
    *
    * @param {boolean}  [opts.help=false] - When true include help plugin / toolbar button.
    *
    * @param {boolean}  [opts.stripStyleFormat=true] - Strips any additional style formats added by other modules.
    *
    * @param {boolean}  [opts.styleFormat=true] - Includes style format select box.
    *
    * @param {boolean}  [opts.tjsOembed=false] - Includes custom oEmbed plugin to include video from YouTube / Vimeo.
    *
    * @param {boolean}  [opts.tjsStyles=false] - Includes extensive TJS styling options.
    *
    * @param {boolean}  [opts.toolbar=true] - Includes the editor toolbar.
    *
    * @returns {object} TinyMCE options
    */
   static configStandard({ basicFormats = false, code = true, contentCSS, contentStyle = '', fontFormat = true,
    fontSize = false, help = false, stripStyleFormat = true, styleFormat = true, tjsOembed = false, tjsStyles = false,
     toolbar = true } = {})
   {
      const style_formats = this.#getStyleFormats(basicFormats, stripStyleFormat,
       tjsStyles ? this.#s_TJS_STYLE_FORMATS : []);

      const toolbarData = `${styleFormat ? `${MCEImpl.isV6 ? 'styles |' : 'styleselect |'}` : ''} ${
       fontFormat ? `${MCEImpl.isV6 ? 'fontfamily |' : 'fontselect |'}` : ''} ${
        fontSize ? `${MCEImpl.isV6 ? 'fontsize |' : 'fontsizeselect |'}` : ''} table | bullist | numlist | image ${
         tjsOembed ? '| typhonjs-oembed' : ''} | hr | link | removeformat | save${code ? ' | code' : ''}${
          help ? ' | help' : ''}`;

      const config = {
         content_css: Array.isArray(contentCSS) ? globalThis.CONFIG.TinyMCE.content_css.concat(contentCSS) :
          globalThis.CONFIG.TinyMCE.content_css,
         content_style: contentStyle,
         [`${MCEImpl.isV6 ? 'font_size_formats' : 'fontsize_formats'}`]: this.#s_DEFAULT_FONT_SIZE,
         plugins: `${MCEImpl.isV6 ? '' : 'hr paste'} emoticons image link lists charmap table ${tjsOembed ? 'typhonjs-oembed' : ''} ${code ? 'code' : ''} save ${help ? 'help' : ''} wordcount`,
         style_formats,
         style_formats_merge: false,

         // For typhonjs-oembed plugin when loaded.
         oembed_live_embeds: false,
         oembed_default_width: 424,
         oembed_default_height: 238,
         oembed_disable_file_source: true,

         // This allows the manual addition of a style tag in the code editor.
         valid_children: '+body[style]',

         // Note we can include all internal tags as we prefilter the URL to make sure it is for YouTube then use the
         // oembed API to get the embed URL.
         extended_valid_elements: 'iframe[allow|allowfullscreen|frameborder|scrolling|class|style|src|width|height]',
      };

      config.toolbar = toolbar ? toolbarData : false;

      return config;
   }

   /**
    * Provides the TJS super cool TinyMCE configuration options. These options are selected for increased media
    * embedding and styling flexibility.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.basicFormats=false] - When true, only basic style formats are allowed.
    *
    * @param {boolean}  [opts.code=true] - When true include source code editing option.
    *
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {string}   [opts.contentStyle=''] - The same content style string for TinyMCE options.
    *
    * @param {boolean}  [opts.fontFormat=true] - Includes font formats, size, line spacing and color options.
    *
    * @param {boolean}  [opts.fontSize=true] - Includes font size options.
    *
    * @param {boolean}  [opts.help=false] - When true include help plugin / toolbar button.
    *
    * @param {boolean}  [opts.stripStyleFormat=true] - Strips any additional style formats added by other modules.
    *
    * @param {boolean}  [opts.styleFormat=true] - Includes style format select box.
    *
    * @param {boolean}  [opts.tjsOembed=true] - Includes custom oEmbed plugin to include video from YouTube / Vimeo.
    *
    * @param {boolean}  [opts.tjsStyles=true] - Includes extensive TJS styling options.
    *
    * @param {boolean}  [opts.toolbar=true] - Includes the editor toolbar.
    *
    * @returns {object} TinyMCE options
    */
   static configTJS({ basicFormats = false, code = true, contentCSS, contentStyle = '', fontFormat = true,
    fontSize = true, help = false, stripStyleFormat = true, styleFormat = true, tjsOembed = true, tjsStyles = true,
     toolbar = true } = {})
   {
      const style_formats = this.#getStyleFormats(basicFormats, stripStyleFormat,
       tjsStyles ? this.#s_TJS_STYLE_FORMATS : []);

      const toolbarData = `${styleFormat ? `${MCEImpl.isV6 ? 'styles |' : 'styleselect |'}` : ''} table | ${fontFormat ? 'formatgroup |' : ''} removeformat | insertgroup | bulletgroup | save${code ? ' | code' : ''}${help ? ' | help' : ''}`;

      const config = {
         plugins: `${MCEImpl.isV6 ? '' : 'hr paste'} emoticons image link lists ${tjsOembed ? 'typhonjs-oembed' : ''} charmap table ${code ? 'code' : ''} save ${help ? 'help' : ''} wordcount`,
         toolbar_groups: {
            bulletgroup: {
               icon: 'unordered-list',
               tooltip: 'Lists',
               items: 'bullist | numlist'
            },
            formatgroup: {
               icon: 'format',
               tooltip: 'Fonts',
               items: `${MCEImpl.isV6 ? 'fontfamily |' : 'fontselect |'} ${fontSize ? `${MCEImpl.isV6 ? 'fontsize |' : 'fontsizeselect |'}` : ''} lineheight | forecolor backcolor`
            },
            insertgroup: {
               icon: 'plus',
               tooltip: 'Insert',
               items: `link image ${tjsOembed ? 'typhonjs-oembed' : ''} emoticons charmap hr`
            }
         },

         content_css: Array.isArray(contentCSS) ? globalThis.CONFIG.TinyMCE.content_css.concat(contentCSS) :
          globalThis.CONFIG.TinyMCE.content_css,
         content_style: contentStyle,
         contextmenu: false,  // Prefer default browser context menu
         [`${MCEImpl.isV6 ? 'font_size_formats' : 'fontsize_formats'}`]: this.#s_DEFAULT_FONT_SIZE,
         file_picker_types: 'image media',
         image_advtab: true,
         [`${MCEImpl.isV6 ? 'line_height_formats' : 'lineheight_formats'}`]: this.#s_DEFAULT_LINE_HEIGHT,

         // For typhonjs-oembed plugin when loaded.
         oembed_live_embeds: false,
         oembed_default_width: 424,
         oembed_default_height: 238,
         oembed_disable_file_source: true,

         style_formats,
         style_formats_merge: false,
         table_class_list: this.#s_DEFAULT_TABLE_CLASS_LIST,

         // This allows the manual addition of a style tag in the code editor.
         valid_children: '+body[style]',

         // Note we can include all internal tags as we prefilter the URL to make sure it is for YouTube then use the
         // oembed API to get the embed URL.
         extended_valid_elements: 'iframe[allow|allowfullscreen|frameborder|scrolling|class|style|src|width|height]',
      };

      config.toolbar = toolbar ? toolbarData : false;

      return config;
   }

   /**
    * Provides a combined `mceConfig` and other default options to create a single line editor that prevents pasting,
    * prevents enter key / new lines, saves on editor blur, and doesn't show the toolbar. This is useful as a shortcut
    * to enable TJSTinyMCE to act as a content editable text entry for a single line text field.
    *
    * Note: Since this function returns an object w/ mceConfig and other options you must use it like in TJSTinyMCE
    * options; where `font-size` in contentStyleBody and any other styles match the editor CSS variables:
    *
    * ...TinyMCEHelper.configSingleLine({ contentStyleBody: { 'font-size': '22pt' }})
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {string}   [opts.contentStyle=''] - The same content style string for TinyMCE options.
    *
    * @returns {object} TinyMCE options
    */
   static optionsSingleLine({ contentCSS, contentStyle = '' } = {})
   {
      const mceConfig = {
         ...this.configBasic({ contentCSS, contentStyle, toolbar: false }),
         save_enablewhendirty: false
      };

      return {
         mceConfig,
         preventEnterKey: true,
         saveOnEnterKey: true,
         saveOnBlur: true
      };
   }

   // Internal methods -----------------------------------------------------------------------------------------------

   /**
    * @param {boolean}  [basicFormats=false] - When true limits core formats to basic style formats.
    *
    * @param {boolean}  [stripStyleFormat=true] - Strips any non-core items added to the style format select group.
    *
    * @param {object[]} [additionalStyleFormats=[]] - Add additional style formats.
    *
    * @returns {{title: string, items: [{classes: string, block: string, wrapper: boolean, title: string}]}[]} MCE
    *          style formats configuration data.
    */
   static #getStyleFormats(basicFormats = false, stripStyleFormat = true, additionalStyleFormats = [])
   {
      // Clone the static style formats data.
      const style_formats = JSON.parse(JSON.stringify(basicFormats ? this.#s_BASIC_STYLE_FORMATS :
       this.#s_ALL_STYLE_FORMATS));

      const customIndex = basicFormats ? 0 : 1;

      if (stripStyleFormat)
      {
         style_formats[customIndex].items.push(this.#s_CUSTOM_SECRET_FORMAT_ITEM);
      }
      else
      {
         // Save any top level format categories added by external modules.
         const notCoreFormats = globalThis.CONFIG.TinyMCE.style_formats.filter((e) => e.title !== 'Custom');

         style_formats.push(...notCoreFormats);

         style_formats[customIndex].items.push(this.#s_CUSTOM_SECRET_FORMAT_ITEM);
      }

      return style_formats.concat(additionalStyleFormats);
   }

  // Static data -----------------------------------------------------------------------------------------------------

   /**
    * Defines the standard all style formats menu for style formats.
    *
    * @type {object[]}
    */
   static #s_ALL_STYLE_FORMATS = [
      {
         title: 'Headings', items: [
            { title: 'Heading 1', format: 'h1' },
            { title: 'Heading 2', format: 'h2' },
            { title: 'Heading 3', format: 'h3' },
            { title: 'Heading 4', format: 'h4' },
            { title: 'Heading 5', format: 'h5' },
            { title: 'Heading 6', format: 'h6' }
         ]
      },
      {
         title: 'Blocks', items: [
            { title: 'Paragraph', format: 'p' },
            { title: 'Blockquote', format: 'blockquote' },
            { title: 'Pre', format: 'pre' }
         ]
      },
      {
         title: 'Inline', items: [
            { title: 'Bold', format: 'bold' },
            { title: 'Italic', format: 'italic' },
            { title: 'Code', format: 'code' },
            { title: 'Underline', format: 'underline' },
            { title: 'Strikethrough', format: 'strikethrough' },
            { title: 'Superscript', format: 'superscript' },
            { title: 'Subscript', format: 'subscript' }
         ]
      },
      {
         title: 'Align', items: [
            { title: 'Left', format: 'alignleft' },
            { title: 'Center', format: 'aligncenter' },
            { title: 'Right', format: 'alignright' },
            { title: 'Justify', format: 'alignjustify' }
         ]
      }
   ];

   /**
    * Removes the TMCE core format options that are not considered basic / essential formats when `basicFormats`
    * is true.
    *
    * @type {object}
    */
   static #s_BASIC_FORMATS = {
      blockquote: {},
      div: {},
      h1: {},
      h2: {},
      h3: {},
      h4: {},
      h5: {},
      h6: {},
      pre: {}
   };

   /**
    * Defines the limited style formats options when `basicFormats` is true.
    *
    * @type {object[]}
    */
   static #s_BASIC_STYLE_FORMATS = [
      {
         title: 'Blocks', items: [
            { title: 'Paragraph', format: 'p' }
         ]
      },
      {
         title: 'Inline', items: [
            { title: 'Bold', format: 'bold' },
            { title: 'Italic', format: 'italic' },
            { title: 'Underline', format: 'underline' },
            { title: 'Strikethrough', format: 'strikethrough' },
            { title: 'Superscript', format: 'superscript' },
            { title: 'Subscript', format: 'subscript' },
            { title: 'Code', format: 'code' }
         ]
      },
      {
         title: 'Align', items: [
            { title: 'Left', format: 'alignleft' },
            { title: 'Center', format: 'aligncenter' },
            { title: 'Right', format: 'alignright' },
            { title: 'Justify', format: 'alignjustify' }
         ]
      }
   ];

   /**
    * Defines the secret FVTT core format item.
    *
    * @type {object}
    */
   static #s_CUSTOM_SECRET_FORMAT_ITEM = {
      title: 'Secret',
      block: 'section',
      classes: 'secret',
      wrapper: true
   };

   /**
    * Defines the font sizes available in the toolbar options.
    *
    * @type {string}
    */
   static #s_DEFAULT_FONT_SIZE = '10.5pt 12pt 13pt 14pt 15pt 16pt 18pt 22pt 28pt 32pt 36pt 42pt 48pt 64pt';

   /**
    * Defines the line-height styles available in the toolbar options.
    *
    * @type {string}
    */
   static #s_DEFAULT_LINE_HEIGHT = '0.8 0.9 1 1.1 1.2 1.3 1.4 1.5 1.75 2';

   /**
    * Provides a class list for the table dialog.
    *
    * @type {object}
    */
   static #s_DEFAULT_TABLE_CLASS_LIST =  [
      { title: 'None', value: '' },
      { title: 'No Colors / Border', value: 'tmce-nocolors' },
   ];

   /**
    * Provides extra CSS styles to configure text and various elements in TinyMCE.
    *
    * @type {object[]}
    */
   static #s_TJS_STYLE_FORMATS = [{
      title: 'Styles',
      items: [
         {
            title: 'Blend Mode', items: [
               {
                  title: 'BM Unset', selector: '*', styles: {
                     'mix-blend-mode': 'unset'
                  }
               },
               {
                  title: 'BM Normal', selector: '*', styles: {
                     'mix-blend-mode': 'normal'
                  }
               },
               {
                  title: 'BM Multiply', selector: '*', styles: {
                     'mix-blend-mode': 'multiply'
                  }
               },
               {
                  title: 'BM Screen', selector: '*', styles: {
                     'mix-blend-mode': 'screen'
                  }
               },
               {
                  title: 'BM Overlay', selector: '*', styles: {
                     'mix-blend-mode': 'overlay'
                  }
               },
               {
                  title: 'BM Darken', selector: '*', styles: {
                     'mix-blend-mode': 'darken'
                  }
               },
               {
                  title: 'BM Lighten', selector: '*', styles: {
                     'mix-blend-mode': 'lighten'
                  }
               },
               {
                  title: 'BM Color Dodge', selector: '*', styles: {
                     'mix-blend-mode': 'color-dodge'
                  }
               },
               {
                  title: 'BM Color Burn', selector: '*', styles: {
                     'mix-blend-mode': 'color-burn'
                  }
               },
               {
                  title: 'BM Hard Light', selector: '*', styles: {
                     'mix-blend-mode': 'hard-light'
                  }
               },
               {
                  title: 'BM Soft Light', selector: '*', styles: {
                     'mix-blend-mode': 'soft-light'
                  }
               },
               {
                  title: 'BM Difference', selector: '*', styles: {
                     'mix-blend-mode': 'difference'
                  }
               },
               {
                  title: 'BM Exclusion', selector: '*', styles: {
                     'mix-blend-mode': 'exclusion'
                  }
               },
               {
                  title: 'BM Hue', selector: '*', styles: {
                     'mix-blend-mode': 'hue'
                  }
               },
               {
                  title: 'BM Saturation', selector: '*', styles: {
                     'mix-blend-mode': 'saturation'
                  }
               },
               {
                  title: 'BM Color', selector: '*', styles: {
                     'mix-blend-mode': 'color'
                  }
               },
               {
                  title: 'BM Luminosity', selector: '*', styles: {
                     'mix-blend-mode': 'luminosity'
                  }
               },
            ]
         },
         {
            title: 'Border', items: [
               {
                  title: 'No Border', selector: '*', styles: {
                     border: 'none'
                  }
               },
               {
                  title: 'Border Radius', items: [
                     {
                        title: 'BR None', selector: '*', styles: {
                           'border-radius': 'unset'
                        }
                     },
                     {
                        title: 'BR 4px', selector: '*', styles: {
                           'border-radius': '4px'
                        }
                     },
                     {
                        title: 'BR 8px', selector: '*', styles: {
                           'border-radius': '8px'
                        }
                     },
                     {
                        title: 'BR 16px', selector: '*', styles: {
                           'border-radius': '16px'
                        }
                     },
                  ]
               },
            ]
         },
         {
            title: 'Filters', items: [
               {
                  title: 'No Filter', selector: '*', styles: {
                     filter: 'none'
                  }
               },
               {
                  title: 'Blur', items: [
                     {
                        title: 'Blur 1px', selector: '*', styles: {
                           filter: 'blur(1px)'
                        }
                     },
                     {
                        title: 'Blur 2px', selector: '*', styles: {
                           filter: 'blur(2px)'
                        }
                     },
                     {
                        title: 'Blur 3px', selector: '*', styles: {
                           filter: 'blur(3px)'
                        }
                     },
                     {
                        title: 'Blur 4px', selector: '*', styles: {
                           filter: 'blur(4px)'
                        }
                     },
                  ]
               },
               {
                  title: 'Drop Shadow', items: [
                     {
                        title: 'DS 2px', selector: '*', styles: {
                           filter: 'drop-shadow(2px 2px 2px black)'
                        }
                     },
                     {
                        title: 'DS 4px', selector: '*', styles: {
                           filter: 'drop-shadow(4px 4px 3px black)'
                        }
                     },
                     {
                        title: 'DS 8px', selector: '*', styles: {
                           filter: 'drop-shadow(8px 8px 6px black)'
                        }
                     },
                  ]
               },
               {
                  title: 'Grayscale', items: [
                     {
                        title: 'GS 25%', selector: '*', styles: {
                           filter: 'grayscale(25%)'
                        }
                     },
                     {
                        title: 'GS 50%', selector: '*', styles: {
                           filter: 'grayscale(50%)'
                        }
                     },
                     {
                        title: 'GS 75%', selector: '*', styles: {
                           filter: 'grayscale(75%)'
                        }
                     },
                     {
                        title: 'GS 100%', selector: '*', styles: {
                           filter: 'grayscale(100%)'
                        }
                     },
                  ]
               },
            ],
         },
         {
            title: 'Float', items: [
               {
                  title: 'Float Left', selector: '*', styles: {
                     float: 'left',
                     margin: '0 10px 0 0'
                  }
               },
               {
                  title: 'Float Right', selector: '*', styles: {
                     float: 'right',
                     margin: '0 0 0 10px'
                  }
               }
            ]
         },
         {
            title: 'Fonts',
            items: [
               {
                  title: 'Neon', items: [
                     {
                        title: 'Neon Blue', selector: '*', styles: {
                           color: '#fff',
                           'text-shadow': '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #0073e6, 0 0 20px #0073e6, 0 0 25px #0073e6'
                        }
                     },
                     {
                        title: 'Neon Green', selector: '*', styles: {
                           color: '#fff',
                           'text-shadow': '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #00e704, 0 0 20px #00e704, 0 0 25px #00e704'
                        }
                     },
                     {
                        title: 'Neon Red', selector: '*', styles: {
                           color: '#fff',
                           'text-shadow': '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #e70000, 0 0 20px #e70000, 0 0 25px #e70000'
                        }
                     },
                     {
                        title: 'Neon Purple', selector: '*', styles: {
                           color: '#fff',
                           'text-shadow': '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #7900ea, 0 0 20px #7900ea, 0 0 25px #7900ea'
                        }
                     }
                  ]
               }
            ]
         },
         {
            title: 'Margin', items: [
               {
                  title: 'No Margin', selector: '*', styles: {
                     margin: 'unset'
                  }
               },
               {
                  title: 'Top', items: [
                     {
                        title: 'MT 5px', selector: '*', styles: {
                           inline: 'span',
                           'margin-top': '5px'
                        }
                     },
                     {
                        title: 'MT 10px', selector: '*', styles: {
                           inline: 'span',
                           'margin-top': '10px'
                        }
                     },
                     {
                        title: 'MT 15px', selector: '*', styles: {
                           inline: 'span',
                           'margin-top': '15px'
                        }
                     },
                     {
                        title: 'MT 25px', selector: '*', styles: {
                           inline: 'span',
                           'margin-top': '25px'
                        }
                     }
                  ]
               },
               {
                  title: 'Left', items: [
                     {
                        title: 'ML 5px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '5px'
                        }
                     },
                     {
                        title: 'ML 10px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '10px'
                        }
                     },
                     {
                        title: 'ML 15px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '15px'
                        }
                     },
                     {
                        title: 'ML 25px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '25px'
                        }
                     },
                     {
                        title: 'ML 50px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '50px'
                        }
                     },
                     {
                        title: 'ML 75px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '75px'
                        }
                     },
                     {
                        title: 'ML 100px', selector: '*', styles: {
                           inline: 'span',
                           'margin-left': '100px'
                        }
                     }
                  ]
               },
               {
                  title: 'Bottom', items: [
                     {
                        title: 'MB 5px', selector: '*', styles: {
                           inline: 'span',
                           'margin-bottom': '5px'
                        }
                     },
                     {
                        title: 'MB 10px', selector: '*', styles: {
                           inline: 'span',
                           'margin-bottom': '10px'
                        }
                     },
                     {
                        title: 'MB 15px', selector: '*', styles: {
                           inline: 'span',
                           'margin-bottom': '15px'
                        }
                     },
                     {
                        title: 'MB 25px', selector: '*', styles: {
                           inline: 'span',
                           'margin-bottom': '25px'
                        }
                     }
                  ]
               },
               {
                  title: 'Right', items: [
                     {
                        title: 'MR 5px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '5px'
                        }
                     },
                     {
                        title: 'MR 10px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '10px'
                        }
                     },
                     {
                        title: 'MR 15px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '15px'
                        }
                     },
                     {
                        title: 'MR 25px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '25px'
                        }
                     },
                     {
                        title: 'MR 50px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '50px'
                        }
                     },
                     {
                        title: 'MR 75px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '75px'
                        }
                     },
                     {
                        title: 'MR 100px', selector: '*', styles: {
                           inline: 'span',
                           'margin-right': '100px'
                        }
                     }
                  ]
               }
            ]
         },
         {
            title: 'Opacity', items: [
               {
                  title: 'OP 100%', selector: '*', styles: {
                     opacity: '1'
                  }
               },
               {
                  title: 'OP 90%', selector: '*', styles: {
                     opacity: '0.9'
                  }
               },
               {
                  title: 'OP 80%', selector: '*', styles: {
                     opacity: '0.8'
                  }
               },
               {
                  title: 'OP 70%', selector: '*', styles: {
                     opacity: '0.7'
                  }
               },
               {
                  title: 'OP 60%', selector: '*', styles: {
                     opacity: '0.6'
                  }
               },
               {
                  title: 'OP 50%', selector: '*', styles: {
                     opacity: '0.5'
                  }
               },
               {
                  title: 'OP 40%', selector: '*', styles: {
                     opacity: '0.4'
                  }
               },
               {
                  title: 'OP 30%', selector: '*', styles: {
                     opacity: '0.3'
                  }
               },
               {
                  title: 'OP 20%', selector: '*', styles: {
                     opacity: '0.2'
                  }
               },
               {
                  title: 'OP 10%', selector: '*', styles: {
                     opacity: '0.1'
                  }
               }
            ]
         },
      ]
   }];
}
