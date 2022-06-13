import { SvelteComponent, init, safe_not_equal, append_styles, update_slot_base, get_all_dirty_from_scope, get_slot_changes, transition_in, transition_out, element, space, attr, null_to_empty, toggle_class, insert, append, listen, action_destroyer, stop_propagation, prevent_default, group_outros, check_outros, is_function, detach, run_all, subscribe, create_slot, noop, bubble, svg_element, set_style, text, set_data, set_store_value, binding_callbacks, set_input_value, add_render_callback, select_option, destroy_each, select_value, create_bidirectional_transition, component_subscribe, globals, current_component } from 'svelte/internal';
import { applyStyles, autoBlur } from '@typhonjs-fvtt/runtime/svelte/action';
import { isSettableStore } from '@typhonjs-fvtt/runtime/svelte/store';
import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
import { onDestroy, onMount, getContext, createEventDispatcher } from 'svelte';
import { writable } from 'svelte/store';
import { isObject, outroAndDestroy } from '@typhonjs-fvtt/runtime/svelte/util';
import { toggleDetails } from '@typhonjs-fvtt/svelte-standard/action';
import { quintOut } from 'svelte/easing';
import { slideFade } from '@typhonjs-fvtt/runtime/svelte/transition';

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

         const obj = {};

         // Parse `cssText` into an object of properties & values.
         for (const entry of rule.style.cssText.split(';'))
         {
            const parts = entry.split(':');

            // Sanity check.
            if (parts.length < 2) { continue; }

            obj[parts[0].trim()] = parts[1].trim();
         }

         this.#sheetMap.set(rule.selectorText, obj);
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

function add_css$6(target) {
	append_styles(target, "svelte-qrlk5m", "div.svelte-qrlk5m{display:block;flex:0 0 var(--tjs-icon-button-diameter);height:var(--tjs-icon-button-diameter);width:var(--tjs-icon-button-diameter);align-self:center;text-align:center}a.svelte-qrlk5m{display:inline-block;background:var(--tjs-icon-button-background);border-radius:var(--tjs-icon-button-border-radius);position:relative;overflow:hidden;clip-path:var(--tjs-icon-button-clip-path, none);transform-style:preserve-3d;width:100%;height:100%;transition:var(--tjs-icon-button-transition)}a.svelte-qrlk5m:hover{background:var(--tjs-icon-button-background-hover);clip-path:var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, none))}a.selected.svelte-qrlk5m{background:var(--tjs-icon-button-background-selected);clip-path:var(--tjs-icon-button-clip-path-selected, var(--tjs-icon-button-clip-path, none))}i.svelte-qrlk5m{line-height:var(--tjs-icon-button-diameter);transform:translateZ(1px)}");
}

// (59:3) {#if selected}
function create_if_block$1(ctx) {
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

function create_fragment$7(ctx) {
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
	let if_block = /*selected*/ ctx[5] && create_if_block$1(ctx);

	return {
		c() {
			div = element("div");
			a = element("a");
			i = element("i");
			t = space();
			if (if_block) if_block.c();
			attr(i, "class", i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-qrlk5m"));
			attr(i, "title", i_title_value = localize(/*title*/ ctx[1]));
			toggle_class(i, "selected", /*selected*/ ctx[5]);
			attr(a, "class", "svelte-qrlk5m");
			toggle_class(a, "selected", /*selected*/ ctx[5]);
			attr(div, "class", "svelte-qrlk5m");
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
			if (!current || dirty & /*icon*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-qrlk5m"))) {
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
					if_block = create_if_block$1(ctx);
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

function instance$7($$self, $$props, $$invalidate) {
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
			$$subscribe_store($$invalidate(2, store = typeof button === 'object' && isSettableStore(button.store)
			? button.store
			: isSettableStore(store) ? store : void 0));
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
			instance$7,
			create_fragment$7,
			safe_not_equal,
			{
				button: 8,
				icon: 0,
				title: 1,
				store: 2,
				styles: 3,
				efx: 4
			},
			add_css$6
		);
	}
}

/* src\component\standard\folder\TJSSvgFolder.svelte generated by Svelte v3.46.0 */

function add_css$5(target) {
	append_styles(target, "svelte-1l88rpq", "details.svelte-1l88rpq.svelte-1l88rpq{margin-left:-5px;padding-left:var(--tjs-details-padding-left, 5px)}summary.svelte-1l88rpq.svelte-1l88rpq{display:flex;position:relative;align-items:center;background-blend-mode:var(--tjs-summary-background-blend-mode, initial);background:var(--tjs-summary-background, none);border:var(--tjs-summary-border, none);border-radius:var(--tjs-summary-border-radius, 0);border-width:var(--tjs-summary-border-width, initial);cursor:var(--tjs-summary-cursor, pointer);font-size:var(--tjs-summary-font-size, inherit);font-weight:var(--tjs-summary-font-weight, bold);font-family:var(--tjs-summary-font-family, inherit);list-style:none;margin:var(--tjs-summary-margin, 0 0 0 -5px);padding:var(--tjs-summary-padding, 4px) 0;user-select:none;width:var(--tjs-summary-width, fit-content)}summary.svelte-1l88rpq svg.svelte-1l88rpq{width:var(--tjs-summary-chevron-size, var(--tjs-summary-font-size, 15px));height:var(--tjs-summary-chevron-size, var(--tjs-summary-font-size, 15px));color:var(--tjs-summary-chevron-color, currentColor);opacity:var(--tjs-summary-chevron-opacity, 0.2);margin:0 5px 0 0;transition:opacity 0.2s, transform 0.1s;transform:rotate(var(--tjs-summary-chevron-rotate-closed, -90deg))}summary.svelte-1l88rpq:hover svg.svelte-1l88rpq{opacity:var(--tjs-summary-chevron-opacity-hover, 1)}details[open].svelte-1l88rpq>summary.svelte-1l88rpq{background:var(--tjs-summary-background-open, var(--tjs-summary-background, inherit))}[open].svelte-1l88rpq:not(details[data-closing='true'])>summary svg.svelte-1l88rpq{transform:rotate(var(--tjs-summary-chevron-rotate-open, 0))}.contents.svelte-1l88rpq.svelte-1l88rpq{position:relative;background-blend-mode:var(--tjs-contents-background-blend-mode, initial);background:var(--tjs-contents-background, none);border:var(--tjs-contents-border, none);margin:var(--tjs-contents-margin, 0 0 0 -5px);padding:var(--tjs-contents-padding, 0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8))}.contents.svelte-1l88rpq.svelte-1l88rpq::before{content:'';position:absolute;width:0;height:calc(100% + 8px);left:0;top:-8px}summary.svelte-1l88rpq:focus-visible+.contents.svelte-1l88rpq::before{height:100%;top:0}");
}

const get_summary_end_slot_changes$1 = dirty => ({});
const get_summary_end_slot_context$1 = ctx => ({});
const get_label_slot_changes$1 = dirty => ({});
const get_label_slot_context$1 = ctx => ({});

// (193:25) {label}
function fallback_block$1(ctx) {
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

function create_fragment$6(ctx) {
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
	const label_slot_template = /*#slots*/ ctx[12].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[11], get_label_slot_context$1);
	const label_slot_or_fallback = label_slot || fallback_block$1(ctx);
	const summary_end_slot_template = /*#slots*/ ctx[12]["summary-end"];
	const summary_end_slot = create_slot(summary_end_slot_template, ctx, /*$$scope*/ ctx[11], get_summary_end_slot_context$1);
	const default_slot_template = /*#slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

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
			attr(svg, "class", "svelte-1l88rpq");
			attr(summary, "class", "svelte-1l88rpq");
			attr(div, "class", "contents svelte-1l88rpq");
			attr(details, "class", "tjs-folder svelte-1l88rpq");
			attr(details, "data-id", /*id*/ ctx[0]);
			attr(details, "data-label", /*label*/ ctx[1]);
			attr(details, "data-closing", "false");
		},
		m(target, anchor) {
			insert(target, details, anchor);
			append(details, summary);
			append(summary, svg);
			append(svg, path);
			/*svg_binding*/ ctx[18](svg);
			append(summary, t0);

			if (label_slot_or_fallback) {
				label_slot_or_fallback.m(summary, null);
			}

			append(summary, t1);

			if (summary_end_slot) {
				summary_end_slot.m(summary, null);
			}

			/*summary_binding*/ ctx[19](summary);
			append(details, t2);
			append(details, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			/*details_binding*/ ctx[20](details);
			current = true;

			if (!mounted) {
				dispose = [
					listen(summary, "click", /*onClickSummary*/ ctx[8], true),
					listen(summary, "contextmenu", function () {
						if (is_function(/*onContextMenu*/ ctx[4])) /*onContextMenu*/ ctx[4].apply(this, arguments);
					}),
					listen(details, "click", /*click_handler*/ ctx[13]),
					listen(details, "open", /*open_handler*/ ctx[14]),
					listen(details, "close", /*close_handler*/ ctx[15]),
					listen(details, "openAny", /*openAny_handler*/ ctx[16]),
					listen(details, "closeAny", /*closeAny_handler*/ ctx[17]),
					action_destroyer(toggleDetails_action = toggleDetails.call(null, details, {
						store: /*store*/ ctx[2],
						clickActive: false
					})),
					action_destroyer(applyStyles_action = applyStyles.call(null, details, /*styles*/ ctx[3]))
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (label_slot) {
				if (label_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						label_slot,
						label_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[11], dirty, get_label_slot_changes$1),
						get_label_slot_context$1
					);
				}
			} else {
				if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty & /*label*/ 2)) {
					label_slot_or_fallback.p(ctx, !current ? -1 : dirty);
				}
			}

			if (summary_end_slot) {
				if (summary_end_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						summary_end_slot,
						summary_end_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(summary_end_slot_template, /*$$scope*/ ctx[11], dirty, get_summary_end_slot_changes$1),
						get_summary_end_slot_context$1
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
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

			if (toggleDetails_action && is_function(toggleDetails_action.update) && dirty & /*store*/ 4) toggleDetails_action.update.call(null, {
				store: /*store*/ ctx[2],
				clickActive: false
			});

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
			/*svg_binding*/ ctx[18](null);
			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
			if (summary_end_slot) summary_end_slot.d(detaching);
			/*summary_binding*/ ctx[19](null);
			if (default_slot) default_slot.d(detaching);
			/*details_binding*/ ctx[20](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(21, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { $$slots: slots = {}, $$scope } = $$props;
	let { folder = void 0 } = $$props;

	let { id = isObject(folder) && typeof folder.id === 'string'
	? folder.id
	: void 0 } = $$props;

	let { label = isObject(folder) && typeof folder.label === 'string'
	? folder.label
	: '' } = $$props;

	let { store = isObject(folder) && isSettableStore(folder.store)
	? folder.store
	: writable(false) } = $$props;

	$$subscribe_store();

	let { styles = isObject(folder) && isObject(folder.styles)
	? folder.styles
	: void 0 } = $$props;

	let { onClick = isObject(folder) && typeof folder.onClick === 'function'
	? folder.onClick
	: () => null } = $$props;

	let { onContextMenu = isObject(folder) && typeof folder.onContextMenu === 'function'
	? folder.onContextMenu
	: () => null } = $$props;

	let detailsEl, summaryEl, svgEl;

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

	function onClickSummary(event) {
		event.target.classList.contains('ignore');
		const target = event.target;

		if (target === summaryEl || target === svgEl || svgEl.contains(event.target) || target.classList.contains('summary-click')) {
			set_store_value(store, $store = !$store, $store);
			onClick(event);
			event.preventDefault();
			event.stopPropagation();
		}
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

	function svg_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			svgEl = $$value;
			$$invalidate(7, svgEl);
		});
	}

	function summary_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			summaryEl = $$value;
			$$invalidate(6, summaryEl);
		});
	}

	function details_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			detailsEl = $$value;
			$$invalidate(5, detailsEl);
		});
	}

	$$self.$$set = $$props => {
		if ('folder' in $$props) $$invalidate(10, folder = $$props.folder);
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('store' in $$props) $$subscribe_store($$invalidate(2, store = $$props.store));
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('onClick' in $$props) $$invalidate(9, onClick = $$props.onClick);
		if ('onContextMenu' in $$props) $$invalidate(4, onContextMenu = $$props.onContextMenu);
		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*folder, id*/ 1025) {
			$$invalidate(0, id = isObject(folder) && typeof folder.id === 'string'
			? folder.id
			: typeof id === 'string' ? id : void 0);
		}

		if ($$self.$$.dirty & /*folder, label*/ 1026) {
			$$invalidate(1, label = isObject(folder) && typeof folder.label === 'string'
			? folder.label
			: typeof label === 'string' ? label : '');
		}

		if ($$self.$$.dirty & /*folder, store*/ 1028) {
			$$subscribe_store($$invalidate(2, store = isObject(folder) && isSettableStore(folder.store)
			? folder.store
			: isSettableStore(store) ? store : writable(false)));
		}

		if ($$self.$$.dirty & /*folder, onClick*/ 1536) {
			$$invalidate(9, onClick = isObject(folder) && typeof folder.onClick === 'function'
			? folder.onClick
			: typeof onClick === 'function' ? onClick : () => null);
		}

		if ($$self.$$.dirty & /*folder, styles*/ 1032) {
			$$invalidate(3, styles = isObject(folder) && isObject(folder.styles)
			? folder.styles
			: isObject(styles) ? styles : void 0);
		}

		if ($$self.$$.dirty & /*folder, onContextMenu*/ 1040) {
			$$invalidate(4, onContextMenu = isObject(folder) && typeof folder.onContextMenu === 'function'
			? folder.onContextMenu
			: typeof onContextMenu === 'function'
				? onContextMenu
				: () => null);
		}
	};

	return [
		id,
		label,
		store,
		styles,
		onContextMenu,
		detailsEl,
		summaryEl,
		svgEl,
		onClickSummary,
		onClick,
		folder,
		$$scope,
		slots,
		click_handler,
		open_handler,
		close_handler,
		openAny_handler,
		closeAny_handler,
		svg_binding,
		summary_binding,
		details_binding
	];
}

class TJSSvgFolder extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$6,
			create_fragment$6,
			safe_not_equal,
			{
				folder: 10,
				id: 0,
				label: 1,
				store: 2,
				styles: 3,
				onClick: 9,
				onContextMenu: 4
			},
			add_css$5
		);
	}
}

/* src\component\standard\folder\TJSIconFolder.svelte generated by Svelte v3.46.0 */

function add_css$4(target) {
	append_styles(target, "svelte-1ytpfhe", "details.svelte-1ytpfhe.svelte-1ytpfhe{margin-left:-5px;padding-left:var(--tjs-details-padding-left, 5px)}summary.svelte-1ytpfhe.svelte-1ytpfhe{display:flex;position:relative;align-items:center;background-blend-mode:var(--tjs-summary-background-blend-mode, initial);background:var(--tjs-summary-background, none);border:var(--tjs-summary-border, none);border-radius:var(--tjs-summary-border-radius, 0);border-width:var(--tjs-summary-border-width, initial);cursor:var(--tjs-summary-cursor, pointer);font-size:var(--tjs-summary-font-size, inherit);font-weight:var(--tjs-summary-font-weight, bold);font-family:var(--tjs-summary-font-family, inherit);list-style:none;margin:var(--tjs-summary-margin, 0);padding:var(--tjs-summary-padding, 4px) 0;user-select:none;width:var(--tjs-summary-width, fit-content);transition:background 0.1s}summary.svelte-1ytpfhe i.svelte-1ytpfhe{color:var(--tjs-summary-chevron-color, currentColor);opacity:var(--tjs-summary-chevron-opacity, 1);margin:0 0 0 0.25em;width:var(--tjs-summary-chevron-width, 1.65em);transition:opacity 0.2s}summary.svelte-1ytpfhe:hover i.svelte-1ytpfhe{opacity:var(--tjs-summary-chevron-opacity-hover, 1)}details[open].svelte-1ytpfhe>summary.svelte-1ytpfhe{background:var(--tjs-summary-background-open, var(--tjs-summary-background, inherit))}.contents.svelte-1ytpfhe.svelte-1ytpfhe{position:relative;background-blend-mode:var(--tjs-contents-background-blend-mode, initial);background:var(--tjs-contents-background, none);border:var(--tjs-contents-border, none);margin:var(--tjs-contents-margin, 0 0 0 -5px);padding:var(--tjs-contents-padding, 0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8))}.contents.svelte-1ytpfhe.svelte-1ytpfhe::before{content:'';position:absolute;width:0;height:calc(100% + 8px);left:0;top:-8px}summary.svelte-1ytpfhe:focus-visible+.contents.svelte-1ytpfhe::before{height:100%;top:0}");
}

const get_summary_end_slot_changes = dirty => ({});
const get_summary_end_slot_context = ctx => ({});
const get_label_slot_changes = dirty => ({});
const get_label_slot_context = ctx => ({});

// (198:8) {#if currentIcon}
function create_if_block(ctx) {
	let i;
	let i_class_value;

	return {
		c() {
			i = element("i");
			attr(i, "class", i_class_value = "" + (null_to_empty(/*currentIcon*/ ctx[8]) + " svelte-1ytpfhe"));
		},
		m(target, anchor) {
			insert(target, i, anchor);
			/*i_binding*/ ctx[22](i);
		},
		p(ctx, dirty) {
			if (dirty & /*currentIcon*/ 256 && i_class_value !== (i_class_value = "" + (null_to_empty(/*currentIcon*/ ctx[8]) + " svelte-1ytpfhe"))) {
				attr(i, "class", i_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(i);
			/*i_binding*/ ctx[22](null);
		}
	};
}

// (200:25) {label}
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

function create_fragment$5(ctx) {
	let details;
	let summary;
	let t0;
	let t1;
	let t2;
	let div;
	let toggleDetails_action;
	let applyStyles_action;
	let current;
	let mounted;
	let dispose;
	let if_block = /*currentIcon*/ ctx[8] && create_if_block(ctx);
	const label_slot_template = /*#slots*/ ctx[16].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[15], get_label_slot_context);
	const label_slot_or_fallback = label_slot || fallback_block(ctx);
	const summary_end_slot_template = /*#slots*/ ctx[16]["summary-end"];
	const summary_end_slot = create_slot(summary_end_slot_template, ctx, /*$$scope*/ ctx[15], get_summary_end_slot_context);
	const default_slot_template = /*#slots*/ ctx[16].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

	return {
		c() {
			details = element("details");
			summary = element("summary");
			if (if_block) if_block.c();
			t0 = space();
			if (label_slot_or_fallback) label_slot_or_fallback.c();
			t1 = space();
			if (summary_end_slot) summary_end_slot.c();
			t2 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			attr(summary, "class", "svelte-1ytpfhe");
			attr(div, "class", "contents svelte-1ytpfhe");
			attr(details, "class", "tjs-icon-folder svelte-1ytpfhe");
			attr(details, "data-id", /*id*/ ctx[0]);
			attr(details, "data-label", /*label*/ ctx[1]);
			attr(details, "data-closing", "false");
		},
		m(target, anchor) {
			insert(target, details, anchor);
			append(details, summary);
			if (if_block) if_block.m(summary, null);
			append(summary, t0);

			if (label_slot_or_fallback) {
				label_slot_or_fallback.m(summary, null);
			}

			append(summary, t1);

			if (summary_end_slot) {
				summary_end_slot.m(summary, null);
			}

			/*summary_binding*/ ctx[23](summary);
			append(details, t2);
			append(details, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			/*details_binding*/ ctx[24](details);
			current = true;

			if (!mounted) {
				dispose = [
					listen(summary, "click", /*onClickSummary*/ ctx[9], true),
					listen(summary, "contextmenu", function () {
						if (is_function(/*onContextMenu*/ ctx[4])) /*onContextMenu*/ ctx[4].apply(this, arguments);
					}),
					listen(details, "click", /*click_handler*/ ctx[17]),
					listen(details, "open", /*open_handler*/ ctx[18]),
					listen(details, "close", /*close_handler*/ ctx[19]),
					listen(details, "openAny", /*openAny_handler*/ ctx[20]),
					listen(details, "closeAny", /*closeAny_handler*/ ctx[21]),
					action_destroyer(toggleDetails_action = toggleDetails.call(null, details, {
						store: /*store*/ ctx[2],
						clickActive: false
					})),
					action_destroyer(applyStyles_action = applyStyles.call(null, details, /*styles*/ ctx[3]))
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (/*currentIcon*/ ctx[8]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(summary, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (label_slot) {
				if (label_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
					update_slot_base(
						label_slot,
						label_slot_template,
						ctx,
						/*$$scope*/ ctx[15],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[15], dirty, get_label_slot_changes),
						get_label_slot_context
					);
				}
			} else {
				if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty & /*label*/ 2)) {
					label_slot_or_fallback.p(ctx, !current ? -1 : dirty);
				}
			}

			if (summary_end_slot) {
				if (summary_end_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
					update_slot_base(
						summary_end_slot,
						summary_end_slot_template,
						ctx,
						/*$$scope*/ ctx[15],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
						: get_slot_changes(summary_end_slot_template, /*$$scope*/ ctx[15], dirty, get_summary_end_slot_changes),
						get_summary_end_slot_context
					);
				}
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[15],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
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

			if (toggleDetails_action && is_function(toggleDetails_action.update) && dirty & /*store*/ 4) toggleDetails_action.update.call(null, {
				store: /*store*/ ctx[2],
				clickActive: false
			});

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
			if (if_block) if_block.d();
			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
			if (summary_end_slot) summary_end_slot.d(detaching);
			/*summary_binding*/ ctx[23](null);
			if (default_slot) default_slot.d(detaching);
			/*details_binding*/ ctx[24](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(14, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { $$slots: slots = {}, $$scope } = $$props;
	let { folder = void 0 } = $$props;

	let { id = isObject(folder) && typeof folder.id === 'string'
	? folder.id
	: void 0 } = $$props;

	let { iconOpen = isObject(folder) && typeof folder.iconOpen === 'string'
	? folder.iconOpen
	: void 0 } = $$props;

	let { iconClosed = isObject(folder) && typeof folder.iconClosed === 'string'
	? folder.iconClosed
	: void 0 } = $$props;

	let { label = isObject(folder) && typeof folder.label === 'string'
	? folder.label
	: '' } = $$props;

	let { store = isObject(folder) && isSettableStore(folder.store)
	? folder.store
	: writable(false) } = $$props;

	$$subscribe_store();

	let { styles = isObject(folder) && isObject(folder.styles)
	? folder.styles
	: void 0 } = $$props;

	let { onClick = isObject(folder) && typeof folder.onClick === 'function'
	? folder.onClick
	: () => null } = $$props;

	let { onContextMenu = isObject(folder) && typeof folder.onContextMenu === 'function'
	? folder.onContextMenu
	: () => null } = $$props;

	let detailsEl, iconEl, summaryEl;
	let currentIcon;

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

	function onClickSummary(event) {
		const target = event.target;

		if (target === summaryEl || target === iconEl || target.classList.contains('summary-click')) {
			set_store_value(store, $store = !$store, $store);
			onClick(event);
			event.preventDefault();
			event.stopPropagation();
		}
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

	function i_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			iconEl = $$value;
			$$invalidate(6, iconEl);
		});
	}

	function summary_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			summaryEl = $$value;
			$$invalidate(7, summaryEl);
		});
	}

	function details_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			detailsEl = $$value;
			$$invalidate(5, detailsEl);
		});
	}

	$$self.$$set = $$props => {
		if ('folder' in $$props) $$invalidate(13, folder = $$props.folder);
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('iconOpen' in $$props) $$invalidate(10, iconOpen = $$props.iconOpen);
		if ('iconClosed' in $$props) $$invalidate(11, iconClosed = $$props.iconClosed);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('store' in $$props) $$subscribe_store($$invalidate(2, store = $$props.store));
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('onClick' in $$props) $$invalidate(12, onClick = $$props.onClick);
		if ('onContextMenu' in $$props) $$invalidate(4, onContextMenu = $$props.onContextMenu);
		if ('$$scope' in $$props) $$invalidate(15, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*folder, id*/ 8193) {
			$$invalidate(0, id = isObject(folder) && typeof folder.id === 'string'
			? folder.id
			: typeof id === 'string' ? id : void 0);
		}

		if ($$self.$$.dirty & /*folder, iconOpen*/ 9216) {
			$$invalidate(10, iconOpen = isObject(folder) && folder.iconOpen === 'string'
			? folder.iconOpen
			: typeof iconOpen === 'string' ? iconOpen : void 0);
		}

		if ($$self.$$.dirty & /*folder, iconClosed*/ 10240) {
			$$invalidate(11, iconClosed = isObject(folder) && folder.iconClosed === 'string'
			? folder.iconClosed
			: typeof iconClosed === 'string' ? iconClosed : void 0);
		}

		if ($$self.$$.dirty & /*folder, label*/ 8194) {
			$$invalidate(1, label = isObject(folder) && typeof folder.label === 'string'
			? folder.label
			: typeof label === 'string' ? label : '');
		}

		if ($$self.$$.dirty & /*folder, store*/ 8196) {
			$$subscribe_store($$invalidate(2, store = isObject(folder) && isSettableStore(folder.store)
			? folder.store
			: isSettableStore(store) ? store : writable(false)));
		}

		if ($$self.$$.dirty & /*folder, styles*/ 8200) {
			$$invalidate(3, styles = isObject(folder) && isObject(folder.styles)
			? folder.styles
			: isObject(styles) ? styles : void 0);
		}

		if ($$self.$$.dirty & /*folder, onClick*/ 12288) {
			$$invalidate(12, onClick = isObject(folder) && typeof folder.onClick === 'function'
			? folder.onClick
			: typeof onClick === 'function' ? onClick : () => null);
		}

		if ($$self.$$.dirty & /*folder, onContextMenu*/ 8208) {
			$$invalidate(4, onContextMenu = isObject(folder) && typeof folder.onContextMenu === 'function'
			? folder.onContextMenu
			: typeof onContextMenu === 'function'
				? onContextMenu
				: () => null);
		}

		if ($$self.$$.dirty & /*$store, iconOpen, iconClosed*/ 19456) {
			{
				const iconData = $store ? iconOpen : iconClosed;
				$$invalidate(8, currentIcon = typeof iconData !== 'string' ? void 0 : iconData);
			}
		}
	};

	return [
		id,
		label,
		store,
		styles,
		onContextMenu,
		detailsEl,
		iconEl,
		summaryEl,
		currentIcon,
		onClickSummary,
		iconOpen,
		iconClosed,
		onClick,
		folder,
		$store,
		$$scope,
		slots,
		click_handler,
		open_handler,
		close_handler,
		openAny_handler,
		closeAny_handler,
		i_binding,
		summary_binding,
		details_binding
	];
}

class TJSIconFolder extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$5,
			create_fragment$5,
			safe_not_equal,
			{
				folder: 13,
				id: 0,
				iconOpen: 10,
				iconClosed: 11,
				label: 1,
				store: 2,
				styles: 3,
				onClick: 12,
				onContextMenu: 4
			},
			add_css$4
		);
	}
}

/* src\component\standard\form\input\TJSInput.svelte generated by Svelte v3.46.0 */

function add_css$3(target) {
	append_styles(target, "svelte-1ed44hh", ".tjs-input-container.svelte-1ed44hh{background:var(--tjs-comp-input-background, var(--tjs-input-background));border-radius:var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));display:block;overflow:hidden;height:var(--tjs-comp-input-height, var(--tjs-input-height));width:var(--tjs-comp-input-width, var(--tjs-input-width));transform-style:preserve-3d}input.svelte-1ed44hh{display:inline-block;position:relative;overflow:hidden;background:transparent;border:var(--tjs-comp-input-border, var(--tjs-input-border));border-radius:var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));text-align:var(--tjs-comp-input-text-align, var(--tjs-input-text-align));width:100%;height:100%;color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;cursor:var(--tjs-comp-input-cursor, var(--tjs-input-cursor));transform:translateZ(1px)}");
}

function create_fragment$4(ctx) {
	let div;
	let input_1;
	let applyStyles_action;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			input_1 = element("input");
			attr(input_1, "class", "tjs-input svelte-1ed44hh");
			attr(input_1, "placeholder", /*placeholder*/ ctx[1]);
			input_1.disabled = /*disabled*/ ctx[0];
			attr(div, "class", "tjs-input-container svelte-1ed44hh");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input_1);
			set_input_value(input_1, /*$store*/ ctx[5]);

			if (!mounted) {
				dispose = [
					listen(input_1, "input", /*input_1_input_handler*/ ctx[8]),
					action_destroyer(autoBlur.call(null, input_1)),
					action_destroyer(/*efx*/ ctx[4].call(null, div)),
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[3]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*placeholder*/ 2) {
				attr(input_1, "placeholder", /*placeholder*/ ctx[1]);
			}

			if (dirty & /*disabled*/ 1) {
				input_1.disabled = /*disabled*/ ctx[0];
			}

			if (dirty & /*$store*/ 32 && input_1.value !== /*$store*/ ctx[5]) {
				set_input_value(input_1, /*$store*/ ctx[5]);
			}

			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 8) applyStyles_action.update.call(null, /*styles*/ ctx[3]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(5, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { input } = $$props;
	let { type } = $$props;
	let { disabled } = $$props;
	let { placeholder } = $$props;
	let { store } = $$props;
	$$subscribe_store();
	let { styles } = $$props;
	let { efx } = $$props;

	onMount(() => {
		
	});

	function input_1_input_handler() {
		$store = this.value;
		store.set($store);
	}

	$$self.$$set = $$props => {
		if ('input' in $$props) $$invalidate(7, input = $$props.input);
		if ('type' in $$props) $$invalidate(6, type = $$props.type);
		if ('disabled' in $$props) $$invalidate(0, disabled = $$props.disabled);
		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
		if ('store' in $$props) $$subscribe_store($$invalidate(2, store = $$props.store));
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(4, efx = $$props.efx);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*input, type*/ 192) {
			$$invalidate(6, type = typeof input === 'object' && typeof input.type === 'string'
			? input.type
			: typeof type === 'string' ? type : void 0);
		}

		if ($$self.$$.dirty & /*input, disabled*/ 129) {
			$$invalidate(0, disabled = typeof input === 'object' && typeof input.disabled === 'boolean'
			? input.disabled
			: typeof disabled === 'boolean' ? disabled : false);
		}

		if ($$self.$$.dirty & /*input, placeholder*/ 130) {
			$$invalidate(1, placeholder = typeof input === 'object' && typeof input.placeholder === 'string'
			? localize(input.placeholder)
			: typeof placeholder === 'string'
				? localize(placeholder)
				: void 0);
		}

		if ($$self.$$.dirty & /*input, store*/ 132) {
			$$subscribe_store($$invalidate(2, store = typeof input === 'object' && isSettableStore(input.store)
			? input.store
			: isSettableStore(store) ? store : writable(void 0)));
		}

		if ($$self.$$.dirty & /*input, styles*/ 136) {
			$$invalidate(3, styles = typeof input === 'object' && typeof input.styles === 'object'
			? input.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*input, efx*/ 144) {
			$$invalidate(4, efx = typeof input === 'object' && typeof input.efx === 'function'
			? input.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}
	};

	return [
		disabled,
		placeholder,
		store,
		styles,
		efx,
		$store,
		type,
		input,
		input_1_input_handler
	];
}

class TJSInput extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$4,
			create_fragment$4,
			safe_not_equal,
			{
				input: 7,
				type: 6,
				disabled: 0,
				placeholder: 1,
				store: 2,
				styles: 3,
				efx: 4
			},
			add_css$3
		);
	}
}

/* src\component\standard\form\select\TJSSelect.svelte generated by Svelte v3.46.0 */

function add_css$2(target) {
	append_styles(target, "svelte-10sj76s", ".tjs-select-container.svelte-10sj76s.svelte-10sj76s{background:var(--tjs-comp-select-background, var(--tjs-input-background));border-radius:var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));display:block;overflow:hidden;height:var(--tjs-comp-select-height, var(--tjs-input-height));width:var(--tjs-comp-select-width, var(--tjs-input-width));transform-style:preserve-3d}select.svelte-10sj76s.svelte-10sj76s{display:inline-block;position:relative;overflow:hidden;background:transparent;border:var(--tjs-comp-select-border, var(--tjs-input-border));border-radius:var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));width:100%;height:100%;color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;cursor:var(--tjs-comp-select-cursor, var(--tjs-input-cursor));transform:translateZ(1px)}select.svelte-10sj76s option.svelte-10sj76s{background:var(--tjs-comp-select-background, var(--tjs-input-background));color:inherit}");
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	return child_ctx;
}

// (67:6) {#each options as option}
function create_each_block$2(ctx) {
	let option;
	let t0_value = /*option*/ ctx[8].label + "";
	let t0;
	let t1;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t0 = text(t0_value);
			t1 = space();
			attr(option, "class", "tjs-select-option svelte-10sj76s");
			option.__value = option_value_value = /*option*/ ctx[8].value;
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*options*/ 1 && t0_value !== (t0_value = /*option*/ ctx[8].label + "")) set_data(t0, t0_value);

			if (dirty & /*options*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[8].value)) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment$3(ctx) {
	let div;
	let select_1;
	let applyStyles_action;
	let mounted;
	let dispose;
	let each_value = /*options*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
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

function instance$3($$self, $$props, $$invalidate) {
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
			$$subscribe_store($$invalidate(1, store = typeof select === 'object' && isSettableStore(select.store)
			? select.store
			: isSettableStore(store) ? store : writable(void 0)));
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
			instance$3,
			create_fragment$3,
			safe_not_equal,
			{
				select: 6,
				selected: 5,
				options: 0,
				store: 1,
				styles: 2,
				efx: 3
			},
			add_css$2
		);
	}
}

/* src\component\standard\menu\TJSMenu.svelte generated by Svelte v3.46.0 */

function add_css$1(target) {
	append_styles(target, "svelte-1uy10ia", ".tjs-menu.svelte-1uy10ia.svelte-1uy10ia.svelte-1uy10ia{position:absolute;width:fit-content;height:max-content;box-shadow:0 0 2px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));background:var(--typhonjs-color-content-window, #23221d);border:1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));border-radius:5px;color:var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));text-align:start;z-index:1}.tjs-menu.svelte-1uy10ia ol.tjs-menu-items.svelte-1uy10ia.svelte-1uy10ia{list-style:none;margin:0;padding:0}.tjs-menu.svelte-1uy10ia li.tjs-menu-item.svelte-1uy10ia.svelte-1uy10ia{padding:0 0.5em;line-height:2em}.tjs-menu.svelte-1uy10ia li.tjs-menu-item.svelte-1uy10ia.svelte-1uy10ia:hover{color:var(--typhonjs-color-text-primary, #FFF);text-shadow:0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red))}.tjs-menu.svelte-1uy10ia li.tjs-menu-item.svelte-1uy10ia>i.svelte-1uy10ia{margin-right:5px}");
}

const get_after_slot_changes$1 = dirty => ({});
const get_after_slot_context$1 = ctx => ({});

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	return child_ctx;
}

const get_before_slot_changes$1 = dirty => ({});
const get_before_slot_context$1 = ctx => ({});

// (135:6) {#each items as item}
function create_each_block$1(ctx) {
	let li;
	let i;
	let i_class_value;
	let t_value = localize(/*item*/ ctx[18].label) + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[13](/*item*/ ctx[18]);
	}

	return {
		c() {
			li = element("li");
			i = element("i");
			t = text(t_value);
			attr(i, "class", i_class_value = "" + (null_to_empty(/*item*/ ctx[18].icon) + " svelte-1uy10ia"));
			attr(li, "class", "tjs-menu-item svelte-1uy10ia");
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

			if (dirty & /*items*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*item*/ ctx[18].icon) + " svelte-1uy10ia"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*items*/ 1 && t_value !== (t_value = localize(/*item*/ ctx[18].label) + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$2(ctx) {
	let t0;
	let nav;
	let ol;
	let t1;
	let t2;
	let nav_transition;
	let current;
	let mounted;
	let dispose;
	const before_slot_template = /*#slots*/ ctx[12].before;
	const before_slot = create_slot(before_slot_template, ctx, /*$$scope*/ ctx[11], get_before_slot_context$1);
	let each_value = /*items*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const after_slot_template = /*#slots*/ ctx[12].after;
	const after_slot = create_slot(after_slot_template, ctx, /*$$scope*/ ctx[11], get_after_slot_context$1);

	return {
		c() {
			t0 = space();
			nav = element("nav");
			ol = element("ol");
			if (before_slot) before_slot.c();
			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			if (after_slot) after_slot.c();
			attr(ol, "class", "tjs-menu-items svelte-1uy10ia");
			attr(nav, "class", "tjs-menu svelte-1uy10ia");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, nav, anchor);
			append(nav, ol);

			if (before_slot) {
				before_slot.m(ol, null);
			}

			append(ol, t1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ol, null);
			}

			append(ol, t2);

			if (after_slot) {
				after_slot.m(ol, null);
			}

			/*nav_binding*/ ctx[14](nav);
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
			if (before_slot) {
				if (before_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						before_slot,
						before_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(before_slot_template, /*$$scope*/ ctx[11], dirty, get_before_slot_changes$1),
						get_before_slot_context$1
					);
				}
			}

			if (dirty & /*onClick, items, localize*/ 33) {
				each_value = /*items*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ol, t2);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (after_slot) {
				if (after_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						after_slot,
						after_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(after_slot_template, /*$$scope*/ ctx[11], dirty, get_after_slot_changes$1),
						get_after_slot_context$1
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(before_slot, local);
			transition_in(after_slot, local);

			add_render_callback(() => {
				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, true);
				nav_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(before_slot, local);
			transition_out(after_slot, local);
			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, false);
			nav_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(nav);
			if (before_slot) before_slot.d(detaching);
			destroy_each(each_blocks, detaching);
			if (after_slot) after_slot.d(detaching);
			/*nav_binding*/ ctx[14](null);
			if (detaching && nav_transition) nav_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let $storeElementRoot;
	let { $$slots: slots = {}, $$scope } = $$props;
	const s_DEFAULT_OFFSET = { x: 0, y: 0 };
	let { menu } = $$props;
	let { items } = $$props;
	let { offset } = $$props;
	let { styles } = $$props;
	let { efx } = $$props;
	let { transitionOptions } = $$props;
	const storeElementRoot = getContext('storeElementRoot');
	component_subscribe($$self, storeElementRoot, value => $$invalidate(16, $storeElementRoot = value));

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
		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*menu, items*/ 1025) {
			{
				const allItems = typeof menu === 'object' && Array.isArray(menu.items)
				? menu.items
				: Array.isArray(items) ? items : [];

				// Filter items for any condition that prevents display.
				$$invalidate(0, items = allItems.filter(item => item.condition === void 0
				? true
				: typeof item.condition === 'function'
					? item.condition()
					: item.condition));
			}
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
		$$scope,
		slots,
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
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				menu: 10,
				items: 0,
				offset: 7,
				styles: 8,
				efx: 1,
				transitionOptions: 9
			},
			add_css$1
		);
	}
}

/* src\component\standard\menu\context\TJSContextMenu.svelte generated by Svelte v3.46.0 */

const { document: document_1 } = globals;

function add_css(target) {
	append_styles(target, "svelte-ugn418", ".tjs-context-menu.svelte-ugn418.svelte-ugn418.svelte-ugn418{position:fixed;width:fit-content;font-size:14px;box-shadow:0 0 10px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));height:max-content;min-width:20px;max-width:360px;background:var(--typhonjs-color-content-window, #23221d);border:1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));border-radius:5px;color:var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));text-align:start}.tjs-context-menu.svelte-ugn418 ol.tjs-context-items.svelte-ugn418.svelte-ugn418{list-style:none;margin:0;padding:0}.tjs-context-menu.svelte-ugn418 li.tjs-context-item.svelte-ugn418.svelte-ugn418{padding:0 0.5em;line-height:2em}.tjs-context-menu.svelte-ugn418 li.tjs-context-item.svelte-ugn418.svelte-ugn418:hover{color:var(--typhonjs-color-text-primary, #FFF);text-shadow:0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red))}.tjs-context-menu.svelte-ugn418 li.tjs-context-item.svelte-ugn418>i.svelte-ugn418{margin-right:5px}");
}

const get_after_slot_changes = dirty => ({});
const get_after_slot_context = ctx => ({});

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	return child_ctx;
}

const get_before_slot_changes = dirty => ({});
const get_before_slot_context = ctx => ({});

// (97:8) {#each items as item}
function create_each_block(ctx) {
	let li;
	let i;
	let i_class_value;
	let t_value = localize(/*item*/ ctx[17].label) + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[12](/*item*/ ctx[17]);
	}

	return {
		c() {
			li = element("li");
			i = element("i");
			t = text(t_value);
			attr(i, "class", i_class_value = "" + (null_to_empty(/*item*/ ctx[17].icon) + " svelte-ugn418"));
			attr(li, "class", "tjs-context-item svelte-ugn418");
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

			if (dirty & /*items*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*item*/ ctx[17].icon) + " svelte-ugn418"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*items*/ 2 && t_value !== (t_value = localize(/*item*/ ctx[17].label) + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$1(ctx) {
	let t0;
	let nav;
	let ol;
	let t1;
	let t2;
	let nav_transition;
	let current;
	let mounted;
	let dispose;
	const before_slot_template = /*#slots*/ ctx[11].before;
	const before_slot = create_slot(before_slot_template, ctx, /*$$scope*/ ctx[10], get_before_slot_context);
	let each_value = /*items*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const after_slot_template = /*#slots*/ ctx[11].after;
	const after_slot = create_slot(after_slot_template, ctx, /*$$scope*/ ctx[10], get_after_slot_context);

	return {
		c() {
			t0 = space();
			nav = element("nav");
			ol = element("ol");
			if (before_slot) before_slot.c();
			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			if (after_slot) after_slot.c();
			attr(ol, "class", "tjs-context-items svelte-ugn418");
			attr(nav, "id", /*id*/ ctx[0]);
			attr(nav, "class", "tjs-context-menu svelte-ugn418");
			set_style(nav, "z-index", /*zIndex*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, nav, anchor);
			append(nav, ol);

			if (before_slot) {
				before_slot.m(ol, null);
			}

			append(ol, t1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ol, null);
			}

			append(ol, t2);

			if (after_slot) {
				after_slot.m(ol, null);
			}

			/*nav_binding*/ ctx[13](nav);
			current = true;

			if (!mounted) {
				dispose = listen(document_1.body, "pointerdown", /*onClose*/ ctx[6]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (before_slot) {
				if (before_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
					update_slot_base(
						before_slot,
						before_slot_template,
						ctx,
						/*$$scope*/ ctx[10],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
						: get_slot_changes(before_slot_template, /*$$scope*/ ctx[10], dirty, get_before_slot_changes),
						get_before_slot_context
					);
				}
			}

			if (dirty & /*onClick, items, localize*/ 34) {
				each_value = /*items*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ol, t2);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (after_slot) {
				if (after_slot.p && (!current || dirty & /*$$scope*/ 1024)) {
					update_slot_base(
						after_slot,
						after_slot_template,
						ctx,
						/*$$scope*/ ctx[10],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
						: get_slot_changes(after_slot_template, /*$$scope*/ ctx[10], dirty, get_after_slot_changes),
						get_after_slot_context
					);
				}
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
			transition_in(before_slot, local);
			transition_in(after_slot, local);

			add_render_callback(() => {
				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, true);
				nav_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(before_slot, local);
			transition_out(after_slot, local);
			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[4], {}, false);
			nav_transition.run(0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(nav);
			if (before_slot) before_slot.d(detaching);
			destroy_each(each_blocks, detaching);
			if (after_slot) after_slot.d(detaching);
			/*nav_binding*/ ctx[13](null);
			if (detaching && nav_transition) nav_transition.end();
			mounted = false;
			dispose();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
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
		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
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
		$$scope,
		slots,
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
			instance$1,
			create_fragment$1,
			safe_not_equal,
			{
				id: 0,
				x: 7,
				y: 8,
				items: 1,
				zIndex: 2,
				transitionOptions: 9
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
   '--tjs-icon-button-transition': 'background 200ms linear, clip-path 200ms linear'
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

export { TJSContextMenu, TJSIconFolder, TJSInput, TJSMenu, TJSSelect, TJSStyleProperties, TJSSvgFolder, TJSToggleIconButton };
//# sourceMappingURL=index.js.map
