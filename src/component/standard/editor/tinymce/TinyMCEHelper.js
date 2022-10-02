import { FVTTVersion } from '../../../internal/FVTTVersion.js';

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
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {boolean}  [opts.fontFormat=true] - Includes font select box.
    *
    * @param {boolean}  [opts.help=false] - When true include help plugin / toolbar button.
    *
    * @param {boolean}  [opts.stripStyleFormat=true] - Strips any additional style formats added by other modules.
    *
    * @param {boolean}  [opts.styleFormat=true] - Includes style format select box.
    *
    * @param {boolean}  [opts.toolbar=true] - Includes the editor toolbar.
    *
    * @returns {object} TinyMCE options
    */
   static configBasic({ contentCSS, fontFormat = true, help = false, stripStyleFormat = true, styleFormat = true,
    toolbar = true } = {})
   {
      const toolbarData = `${styleFormat ? `${FVTTVersion.isV10 ? 'styles |' : 'styleselect |'}` : ''} ${fontFormat ? `${FVTTVersion.isV10 ? 'fontfamily |' : 'fontselect |'}` : ''} | removeformat | save${help ? ' | help' : ''}`;

      const config = {
         content_css: Array.isArray(contentCSS) ? CONFIG.TinyMCE.content_css.concat(contentCSS) :
          CONFIG.TinyMCE.content_css,
         content_style: this.#s_DEFAULT_CONTENT_STYLE,
         [`${FVTTVersion.isV10 ? 'font_family_formats' : 'font_formats'}`]: this.#getFontFormats(),
         plugins: `${FVTTVersion.isV10 ? '' : 'hr'} save ${help ? 'help' : ''}`,
         style_formats: this.#getStyleFormats(stripStyleFormat)
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
    * @param {boolean}  [opts.code=true] - When true include source code editing option.
    *
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {boolean}  [opts.fontFormat=true] - Includes font select box.
    *
    * @param {boolean}  [opts.help=false] - When true include help plugin / toolbar button.
    *
    * @param {boolean}  [opts.stripStyleFormat=true] - Strips any additional style formats added by other modules.
    *
    * @param {boolean}  [opts.styleFormat=true] - Includes style format select box.
    *
    * @param {boolean}  [opts.toolbar=true] - Includes the editor toolbar.
    *
    * @returns {object} TinyMCE options
    */
   static configStandard({ code = true, contentCSS, fontFormat = true, help = false, stripStyleFormat = true, styleFormat = true,
    toolbar = true } = {})
   {
      const toolbarData = `${styleFormat ? `${FVTTVersion.isV10 ? 'styles |' : 'styleselect |'}` : ''} ${fontFormat ? `${FVTTVersion.isV10 ? 'fontfamily |' : 'fontselect |'}` : ''} table | bullist | numlist | image | hr | link | removeformat | save${code ? ' | code' : ''}${help ? ' | help' : ''}`;

      const config = {
         content_css: Array.isArray(contentCSS) ? CONFIG.TinyMCE.content_css.concat(contentCSS) :
          CONFIG.TinyMCE.content_css,
         content_style: this.#s_DEFAULT_CONTENT_STYLE,
         [`${FVTTVersion.isV10 ? 'font_family_formats' : 'font_formats'}`]: this.#getFontFormats(),
         plugins: `${FVTTVersion.isV10 ? '' : 'hr'} emoticons image link lists charmap table ${code ? 'code' : ''} save ${help ? 'help' : ''}`,
         style_formats: this.#getStyleFormats(stripStyleFormat),
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
    * @param {boolean}  [opts.code=true] - When true include source code editing option.
    *
    * @param {string[]} [opts.contentCSS] - An array of CSS paths to load. `getRoute` will be applied to them.
    *
    * @param {boolean}  [opts.fontFormat=true] - Includes font formats, size, line spacing and color options.
    *
    * @param {boolean}  [opts.help=false] - When true include help plugin / toolbar button.
    *
    * @param {boolean}  [opts.stripStyleFormat=true] - Strips any additional style formats added by other modules.
    *
    * @param {boolean}  [opts.styleFormat=true] - Includes style format select box.
    *
    * @param {boolean}  [opts.toolbar=true] - Includes the editor toolbar.
    *
    * @returns {object} TinyMCE options
    */
   static configTJS({ code = true, contentCSS, fontFormat = true, help = false, stripStyleFormat = true, styleFormat = true,
    toolbar = true } = {})
   {
      const style_formats = this.#getStyleFormats(stripStyleFormat, this.#s_DEFAULT_STYLE_FORMATS);

      const toolbarData = `${styleFormat ? `${FVTTVersion.isV10 ? 'styles |' : 'styleselect |'}` : ''} ${fontFormat ? 'formatgroup |' : ''} removeformat | insertgroup | table | bulletgroup | save${code ? ' | code' : ''}${help ? ' | help' : ''}`;

      const config = {
         plugins: `${FVTTVersion.isV10 ? '' : 'hr'} emoticons image link lists typhonjs-oembed charmap table ${code ? 'code' : ''} save ${help ? 'help' : ''}`,
         toolbar_groups: {
            bulletgroup: {
               icon: 'unordered-list',
               tooltip: 'Lists',
               items: 'bullist | numlist'
            },
            formatgroup: {
               icon: 'format',
               tooltip: 'Fonts',
               items: `${FVTTVersion.isV10 ? 'fontfamily | fontsize' : 'fontselect | fontsizeselect'} | lineheight | forecolor backcolor`
            },
            insertgroup: {
               icon: 'plus',
               tooltip: 'Insert',
               items: 'link image typhonjs-oembed emoticons charmap hr'
            }
         },

         content_css: Array.isArray(contentCSS) ? CONFIG.TinyMCE.content_css.concat(contentCSS) :
          CONFIG.TinyMCE.content_css,
         content_style: this.#s_DEFAULT_CONTENT_STYLE,
         contextmenu: false,  // Prefer default browser context menu
         [`${FVTTVersion.isV10 ? 'font_size_formats' : 'fontsize_formats'}`]: this.#s_DEFAULT_FONT_SIZE,
         file_picker_types: 'image media',
         image_advtab: true,
         [`${FVTTVersion.isV10 ? 'line_height_formats' : 'lineheight_formats'}`]: this.#s_DEFAULT_LINE_HEIGHT,

         // For typhonjs-oembed plugin when loaded.
         oembed_live_embeds: false,
         oembed_default_width: 424,
         oembed_default_height: 238,
         oembed_disable_file_source: true,

         style_formats,
         table_class_list: this.#s_DEFAULT_TABLE_CLASS_LIST,

         // This allows the manual addition of a style tag in the code editor.
         valid_children: '+body[style]',

         // Note we can include all internal tags as we prefilter the URL to make sure it is for YouTube then use the
         // oembed API to get the embed URL. Additionally, DOMPurify is configured to only accept iframes from YouTube.
         extended_valid_elements: 'iframe[allow|allowfullscreen|frameborder|scrolling|class|style|src|width|height]',
      };

      config.toolbar = toolbar ? toolbarData : false;

      return config;
   }

   /**
    * Retrieves Foundry default fonts on v10+ and appends any custom fonts into the TinyMCE format.
    *
    * @returns {string} TinyMCE formatted font family string.
    */
   static #getFontFormats()
   {
      let fvttFonts = FVTTVersion.isV10 ? FontConfig.getAvailableFonts() : CONFIG.fontFamilies;

      fvttFonts = fvttFonts.map((family) =>`${family}=${family}`);

      return fvttFonts.sort().join(';');
   }

   /**
    * @param {boolean}  [stripStyleFormat=true] - Strips any non-core items added to the style format select group.
    *
    * @param {object[]} [additionalStyleFormats=[]] - Add additional style formats.
    *
    * @returns {{title: string, items: [{classes: string, block: string, wrapper: boolean, title: string}]}[]}
    */
   static #getStyleFormats(stripStyleFormat = true, additionalStyleFormats = [])
   {
      let style_formats;

      if (stripStyleFormat)
      {
         // Strip out any unwanted custom items from other modules; currently Monk's Extended Journals.
         const foundryBaseItems = CONFIG.TinyMCE.style_formats[0].items.filter((e) => e.title === 'Secret');

         style_formats = [
            {
               title: 'Custom',
               items: foundryBaseItems
            }
         ];
      }
      else
      {
         style_formats = CONFIG.TinyMCE.style_formats;
      }

      return style_formats.concat(additionalStyleFormats);
   }

   // The following code is borrowed from Foundry VTT to load core / FVTT fonts into the TinyMCE IFrame. ---------------

   /**
    * Load a font definition.
    *
    * @param {string}               family - The font family name (case-sensitive).
    *
    * @param {FontFamilyDefinition} definition - The font family definition.
    *
    * @param {Document}             document - Target Document to load font into.
    *
    * @returns {Promise<boolean>} Returns true if the font was successfully loaded.
    */
   static async #loadFont(family, definition, document)
   {
      const font = `1rem "${family}"`;
      try
      {
         for (const font of definition.fonts)
         {
            const fontFace = this.#createFontFace(family, font);
            await fontFace.load();
            document.fonts.add(fontFace);
         }
         await document.fonts.load(font);
      }
      catch (err)
      {
         console.warn(`Font family "${family}" failed to load: `, err);
         return false;
      }
      if (!document.fonts.check(font))
      {
         console.warn(`Font family "${family}" failed to load.`);
         return false;
      }

      return true;
   }

   /* -------------------------------------------- */

   /**
    * Ensure that fonts have loaded and are ready for use.
    * Enforce a maximum timeout in milliseconds.
    * Proceed after that point even if fonts are not yet available.
    *
    * @param {object} [opts] - Optional parameters.
    *
    * @param {number} [opts.ms=4500] - The maximum time to spend loading fonts before proceeding.
    *
    * @param {Document} [opts.document] - The target document to load the fonts into.
    *
    * @returns {Promise<void>}
    */
   static async loadFonts({ ms = 4500, document = document } = {})
   {
      const allFonts = this.#collectDefinitions();
      const promises = [];
      for (const definitions of allFonts)
      {
         if (typeof definitions === 'object')
         {
            for (const [family, definition] of Object.entries(definitions))
            {
               promises.push(this.#loadFont(family, definition, document));
            }
         }
      }
      const timeout = new Promise(resolve => setTimeout(resolve, ms));
      const ready = Promise.all(promises).then(() => document.fonts.ready);
      return Promise.race([ready, timeout]);
   }

   /* -------------------------------------------- */

   /**
    * Collect all the font definitions and combine them.
    *
    * @returns {Object<FontFamilyDefinition>[]}
    */
   static #collectDefinitions()
   {
      if (FVTTVersion.isV10)
      {
         /**
          * @deprecated since v10.
          */
         const legacyFamilies = CONFIG._fontFamilies.reduce((obj, f) =>
         {
            obj[f] = { editor: true, fonts: [] };
            return obj;
         }, {});

         return [CONFIG.fontDefinitions, game.settings.get('core', 'fonts'), legacyFamilies];
      }
      else
      {
         const legacyFamilies = CONFIG.fontFamilies.reduce((obj, f) =>
         {
            obj[f] = { editor: true, fonts: [] };
            return obj;
         }, {});

         return [legacyFamilies];
      }
   }

   /**
    * Create FontFace object from a FontDefinition.
    *
    * @param {string} family        The font family name.
    *
    * @param {FontDefinition} font  The font definition.
    *
    * @returns {FontFace}
    */
   static #createFontFace(family, font)
   {
      const urls = font.urls.map(url => `url("${url}")`).join(', ');
      return new FontFace(family, urls, font);
   }

  // Static data for `configTJS` -------------------------------------------------------------------------------------

   static #s_DEFAULT_CONTENT_STYLE = 'body { color: #000; font-family: Signika; font-size: 10.5pt; line-height: 1.2; padding: 0; } p:first-of-type { margin-top: 0; }';

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
   static #s_DEFAULT_STYLE_FORMATS = [{
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
