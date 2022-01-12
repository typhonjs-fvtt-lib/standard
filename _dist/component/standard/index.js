import { SvelteComponent, init, safe_not_equal, append_styles, update_slot_base, get_all_dirty_from_scope, get_slot_changes, transition_in, transition_out, element, space, attr, null_to_empty, toggle_class, insert, append, listen, action_destroyer, stop_propagation, prevent_default, group_outros, check_outros, is_function, detach, run_all, subscribe, create_slot, noop, bubble, svg_element, set_style, text, set_data, binding_callbacks, add_render_callback, create_bidirectional_transition, destroy_each, component_subscribe, globals, current_component, select_option, select_value } from 'svelte/internal';
import { applyStyles } from '@typhonjs-fvtt/svelte/action';
import { localize } from '@typhonjs-fvtt/svelte/helper';
import { onDestroy, getContext, createEventDispatcher, onMount } from 'svelte';
import { writable } from 'svelte/store';
import { toggleDetails, autoBlur } from '@typhonjs-fvtt/svelte-standard/action';
import { quintOut } from 'svelte/easing';
import { slideFade } from '@typhonjs-fvtt/svelte/transition';
import { outroAndDestroy } from '@typhonjs-fvtt/svelte/util';

/**
 * First pass at a system to create a unique style sheet for the UI library that loads default values for all CSS
 * variables.
 */
class StyleManager
{
   #selector;
   #styleElement;
   #cssRule;

   /**
    *
    * @param selector
    * @param {string}   docKey
    */
   constructor({ selector = ':root', docKey } = {})
   {
      if (typeof selector !== 'string') { throw new TypeError(`StyleManager error: 'selector' is not a string.`); }
      if (typeof docKey !== 'string') { throw new TypeError(`StyleManager error: 'docKey' is not a string.`); }

      this.#selector = selector;

      if (document[docKey] === void 0)
      {
         this.#styleElement = document.createElement('style');

         document.head.append(this.#styleElement);

         this.#styleElement.sheet.insertRule(`${selector} {}`, 0);

         this.#cssRule = this.#styleElement.sheet.cssRules[0];

         document[docKey] = this.#styleElement;
      }
      else
      {
         this.#styleElement = document[docKey];
         this.#cssRule = this.#styleElement.sheet.cssRules[0];
      }
   }

   /**
    * Set rules by property / value; useful for CSS variables.
    *
    * @param {Object<string, string>}  rules - An object with property / value string pairs to load.
    *
    * @param {boolean}                 [overwrite=false] - When true overwrites any existing values.
    */
   set(rules, overwrite = false)
   {
      if (overwrite)
      {
         for (const [key, value] of Object.entries(rules))
         {
            this.#cssRule.style.setProperty(key, value);
         }
      }
      else
      {
         // Only set property keys for entries that don't have an existing rule set.
         for (const [key, value] of Object.entries(rules))
         {
            if (this.#cssRule.style.getPropertyValue(key) === '')
            {
               this.#cssRule.style.setProperty(key, value);
            }
         }
      }
   }

   /**
    * Removes the property keys specified. If `keys` is a string a single property is removed. Or if `keys` is an
    * iterable list then all property keys in the list are removed.
    *
    * @param {string|Iterable<string>} keys - The property keys to remove.
    */
   remove(keys)
   {
      if (Array.isArray(keys))
      {
         for (const key of keys)
         {
            if (typeof key === 'string') { this.#cssRule.style.removeProperty(key); }
         }
      }
      else if (typeof keys === 'string')
      {
         this.#cssRule.style.removeProperty(keys);
      }
   }
}

const s_STYLE_KEY = '#__tjs-root-styles';

const cssVariables = new StyleManager({ docKey: s_STYLE_KEY });

/**
 * Parses the core Foundry style sheet creating an indexed object of properties by selector.
 */
class FoundryStyles
{
   static #sheet = void 0;

   static #sheetMap = new Map();

   static #initialized = false;

   /**
    * Called once on initialization / first usage. Parses the core foundry style sheet.
    */
   static #initialize()
   {
      this.#initialized = true;

      const styleSheets = Array.from(document.styleSheets).filter((sheet) => sheet.href !== null);

      let sheet;

      // Find the core Foundry stylesheet.
      for (const styleSheet of styleSheets)
      {
         let url;

         try { url = new URL(styleSheet.href); } catch (err) { continue; }

         if (url.pathname === '/css/style.css')
         {
            this.#sheet = sheet = styleSheet;
            break;
         }
      }

      // Quit now if the Foundry style sheet was not found.
      if (!sheet) { return; }

      // Parse each CSSStyleRule and build the map of selectors to parsed properties.
      for (const rule of sheet.cssRules)
      {
         if (!(rule instanceof CSSStyleRule)) { continue; }

         // Split on attributes and filter out any non-strings / empty strings then trim results.
         const data = rule.style.cssText.split(';').filter((d) => typeof d === 'string' && d !== '').map(
          (d) => d.trim());

         // Split property and value.
         const result = data.map((entry) => entry.split(':').map((d) => d.trim()));

         // Create an object indexing property / value.
         this.#sheetMap.set(rule.selectorText, Object.fromEntries(result));
      }
   }

   /**
    * Gets the properties object associated with the selector. Try and use a direct match otherwise all keys
    * are iterated to find a selector string that includes the `selector`.
    *
    * @param {string}   selector - Selector to find.
    *
    * @returns {Object<string, string>} Properties object.
    */
   static getProperties(selector)
   {
      if (!this.#initialized) { this.#initialize(); }

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         return this.#sheetMap.get(selector);
      }

      for (const key of this.#sheetMap.keys())
      {
         if (key.includes(selector)) { return this.#sheetMap.get(key); }
      }

      return void 0;
   }

   /**
    * Gets a specific property value from the given `selector` and `property` key. Try and use a direct selector
    * match otherwise all keys are iterated to find a selector string that includes `selector`.
    *
    * @param {string}   selector - Selector to find.
    *
    * @param {string}   property - Specific property to locate.
    *
    * @returns {string|undefined} Property value.
    */
   static getProperty(selector, property)
   {
      if (!this.#initialized) { this.#initialize(); }

      // If there is a direct selector match then return a value immediately.
      if (this.#sheetMap.has(selector))
      {
         const data = this.#sheetMap.get(selector);
         return typeof data === 'object' && property in data ? data[property] : void 0;
      }

      for (const key of this.#sheetMap.keys())
      {
         if (key.includes(selector))
         {
            const data = this.#sheetMap.get(key);
            if (typeof data === 'object' && property in data) { return data[property]; }
         }
      }

      return void 0;
   }
}

/* src\component\standard\button\TJSToggleIconButton.svelte generated by Svelte v3.46.0 */

function add_css$4(target) {
	append_styles(target, "svelte-1memxv1", "div.svelte-1memxv1{display:block;flex:0 0 var(--tjs-icon-button-diameter);height:var(--tjs-icon-button-diameter);width:var(--tjs-icon-button-diameter);align-self:center;text-align:center}a.svelte-1memxv1{display:inline-block;background:var(--tjs-icon-button-background);border-radius:var(--tjs-icon-button-border-radius);position:relative;overflow:hidden;clip-path:var(--tjs-icon-button-clip-path);transform-style:preserve-3d;width:100%;height:100%;transition:var(--tjs-icon-button-transition)}a.svelte-1memxv1:hover{background:var(--tjs-icon-button-background-hover)}a.selected.svelte-1memxv1{background:var(--tjs-icon-button-background-selected)}i.svelte-1memxv1{line-height:var(--tjs-icon-button-diameter);transform:translateZ(1px)}");
}

// (56:3) {#if selected}
function create_if_block(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[11].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[10],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, null),
						null
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let div;
	let a;
	let i;
	let i_class_value;
	let i_title_value;
	let t;
	let applyStyles_action;
	let current;
	let mounted;
	let dispose;
	let if_block = /*selected*/ ctx[5] && create_if_block(ctx);

	return {
		c() {
			div = element("div");
			a = element("a");
			i = element("i");
			t = space();
			if (if_block) if_block.c();
			attr(i, "class", i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-1memxv1"));
			attr(i, "title", i_title_value = localize(/*title*/ ctx[1]));
			toggle_class(i, "selected", /*selected*/ ctx[5]);
			attr(a, "class", "svelte-1memxv1");
			toggle_class(a, "selected", /*selected*/ ctx[5]);
			attr(div, "class", "svelte-1memxv1");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, a);
			append(a, i);
			append(div, t);
			if (if_block) if_block.m(div, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(a, "click", /*click_handler*/ ctx[13]),
					listen(a, "click", /*onClick*/ ctx[6]),
					action_destroyer(/*efx*/ ctx[4].call(null, a)),
					listen(div, "close", /*close_handler*/ ctx[12]),
					listen(div, "close", stop_propagation(prevent_default(/*onClose*/ ctx[7]))),
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[3]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*icon*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-1memxv1"))) {
				attr(i, "class", i_class_value);
			}

			if (!current || dirty & /*title*/ 2 && i_title_value !== (i_title_value = localize(/*title*/ ctx[1]))) {
				attr(i, "title", i_title_value);
			}

			if (dirty & /*icon, selected*/ 33) {
				toggle_class(i, "selected", /*selected*/ ctx[5]);
			}

			if (dirty & /*selected*/ 32) {
				toggle_class(a, "selected", /*selected*/ ctx[5]);
			}

			if (/*selected*/ ctx[5]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*selected*/ 32) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 8) applyStyles_action.update.call(null, /*styles*/ ctx[3]);
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(9, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { $$slots: slots = {}, $$scope } = $$props;
	let { button } = $$props;
	let { icon } = $$props;
	let { title } = $$props;
	let { store } = $$props;
	$$subscribe_store();
	let { styles } = $$props;
	let { efx } = $$props;
	let selected = false;

	function onClick() {
		$$invalidate(5, selected = !selected);

		if (store) {
			store.set(selected);
		}
	}

	/**
 * Handles `close` event from any children elements.
 */
	function onClose() {
		$$invalidate(5, selected = false);

		if (store) {
			store.set(false);
		}
	}

	function close_handler(event) {
		bubble.call(this, $$self, event);
	}

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('button' in $$props) $$invalidate(8, button = $$props.button);
		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
		if ('title' in $$props) $$invalidate(1, title = $$props.title);
		if ('store' in $$props) $$subscribe_store($$invalidate(2, store = $$props.store));
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(4, efx = $$props.efx);
		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*button, icon*/ 257) {
			$$invalidate(0, icon = typeof button === 'object' && typeof button.icon === 'string'
			? button.icon
			: typeof icon === 'string' ? icon : '');
		}

		if ($$self.$$.dirty & /*button, title*/ 258) {
			$$invalidate(1, title = typeof button === 'object' && typeof button.title === 'string'
			? button.title
			: typeof title === 'string' ? title : '');
		}

		if ($$self.$$.dirty & /*button, store*/ 260) {
			$$subscribe_store($$invalidate(2, store = typeof button === 'object' && typeof button.store === 'object'
			? button.store
			: typeof store === 'object' ? store : void 0));
		}

		if ($$self.$$.dirty & /*button, styles*/ 264) {
			$$invalidate(3, styles = typeof button === 'object' && typeof button.styles === 'object'
			? button.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*button, efx*/ 272) {
			$$invalidate(4, efx = typeof button === 'object' && typeof button.efx === 'function'
			? button.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}

		if ($$self.$$.dirty & /*store, $store*/ 516) {
			if (store) {
				$$invalidate(5, selected = $store);
			}
		}
	};

	return [
		icon,
		title,
		store,
		styles,
		efx,
		selected,
		onClick,
		onClose,
		button,
		$store,
		$$scope,
		slots,
		close_handler,
		click_handler
	];
}

class TJSToggleIconButton extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$5,
			create_fragment$5,
			safe_not_equal,
			{
				button: 8,
				icon: 0,
				title: 1,
				store: 2,
				styles: 3,
				efx: 4
			},
			add_css$4
		);
	}
}

/* src\component\standard\folder\TJSFolder.svelte generated by Svelte v3.46.0 */

function add_css$3(target) {
	append_styles(target, "svelte-txio7o", "details.svelte-txio7o.svelte-txio7o{margin-left:-5px;padding-left:var(--tjs-details-padding-left, 5px)}summary.svelte-txio7o.svelte-txio7o{display:flex;position:relative;align-items:center;background-blend-mode:var(--tjs-summary-background-blend-mode, initial);background:var(--tjs-summary-background, none);border:var(--tjs-summary-border, none);cursor:var(--tjs-summary-cursor, pointer);font-size:var(--tjs-summary-font-size, inherit);font-weight:var(--tjs-summary-font-weight, bold);list-style:none;margin:0 0 0 -5px;padding:var(--tjs-summary-padding, 4px) 0;user-select:none;width:var(--tjs-summary-width, fit-content)}summary.svelte-txio7o svg.svelte-txio7o{width:var(--tjs-summary-chevron-size, var(--tjs-summary-font-size, 15px));height:var(--tjs-summary-chevron-size, var(--tjs-summary-font-size, 15px));color:var(--tjs-summary-chevron-color, currentColor);opacity:var(--tjs-summary-chevron-opacity, 0.2);margin:0 5px 0 0;transition:opacity 0.2s, transform 0.1s;transform:rotate(var(--tjs-summary-chevron-rotate-closed, -90deg))}summary.svelte-txio7o:hover svg.svelte-txio7o{opacity:var(--tjs-summary-chevron-opacity-hover, 1)}[open].svelte-txio7o:not(details[data-closing='true'])>summary svg.svelte-txio7o{transform:rotate(var(--tjs-summary-chevron-rotate-open, 0))}.contents.svelte-txio7o.svelte-txio7o{position:relative;background-blend-mode:var(--tjs-contents-background-blend-mode, initial);background:var(--tjs-contents-background, none);border:var(--tjs-contents-border, none);margin:var(--tjs-contents-margin, 0 0 0 -5px);padding:var(--tjs-contents-padding, 0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8))}.contents.svelte-txio7o.svelte-txio7o::before{content:'';position:absolute;width:0;height:calc(100% + 8px);left:0;top:-8px}summary.svelte-txio7o:focus-visible+.contents.svelte-txio7o::before{height:100%;top:0}");
}

const get_summary_end_slot_changes = dirty => ({});
const get_summary_end_slot_context = ctx => ({});
const get_label_slot_changes = dirty => ({});
const get_label_slot_context = ctx => ({});

// (157:25) {label}
function fallback_block(ctx) {
	let t;

	return {
		c() {
			t = text(/*label*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 2) set_data(t, /*label*/ ctx[1]);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$4(ctx) {
	let details;
	let summary;
	let svg;
	let path;
	let t0;
	let t1;
	let t2;
	let div;
	let toggleDetails_action;
	let applyStyles_action;
	let current;
	let mounted;
	let dispose;
	const label_slot_template = /*#slots*/ ctx[7].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[6], get_label_slot_context);
	const label_slot_or_fallback = label_slot || fallback_block(ctx);
	const summary_end_slot_template = /*#slots*/ ctx[7]["summary-end"];
	const summary_end_slot = create_slot(summary_end_slot_template, ctx, /*$$scope*/ ctx[6], get_summary_end_slot_context);
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

	return {
		c() {
			details = element("details");
			summary = element("summary");
			svg = svg_element("svg");
			path = svg_element("path");
			t0 = space();
			if (label_slot_or_fallback) label_slot_or_fallback.c();
			t1 = space();
			if (summary_end_slot) summary_end_slot.c();
			t2 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			attr(path, "fill", "currentColor");
			attr(path, "stroke", "currentColor");
			set_style(path, "stroke-linejoin", "round");
			set_style(path, "stroke-width", "3");
			attr(path, "d", "M5,8L19,8L12,15Z");
			attr(svg, "viewBox", "0 0 24 24");
			attr(svg, "class", "svelte-txio7o");
			attr(summary, "class", "svelte-txio7o");
			attr(div, "class", "contents svelte-txio7o");
			attr(details, "class", "tjs-folder svelte-txio7o");
			attr(details, "data-id", /*id*/ ctx[0]);
			attr(details, "data-label", /*label*/ ctx[1]);
			attr(details, "data-closing", "false");
		},
		m(target, anchor) {
			insert(target, details, anchor);
			append(details, summary);
			append(summary, svg);
			append(svg, path);
			append(summary, t0);

			if (label_slot_or_fallback) {
				label_slot_or_fallback.m(summary, null);
			}

			append(summary, t1);

			if (summary_end_slot) {
				summary_end_slot.m(summary, null);
			}

			append(details, t2);
			append(details, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			/*details_binding*/ ctx[13](details);
			current = true;

			if (!mounted) {
				dispose = [
					listen(details, "click", /*click_handler*/ ctx[8]),
					listen(details, "open", /*open_handler*/ ctx[9]),
					listen(details, "close", /*close_handler*/ ctx[10]),
					listen(details, "openAny", /*openAny_handler*/ ctx[11]),
					listen(details, "closeAny", /*closeAny_handler*/ ctx[12]),
					action_destroyer(toggleDetails_action = toggleDetails.call(null, details, /*store*/ ctx[2])),
					action_destroyer(applyStyles_action = applyStyles.call(null, details, /*styles*/ ctx[3]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (label_slot) {
				if (label_slot.p && (!current || dirty & /*$$scope*/ 64)) {
					update_slot_base(
						label_slot,
						label_slot_template,
						ctx,
						/*$$scope*/ ctx[6],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[6], dirty, get_label_slot_changes),
						get_label_slot_context
					);
				}
			} else {
				if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty & /*label*/ 2)) {
					label_slot_or_fallback.p(ctx, !current ? -1 : dirty);
				}
			}

			if (summary_end_slot) {
				if (summary_end_slot.p && (!current || dirty & /*$$scope*/ 64)) {
					update_slot_base(
						summary_end_slot,
						summary_end_slot_template,
						ctx,
						/*$$scope*/ ctx[6],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
						: get_slot_changes(summary_end_slot_template, /*$$scope*/ ctx[6], dirty, get_summary_end_slot_changes),
						get_summary_end_slot_context
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[6],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
						null
					);
				}
			}

			if (!current || dirty & /*id*/ 1) {
				attr(details, "data-id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*label*/ 2) {
				attr(details, "data-label", /*label*/ ctx[1]);
			}

			if (toggleDetails_action && is_function(toggleDetails_action.update) && dirty & /*store*/ 4) toggleDetails_action.update.call(null, /*store*/ ctx[2]);
			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 8) applyStyles_action.update.call(null, /*styles*/ ctx[3]);
		},
		i(local) {
			if (current) return;
			transition_in(label_slot_or_fallback, local);
			transition_in(summary_end_slot, local);
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(label_slot_or_fallback, local);
			transition_out(summary_end_slot, local);
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(details);
			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
			if (summary_end_slot) summary_end_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			/*details_binding*/ ctx[13](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { styles } = $$props;
	let { folder } = $$props;
	let { id = folder ? folder.id : void 0 } = $$props;
	let { label = folder ? folder.label : '' } = $$props;
	let { store = folder ? folder.store : writable(false) } = $$props;
	let detailsEl;

	/**
 * Create a CustomEvent with details object containing relevant element and props.
 *
 * @param {string}   type - Event name / type.
 *
 * @param {boolean}  [bubbles=false] - Does the event bubble.
 *
 * @returns {CustomEvent<object>}
 */
	function createEvent(type, bubbles = false) {
		return new CustomEvent(type,
		{
				detail: {
					element: detailsEl,
					folder,
					id,
					label,
					store
				},
				bubbles
			});
	}

	// Manually subscribe to store in order to trigger only on changes; avoids initial dispatch on mount as `detailsEl`
	// is not set yet. Directly dispatch custom events as Svelte 3 does not support bubbling of custom events by
	// `createEventDispatcher`.
	const unsubscribe = store.subscribe(value => {
		if (detailsEl) {
			detailsEl.dispatchEvent(createEvent(value ? 'open' : 'close'));
			detailsEl.dispatchEvent(createEvent(value ? 'openAny' : 'closeAny', true));
		}
	});

	onDestroy(unsubscribe);

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	function open_handler(event) {
		bubble.call(this, $$self, event);
	}

	function close_handler(event) {
		bubble.call(this, $$self, event);
	}

	function openAny_handler(event) {
		bubble.call(this, $$self, event);
	}

	function closeAny_handler(event) {
		bubble.call(this, $$self, event);
	}

	function details_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			detailsEl = $$value;
			$$invalidate(4, detailsEl);
		});
	}

	$$self.$$set = $$props => {
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('folder' in $$props) $$invalidate(5, folder = $$props.folder);
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('store' in $$props) $$invalidate(2, store = $$props.store);
		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*folder, id*/ 33) {
			$$invalidate(0, id = typeof folder === 'object'
			? folder.icon
			: typeof id === 'string' ? id : void 0);
		}

		if ($$self.$$.dirty & /*folder, label*/ 34) {
			$$invalidate(1, label = typeof folder === 'object'
			? folder.label
			: typeof label === 'string' ? label : '');
		}

		if ($$self.$$.dirty & /*folder, store*/ 36) {
			$$invalidate(2, store = typeof folder === 'object'
			? folder.store
			: typeof store === 'object' ? store : writable(false));
		}
	};

	return [
		id,
		label,
		store,
		styles,
		detailsEl,
		folder,
		$$scope,
		slots,
		click_handler,
		open_handler,
		close_handler,
		openAny_handler,
		closeAny_handler,
		details_binding
	];
}

class TJSFolder extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$4,
			create_fragment$4,
			safe_not_equal,
			{
				styles: 3,
				folder: 5,
				id: 0,
				label: 1,
				store: 2
			},
			add_css$3
		);
	}
}

/* src\component\standard\menu\TJSMenu.svelte generated by Svelte v3.46.0 */

function add_css$2(target) {
	append_styles(target, "svelte-1md432p", ".tjs-menu.svelte-1md432p.svelte-1md432p.svelte-1md432p{position:absolute;width:fit-content;height:max-content;box-shadow:0 0 2px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));background:var(--typhonjs-color-content-window, #23221d);border:1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));border-radius:5px;color:var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE))}.tjs-menu.svelte-1md432p ol.tjs-menu-items.svelte-1md432p.svelte-1md432p{list-style:none;margin:0;padding:0}.tjs-menu.svelte-1md432p li.tjs-menu-item.svelte-1md432p.svelte-1md432p{padding:0 5px;line-height:32px}.tjs-menu.svelte-1md432p li.tjs-menu-item.svelte-1md432p.svelte-1md432p:hover{color:var(--typhonjs-color-text-primary, #FFF);text-shadow:0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red))}.tjs-menu.svelte-1md432p li.tjs-menu-item.svelte-1md432p>i.svelte-1md432p{margin-right:5px}");
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[16] = list[i];
	return child_ctx;
}

// (127:6) {#each items as item}
function create_each_block$2(ctx) {
	let li;
	let i;
	let i_class_value;
	let t0_value = localize(/*item*/ ctx[16].label) + "";
	let t0;
	let t1;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[11](/*item*/ ctx[16]);
	}

	return {
		c() {
			li = element("li");
			i = element("i");
			t0 = text(t0_value);
			t1 = space();
			attr(i, "class", i_class_value = "" + (null_to_empty(/*item*/ ctx[16].icon) + " svelte-1md432p"));
			attr(li, "class", "tjs-menu-item svelte-1md432p");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, i);
			append(li, t0);
			append(li, t1);

			if (!mounted) {
				dispose = listen(li, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*items*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*item*/ ctx[16].icon) + " svelte-1md432p"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*items*/ 1 && t0_value !== (t0_value = localize(/*item*/ ctx[16].label) + "")) set_data(t0, t0_value);
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$3(ctx) {
	let t;
	let nav;
	let ol;
	let nav_transition;
	let current;
	let mounted;
	let dispose;
	let each_value = /*items*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			t = space();
			nav = element("nav");
			ol = element("ol");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ol, "class", "tjs-menu-items svelte-1md432p");
			attr(nav, "class", "tjs-menu svelte-1md432p");
		},
		m(target, anchor) {
			insert(target, t, anchor);
			insert(target, nav, anchor);
			append(nav, ol);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ol, null);
			}

			/*nav_binding*/ ctx[12](nav);
			current = true;

			if (!mounted) {
				dispose = [
					listen(document.body, "pointerdown", /*onClose*/ ctx[6]),
					action_destroyer(/*efx*/ ctx[1].call(null, nav))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*onClick, items, localize*/ 33) {
				each_value = /*items*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ol, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, true);
				nav_transition.run(1);
			});

			current = true;
		},
		o(local) {
			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, false);
			nav_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t);
			if (detaching) detach(nav);
			destroy_each(each_blocks, detaching);
			/*nav_binding*/ ctx[12](null);
			if (detaching && nav_transition) nav_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let $storeElementRoot;
	const s_DEFAULT_OFFSET = { x: 0, y: 0 };
	let { menu } = $$props;
	let { items } = $$props;
	let { offset } = $$props;
	let { styles } = $$props;
	let { efx } = $$props;
	let { transitionOptions } = $$props;
	const storeElementRoot = getContext('storeElementRoot');
	component_subscribe($$self, storeElementRoot, value => $$invalidate(14, $storeElementRoot = value));

	// Bound to the nav element / menu.
	let menuEl;

	// Stores if this context menu is closed.
	let closed = false;

	/**
 * Provides a custom transform allowing inspection of the element to change positioning styles based on the
 * height / width of the element and the containing `element root`. This allows the menu to expand left or right when
 * the menu exceeds the bounds of the containing `element root`.
 *
 * @param {HTMLElement} node - nav element.
 *
 * @returns {object} Transition object.
 */
	function animate(node) {
		const elementRoot = $storeElementRoot;

		if (!elementRoot) {
			return;
		}

		const elementRootRect = elementRoot.getBoundingClientRect();
		const elementRootRight = elementRootRect.x + elementRootRect.width;
		const nodeRect = node.getBoundingClientRect();
		const parentRect = node.parentElement.getBoundingClientRect();
		const parentRight = parentRect.x + parentRect.width;
		const adjustedOffset = { ...s_DEFAULT_OFFSET, ...offset };
		node.style.top = `${adjustedOffset.y + parentRect.top + parentRect.height - elementRootRect.top}px`;

		// Check to make sure that the menu width does not exceed the right side of the element root. If not open right.
		if (parentRect.x + nodeRect.width < elementRootRight) {
			node.style.left = `${adjustedOffset.x + parentRect.x - elementRootRect.x}px`;
			node.style.removeProperty('right');
		} else // Open left.
		{
			node.style.right = `${elementRootRight - parentRight}px`;
			node.style.removeProperty('left');
		}

		return slideFade(node, transitionOptions);
	}

	/**
 * Invokes a function on click of a menu item then fires the `close` event and automatically runs the outro
 * transition and destroys the component.
 *
 * @param {function} callback - Function to invoke on click.
 */
	function onClick(callback) {
		if (typeof callback === 'function') {
			callback();
		}

		if (!closed) {
			menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true }));
			closed = true;
		}
	}

	/**
 * Determines if a pointer pressed to the document body closes the menu. If the click occurs outside the
 * menu then fire the `close` event and run the outro transition then destroy the component.
 *
 * @param {PointerEvent}   event - Pointer event from document body click.
 */
	async function onClose(event) {
		// Early out if the pointer down is inside the menu element.
		if (event.target === menuEl || menuEl.contains(event.target)) {
			return;
		}

		if (event.target === menuEl.parentElement || menuEl.parentElement.contains(event.target)) {
			return;
		}

		if (!closed) {
			closed = true;
			menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true }));
		}
	}

	const click_handler = item => onClick(item.onclick);

	function nav_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			menuEl = $$value;
			$$invalidate(2, menuEl);
		});
	}

	$$self.$$set = $$props => {
		if ('menu' in $$props) $$invalidate(10, menu = $$props.menu);
		if ('items' in $$props) $$invalidate(0, items = $$props.items);
		if ('offset' in $$props) $$invalidate(7, offset = $$props.offset);
		if ('styles' in $$props) $$invalidate(8, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(1, efx = $$props.efx);
		if ('transitionOptions' in $$props) $$invalidate(9, transitionOptions = $$props.transitionOptions);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*menu, items*/ 1025) {
			$$invalidate(0, items = typeof menu === 'object' && Array.isArray(menu.items)
			? menu.items
			: Array.isArray(items) ? items : []);
		}

		if ($$self.$$.dirty & /*menu, offset*/ 1152) {
			$$invalidate(7, offset = typeof menu === 'object' && typeof menu.offset === 'object'
			? menu.offset
			: typeof offset === 'object' ? offset : s_DEFAULT_OFFSET);
		}

		if ($$self.$$.dirty & /*menu, styles*/ 1280) {
			$$invalidate(8, styles = typeof menu === 'object' && typeof menu.styles === 'object'
			? menu.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*menu, efx*/ 1026) {
			$$invalidate(1, efx = typeof menu === 'object' && typeof menu.efx === 'function'
			? menu.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}

		if ($$self.$$.dirty & /*menu, transitionOptions*/ 1536) {
			$$invalidate(9, transitionOptions = typeof menu === 'object' && typeof menu.transitionOptions === 'object'
			? menu.transitionOptions
			: typeof transitionOptions === 'object'
				? transitionOptions
				: { duration: 200, easing: quintOut });
		}
	};

	return [
		items,
		efx,
		menuEl,
		storeElementRoot,
		animate,
		onClick,
		onClose,
		offset,
		styles,
		transitionOptions,
		menu,
		click_handler,
		nav_binding
	];
}

class TJSMenu extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$3,
			create_fragment$3,
			safe_not_equal,
			{
				menu: 10,
				items: 0,
				offset: 7,
				styles: 8,
				efx: 1,
				transitionOptions: 9
			},
			add_css$2
		);
	}
}

/* src\component\standard\menu\context\TJSContextMenu.svelte generated by Svelte v3.46.0 */

const { document: document_1 } = globals;

function add_css$1(target) {
	append_styles(target, "svelte-1ykoenx", ".tjs-context-menu.svelte-1ykoenx.svelte-1ykoenx.svelte-1ykoenx{position:fixed;width:fit-content;font-size:14px;box-shadow:0 0 10px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));height:max-content;min-width:150px;max-width:360px;background:var(--typhonjs-color-content-window, #23221d);border:1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));border-radius:5px;color:var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE))}.tjs-context-menu.svelte-1ykoenx ol.tjs-context-items.svelte-1ykoenx.svelte-1ykoenx{list-style:none;margin:0;padding:0}.tjs-context-menu.svelte-1ykoenx li.tjs-context-item.svelte-1ykoenx.svelte-1ykoenx{padding:0 5px;line-height:32px}.tjs-context-menu.svelte-1ykoenx li.tjs-context-item.svelte-1ykoenx.svelte-1ykoenx:hover{color:var(--typhonjs-color-text-primary, #FFF);text-shadow:0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red))}.tjs-context-menu.svelte-1ykoenx li.tjs-context-item.svelte-1ykoenx>i.svelte-1ykoenx{margin-right:5px}");
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[15] = list[i];
	return child_ctx;
}

// (96:8) {#each items as item}
function create_each_block$1(ctx) {
	let li;
	let i;
	let i_class_value;
	let t_value = localize(/*item*/ ctx[15].label) + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[10](/*item*/ ctx[15]);
	}

	return {
		c() {
			li = element("li");
			i = element("i");
			t = text(t_value);
			attr(i, "class", i_class_value = "" + (null_to_empty(/*item*/ ctx[15].icon) + " svelte-1ykoenx"));
			attr(li, "class", "tjs-context-item svelte-1ykoenx");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, i);
			append(li, t);

			if (!mounted) {
				dispose = listen(li, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*items*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*item*/ ctx[15].icon) + " svelte-1ykoenx"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*items*/ 2 && t_value !== (t_value = localize(/*item*/ ctx[15].label) + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$2(ctx) {
	let t;
	let nav;
	let ol;
	let nav_transition;
	let current;
	let mounted;
	let dispose;
	let each_value = /*items*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			t = space();
			nav = element("nav");
			ol = element("ol");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ol, "class", "tjs-context-items svelte-1ykoenx");
			attr(nav, "id", /*id*/ ctx[0]);
			attr(nav, "class", "tjs-context-menu svelte-1ykoenx");
			set_style(nav, "z-index", /*zIndex*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
			insert(target, nav, anchor);
			append(nav, ol);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ol, null);
			}

			/*nav_binding*/ ctx[11](nav);
			current = true;

			if (!mounted) {
				dispose = listen(document_1.body, "pointerdown", /*onClose*/ ctx[6]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*onClick, items, localize*/ 34) {
				each_value = /*items*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ol, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (!current || dirty & /*id*/ 1) {
				attr(nav, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*zIndex*/ 4) {
				set_style(nav, "z-index", /*zIndex*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, true);
				nav_transition.run(1);
			});

			current = true;
		},
		o(local) {
			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, false);
			nav_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t);
			if (detaching) detach(nav);
			destroy_each(each_blocks, detaching);
			/*nav_binding*/ ctx[11](null);
			if (detaching && nav_transition) nav_transition.end();
			mounted = false;
			dispose();
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { id = '' } = $$props;
	let { x = 0 } = $$props;
	let { y = 0 } = $$props;
	let { items = [] } = $$props;
	let { zIndex = 10000 } = $$props;
	let { transitionOptions = void 0 } = $$props;

	// Bound to the nav element / menu.
	let menuEl;

	// Store this component reference.
	const local = current_component;

	// Dispatches `close` event.
	const dispatch = createEventDispatcher();

	// Stores if this context menu is closed.
	let closed = false;

	/**
 * Provides a custom animate callback allowing inspection of the element to change positioning styles based on the
 * height / width of the element and `document.body`. This allows the context menu to expand up when the menu
 * is outside the height bound of `document.body` and expand to the left if width is greater than `document.body`.
 *
 * @param {HTMLElement} node - nav element.
 *
 * @returns {object} Transition object.
 */
	function animate(node) {
		const expandUp = y + node.clientHeight > document.body.clientHeight;
		const expandLeft = x + node.clientWidth > document.body.clientWidth;
		node.style.top = expandUp ? null : `${y}px`;
		node.style.bottom = expandUp ? `${document.body.clientHeight - y}px` : null;
		node.style.left = expandLeft ? null : `${x}px`;
		node.style.right = expandLeft ? `${document.body.clientWidth - x}px` : null;
		return slideFade(node, transitionOptions);
	}

	/**
 * Invokes a function on click of a menu item then fires the `close` event and automatically runs the outro
 * transition and destroys the component.
 *
 * @param {function} callback - Function to invoke on click.
 */
	function onClick(callback) {
		if (typeof callback === 'function') {
			callback();
		}

		if (!closed) {
			dispatch('close');
			closed = true;
			outroAndDestroy(local);
		}
	}

	/**
 * Determines if a pointer pressed to the document body closes the context menu. If the click occurs outside the
 * context menu then fire the `close` event and run the outro transition then destroy the component.
 *
 * @param {PointerEvent}   event - Pointer event from document body click.
 */
	async function onClose(event) {
		// Early out if the pointer down is inside the menu element.
		if (event.target === menuEl || menuEl.contains(event.target)) {
			return;
		}

		// Early out if the event page X / Y is the same as this context menu.
		if (Math.floor(event.pageX) === x && Math.floor(event.pageY) === y) {
			return;
		}

		if (!closed) {
			dispatch('close');
			closed = true;
			outroAndDestroy(local);
		}
	}

	const click_handler = item => onClick(item.onclick);

	function nav_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			menuEl = $$value;
			$$invalidate(3, menuEl);
		});
	}

	$$self.$$set = $$props => {
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('x' in $$props) $$invalidate(7, x = $$props.x);
		if ('y' in $$props) $$invalidate(8, y = $$props.y);
		if ('items' in $$props) $$invalidate(1, items = $$props.items);
		if ('zIndex' in $$props) $$invalidate(2, zIndex = $$props.zIndex);
		if ('transitionOptions' in $$props) $$invalidate(9, transitionOptions = $$props.transitionOptions);
	};

	return [
		id,
		items,
		zIndex,
		menuEl,
		animate,
		onClick,
		onClose,
		x,
		y,
		transitionOptions,
		click_handler,
		nav_binding
	];
}

class TJSContextMenu extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				id: 0,
				x: 7,
				y: 8,
				items: 1,
				zIndex: 2,
				transitionOptions: 9
			},
			add_css$1
		);
	}
}

/* src\component\standard\select\TJSSelect.svelte generated by Svelte v3.46.0 */

function add_css(target) {
	append_styles(target, "svelte-10sj76s", ".tjs-select-container.svelte-10sj76s.svelte-10sj76s{background:var(--tjs-comp-select-background, var(--tjs-input-background));border-radius:var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));display:block;overflow:hidden;height:var(--tjs-comp-select-height, var(--tjs-input-height));width:var(--tjs-comp-select-width, var(--tjs-input-width));transform-style:preserve-3d}select.svelte-10sj76s.svelte-10sj76s{display:inline-block;position:relative;overflow:hidden;background:transparent;border:var(--tjs-comp-select-border, var(--tjs-input-border));border-radius:var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));width:100%;height:100%;color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;cursor:var(--tjs-comp-select-cursor, var(--tjs-input-cursor));transform:translateZ(1px)}select.svelte-10sj76s option.svelte-10sj76s{background:var(--tjs-comp-select-background, var(--tjs-input-background));color:inherit}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	return child_ctx;
}

// (51:3) {#each options as option}
function create_each_block(ctx) {
	let option;
	let t0_value = /*option*/ ctx[8] + "";
	let t0;
	let t1;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t0 = text(t0_value);
			t1 = space();
			attr(option, "class", "tjs-select-option svelte-10sj76s");
			option.__value = option_value_value = /*option*/ ctx[8];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*options*/ 1 && t0_value !== (t0_value = /*option*/ ctx[8] + "")) set_data(t0, t0_value);

			if (dirty & /*options*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[8])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment$1(ctx) {
	let div;
	let select_1;
	let applyStyles_action;
	let mounted;
	let dispose;
	let each_value = /*options*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");
			select_1 = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(select_1, "class", "tjs-select svelte-10sj76s");
			if (/*$store*/ ctx[4] === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[7].call(select_1));
			attr(div, "class", "tjs-select-container svelte-10sj76s");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, select_1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select_1, null);
			}

			select_option(select_1, /*$store*/ ctx[4]);

			if (!mounted) {
				dispose = [
					listen(select_1, "change", /*select_1_change_handler*/ ctx[7]),
					action_destroyer(autoBlur.call(null, select_1)),
					action_destroyer(/*efx*/ ctx[3].call(null, div)),
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[2]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*options*/ 1) {
				each_value = /*options*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select_1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*$store, options*/ 17) {
				select_option(select_1, /*$store*/ ctx[4]);
			}

			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 4) applyStyles_action.update.call(null, /*styles*/ ctx[2]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(4, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { select } = $$props;
	let { selected } = $$props;
	let { options } = $$props;
	let { store } = $$props;
	$$subscribe_store();
	let { styles } = $$props;
	let { efx } = $$props;

	onMount(() => {
		// On mount verify that the current store value is included in options otherwise check the `selected` value if set
		// and if this initial value is in the list of options then set it as the default option.
		if (selected && store && !options.includes($store) && options.includes(selected)) {
			store.set(selected);
		}
	});

	function select_1_change_handler() {
		$store = select_value(this);
		store.set($store);
		($$invalidate(0, options), $$invalidate(6, select));
	}

	$$self.$$set = $$props => {
		if ('select' in $$props) $$invalidate(6, select = $$props.select);
		if ('selected' in $$props) $$invalidate(5, selected = $$props.selected);
		if ('options' in $$props) $$invalidate(0, options = $$props.options);
		if ('store' in $$props) $$subscribe_store($$invalidate(1, store = $$props.store));
		if ('styles' in $$props) $$invalidate(2, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(3, efx = $$props.efx);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*select, selected*/ 96) {
			$$invalidate(5, selected = typeof select === 'object' && typeof select.selected === 'string'
			? select.selected
			: typeof selected === 'string' ? selected : void 0);
		}

		if ($$self.$$.dirty & /*select, options*/ 65) {
			$$invalidate(0, options = typeof select === 'object' && Array.isArray(select.options)
			? select.options
			: Array.isArray(options) ? options : []);
		}

		if ($$self.$$.dirty & /*select, store*/ 66) {
			$$subscribe_store($$invalidate(1, store = typeof select === 'object' && typeof select.store === 'object'
			? select.store
			: typeof store === 'object' ? store : writable(void 0)));
		}

		if ($$self.$$.dirty & /*select, styles*/ 68) {
			$$invalidate(2, styles = typeof select === 'object' && typeof select.styles === 'object'
			? select.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*select, efx*/ 72) {
			$$invalidate(3, efx = typeof select === 'object' && typeof select.efx === 'function'
			? select.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}
	};

	return [options, store, styles, efx, $store, selected, select, select_1_change_handler];
}

class TJSSelect extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$1,
			create_fragment$1,
			safe_not_equal,
			{
				select: 6,
				selected: 5,
				options: 0,
				store: 1,
				styles: 2,
				efx: 3
			},
			add_css
		);
	}
}

/* src\component\standard\TJSStyleProperties.svelte generated by Svelte v3.46.0 */

function create_fragment(ctx) {
	let div;
	let applyStyles_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[0]));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
						null
					);
				}
			}

			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 1) applyStyles_action.update.call(null, /*styles*/ ctx[0]);
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { styles } = $$props;

	$$self.$$set = $$props => {
		if ('styles' in $$props) $$invalidate(0, styles = $$props.styles);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [styles, $$scope, slots];
}

class TJSStyleProperties extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { styles: 0 });
	}
}

/**
 * Assign all TyphonJS CSS variables to Foundry defaults.
 */

cssVariables.set({
   '--tjs-action-ripple-background': 'rgba(0, 0, 0, 0.35)'
});

// -------------------------------------------------------------------------------------------------------------------

cssVariables.set({
   '--tjs-icon-button-background': 'none',
   '--tjs-icon-button-background-hover': 'rgba(0, 0, 0, 0.10)',
   '--tjs-icon-button-background-selected': 'rgba(0, 0, 0, 0.20)',
   '--tjs-icon-button-border-radius': '50%',
   '--tjs-icon-button-clip-path': 'none',
   '--tjs-icon-button-diameter': '2em',
   '--tjs-icon-button-transition': 'background 200ms linear'
});

{
   /**
    * All input related components including: TJSSelect,
    */
   const props = FoundryStyles.getProperties('input[type="text"], input[type="number"]');

   cssVariables.set({
      '--tjs-input-background': 'background' in props ? props.background : 'rgba(0, 0, 0, 0.05)',
      '--tjs-input-border': 'border' in props ? props.border : '1px solid var(--color-border-light-tertiary)',
      '--tjs-input-border-radius': 'border-radius' in props ? props['border-radius'] : '3px',
      '--tjs-input-cursor': 'pointer',
      '--tjs-input-height': 'height' in props ? props.height : 'var(--form-field-height)',
      '--tjs-input-min-width': 'min-width' in props ? props['min-width'] : '20px',
      '--tjs-input-width': 'width' in props ? props.width : 'calc(100% - 2px)'
   });
}

export { TJSContextMenu, TJSFolder, TJSMenu, TJSSelect, TJSStyleProperties, TJSToggleIconButton };
//# sourceMappingURL=index.js.map
