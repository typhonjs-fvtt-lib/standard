import { SvelteComponent, init, safe_not_equal, append_styles, element, attr, null_to_empty, insert, append, listen, action_destroyer, is_function, noop, detach, run_all, bubble, update_slot_base, get_all_dirty_from_scope, get_slot_changes, transition_in, transition_out, space, toggle_class, group_outros, check_outros, subscribe, create_slot, svg_element, set_style, text, set_data, set_store_value, binding_callbacks, assign, set_attributes, set_input_value, get_spread_update, add_render_callback, select_option, destroy_each, select_value, stop_propagation, prevent_default, empty, create_component, mount_component, destroy_component, update_keyed_each, outro_and_destroy_block, component_subscribe, create_bidirectional_transition, globals, current_component } from 'svelte/internal';
import { applyStyles, autoBlur } from '@typhonjs-fvtt/runtime/svelte/action';
import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
import { isWritableStore, propertyStore } from '@typhonjs-fvtt/runtime/svelte/store';
import { onDestroy, onMount, getContext, setContext, createEventDispatcher } from 'svelte';
import { writable } from 'svelte/store';
import { isObject, getStackingContext, outroAndDestroy } from '@typhonjs-fvtt/runtime/svelte/util';
import { toggleDetails } from '@typhonjs-fvtt/svelte-standard/action';
import { applyPosition } from '@typhonjs-fvtt/runtime/svelte/action';
import { Position } from '@typhonjs-fvtt/runtime/svelte/application';
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

/* src\component\standard\button\TJSIconButton.svelte generated by Svelte v3.49.0 */

function add_css$b(target) {
	append_styles(target, "svelte-su3d4z", "div.svelte-su3d4z{pointer-events:none;display:block;flex:0 0 var(--tjs-icon-button-diameter);height:var(--tjs-icon-button-diameter);width:var(--tjs-icon-button-diameter);align-self:center;text-align:center}a.svelte-su3d4z{pointer-events:initial;display:inline-block;background:var(--tjs-icon-button-background);border-radius:var(--tjs-icon-button-border-radius);position:relative;overflow:hidden;clip-path:var(--tjs-icon-button-clip-path, none);transform-style:preserve-3d;width:100%;height:100%;transition:var(--tjs-icon-button-transition)}a.svelte-su3d4z:hover{background:var(--tjs-icon-button-background-hover);clip-path:var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, none))}i.svelte-su3d4z{line-height:var(--tjs-icon-button-diameter);transform:translateZ(1px)}");
}

function create_fragment$c(ctx) {
	let div;
	let a;
	let i;
	let i_class_value;
	let div_title_value;
	let applyStyles_action;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			a = element("a");
			i = element("i");
			attr(i, "class", i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-su3d4z"));
			attr(a, "class", "svelte-su3d4z");
			attr(div, "title", div_title_value = localize(/*title*/ ctx[1]));
			attr(div, "class", "svelte-su3d4z");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, a);
			append(a, i);

			if (!mounted) {
				dispose = [
					listen(a, "click", /*click_handler_1*/ ctx[8]),
					action_destroyer(/*efx*/ ctx[3].call(null, a)),
					listen(div, "click", /*click_handler*/ ctx[7]),
					listen(div, "click", /*onClick*/ ctx[4]),
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[2]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*icon*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-su3d4z"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*title*/ 2 && div_title_value !== (div_title_value = localize(/*title*/ ctx[1]))) {
				attr(div, "title", div_title_value);
			}

			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 4) applyStyles_action.update.call(null, /*styles*/ ctx[2]);
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

function instance$b($$self, $$props, $$invalidate) {
	let { button } = $$props;
	let { icon } = $$props;
	let { title } = $$props;
	let { styles } = $$props;
	let { efx } = $$props;
	let { onClickPropagate } = $$props;

	function onClick(event) {
		if (!onClickPropagate) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	function click_handler_1(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('button' in $$props) $$invalidate(6, button = $$props.button);
		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
		if ('title' in $$props) $$invalidate(1, title = $$props.title);
		if ('styles' in $$props) $$invalidate(2, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(3, efx = $$props.efx);
		if ('onClickPropagate' in $$props) $$invalidate(5, onClickPropagate = $$props.onClickPropagate);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*button, icon*/ 65) {
			$$invalidate(0, icon = typeof button === 'object' && typeof button.icon === 'string'
			? button.icon
			: typeof icon === 'string' ? icon : '');
		}

		if ($$self.$$.dirty & /*button, title*/ 66) {
			$$invalidate(1, title = typeof button === 'object' && typeof button.title === 'string'
			? button.title
			: typeof title === 'string' ? title : '');
		}

		if ($$self.$$.dirty & /*button, styles*/ 68) {
			$$invalidate(2, styles = typeof button === 'object' && typeof button.styles === 'object'
			? button.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*button, efx*/ 72) {
			$$invalidate(3, efx = typeof button === 'object' && typeof button.efx === 'function'
			? button.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}

		if ($$self.$$.dirty & /*button, onClickPropagate*/ 96) {
			$$invalidate(5, onClickPropagate = typeof button === 'object' && typeof button.onClickPropagate === 'boolean'
			? button.onClickPropagate
			: typeof onClickPropagate === 'boolean'
				? onClickPropagate
				: true);
		}
	};

	return [
		icon,
		title,
		styles,
		efx,
		onClick,
		onClickPropagate,
		button,
		click_handler,
		click_handler_1
	];
}

class TJSIconButton extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$b,
			create_fragment$c,
			safe_not_equal,
			{
				button: 6,
				icon: 0,
				title: 1,
				styles: 2,
				efx: 3,
				onClickPropagate: 5
			},
			add_css$b
		);
	}
}

/* src\component\standard\button\TJSToggleIconButton.svelte generated by Svelte v3.49.0 */

function add_css$a(target) {
	append_styles(target, "svelte-qlfxx4", "div.svelte-qlfxx4{display:block;position:relative;flex:0 0 var(--tjs-icon-button-diameter);height:var(--tjs-icon-button-diameter);width:var(--tjs-icon-button-diameter);align-self:center;text-align:center}a.svelte-qlfxx4{pointer-events:initial;display:inline-block;background:var(--tjs-icon-button-background);border-radius:var(--tjs-icon-button-border-radius);position:relative;overflow:hidden;clip-path:var(--tjs-icon-button-clip-path, none);transform-style:preserve-3d;width:100%;height:100%;transition:var(--tjs-icon-button-transition)}a.svelte-qlfxx4:hover{background:var(--tjs-icon-button-background-hover);clip-path:var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, none))}a.selected.svelte-qlfxx4{background:var(--tjs-icon-button-background-selected);clip-path:var(--tjs-icon-button-clip-path-selected, var(--tjs-icon-button-clip-path, none))}i.svelte-qlfxx4{line-height:var(--tjs-icon-button-diameter);transform:translateZ(1px)}");
}

// (103:3) {#if selected}
function create_if_block$3(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[16].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

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

function create_fragment$b(ctx) {
	let div;
	let a;
	let i;
	let i_class_value;
	let t;
	let div_title_value;
	let applyStyles_action;
	let current;
	let mounted;
	let dispose;
	let if_block = /*selected*/ ctx[4] && create_if_block$3(ctx);

	return {
		c() {
			div = element("div");
			a = element("a");
			i = element("i");
			t = space();
			if (if_block) if_block.c();
			attr(i, "class", i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-qlfxx4"));
			toggle_class(i, "selected", /*selected*/ ctx[4]);
			attr(a, "class", "svelte-qlfxx4");
			toggle_class(a, "selected", /*selected*/ ctx[4]);
			attr(div, "title", div_title_value = localize(/*titleCurrent*/ ctx[5]));
			attr(div, "class", "svelte-qlfxx4");
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
					listen(a, "click", /*onClick*/ ctx[6]),
					action_destroyer(/*efx*/ ctx[3].call(null, a)),
					listen(div, "close", /*close_handler*/ ctx[17]),
					listen(div, "click", /*click_handler*/ ctx[18]),
					listen(div, "click", /*onClickDiv*/ ctx[7]),
					listen(div, "close", /*onClose*/ ctx[8]),
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[2]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*icon*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*icon*/ ctx[0]) + " svelte-qlfxx4"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*icon, selected*/ 17) {
				toggle_class(i, "selected", /*selected*/ ctx[4]);
			}

			if (dirty & /*selected*/ 16) {
				toggle_class(a, "selected", /*selected*/ ctx[4]);
			}

			if (/*selected*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*selected*/ 16) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$3(ctx);
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

			if (!current || dirty & /*titleCurrent*/ 32 && div_title_value !== (div_title_value = localize(/*titleCurrent*/ ctx[5]))) {
				attr(div, "title", div_title_value);
			}

			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 4) applyStyles_action.update.call(null, /*styles*/ ctx[2]);
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

function instance$a($$self, $$props, $$invalidate) {
	let titleCurrent;

	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(14, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { $$slots: slots = {}, $$scope } = $$props;
	let { button } = $$props;
	let { icon } = $$props;
	let { title } = $$props;
	let { titleSelected } = $$props;
	let { store } = $$props;
	$$subscribe_store();
	let { styles } = $$props;
	let { efx } = $$props;
	let { onClickPropagate } = $$props;
	let { onClosePropagate } = $$props;
	let selected = false;

	function onClick(event) {
		$$invalidate(4, selected = !selected);

		if (store) {
			store.set(selected);
		}

		if (!onClickPropagate) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	/**
 * In this case we can't set pointer-events: none for the div due to the slotted component, so process clicks on the
 * div in respect to onClickPropagate.
 *
 * @param {MouseEvent} event -
 */
	function onClickDiv(event) {
		if (!onClickPropagate) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	/**
 * Handles `close` event from any children elements.
 */
	function onClose(event) {
		$$invalidate(4, selected = false);

		if (store) {
			store.set(false);
		}

		if (!onClosePropagate) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	function close_handler(event) {
		bubble.call(this, $$self, event);
	}

	function click_handler(event) {
		bubble.call(this, $$self, event);
	}

	$$self.$$set = $$props => {
		if ('button' in $$props) $$invalidate(13, button = $$props.button);
		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
		if ('title' in $$props) $$invalidate(9, title = $$props.title);
		if ('titleSelected' in $$props) $$invalidate(10, titleSelected = $$props.titleSelected);
		if ('store' in $$props) $$subscribe_store($$invalidate(1, store = $$props.store));
		if ('styles' in $$props) $$invalidate(2, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(3, efx = $$props.efx);
		if ('onClickPropagate' in $$props) $$invalidate(11, onClickPropagate = $$props.onClickPropagate);
		if ('onClosePropagate' in $$props) $$invalidate(12, onClosePropagate = $$props.onClosePropagate);
		if ('$$scope' in $$props) $$invalidate(15, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*button, icon*/ 8193) {
			$$invalidate(0, icon = typeof button === 'object' && typeof button.icon === 'string'
			? button.icon
			: typeof icon === 'string' ? icon : '');
		}

		if ($$self.$$.dirty & /*button, title*/ 8704) {
			$$invalidate(9, title = typeof button === 'object' && typeof button.title === 'string'
			? button.title
			: typeof title === 'string' ? title : '');
		}

		if ($$self.$$.dirty & /*button, titleSelected*/ 9216) {
			$$invalidate(10, titleSelected = typeof button === 'object' && typeof button.titleSelected === 'string'
			? button.titleSelected
			: typeof titleSelected === 'string' ? titleSelected : '');
		}

		if ($$self.$$.dirty & /*button, store*/ 8194) {
			$$subscribe_store($$invalidate(1, store = typeof button === 'object' && isWritableStore(button.store)
			? button.store
			: isWritableStore(store) ? store : void 0));
		}

		if ($$self.$$.dirty & /*button, styles*/ 8196) {
			$$invalidate(2, styles = typeof button === 'object' && typeof button.styles === 'object'
			? button.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*button, efx*/ 8200) {
			$$invalidate(3, efx = typeof button === 'object' && typeof button.efx === 'function'
			? button.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}

		if ($$self.$$.dirty & /*button, onClosePropagate*/ 12288) {
			$$invalidate(12, onClosePropagate = typeof button === 'object' && typeof button.onClosePropagate === 'boolean'
			? button.onClosePropagate
			: typeof onClosePropagate === 'boolean'
				? onClosePropagate
				: true);
		}

		if ($$self.$$.dirty & /*button, onClickPropagate*/ 10240) {
			$$invalidate(11, onClickPropagate = typeof button === 'object' && typeof button.onClickPropagate === 'boolean'
			? button.onClickPropagate
			: typeof onClickPropagate === 'boolean'
				? onClickPropagate
				: true);
		}

		if ($$self.$$.dirty & /*store, $store*/ 16386) {
			if (store) {
				$$invalidate(4, selected = $store);
			}
		}

		if ($$self.$$.dirty & /*selected, titleSelected, title*/ 1552) {
			// Chose the current title when `selected` changes; if there is no `titleSelected` fallback to `title`.
			$$invalidate(5, titleCurrent = selected && titleSelected !== '' ? titleSelected : title);
		}
	};

	return [
		icon,
		store,
		styles,
		efx,
		selected,
		titleCurrent,
		onClick,
		onClickDiv,
		onClose,
		title,
		titleSelected,
		onClickPropagate,
		onClosePropagate,
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
			instance$a,
			create_fragment$b,
			safe_not_equal,
			{
				button: 13,
				icon: 0,
				title: 9,
				titleSelected: 10,
				store: 1,
				styles: 2,
				efx: 3,
				onClickPropagate: 11,
				onClosePropagate: 12
			},
			add_css$a
		);
	}
}

/* src\component\standard\folder\TJSSvgFolder.svelte generated by Svelte v3.49.0 */

function add_css$9(target) {
	append_styles(target, "svelte-1hxu1tb", "details.svelte-1hxu1tb.svelte-1hxu1tb{margin-left:-5px;padding-left:var(--tjs-details-padding-left, 5px)}summary.svelte-1hxu1tb.svelte-1hxu1tb{display:flex;position:relative;align-items:center;background-blend-mode:var(--tjs-summary-background-blend-mode, initial);background:var(--tjs-summary-background, none);border:var(--tjs-summary-border, none);border-radius:var(--tjs-summary-border-radius, 0);border-width:var(--tjs-summary-border-width, initial);cursor:var(--tjs-summary-cursor, pointer);font-size:var(--tjs-summary-font-size, inherit);font-weight:var(--tjs-summary-font-weight, bold);font-family:var(--tjs-summary-font-family, inherit);list-style:none;margin:var(--tjs-summary-margin, 0 0 0 -5px);padding:var(--tjs-summary-padding, 4px) 0;user-select:none;width:var(--tjs-summary-width, fit-content)}.default-cursor.svelte-1hxu1tb.svelte-1hxu1tb{cursor:default}summary.svelte-1hxu1tb svg.svelte-1hxu1tb{width:var(--tjs-summary-chevron-size, var(--tjs-summary-font-size, 15px));height:var(--tjs-summary-chevron-size, var(--tjs-summary-font-size, 15px));color:var(--tjs-summary-chevron-color, currentColor);cursor:var(--tjs-summary-cursor, pointer);opacity:var(--tjs-summary-chevron-opacity, 0.2);margin:0 5px 0 0;transition:opacity 0.2s, transform 0.1s;transform:rotate(var(--tjs-summary-chevron-rotate-closed, -90deg))}summary.svelte-1hxu1tb:hover svg.svelte-1hxu1tb{opacity:var(--tjs-summary-chevron-opacity-hover, 1)}details[open].svelte-1hxu1tb>summary.svelte-1hxu1tb{background:var(--tjs-summary-background-open, var(--tjs-summary-background, inherit))}[open].svelte-1hxu1tb:not(details[data-closing='true'])>summary svg.svelte-1hxu1tb{transform:rotate(var(--tjs-summary-chevron-rotate-open, 0))}.contents.svelte-1hxu1tb.svelte-1hxu1tb{position:relative;background-blend-mode:var(--tjs-contents-background-blend-mode, initial);background:var(--tjs-contents-background, none);border:var(--tjs-contents-border, none);margin:var(--tjs-contents-margin, 0 0 0 -5px);padding:var(--tjs-contents-padding, 0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8))}.contents.svelte-1hxu1tb.svelte-1hxu1tb::before{content:'';position:absolute;width:0;height:calc(100% + 8px);left:0;top:-8px}summary.svelte-1hxu1tb:focus-visible+.contents.svelte-1hxu1tb::before{height:100%;top:0}");
}

const get_summary_end_slot_changes$1 = dirty => ({});
const get_summary_end_slot_context$1 = ctx => ({});
const get_label_slot_changes$1 = dirty => ({});
const get_label_slot_context$1 = ctx => ({});

// (254:25) {label}
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

function create_fragment$a(ctx) {
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
	const label_slot_template = /*#slots*/ ctx[15].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[14], get_label_slot_context$1);
	const label_slot_or_fallback = label_slot || fallback_block$1(ctx);
	const summary_end_slot_template = /*#slots*/ ctx[15]["summary-end"];
	const summary_end_slot = create_slot(summary_end_slot_template, ctx, /*$$scope*/ ctx[14], get_summary_end_slot_context$1);
	const default_slot_template = /*#slots*/ ctx[15].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

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
			attr(svg, "class", "svelte-1hxu1tb");
			attr(summary, "class", "svelte-1hxu1tb");
			toggle_class(summary, "default-cursor", /*localOptions*/ ctx[5].chevronOnly);
			attr(div, "class", "contents svelte-1hxu1tb");
			attr(details, "class", "tjs-folder svelte-1hxu1tb");
			attr(details, "data-id", /*id*/ ctx[0]);
			attr(details, "data-label", /*label*/ ctx[1]);
			attr(details, "data-closing", "false");
		},
		m(target, anchor) {
			insert(target, details, anchor);
			append(details, summary);
			append(summary, svg);
			append(svg, path);
			/*svg_binding*/ ctx[21](svg);
			append(summary, t0);

			if (label_slot_or_fallback) {
				label_slot_or_fallback.m(summary, null);
			}

			append(summary, t1);

			if (summary_end_slot) {
				summary_end_slot.m(summary, null);
			}

			/*summary_binding*/ ctx[22](summary);
			append(details, t2);
			append(details, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			/*details_binding*/ ctx[23](details);
			current = true;

			if (!mounted) {
				dispose = [
					listen(summary, "click", /*onClickSummary*/ ctx[9], true),
					listen(summary, "contextmenu", function () {
						if (is_function(/*onContextMenu*/ ctx[4])) /*onContextMenu*/ ctx[4].apply(this, arguments);
					}),
					listen(summary, "keyup", /*onKeyUp*/ ctx[10]),
					listen(details, "click", /*click_handler*/ ctx[16]),
					listen(details, "open", /*open_handler*/ ctx[17]),
					listen(details, "close", /*close_handler*/ ctx[18]),
					listen(details, "openAny", /*openAny_handler*/ ctx[19]),
					listen(details, "closeAny", /*closeAny_handler*/ ctx[20]),
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
				if (label_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
					update_slot_base(
						label_slot,
						label_slot_template,
						ctx,
						/*$$scope*/ ctx[14],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[14], dirty, get_label_slot_changes$1),
						get_label_slot_context$1
					);
				}
			} else {
				if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty & /*label*/ 2)) {
					label_slot_or_fallback.p(ctx, !current ? -1 : dirty);
				}
			}

			if (summary_end_slot) {
				if (summary_end_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
					update_slot_base(
						summary_end_slot,
						summary_end_slot_template,
						ctx,
						/*$$scope*/ ctx[14],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
						: get_slot_changes(summary_end_slot_template, /*$$scope*/ ctx[14], dirty, get_summary_end_slot_changes$1),
						get_summary_end_slot_context$1
					);
				}
			}

			if (dirty & /*localOptions*/ 32) {
				toggle_class(summary, "default-cursor", /*localOptions*/ ctx[5].chevronOnly);
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[14],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null),
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
			/*svg_binding*/ ctx[21](null);
			if (label_slot_or_fallback) label_slot_or_fallback.d(detaching);
			if (summary_end_slot) summary_end_slot.d(detaching);
			/*summary_binding*/ ctx[22](null);
			if (default_slot) default_slot.d(detaching);
			/*details_binding*/ ctx[23](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(24, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { $$slots: slots = {}, $$scope } = $$props;
	let { folder = void 0 } = $$props;

	let { id = isObject(folder) && typeof folder.id === 'string'
	? folder.id
	: void 0 } = $$props;

	let { label = isObject(folder) && typeof folder.label === 'string'
	? folder.label
	: '' } = $$props;

	let { options = isObject(folder) && isObject(folder.options)
	? folder.options
	: {} } = $$props;

	let { store = isObject(folder) && isWritableStore(folder.store)
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

	/** @type {TJSFolderOptions} */
	const localOptions = { chevronOnly: false, noKeys: false };

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
		const target = event.target;
		const chevronTarget = target === svgEl || svgEl.contains(target);

		if (target === summaryEl || chevronTarget || target.querySelector('.summary-click') !== null) {
			if (localOptions.chevronOnly && !chevronTarget) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}

			set_store_value(store, $store = !$store, $store);
			onClick(event);
			event.preventDefault();
			event.stopPropagation();
		} else {
			// Handle exclusion cases when no-summary-click class is in target, targets children, or targets parent
			// element.
			if (target.classList.contains('no-summary-click') || target.querySelector('.no-summary-click') !== null || target.parentElement && target.parentElement.classList.contains('no-summary-click')) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
	}

	/**
 * When localOptions `noKeys` is true prevent `space bar` / 'space' from activating folder open / close.
 *
 * @param {KeyboardEvent} event -
 */
	function onKeyUp(event) {
		if (localOptions.noKeys && event.key === ' ') {
			event.preventDefault();
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
			$$invalidate(8, svgEl);
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
			$$invalidate(6, detailsEl);
		});
	}

	$$self.$$set = $$props => {
		if ('folder' in $$props) $$invalidate(13, folder = $$props.folder);
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('options' in $$props) $$invalidate(11, options = $$props.options);
		if ('store' in $$props) $$subscribe_store($$invalidate(2, store = $$props.store));
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('onClick' in $$props) $$invalidate(12, onClick = $$props.onClick);
		if ('onContextMenu' in $$props) $$invalidate(4, onContextMenu = $$props.onContextMenu);
		if ('$$scope' in $$props) $$invalidate(14, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*folder, id*/ 8193) {
			$$invalidate(0, id = isObject(folder) && typeof folder.id === 'string'
			? folder.id
			: typeof id === 'string' ? id : void 0);
		}

		if ($$self.$$.dirty & /*folder, label*/ 8194) {
			$$invalidate(1, label = isObject(folder) && typeof folder.label === 'string'
			? folder.label
			: typeof label === 'string' ? label : '');
		}

		if ($$self.$$.dirty & /*folder, options*/ 10240) {
			{
				$$invalidate(11, options = isObject(folder) && isObject(folder.options)
				? folder.options
				: isObject(options) ? options : {});

				if (typeof options?.chevronOnly === 'boolean') {
					$$invalidate(5, localOptions.chevronOnly = options.chevronOnly, localOptions);
				}

				if (typeof options?.noKeys === 'boolean') {
					$$invalidate(5, localOptions.noKeys = options.noKeys, localOptions);
				}
			}
		}

		if ($$self.$$.dirty & /*folder, store*/ 8196) {
			$$subscribe_store($$invalidate(2, store = isObject(folder) && isWritableStore(folder.store)
			? folder.store
			: isWritableStore(store) ? store : writable(false)));
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
	};

	return [
		id,
		label,
		store,
		styles,
		onContextMenu,
		localOptions,
		detailsEl,
		summaryEl,
		svgEl,
		onClickSummary,
		onKeyUp,
		options,
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
			instance$9,
			create_fragment$a,
			safe_not_equal,
			{
				folder: 13,
				id: 0,
				label: 1,
				options: 11,
				store: 2,
				styles: 3,
				onClick: 12,
				onContextMenu: 4
			},
			add_css$9
		);
	}
}

/* src\component\standard\folder\TJSIconFolder.svelte generated by Svelte v3.49.0 */

function add_css$8(target) {
	append_styles(target, "svelte-bjpg8h", "details.svelte-bjpg8h.svelte-bjpg8h{margin-left:-5px;padding-left:var(--tjs-details-padding-left, 5px)}summary.svelte-bjpg8h.svelte-bjpg8h{display:flex;position:relative;align-items:center;background-blend-mode:var(--tjs-summary-background-blend-mode, initial);background:var(--tjs-summary-background, none);border:var(--tjs-summary-border, none);border-radius:var(--tjs-summary-border-radius, 0);border-width:var(--tjs-summary-border-width, initial);cursor:var(--tjs-summary-cursor, pointer);font-size:var(--tjs-summary-font-size, inherit);font-weight:var(--tjs-summary-font-weight, bold);font-family:var(--tjs-summary-font-family, inherit);list-style:none;margin:var(--tjs-summary-margin, 0);padding:var(--tjs-summary-padding, 4px) 0;user-select:none;width:var(--tjs-summary-width, fit-content);transition:background 0.1s}summary.svelte-bjpg8h i.svelte-bjpg8h{color:var(--tjs-summary-chevron-color, currentColor);cursor:var(--tjs-summary-cursor, pointer);opacity:var(--tjs-summary-chevron-opacity, 1);margin:0 0 0 0.25em;width:var(--tjs-summary-chevron-width, 1.65em);transition:opacity 0.2s}summary.svelte-bjpg8h:hover i.svelte-bjpg8h{opacity:var(--tjs-summary-chevron-opacity-hover, 1)}.default-cursor.svelte-bjpg8h.svelte-bjpg8h{cursor:default}details[open].svelte-bjpg8h>summary.svelte-bjpg8h{background:var(--tjs-summary-background-open, var(--tjs-summary-background, inherit))}.contents.svelte-bjpg8h.svelte-bjpg8h{position:relative;background-blend-mode:var(--tjs-contents-background-blend-mode, initial);background:var(--tjs-contents-background, none);border:var(--tjs-contents-border, none);margin:var(--tjs-contents-margin, 0 0 0 -5px);padding:var(--tjs-contents-padding, 0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8))}.contents.svelte-bjpg8h.svelte-bjpg8h::before{content:'';position:absolute;width:0;height:calc(100% + 8px);left:0;top:-8px}summary.svelte-bjpg8h:focus-visible+.contents.svelte-bjpg8h::before{height:100%;top:0}");
}

const get_summary_end_slot_changes = dirty => ({});
const get_summary_end_slot_context = ctx => ({});
const get_label_slot_changes = dirty => ({});
const get_label_slot_context = ctx => ({});

// (262:8) {#if currentIcon}
function create_if_block$2(ctx) {
	let i;
	let i_class_value;

	return {
		c() {
			i = element("i");
			attr(i, "class", i_class_value = "" + (null_to_empty(/*currentIcon*/ ctx[9]) + " svelte-bjpg8h"));
		},
		m(target, anchor) {
			insert(target, i, anchor);
			/*i_binding*/ ctx[25](i);
		},
		p(ctx, dirty) {
			if (dirty & /*currentIcon*/ 512 && i_class_value !== (i_class_value = "" + (null_to_empty(/*currentIcon*/ ctx[9]) + " svelte-bjpg8h"))) {
				attr(i, "class", i_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(i);
			/*i_binding*/ ctx[25](null);
		}
	};
}

// (264:25) {label}
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

function create_fragment$9(ctx) {
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
	let if_block = /*currentIcon*/ ctx[9] && create_if_block$2(ctx);
	const label_slot_template = /*#slots*/ ctx[19].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[18], get_label_slot_context);
	const label_slot_or_fallback = label_slot || fallback_block(ctx);
	const summary_end_slot_template = /*#slots*/ ctx[19]["summary-end"];
	const summary_end_slot = create_slot(summary_end_slot_template, ctx, /*$$scope*/ ctx[18], get_summary_end_slot_context);
	const default_slot_template = /*#slots*/ ctx[19].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

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
			attr(summary, "class", "svelte-bjpg8h");
			toggle_class(summary, "default-cursor", /*localOptions*/ ctx[5].chevronOnly);
			attr(div, "class", "contents svelte-bjpg8h");
			attr(details, "class", "tjs-icon-folder svelte-bjpg8h");
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

			/*summary_binding*/ ctx[26](summary);
			append(details, t2);
			append(details, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			/*details_binding*/ ctx[27](details);
			current = true;

			if (!mounted) {
				dispose = [
					listen(summary, "click", /*onClickSummary*/ ctx[10], true),
					listen(summary, "contextmenu", function () {
						if (is_function(/*onContextMenu*/ ctx[4])) /*onContextMenu*/ ctx[4].apply(this, arguments);
					}),
					listen(summary, "keyup", /*onKeyUp*/ ctx[11]),
					listen(details, "click", /*click_handler*/ ctx[20]),
					listen(details, "open", /*open_handler*/ ctx[21]),
					listen(details, "close", /*close_handler*/ ctx[22]),
					listen(details, "openAny", /*openAny_handler*/ ctx[23]),
					listen(details, "closeAny", /*closeAny_handler*/ ctx[24]),
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

			if (/*currentIcon*/ ctx[9]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					if_block.m(summary, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (label_slot) {
				if (label_slot.p && (!current || dirty & /*$$scope*/ 262144)) {
					update_slot_base(
						label_slot,
						label_slot_template,
						ctx,
						/*$$scope*/ ctx[18],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[18], dirty, get_label_slot_changes),
						get_label_slot_context
					);
				}
			} else {
				if (label_slot_or_fallback && label_slot_or_fallback.p && (!current || dirty & /*label*/ 2)) {
					label_slot_or_fallback.p(ctx, !current ? -1 : dirty);
				}
			}

			if (summary_end_slot) {
				if (summary_end_slot.p && (!current || dirty & /*$$scope*/ 262144)) {
					update_slot_base(
						summary_end_slot,
						summary_end_slot_template,
						ctx,
						/*$$scope*/ ctx[18],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
						: get_slot_changes(summary_end_slot_template, /*$$scope*/ ctx[18], dirty, get_summary_end_slot_changes),
						get_summary_end_slot_context
					);
				}
			}

			if (dirty & /*localOptions*/ 32) {
				toggle_class(summary, "default-cursor", /*localOptions*/ ctx[5].chevronOnly);
			}

			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 262144)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[18],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[18])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null),
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
			/*summary_binding*/ ctx[26](null);
			if (default_slot) default_slot.d(detaching);
			/*details_binding*/ ctx[27](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(17, $store = $$value)), store);

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

	let { options = isObject(folder) && isObject(folder.options)
	? folder.options
	: {} } = $$props;

	let { store = isObject(folder) && isWritableStore(folder.store)
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

	/** @type {TJSFolderOptions} */
	const localOptions = { chevronOnly: false, noKeys: false };

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

		if (target === summaryEl || target === iconEl || target.querySelector('.summary-click') !== null) {
			if (localOptions.chevronOnly && target !== iconEl) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}

			set_store_value(store, $store = !$store, $store);
			onClick(event);
			event.preventDefault();
			event.stopPropagation();
		} else {
			// Handle exclusion cases when no-summary-click class is in target, targets children, or targets parent
			// element.
			if (target.classList.contains('no-summary-click') || target.querySelector('.no-summary-click') !== null || target.parentElement && target.parentElement.classList.contains('no-summary-click')) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
	}

	/**
 * When localOptions `noKeys` is true prevent `space bar` / 'space' from activating folder open / close.
 *
 * @param {KeyboardEvent} event -
 */
	function onKeyUp(event) {
		if (localOptions.noKeys && event.key === ' ') {
			event.preventDefault();
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
			$$invalidate(7, iconEl);
		});
	}

	function summary_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			summaryEl = $$value;
			$$invalidate(8, summaryEl);
		});
	}

	function details_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			detailsEl = $$value;
			$$invalidate(6, detailsEl);
		});
	}

	$$self.$$set = $$props => {
		if ('folder' in $$props) $$invalidate(16, folder = $$props.folder);
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('iconOpen' in $$props) $$invalidate(12, iconOpen = $$props.iconOpen);
		if ('iconClosed' in $$props) $$invalidate(13, iconClosed = $$props.iconClosed);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
		if ('options' in $$props) $$invalidate(14, options = $$props.options);
		if ('store' in $$props) $$subscribe_store($$invalidate(2, store = $$props.store));
		if ('styles' in $$props) $$invalidate(3, styles = $$props.styles);
		if ('onClick' in $$props) $$invalidate(15, onClick = $$props.onClick);
		if ('onContextMenu' in $$props) $$invalidate(4, onContextMenu = $$props.onContextMenu);
		if ('$$scope' in $$props) $$invalidate(18, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*folder, id*/ 65537) {
			$$invalidate(0, id = isObject(folder) && typeof folder.id === 'string'
			? folder.id
			: typeof id === 'string' ? id : void 0);
		}

		if ($$self.$$.dirty & /*folder, iconOpen*/ 69632) {
			$$invalidate(12, iconOpen = isObject(folder) && folder.iconOpen === 'string'
			? folder.iconOpen
			: typeof iconOpen === 'string' ? iconOpen : void 0);
		}

		if ($$self.$$.dirty & /*folder, iconClosed*/ 73728) {
			$$invalidate(13, iconClosed = isObject(folder) && folder.iconClosed === 'string'
			? folder.iconClosed
			: typeof iconClosed === 'string' ? iconClosed : void 0);
		}

		if ($$self.$$.dirty & /*folder, label*/ 65538) {
			$$invalidate(1, label = isObject(folder) && typeof folder.label === 'string'
			? folder.label
			: typeof label === 'string' ? label : '');
		}

		if ($$self.$$.dirty & /*folder, options*/ 81920) {
			{
				$$invalidate(14, options = isObject(folder) && isObject(folder.options)
				? folder.options
				: isObject(options) ? options : {});

				if (typeof options?.chevronOnly === 'boolean') {
					$$invalidate(5, localOptions.chevronOnly = options.chevronOnly, localOptions);
				}

				if (typeof options?.noKeys === 'boolean') {
					$$invalidate(5, localOptions.noKeys = options.noKeys, localOptions);
				}
			}
		}

		if ($$self.$$.dirty & /*folder, store*/ 65540) {
			$$subscribe_store($$invalidate(2, store = isObject(folder) && isWritableStore(folder.store)
			? folder.store
			: isWritableStore(store) ? store : writable(false)));
		}

		if ($$self.$$.dirty & /*folder, styles*/ 65544) {
			$$invalidate(3, styles = isObject(folder) && isObject(folder.styles)
			? folder.styles
			: isObject(styles) ? styles : void 0);
		}

		if ($$self.$$.dirty & /*folder, onClick*/ 98304) {
			$$invalidate(15, onClick = isObject(folder) && typeof folder.onClick === 'function'
			? folder.onClick
			: typeof onClick === 'function' ? onClick : () => null);
		}

		if ($$self.$$.dirty & /*folder, onContextMenu*/ 65552) {
			$$invalidate(4, onContextMenu = isObject(folder) && typeof folder.onContextMenu === 'function'
			? folder.onContextMenu
			: typeof onContextMenu === 'function'
				? onContextMenu
				: () => null);
		}

		if ($$self.$$.dirty & /*$store, iconOpen, iconClosed*/ 143360) {
			{
				const iconData = $store ? iconOpen : iconClosed;
				$$invalidate(9, currentIcon = typeof iconData !== 'string' ? void 0 : iconData);
			}
		}
	};

	return [
		id,
		label,
		store,
		styles,
		onContextMenu,
		localOptions,
		detailsEl,
		iconEl,
		summaryEl,
		currentIcon,
		onClickSummary,
		onKeyUp,
		iconOpen,
		iconClosed,
		options,
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
			instance$8,
			create_fragment$9,
			safe_not_equal,
			{
				folder: 16,
				id: 0,
				iconOpen: 12,
				iconClosed: 13,
				label: 1,
				options: 14,
				store: 2,
				styles: 3,
				onClick: 15,
				onContextMenu: 4
			},
			add_css$8
		);
	}
}

/* src\component\standard\form\input\TJSInput.svelte generated by Svelte v3.49.0 */

function add_css$7(target) {
	append_styles(target, "svelte-wpk8dr", ".tjs-input-container.svelte-wpk8dr{pointer-events:none;background:var(--tjs-comp-input-background, var(--tjs-input-background));border-radius:var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));display:block;overflow:hidden;height:var(--tjs-comp-input-height, var(--tjs-input-height));width:var(--tjs-comp-input-width, var(--tjs-input-width));transform-style:preserve-3d}input.svelte-wpk8dr{pointer-events:initial;display:inline-block;position:relative;overflow:hidden;background:transparent;border:var(--tjs-comp-input-border, var(--tjs-input-border));border-radius:var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));text-align:var(--tjs-comp-input-text-align, var(--tjs-input-text-align));width:100%;height:100%;padding:var(--tjs-comp-input-padding, var(--tjs-input-padding));color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;cursor:var(--tjs-comp-input-cursor, var(--tjs-input-cursor));transform:translateZ(1px)}input.svelte-wpk8dr::placeholder{color:var(--tjs-input-placeholder-color, inherit)}");
}

function create_fragment$8(ctx) {
	let div;
	let input_1;
	let applyStyles_action;
	let mounted;
	let dispose;

	let input_1_levels = [
		{ class: "tjs-input" },
		{ type: /*type*/ ctx[0] },
		{ placeholder: /*placeholder*/ ctx[2] },
		{ disabled: /*disabled*/ ctx[1] }
	];

	let input_1_data = {};

	for (let i = 0; i < input_1_levels.length; i += 1) {
		input_1_data = assign(input_1_data, input_1_levels[i]);
	}

	return {
		c() {
			div = element("div");
			input_1 = element("input");
			set_attributes(input_1, input_1_data);
			toggle_class(input_1, "svelte-wpk8dr", true);
			attr(div, "class", "tjs-input-container svelte-wpk8dr");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input_1);
			if (input_1.autofocus) input_1.focus();
			/*input_1_binding*/ ctx[12](input_1);
			set_input_value(input_1, /*$store*/ ctx[7]);

			if (!mounted) {
				dispose = [
					listen(input_1, "input", /*input_1_input_handler*/ ctx[13]),
					action_destroyer(autoBlur.call(null, input_1)),
					listen(input_1, "focusin", /*onFocusIn*/ ctx[8]),
					listen(input_1, "keydown", /*onKeyDown*/ ctx[9]),
					action_destroyer(/*efx*/ ctx[5].call(null, div)),
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*styles*/ ctx[4]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
				{ class: "tjs-input" },
				dirty & /*type*/ 1 && { type: /*type*/ ctx[0] },
				dirty & /*placeholder*/ 4 && { placeholder: /*placeholder*/ ctx[2] },
				dirty & /*disabled*/ 2 && { disabled: /*disabled*/ ctx[1] }
			]));

			if (dirty & /*$store*/ 128 && input_1.value !== /*$store*/ ctx[7]) {
				set_input_value(input_1, /*$store*/ ctx[7]);
			}

			toggle_class(input_1, "svelte-wpk8dr", true);
			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*styles*/ 16) applyStyles_action.update.call(null, /*styles*/ ctx[4]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			/*input_1_binding*/ ctx[12](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $store,
		$$unsubscribe_store = noop,
		$$subscribe_store = () => ($$unsubscribe_store(), $$unsubscribe_store = subscribe(store, $$value => $$invalidate(7, $store = $$value)), store);

	$$self.$$.on_destroy.push(() => $$unsubscribe_store());
	let { input = void 0 } = $$props;
	let { type } = $$props;
	let { disabled } = $$props;
	let { options } = $$props;
	let { placeholder } = $$props;
	let { store } = $$props;
	$$subscribe_store();
	let { styles } = $$props;
	let { efx } = $$props;

	const localOptions = {
		blurOnEnterKey: true,
		cancelOnEscKey: false,
		clearOnEscKey: false
	};

	let inputEl;
	let initialValue;

	function onFocusIn(event) {
		initialValue = localOptions.cancelOnEscKey ? inputEl.value : void 0;
	}

	/**
 * Blur input on enter key down.
 *
 * @param {KeyboardEvent} event -
 */
	function onKeyDown(event) {
		if (localOptions.blurOnEnterKey && event.key === 'Enter') {
			inputEl.blur();
			return;
		}

		if (event.key === 'Escape') {
			if (localOptions.cancelOnEscKey && typeof initialValue === 'string') {
				store.set(initialValue);
				initialValue = void 0;
				inputEl.blur();
			} else if (localOptions.clearOnEscKey) {
				store.set('');
				inputEl.blur();
			}
		}
	}

	function input_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			inputEl = $$value;
			$$invalidate(6, inputEl);
		});
	}

	function input_1_input_handler() {
		$store = this.value;
		store.set($store);
	}

	$$self.$$set = $$props => {
		if ('input' in $$props) $$invalidate(11, input = $$props.input);
		if ('type' in $$props) $$invalidate(0, type = $$props.type);
		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
		if ('options' in $$props) $$invalidate(10, options = $$props.options);
		if ('placeholder' in $$props) $$invalidate(2, placeholder = $$props.placeholder);
		if ('store' in $$props) $$subscribe_store($$invalidate(3, store = $$props.store));
		if ('styles' in $$props) $$invalidate(4, styles = $$props.styles);
		if ('efx' in $$props) $$invalidate(5, efx = $$props.efx);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*input, type*/ 2049) {
			$$invalidate(0, type = isObject(input) && typeof input.type === 'string'
			? input.type
			: typeof type === 'string' ? type : void 0);
		}

		if ($$self.$$.dirty & /*input, disabled*/ 2050) {
			$$invalidate(1, disabled = isObject(input) && typeof input.disabled === 'boolean'
			? input.disabled
			: typeof disabled === 'boolean' ? disabled : false);
		}

		if ($$self.$$.dirty & /*input, options*/ 3072) {
			{
				$$invalidate(10, options = isObject(input) && isObject(input.options)
				? input.options
				: isObject(options) ? options : {});

				if (typeof options?.blurOnEnterKey === 'boolean') {
					localOptions.blurOnEnterKey = options.blurOnEnterKey;
				}

				if (typeof options?.cancelOnEscKey === 'boolean') {
					localOptions.cancelOnEscKey = options.cancelOnEscKey;
				}

				if (typeof options?.clearOnEscKey === 'boolean') {
					localOptions.clearOnEscKey = options.clearOnEscKey;
				}
			}
		}

		if ($$self.$$.dirty & /*input, placeholder*/ 2052) {
			$$invalidate(2, placeholder = isObject(input) && typeof input.placeholder === 'string'
			? localize(input.placeholder)
			: typeof placeholder === 'string'
				? localize(placeholder)
				: void 0);
		}

		if ($$self.$$.dirty & /*input, store*/ 2056) {
			$$subscribe_store($$invalidate(3, store = isObject(input) && isWritableStore(input.store)
			? input.store
			: isWritableStore(store) ? store : writable(void 0)));
		}

		if ($$self.$$.dirty & /*input, styles*/ 2064) {
			$$invalidate(4, styles = isObject(input) && isObject(input.styles)
			? input.styles
			: typeof styles === 'object' ? styles : void 0);
		}

		if ($$self.$$.dirty & /*input, efx*/ 2080) {
			$$invalidate(5, efx = isObject(input) && typeof input.efx === 'function'
			? input.efx
			: typeof efx === 'function'
				? efx
				: () => {
						
					});
		}
	};

	return [
		type,
		disabled,
		placeholder,
		store,
		styles,
		efx,
		inputEl,
		$store,
		onFocusIn,
		onKeyDown,
		options,
		input,
		input_1_binding,
		input_1_input_handler
	];
}

class TJSInput extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$7,
			create_fragment$8,
			safe_not_equal,
			{
				input: 11,
				type: 0,
				disabled: 1,
				options: 10,
				placeholder: 2,
				store: 3,
				styles: 4,
				efx: 5
			},
			add_css$7
		);
	}
}

/* src\component\standard\form\select\TJSSelect.svelte generated by Svelte v3.49.0 */

function add_css$6(target) {
	append_styles(target, "svelte-166po96", ".tjs-select-container.svelte-166po96.svelte-166po96{pointer-events:none;background:var(--tjs-comp-select-background, var(--tjs-input-background));border-radius:var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));display:block;overflow:hidden;height:var(--tjs-comp-select-height, var(--tjs-input-height));width:var(--tjs-comp-select-width, var(--tjs-input-width));transform-style:preserve-3d}select.svelte-166po96.svelte-166po96{pointer-events:initial;display:inline-block;position:relative;overflow:hidden;background:transparent;border:var(--tjs-comp-select-border, var(--tjs-input-border));border-radius:var(--tjs-comp-select-border-radius, var(--tjs-input-border-radius));width:100%;height:100%;color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;cursor:var(--tjs-comp-select-cursor, var(--tjs-input-cursor));transform:translateZ(1px)}select.svelte-166po96 option.svelte-166po96{background:var(--tjs-comp-select-background, var(--tjs-input-background));color:inherit}");
}

function get_each_context$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

// (67:6) {#each options as option}
function create_each_block$4(ctx) {
	let option;
	let t0_value = /*option*/ ctx[10].label + "";
	let t0;
	let t1;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t0 = text(t0_value);
			t1 = space();
			attr(option, "class", "tjs-select-option svelte-166po96");
			option.__value = option_value_value = /*option*/ ctx[10].value;
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t0);
			append(option, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*options*/ 1 && t0_value !== (t0_value = /*option*/ ctx[10].label + "")) set_data(t0, t0_value);

			if (dirty & /*options*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[10].value)) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

function create_fragment$7(ctx) {
	let div;
	let select_1;
	let applyStyles_action;
	let mounted;
	let dispose;
	let each_value = /*options*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");
			select_1 = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(select_1, "class", "tjs-select svelte-166po96");
			if (/*$store*/ ctx[4] === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[9].call(select_1));
			attr(div, "class", "tjs-select-container svelte-166po96");
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
					listen(select_1, "change", /*change_handler_1*/ ctx[8]),
					listen(select_1, "change", /*select_1_change_handler*/ ctx[9]),
					action_destroyer(autoBlur.call(null, select_1)),
					listen(div, "change", /*change_handler*/ ctx[7]),
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
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
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

function instance$6($$self, $$props, $$invalidate) {
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

	function change_handler(event) {
		bubble.call(this, $$self, event);
	}

	function change_handler_1(event) {
		bubble.call(this, $$self, event);
	}

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
			$$subscribe_store($$invalidate(1, store = typeof select === 'object' && isWritableStore(select.store)
			? select.store
			: isWritableStore(store) ? store : writable(void 0)));
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

	return [
		options,
		store,
		styles,
		efx,
		$store,
		selected,
		select,
		change_handler,
		change_handler_1,
		select_1_change_handler
	];
}

class TJSSelect extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$6,
			create_fragment$7,
			safe_not_equal,
			{
				select: 6,
				selected: 5,
				options: 0,
				store: 1,
				styles: 2,
				efx: 3
			},
			add_css$6
		);
	}
}

/**
 * Provides an action to enable pointer dragging that tracks relative changes. Sends data to
 * {@link ControlsStore.dragging}.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */
function draggable(node, { active = true })
{
   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   const initialDragPoint = { x: 0, y: 0 };

   /**
    * Remember event handlers associated with this action so they may be later unregistered.
    *
    * @type {object}
    */
   const handlers = {
      dragDown: ['pointerdown', (e) => onDragPointerDown(e), false],
      dragChange: ['pointermove', (e) => onDragPointerChange(e), false],
      dragUp: ['pointerup', (e) => onDragPointerUp(e), false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners()
   {
      // Drag handlers
      node.addEventListener(...handlers.dragDown);
   }

   /**
    * Removes listeners.
    */
   function removeListeners()
   {
      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);

      node.style.cursor = null;
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the positionable.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      if (event.button !== 0 || !event.isPrimary) { return; }

      event.preventDefault();

      // Record initial position.
      initialDragPoint.x = event.clientX;
      initialDragPoint.y = event.clientY;

      // Add move and pointer up handlers.
      node.addEventListener(...handlers.dragChange);
      node.addEventListener(...handlers.dragUp);

      node.setPointerCapture(event.pointerId);

      node.style.cursor = 'grabbing';

      node.dispatchEvent(new CustomEvent('draggable:start', { bubbles: false }));
   }

   /**
    * Move the positionable.
    *
    * @param {PointerEvent} event - The pointer move event.
    */
   function onDragPointerChange(event)
   {
      // See chorded button presses for pointer events:
      // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
      if ((event.buttons & 1) === 0)
      {
         onDragPointerUp(event);
         return;
      }

      event.preventDefault();

      const tX = event.clientX - initialDragPoint.x;
      const tY = event.clientY - initialDragPoint.y;

      node.dispatchEvent(new CustomEvent('draggable:move', { detail: { tX, tY }, bubbles: false }));
   }

   /**
    * Finish dragging and set the final position and removing listeners.
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      event.preventDefault();

      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);

      node.style.cursor = null;

      node.dispatchEvent(new CustomEvent('draggable:end', { bubbles: false }));
   }

   return {
      // The default of active being true won't automatically add listeners twice.
      update: (options) =>
      {
         if (typeof options.active === 'boolean')
         {
            active = options.active;
            if (active) { activateListeners(); }
            else { removeListeners(); }
         }
      },

      destroy: () => removeListeners()
   };
}

/**
 * Provides an action to enable pointer dragging that tracks relative changes. Sends data to
 * {@link ControlsStore.dragging}.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {number}            params.id - An ID for the hit box.
 *
 * @param {Function}          params.resizeCallback - Callback function on resize.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */
function resize(node, { id, resizeCallback, active = true })
{
   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   const lastDragPoint = { x: 0, y: 0 };

   /**
    * Remember event handlers associated with this action so they may be later unregistered.
    *
    * @type {object}
    */
   const handlers = {
      dragDown: ['pointerdown', (e) => onDragPointerDown(e), false],
      dragMove: ['pointermove', (e) => onDragPointerChange(e), false],
      dragUp: ['pointerup', (e) => onDragPointerUp(e), false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners()
   {
      // Drag handlers
      node.addEventListener(...handlers.dragDown);
   }

   /**
    * Removes listeners.
    */
   function removeListeners()
   {
      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the positionable.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      if (event.button !== 0 || !event.isPrimary) { return; }

      event.preventDefault();

      // Record initial position.
      lastDragPoint.x = event.clientX;
      lastDragPoint.y = event.clientY;

      // Add move and pointer up handlers.
      node.addEventListener(...handlers.dragMove);
      node.addEventListener(...handlers.dragUp);

      node.setPointerCapture(event.pointerId);
   }

   /**
    * Move the positionable.
    *
    * @param {PointerEvent} event - The pointer move event.
    */
   function onDragPointerChange(event)
   {
      // See chorded button presses for pointer events:
      // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
      if ((event.buttons & 1) === 0)
      {
         onDragPointerUp(event);
         return;
      }

      event.preventDefault();

      /** @type {number} */
      const dX = event.clientX - lastDragPoint.x;
      const dY = event.clientY - lastDragPoint.y;

      // Update last drag point.
      lastDragPoint.x = event.clientX;
      lastDragPoint.y = event.clientY;

      resizeCallback(id, dX, dY, event);
   }

   /**
    * Finish dragging and set the final position and removing listeners.
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      event.preventDefault();

      node.removeEventListener(...handlers.dragMove);
      node.removeEventListener(...handlers.dragUp);
   }

   return {
      // The default of active being true won't automatically add listeners twice.
      update: (options) =>
      {
         if (typeof options.active === 'boolean')
         {
            active = options.active;
            if (active) { activateListeners(); }
            else { removeListeners(); }
         }
      },

      destroy: () => removeListeners()
   };
}

const boxLength = 5;

const size = `${boxLength}px`;
const minusSize = `-${boxLength}px`;

const hitboxData = [
   // corners (top, right, bottom right, bottom left)
   { id: 0, styles: { top: minusSize, left: minusSize, width: size, height: size, cursor: 'nwse-resize' } },
   { id: 1, styles: { top: minusSize, left: '100%', width: size, height: size, cursor: 'nesw-resize' } },
   { id: 2, styles: { top: '100%', left: '100%', width: size, height: size, cursor: 'nwse-resize' } },
   { id: 3, styles: { top: '100%', left: minusSize, width: size, height: size, cursor: 'nesw-resize' } },

   // sides (top, right, bottom, left)
   { id: 4, styles: { top: minusSize, left: 0, width: '100%', height: size, cursor: 'ns-resize' } },
   { id: 5, styles: { top: 0, left: '100%', width: size, height: '100%', cursor: 'ew-resize' } },
   { id: 6, styles: { top: '100%', left: 0, width: '100%', height: size, cursor: 'ns-resize' } },
   { id: 7, styles: { top: 0, left: minusSize, width: size, height: '100%', cursor: 'ew-resize' } }
];

const hitboxCallback = [{}, {}, {}, {}, {}, {}, {}, {}];

function applyResizeData(id, dX, dY, control)
{
   const data = hitboxCallback[id];

   switch (id)
   {
      case 0:
      {
         const heightAdjust = control.position.height - dY;

         if (heightAdjust < 0) { dY += heightAdjust; }

         data.top = `+=${dY}`;
         data.height = `+=${-dY}`;

         const widthAdjust = control.position.width - dX;

         if (widthAdjust < 0) { dX += widthAdjust; }

         data.left = `+=${dX}`;
         data.width = `+=${-dX}`;
         break;
      }

      case 1:
      {
         const heightAdjust = control.position.height - dY;

         if (heightAdjust < 0) { dY += heightAdjust; }

         data.top = `+=${dY}`;
         data.height = `+=${-dY}`;
         data.width = `+=${dX}`;
         break;
      }

      case 2:
      {
         data.width = `+=${dX}`;
         data.height = `+=${dY}`;
         break;
      }

      case 3:
      {
         const widthAdjust = control.position.width - dX;

         if (widthAdjust < 0) { dX += widthAdjust; }

         data.left = `+=${dX}`;
         data.width = `+=${-dX}`;
         data.height = `+=${dY}`;
         break;
      }

      case 4:
      {
         const heightAdjust = control.position.height - dY;

         if (heightAdjust < 0) { dY += heightAdjust; }

         data.top = `+=${dY}`;
         data.height = `+=${-dY}`;
         break;
      }

      case 5:
      {
         data.width = `+=${dX}`;
         break;
      }

      case 6:
      {
         data.height = `+=${dY}`;
         break;
      }

      case 7:
      {
         const widthAdjust = control.position.width - dX;

         if (widthAdjust < 0) { dX += widthAdjust; }

         data.left = `+=${dX}`;
         data.width = `+=${-dX}`;
         break;
      }
   }

   return data;
}

/* src\component\standard\layers\position-control\control\resize\ResizeHitBox.svelte generated by Svelte v3.49.0 */

function add_css$5(target) {
	append_styles(target, "svelte-1sc2cz1", "div.svelte-1sc2cz1{position:absolute}");
}

function create_fragment$6(ctx) {
	let div;
	let applyStyles_action;
	let resize_action;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			attr(div, "class", "svelte-1sc2cz1");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (!mounted) {
				dispose = [
					action_destroyer(applyStyles_action = applyStyles.call(null, div, /*data*/ ctx[0].styles)),
					action_destroyer(resize_action = resize.call(null, div, {
						id: /*data*/ ctx[0].id,
						resizeCallback: /*resizeCallback*/ ctx[4]
					})),
					listen(div, "pointerdown", stop_propagation(prevent_default(/*onPointerDown*/ ctx[3]))),
					listen(div, "pointermove", stop_propagation(prevent_default(/*capture*/ ctx[2]))),
					listen(div, "pointerover", stop_propagation(prevent_default(/*capture*/ ctx[2]))),
					listen(div, "pointerup", stop_propagation(prevent_default(/*pointerup_handler*/ ctx[5])))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (applyStyles_action && is_function(applyStyles_action.update) && dirty & /*data*/ 1) applyStyles_action.update.call(null, /*data*/ ctx[0].styles);

			if (resize_action && is_function(resize_action.update) && dirty & /*data*/ 1) resize_action.update.call(null, {
				id: /*data*/ ctx[0].id,
				resizeCallback: /*resizeCallback*/ ctx[4]
			});
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

function instance$5($$self, $$props, $$invalidate) {
	let { data } = $$props;
	const control = getContext('pcControl');
	const controls = getContext('pclControls');
	const capture = () => null;

	function onPointerDown() {
		$$invalidate(1, control.resizing = true, control);
		controls.selected.setPrimary(control);
	}

	function resizeCallback(id, dX, dY, event) {
		if (event.shiftKey) {
			for (const control of controls.selected.values()) {
				control.position.set(applyResizeData(id, dX, dY, control));
			}
		} else {
			control.position.set(applyResizeData(id, dX, dY, control));
		}
	}

	const pointerup_handler = () => $$invalidate(1, control.resizing = false, control);

	$$self.$$set = $$props => {
		if ('data' in $$props) $$invalidate(0, data = $$props.data);
	};

	return [data, control, capture, onPointerDown, resizeCallback, pointerup_handler];
}

class ResizeHitBox extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$6, safe_not_equal, { data: 0 }, add_css$5);
	}
}

/* src\component\standard\layers\position-control\control\resize\ResizeControl.svelte generated by Svelte v3.49.0 */

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[0] = list[i];
	return child_ctx;
}

// (7:0) {#each hitboxData as data (data.id)}
function create_each_block$3(key_1, ctx) {
	let first;
	let resizehitbox;
	let current;
	resizehitbox = new ResizeHitBox({ props: { data: /*data*/ ctx[0] } });

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(resizehitbox.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(resizehitbox, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		i(local) {
			if (current) return;
			transition_in(resizehitbox.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(resizehitbox.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(first);
			destroy_component(resizehitbox, detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let each_blocks = [];
	let each_1_lookup = new Map();
	let each_1_anchor;
	let current;
	let each_value = hitboxData;
	const get_key = ctx => /*data*/ ctx[0].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$3(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*hitboxData*/ 0) {
				each_value = hitboxData;
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$3, each_1_anchor, get_each_context$3);
				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d(detaching);
			}

			if (detaching) detach(each_1_anchor);
		}
	};
}

class ResizeControl extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$5, safe_not_equal, {});
	}
}

/* src\component\standard\layers\position-control\control\SelectedBorder.svelte generated by Svelte v3.49.0 */

function add_css$4(target) {
	append_styles(target, "svelte-95ujfj", "div.border.svelte-95ujfj{position:absolute;pointer-events:none;top:-2px;left:-2px;width:calc(100% + 4px);height:calc(100% + 4px);clip-path:polygon(0% 0%, 0% 100%, 2px 100%, 2px 2px, calc(100% - 2px) 2px, calc(100% - 2px) calc(100% - 2px), 2px calc(100% - 2px), 2px 100%, 100% 100%, 100% 0%);background-size:200% auto;animation:svelte-95ujfj-shine 1.5s linear infinite}.selected.svelte-95ujfj{background:linear-gradient(45deg, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.3) 35%, rgba(21, 204, 247, 0.95) 45%, rgba(64, 208, 245, 0.95) 55%, rgba(255, 255, 255, 0.3) 70%, rgba(255, 255, 255, 0.3) 100%);border:dotted 2px lightblue}.primary.svelte-95ujfj{background:linear-gradient(45deg, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.3) 35%, rgba(250, 197, 99, 0.95) 45%, rgba(255, 215 , 0, 0.95) 55%, rgba(255, 255, 255, 0.3) 70%, rgba(255, 255, 255, 0.3) 100%);border:dotted 2px yellow}@keyframes svelte-95ujfj-shine{to{background-position:200% center}}");
}

function create_fragment$4(ctx) {
	let div;

	return {
		c() {
			div = element("div");
			attr(div, "class", "border svelte-95ujfj");
			toggle_class(div, "selected", /*$selected*/ ctx[0] && !/*$isPrimary*/ ctx[1]);
			toggle_class(div, "primary", /*$selected*/ ctx[0] && /*$isPrimary*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*$selected, $isPrimary*/ 3) {
				toggle_class(div, "selected", /*$selected*/ ctx[0] && !/*$isPrimary*/ ctx[1]);
			}

			if (dirty & /*$selected, $isPrimary*/ 3) {
				toggle_class(div, "primary", /*$selected*/ ctx[0] && /*$isPrimary*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $selected;
	let $isPrimary;
	const control = getContext('pcControl');
	const { isPrimary, selected } = control.stores;
	component_subscribe($$self, isPrimary, value => $$invalidate(1, $isPrimary = value));
	component_subscribe($$self, selected, value => $$invalidate(0, $selected = value));
	return [$selected, $isPrimary, isPrimary, selected];
}

class SelectedBorder extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, add_css$4);
	}
}

/* src\component\standard\layers\position-control\control\PositionControl.svelte generated by Svelte v3.49.0 */

function add_css$3(target) {
	append_styles(target, "svelte-79wzo3", "div.svelte-79wzo3{position:absolute;z-index:999999;pointer-events:none}.cursor-default.svelte-79wzo3{cursor:default}.cursor-grab.svelte-79wzo3{cursor:grab}.enabled.svelte-79wzo3{pointer-events:auto}");
}

// (61:4) {#if $selected}
function create_if_block$1(ctx) {
	let resizecontrol;
	let t;
	let selectedborder;
	let current;
	resizecontrol = new ResizeControl({});
	selectedborder = new SelectedBorder({});

	return {
		c() {
			create_component(resizecontrol.$$.fragment);
			t = space();
			create_component(selectedborder.$$.fragment);
		},
		m(target, anchor) {
			mount_component(resizecontrol, target, anchor);
			insert(target, t, anchor);
			mount_component(selectedborder, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(resizecontrol.$$.fragment, local);
			transition_in(selectedborder.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(resizecontrol.$$.fragment, local);
			transition_out(selectedborder.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(resizecontrol, detaching);
			if (detaching) detach(t);
			destroy_component(selectedborder, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let div;
	let draggable_action;
	let current;
	let mounted;
	let dispose;
	let if_block = /*$selected*/ ctx[0] && create_if_block$1();

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "svelte-79wzo3");
			toggle_class(div, "enabled", /*$enabled*/ ctx[1] || /*$selected*/ ctx[0]);
			toggle_class(div, "cursor-default", /*$enabled*/ ctx[1] && !/*$resizing*/ ctx[2]);
			toggle_class(div, "cursor-grab", /*$selected*/ ctx[0] && !/*$enabled*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(applyPosition.call(null, div, /*position*/ ctx[7])),
					action_destroyer(draggable_action = draggable.call(null, div, {
						active: /*$selected*/ ctx[0] && !/*$enabled*/ ctx[1]
					})),
					listen(div, "click", /*onClick*/ ctx[8]),
					listen(div, "pointerdown", /*onPointerDown*/ ctx[9]),
					listen(div, "draggable:start", /*selectedDragAPI*/ ctx[3].onStart),
					listen(div, "draggable:move", /*selectedDragAPI*/ ctx[3].onMove)
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*$selected*/ ctx[0]) {
				if (if_block) {
					if (dirty & /*$selected*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1();
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

			if (draggable_action && is_function(draggable_action.update) && dirty & /*$selected, $enabled*/ 3) draggable_action.update.call(null, {
				active: /*$selected*/ ctx[0] && !/*$enabled*/ ctx[1]
			});

			if (dirty & /*$enabled, $selected*/ 3) {
				toggle_class(div, "enabled", /*$enabled*/ ctx[1] || /*$selected*/ ctx[0]);
			}

			if (dirty & /*$enabled, $resizing*/ 6) {
				toggle_class(div, "cursor-default", /*$enabled*/ ctx[1] && !/*$resizing*/ ctx[2]);
			}

			if (dirty & /*$selected, $enabled*/ 3) {
				toggle_class(div, "cursor-grab", /*$selected*/ ctx[0] && !/*$enabled*/ ctx[1]);
			}
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

function instance$3($$self, $$props, $$invalidate) {
	let $selected;
	let $enabled;
	let $resizing;
	let { control } = $$props;
	setContext('pcControl', control);
	const controls = getContext('pclControls');
	const selectedDragAPI = getContext('pclSelectedDragAPI');
	const { enabled } = controls.stores;
	component_subscribe($$self, enabled, value => $$invalidate(1, $enabled = value));
	const { resizing, selected } = control.stores;
	component_subscribe($$self, resizing, value => $$invalidate(2, $resizing = value));
	component_subscribe($$self, selected, value => $$invalidate(0, $selected = value));
	controls.selected.onDrag;

	// Must store position as control is a store and will trigger updates to applyPosition action.
	const position = control.position;

	function onClick(event) {
		// Only handle click events when <ctrl> key pressed.
		if (!event.ctrlKey) {
			return;
		}

		// Remove selection if <ctrl> key is pressed.
		if ($selected) {
			controls.selected.remove(control);
		} else // Add control to selection if <ctrl> key is pressed otherwise set control as only selected item.
		{
			controls.selected.add(control);
		}
	}

	function onPointerDown(event) {
		// If already selected set as primary control.
		if ($selected && !event.ctrlKey) {
			controls.selected.setPrimary(control);
		}
	}

	$$self.$$set = $$props => {
		if ('control' in $$props) $$invalidate(10, control = $$props.control);
	};

	return [
		$selected,
		$enabled,
		$resizing,
		selectedDragAPI,
		enabled,
		resizing,
		selected,
		position,
		onClick,
		onPointerDown,
		control
	];
}

class PositionControl extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { control: 10 }, add_css$3);
	}
}

class ControlStore
{
   #component;

   #data = {
      isPrimary: false,
      resizing: false,
      selected: false
   };

   #position;

   #stores;

   /**
    * @type {Function[]}
    */
   #unsubscribe = [];

   constructor(component)
   {
      this.#component = component;

      // To accomplish bidirectional updates Must ignore updates from the control position when set from the
      // target component position.
      let ignoreRoundRobin = false;

      this.#position = Position.duplicate(component.position, { calculateTransform: true });

      /**
       * Update component position, but only when ignoring round-robin callback.
       */
      this.#unsubscribe.push(this.#position.subscribe((data) =>
      {
         if (!ignoreRoundRobin)
         {
            component.position.set({ ...data, immediateElementUpdate: true });
         }
      }));

      /**
       * Sets the local control position store, but temporarily sets ignoreRoundRobin callback;
       */
      this.#unsubscribe.push(component.position.subscribe((data) =>
      {
         ignoreRoundRobin = true;
         this.#position.set({ ...data, immediateElementUpdate: true });
         ignoreRoundRobin = false;
      }));

      const dataStore = writable(this.#data);

      this.#stores = {
         isPrimary: propertyStore(dataStore, 'isPrimary'),
         resizing: propertyStore(dataStore, 'resizing'),
         selected: propertyStore(dataStore, 'selected')
      };

      Object.freeze(this.#stores);
   }

   get component() { return this.#component; }

   get id() { return this.#component.id; }

   get isPrimary() { return this.#data.isPrimary; }

   get position() { return this.#position; }

   get resizing() { return this.#data.resizing; }

   get selected() { return this.#data.selected; }

   get stores() { return this.#stores; }

   set isPrimary(isPrimary)
   {
      this.#stores.isPrimary.set(isPrimary);
   }

   set resizing(resizing)
   {
      this.#stores.resizing.set(resizing);
   }

   set selected(selected)
   {
      this.#stores.selected.set(selected);
   }

   /**
    * Cleans up all subscriptions and removes references to tracked component data.
    */
   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }

      this.#unsubscribe = void 0;
      this.#component = void 0;
      this.#position = void 0;
   }
}

class ControlsStore
{
   #controls = [];

   /**
    * @type {Map<*, ControlStore>}
    */
   #controlMap = new Map();

   /**
    * @type {ControlsData}
    */
   #data = {
      boundingRect: void 0,
      enabled: false,
      validate: true
   };

   #selectedAPI;

   #selectedDragAPI;

   #stores;

   /**
    * Stores the subscribers.
    *
    * @type {(function(ControlStore[]): void)[]}
    */
   #subscriptions = [];

   constructor()
   {
      const dataStore = writable(this.#data);

      [this.#selectedAPI, this.#selectedDragAPI] = new SelectedAPI(this.#data);

      this.#stores = {
         boundingRect: propertyStore(dataStore, 'boundingRect'),
         enabled: propertyStore(dataStore, 'enabled'),
         validate: propertyStore(dataStore, 'validate')
      };

      Object.freeze(this.#stores);

      return [this, this.#selectedDragAPI];
   }

   /**
    * @returns {DOMRect} Returns any validation bounding rect.
    */
   get boundingRect() { return this.#data.boundingRect; }

   /**
    * @returns {boolean} Returns enabled state.
    */
   get enabled() { return this.#data.enabled; }

   /**
    * @returns {SelectedAPI} Selected API
    */
   get selected() { return this.#selectedAPI; }

   /**
    * @returns {*} Stores.
    */
   get stores() { return this.#stores; }

   /**
    * @returns {boolean} Returns if on-drag validation is enabled.
    */
   get validate() { return this.#data.validate; }

   /**
    * @param {DOMRect|void}  boundingRect - Assigns the validation bounding rect.
    */
   set boundingRect(boundingRect) { this.#stores.boundingRect.set(boundingRect); }

   /**
    * @param {boolean}  enabled - New enabled state.
    */
   set enabled(enabled) { this.#stores.enabled.set(enabled); }

   /**
    * @param {boolean}  validate - New on-drag validation state.
    */
   set validate(validate) { this.#stores.validate.set(validate); }

   /**
    * Exports all or selected component data w/ Position converted to JSON object. An option to compact the position
    * data will transform the minimum top / left of all components as the origin.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.compact=false] - Transform / compact position data.
    *
    * @param {boolean}  [opts.selected=false] - When true export selected components.
    *
    * @returns {{width: number|void, height: number|void, components: object[]}} Width / height max extents & serialized
    *                                                                  component data.
    */
   export({ compact = false, selected = false } = {})
   {
      const components = [];

      let maxWidth = Number.MIN_SAFE_INTEGER;
      let maxHeight = Number.MIN_SAFE_INTEGER;

      if (!compact)
      {
         for (const control of selected ? this.selected.values() : this.values())
         {
            const position = control.component.position.toJSON();

            const boundingRect = control.position.transform.boundingRect;

            if (boundingRect.right > maxWidth) { maxWidth = boundingRect.right; }
            if (boundingRect.bottom > maxHeight) { maxHeight = boundingRect.bottom; }

            components.push(Object.assign({}, control.component, { position }));
         }
      }
      else
      {
         // TODO: Currently compacting only handles positions greater than 0, 0 origin.
         let minTop = Number.MAX_SAFE_INTEGER;
         let minLeft = Number.MAX_SAFE_INTEGER;

         // Find minimum left and top;
         for (const control of selected ? this.selected.values() : this.values())
         {
            const boundingRect = control.position.transform.boundingRect;

            if (boundingRect.left < minLeft) { minLeft = boundingRect.left; }
            if (boundingRect.top < minTop) { minTop = boundingRect.top; }
         }

         for (const control of selected ? this.selected.values() : this.values())
         {
            const position = control.position.toJSON();

            // Adjust for minLeft / minTop.
            position.left -= minLeft;
            position.top -= minTop;

            const boundingRect = control.position.transform.boundingRect;

            const right = boundingRect.right - minLeft;
            const bottom = boundingRect.bottom - minTop;

            if (right > maxWidth) { maxWidth = right; }
            if (bottom > maxHeight) { maxHeight = bottom; }

            components.push(Object.assign({}, control.component, { position }));
         }
      }

      return {
         width: maxWidth === Number.MIN_SAFE_INTEGER ? 0 : maxWidth,
         height: maxHeight === Number.MIN_SAFE_INTEGER ? 0 : maxHeight,
         components
      };
   }

   /**
    * @returns {IterableIterator<any>} Keys for all controls.
    */
   keys()
   {
      return this.#controlMap.keys();
   }

   /**
    * Updates the tracked component data. Each entry must be an object containing a unique `id` property and an
    * instance of Position as the `position` property.
    *
    * @param {Iterable<object>} components - Iterable list of component data objects.
    */
   updateComponents(components)
   {
      const controlMap = this.#controlMap;
      const selected = this.#selectedAPI;

      const removeIDs = new Set(controlMap.keys());

      for (const component of components)
      {
         const componentId = component.id;

         if (componentId === void 0 || componentId === null)
         {
            throw new Error(`updateComponents error: component data does not have a defined 'id' property.`);
         }

         if (!(component.position instanceof Position))
         {
            throw new Error(`updateComponents error: component data does not have a valid 'position' property.`);
         }

         if (controlMap.has(componentId))
         {
            const control = controlMap.get(componentId);

            // Evaluate if the components Position instance has changed.
            if (control.component.position !== component.position)
            {
               // Remove old control
               selected.removeById(componentId);
               controlMap.delete(componentId);
               control.destroy();

               controlMap.set(component.id, new ControlStore(component));
            }
            else
            {
               removeIDs.delete(componentId);
            }
         }
         else
         {
            controlMap.set(component.id, new ControlStore(component));
         }
      }

      for (const id of removeIDs)
      {
         const control = controlMap.get(id);

         selected.removeById(id);
         controlMap.delete(id);

         // Remove subscriptions to Position instances.
         if (control) { control.destroy(); }
      }

      this.#controls = [...controlMap.values()];

      this.#updateSubscribers();
   }

   /**
    * @returns {IterableIterator<ControlStore>} All controls.
    */
   values()
   {
      return this.#controlMap.values();
   }

// -------------------------------------------------------------------------------------------------------------------

   #updateSubscribers()
   {
      const subscriptions = this.#subscriptions;

      // Early out if there are no subscribers.
      if (subscriptions.length > 0)
      {
         for (let cntr = 0; cntr < subscriptions.length; cntr++) { subscriptions[cntr](this.#controls); }
      }
   }

   /**
    * @param {function(ControlStore[]): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this.#controls);           // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }
}

class SelectedAPI
{
   /**
    * Stores the main ControlStore data object.
    *
    * @type {ControlsData}
    */
   #data;

   /**
    * Initial bounding rect when drag starts.
    *
    * @type {DOMRect}
    */
   #dragBoundingRect = new DOMRect();

   /**
    * Data to send selected control position instances.
    *
    * @type {{top: number, left: number}}
    */
   #dragUpdate = { top: 0, left: 0 };

   /**
    * @type {ControlStore}
    */
   #primaryControl;

   /**
    * @type {Map<*, ControlStore>}
    */
   #selectedMap = new Map();

   /**
    * @type {Map<*, TransformData>}
    */
   #transformDataMap = new Map();

   /**
    * @type {Map<*, Function>}
    */
   #unsubscribeMap = new Map();

   /**
    * @type {Map<*, Function>}
    */
   #quickToMap = new Map();

   /**
    * @param {ControlsData} data - The main ControlStore data object.
    */
   constructor(data)
   {
      this.#data = data;

      const selectedDragAPI = {
         onStart: this.#onDragStart.bind(this),
         onMove: this.#onDragMove.bind(this)
      };

      return [this, selectedDragAPI];
   }

   /**
    * @param {ControlStore}   control - A control store.
    *
    * @param {boolean}        setPrimary - Make added control the primary control.
    */
   add(control, setPrimary = true)
   {
      const controlId = control.id;

      if (this.#selectedMap.has(controlId)) { return; }

      this.#selectedMap.set(controlId, control);
      this.#quickToMap.set(controlId, control.position.animate.quickTo(['top', 'left'], { duration: 0.1 }));

      if (setPrimary && this.#primaryControl)
      {
         this.#primaryControl.isPrimary = false;
         this.#primaryControl = void 0;
      }

      if (setPrimary)
      {
         control.isPrimary = true;
         this.#primaryControl = control;
      }

      control.selected = true;

      const unsubscribe = control.position.stores.transform.subscribe(
       (data) => this.#transformDataMap.set(controlId, data));

      this.#unsubscribeMap.set(controlId, unsubscribe);
   }

   clear()
   {
      if (this.#primaryControl)
      {
         this.#primaryControl.isPrimary = false;
         this.#primaryControl = void 0;
      }

      for (const control of this.#selectedMap.values())
      {
         const unsubscribe = this.#unsubscribeMap.get(control.id);
         if (typeof unsubscribe === 'function') { unsubscribe(); }

         control.selected = false;
      }

      this.#transformDataMap.clear();
      this.#unsubscribeMap.clear();
      this.#quickToMap.clear();
      this.#selectedMap.clear();
   }

   /**
    * @returns {IterableIterator<[*, ControlStore]>} Selected control entries iterator.
    */
   entries()
   {
      return this.#selectedMap.entries();
   }

   /**
    * @returns {ControlStore} The primary control store.
    */
   getPrimary()
   {
      return this.#primaryControl;
   }

   /**
    * @returns {IterableIterator<*>} Selected control keys iterator.
    */
   keys()
   {
      return this.#selectedMap.keys();
   }

   #onDragMove(event)
   {
      let { tX, tY } = event.detail;

      const dragUpdate = this.#dragUpdate;

      const validationRect = this.#data.boundingRect;
      const validate = this.#data.validate;

      if (validate && validationRect)
      {
         const boundingRect = this.#dragBoundingRect;

         let x = boundingRect.x + tX;
         let y = boundingRect.y + tY;
         const left = boundingRect.left + tX;
         const right = boundingRect.right + tX;
         const bottom = boundingRect.bottom + tY;
         const top = boundingRect.top + tY;

         const initialX = x;
         const initialY = y;

         if (bottom > validationRect.bottom) { y += validationRect.bottom - bottom; }
         if (right > validationRect.right) { x += validationRect.right - right; }
         if (top < 0) { y += Math.abs(top); }
         if (left < 0) { x += Math.abs(left); }

         tX -= initialX - x;
         tY -= initialY - y;
      }

      // Add adjusted total X / Y added to initial positions for each control position.
      for (const quickTo of this.#quickToMap.values())
      {
         dragUpdate.left = quickTo.initialPosition.left + tX;
         dragUpdate.top = quickTo.initialPosition.top + tY;

         quickTo(dragUpdate);
      }
   }

   #onDragStart()
   {
      for (const controlId of this.keys())
      {
         const control = this.#selectedMap.get(controlId);
         const quickTo = this.#quickToMap.get(controlId);
         quickTo.initialPosition = control.position.get();
      }

      this.getBoundingRect(this.#dragBoundingRect);
   }

   /**
    * @param {ControlStore}   control - A control store.
    */
   remove(control)
   {
      if (this.#primaryControl === control)
      {
         this.#primaryControl.isPrimary = false;
         this.#primaryControl = void 0;
      }

      const controlId = control.id;

      if (this.#selectedMap.delete(controlId))
      {
         const unsubscribe = this.#unsubscribeMap.get(controlId);
         this.#unsubscribeMap.delete(controlId);

         if (typeof unsubscribe === 'function') { unsubscribe(); }

         this.#transformDataMap.delete(controlId);
         this.#quickToMap.delete(controlId);

         control.selected = false;
      }
   }

   /**
    * @param {*}   controlId - An ID for a control store to remove.
    */
   removeById(controlId)
   {
      if (this.#primaryControl?.id === controlId)
      {
         this.#primaryControl.isPrimary = false;
         this.#primaryControl = void 0;
      }

      const control = this.#selectedMap.get(controlId);

      if (control)
      {
         const unsubscribe = this.#unsubscribeMap.get(controlId);
         this.#unsubscribeMap.delete(controlId);

         if (typeof unsubscribe === 'function') { unsubscribe(); }

         this.#transformDataMap.delete(controlId);
         this.#quickToMap.delete(controlId);
         this.#selectedMap.delete(controlId);

         control.selected = false;
      }
   }

   setPrimary(control)
   {
      if (this.#primaryControl && this.#primaryControl !== control)
      {
         this.#primaryControl.isPrimary = false;
         this.#primaryControl = void 0;
      }

      this.#primaryControl = control;
      control.isPrimary = true;
   }

   /**
    * Processes all selected controls transformed bounds to create a single combined bounding rect.
    *
    * @param {DOMRect} [boundingRect] - A DOMRect to store calculations or one will be created.
    *
    * @returns {DOMRect} Bounding rect.
    */
   getBoundingRect(boundingRect = new DOMRect())
   {
      let maxX = Number.MIN_SAFE_INTEGER;
      let maxY = Number.MIN_SAFE_INTEGER;
      let minX = Number.MAX_SAFE_INTEGER;
      let minY = Number.MAX_SAFE_INTEGER;

      for (const transformData of this.#transformDataMap.values())
      {
         const controlRect = transformData.boundingRect;

         if (controlRect.right > maxX) { maxX = controlRect.right; }
         if (controlRect.left < minX) { minX = controlRect.left; }
         if (controlRect.bottom > maxY) { maxY = controlRect.bottom; }
         if (controlRect.top < minY) { minY = controlRect.top; }
      }

      boundingRect.x = minX;
      boundingRect.y = minY;
      boundingRect.width = maxX - minX;
      boundingRect.height = maxY - minY;

      return boundingRect;
   }

   /**
    * @returns {IterableIterator<Object>} Selected controls iterator.
    */
   values()
   {
      return this.#selectedMap.values();
   }
}

/**
 * @typedef {object} ControlsData
 *
 * @property {DOMRect} boundingRect -
 *
 * @property {boolean} enabled -
 *
 * @property {boolean} validate -
 */

/**
 * Provides an action to enable selection dragging that creates events for start,change,end
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @param {boolean}           [params.constrain=true] - Constrains selection to origin and width of node.
 *
 * @param {boolean}           [params.capture=false] - Capture pointer events.
 *
 * @param {string}            [params.background='rgba(255, 0, 0, 0.3)'] - A valid CSS background style string.
 *
 * @param {number}            [params.width=2] - Width of selection box in pixels.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */
function selection(node, { active = true, constrain = true, capture = false,
 background = 'rgba(255, 255, 255, 0.5)', width = 2 } = {})
{
   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   const initialDragPoint = { x: 0, y: 0 };

   const selectionRect = new DOMRect();

   let dragging = false;

   /**
    * @type {HTMLElement}
    */
   let spanEl;

   /**
    * Remember event handlers associated with this action so they may be later unregistered.
    *
    * @type {object}
    */
   const handlers = {
      dragDown: ['pointerdown', (e) => onDragPointerDown(e), false],
      dragChange: ['pointermove', (e) => onDragPointerChange(e), false],
      dragUp: ['pointerup', (e) => onDragPointerUp(e), false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners()
   {
      // Drag handlers
      node.addEventListener(...handlers.dragDown);
   }

   /**
    * Removes listeners.
    */
   function removeListeners()
   {
      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the selection box.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      if (event.target !== node) { return; }
      if (event.button !== 0 || !event.isPrimary) { return; }

      if (capture) { event.preventDefault(); event.stopPropagation(); }

      const nodeRect = node.getBoundingClientRect();

      selectionRect.x = initialDragPoint.x = event.clientX - nodeRect.left;
      selectionRect.y = initialDragPoint.y = event.clientY - nodeRect.top;
      selectionRect.width = 0;
      selectionRect.height = 0;

      if (constrain)
      {
         if (selectionRect.x < 0) { selectionRect.x = 0; }
         if (selectionRect.y < 0) { selectionRect.x = 0; }
      }

      dragging = false;

      // Add move and pointer up handlers.
      node.addEventListener(...handlers.dragChange);
      node.addEventListener(...handlers.dragUp);

      node.setPointerCapture(event.pointerId);

      node.dispatchEvent(new CustomEvent('selection:start', { bubbles: false }));
   }

   /**
    * Change selection.
    *
    * @param {PointerEvent} event - The pointer move event.
    */
   function onDragPointerChange(event)
   {
      // See chorded button presses for pointer events:
      // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
      if ((event.buttons & 1) === 0)
      {
         onDragPointerUp(event);
         return;
      }

      if (capture) { event.preventDefault(); event.stopPropagation(); }

      const nodeRect = node.getBoundingClientRect();

      /** @type {number} */
      selectionRect.width = event.clientX - initialDragPoint.x - nodeRect.left;
      selectionRect.height = event.clientY - initialDragPoint.y - nodeRect.top;

      if (constrain)
      {
         const bottom = nodeRect.bottom - nodeRect.top;
         const right = nodeRect.right - nodeRect.left;

         if (selectionRect.left < 0) { selectionRect.width += selectionRect.width >= 0 ? selectionRect.left : -selectionRect.left; }
         if (selectionRect.top < 0) { selectionRect.height += selectionRect.height >= 0 ? selectionRect.top : -selectionRect.top; }

         if (selectionRect.right > right) { selectionRect.width += selectionRect.width >= 0 ? right - selectionRect.right : -(right - selectionRect.right); }
         if (selectionRect.bottom > bottom) { selectionRect.height += selectionRect.height >= 0 ? bottom - selectionRect.bottom : -(bottom - selectionRect.bottom); }
      }

      if (!dragging && (selectionRect.width !== 0 || selectionRect.height !== 0))
      {
         spanEl = document.createElement('span');

         spanEl.style.position = 'absolute';
         spanEl.style.background = `var(--tjs-action-selection-background, ${background})`;
         spanEl.style.pointerEvents = 'none';
         spanEl.style.clipPath = `polygon(0% 0%, 0% 100%, ${width}px 100%, ${width}px ${width}px, calc(100% - ${width}px) ${width}px, calc(100% - ${width}px) calc(100% - ${width}px), ${width}px calc(100% - ${width}px), ${width}px 100%, 100% 100%, 100% 0%)`;
         spanEl.style.zIndex = `${Number.MAX_SAFE_INTEGER}`;

         dragging = true;

         node.append(spanEl);
      }

      if (spanEl)
      {
         spanEl.style.width = `${selectionRect.right - selectionRect.left}px`;
         spanEl.style.height = `${selectionRect.bottom - selectionRect.top}px`;
         spanEl.style.left = `${selectionRect.left}px`;
         spanEl.style.top = `${selectionRect.top}px`;
      }

      node.dispatchEvent(new CustomEvent('selection:change', {
         detail: { rect: DOMRectReadOnly.fromRect(selectionRect) },
         bubbles: false
      }));
   }

   /**
    * Finish dragging and send completion event.
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      if (capture) { event.preventDefault(); event.stopPropagation(); }

      if (spanEl)
      {
         spanEl.remove();
         spanEl = void 0;
      }

      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);

      if (dragging)
      {
         node.dispatchEvent(new CustomEvent('selection:end', {
            detail: {
               ctrlKey: event.ctrlKey,
               shiftKey: event.shiftKey,
               metaKey: event.metaKey,
               rect: DOMRectReadOnly.fromRect(selectionRect)
            },
            bubbles: false
         }));
      }

      dragging = false;
   }

   return {
      // The default of active being true won't automatically add listeners twice.
      update: (options) =>
      {
         if (typeof options.active === 'boolean')
         {
            active = options.active;
            if (active) { activateListeners(); }
            else
            {
               dragging = false;

               if (spanEl)
               {
                  spanEl.remove();
                  spanEl = void 0;
               }

               removeListeners();
            }
         }
      },

      destroy: () => removeListeners()
   };
}

/* src\component\standard\layers\position-control\TJSPositionControlLayer.svelte generated by Svelte v3.49.0 */

function add_css$2(target) {
	append_styles(target, "svelte-1brgi3d", "div.svelte-1brgi3d{width:100%;height:100%}");
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[15] = list[i];
	return child_ctx;
}

// (83:0) {:else}
function create_else_block(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

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

// (74:0) {#if active}
function create_if_block(ctx) {
	let div;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t;
	let selection_action;
	let current;
	let mounted;
	let dispose;
	let each_value = /*$controls*/ ctx[3];
	const get_key = ctx => /*control*/ ctx[15].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$2(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
	}

	const default_slot_template = /*#slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			if (default_slot) default_slot.c();
			attr(div, "class", "svelte-1brgi3d");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			append(div, t);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(selection_action = selection.call(null, div, { active: /*ctrlKey*/ ctx[2], width: 4 })),
					listen(div, "mousedown", /*onMouseDown*/ ctx[6], true),
					listen(div, "selection:end", /*onSelectionEnd*/ ctx[7])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*$controls*/ 8) {
				each_value = /*$controls*/ ctx[3];
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$2, t, get_each_context$2);
				check_outros();
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

			if (selection_action && is_function(selection_action.update) && dirty & /*ctrlKey*/ 4) selection_action.update.call(null, { active: /*ctrlKey*/ ctx[2], width: 4 });
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (default_slot) default_slot.d(detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (78:3) {#each $controls as control (control.id)}
function create_each_block$2(key_1, ctx) {
	let first;
	let positioncontrol;
	let current;
	positioncontrol = new PositionControl({ props: { control: /*control*/ ctx[15] } });

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(positioncontrol.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(positioncontrol, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const positioncontrol_changes = {};
			if (dirty & /*$controls*/ 8) positioncontrol_changes.control = /*control*/ ctx[15];
			positioncontrol.$set(positioncontrol_changes);
		},
		i(local) {
			if (current) return;
			transition_in(positioncontrol.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(positioncontrol.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(first);
			destroy_component(positioncontrol, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let t;
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*active*/ ctx[1]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			t = space();
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			insert(target, t, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(document.body, "keydown", /*onKeyDown*/ ctx[4], true),
					listen(document.body, "keyup", /*onKeyUp*/ ctx[5], true)
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
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
			if (detaching) detach(t);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let $controls,
		$$unsubscribe_controls = noop,
		$$subscribe_controls = () => ($$unsubscribe_controls(), $$unsubscribe_controls = subscribe(controls, $$value => $$invalidate(3, $controls = $$value)), controls);

	$$self.$$.on_destroy.push(() => $$unsubscribe_controls());
	let { $$slots: slots = {}, $$scope } = $$props;
	const [controlsStore, selectedDragAPI] = new ControlsStore();
	let { controls = controlsStore } = $$props;
	$$subscribe_controls();
	let { components } = $$props;
	let { active = true } = $$props;
	let { boundingRect = void 0 } = $$props;
	let { validate = true } = $$props;
	setContext('pclControls', controls);
	setContext('pclSelectedDragAPI', selectedDragAPI);
	let ctrlKey = false;

	function onKeyDown(event) {
		if (event.key === 'Control' && !event.repeat) {
			$$invalidate(2, ctrlKey = true);
			$$invalidate(0, controls.enabled = true, controls);
		}
	}

	function onKeyUp(event) {
		if (event.key === 'Control' && !event.repeat) {
			$$invalidate(2, ctrlKey = false);
			$$invalidate(0, controls.enabled = false, controls);
		}
	}

	function onMouseDown(event) {
		if (!event.ctrlKey) {
			controls.selected.clear();
		}
	}

	function onSelectionEnd(event) {
		const rect = event.detail.rect;

		for (const control of $controls) {
			const position = control.position;
			const top = position.top;
			const left = position.left;
			const bottom = top + position.height;
			const right = left + position.width;

			// AABB -> AABB overlap test.
			const xOverlap = Math.max(0, Math.min(right, rect.right) - Math.max(left, rect.left));

			const yOverlap = Math.max(0, Math.min(bottom, rect.bottom) - Math.max(top, rect.top));

			if (xOverlap > 0 && yOverlap > 0) {
				controls.selected.add(control, false);
			} else {
				if (!event.detail.shiftKey) {
					controls.selected.remove(control);
				}
			}
		}
	}

	$$self.$$set = $$props => {
		if ('controls' in $$props) $$subscribe_controls($$invalidate(0, controls = $$props.controls));
		if ('components' in $$props) $$invalidate(8, components = $$props.components);
		if ('active' in $$props) $$invalidate(1, active = $$props.active);
		if ('boundingRect' in $$props) $$invalidate(9, boundingRect = $$props.boundingRect);
		if ('validate' in $$props) $$invalidate(10, validate = $$props.validate);
		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*boundingRect*/ 512) {
			$$invalidate(0, controls.boundingRect = boundingRect, controls);
		}

		if ($$self.$$.dirty & /*validate*/ 1024) {
			$$invalidate(0, controls.validate = validate, controls);
		}

		if ($$self.$$.dirty & /*controls, components*/ 257) {
			controls.updateComponents(components);
		}
	};

	return [
		controls,
		active,
		ctrlKey,
		$controls,
		onKeyDown,
		onKeyUp,
		onMouseDown,
		onSelectionEnd,
		components,
		boundingRect,
		validate,
		$$scope,
		slots
	];
}

class TJSPositionControlLayer extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				controls: 0,
				components: 8,
				active: 1,
				boundingRect: 9,
				validate: 10
			},
			add_css$2
		);
	}
}

/* src\component\standard\menu\TJSMenu.svelte generated by Svelte v3.49.0 */

function add_css$1(target) {
	append_styles(target, "svelte-argoi9", ".tjs-menu.svelte-argoi9.svelte-argoi9.svelte-argoi9{position:absolute;width:max-content;height:max-content;box-shadow:0 0 2px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));background:var(--typhonjs-color-content-window, #23221d);border:1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));border-radius:5px;color:var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));text-align:start;z-index:1}.tjs-menu.svelte-argoi9 ol.tjs-menu-items.svelte-argoi9.svelte-argoi9{list-style:none;margin:0;padding:0}.tjs-menu.svelte-argoi9 li.tjs-menu-item.svelte-argoi9.svelte-argoi9{padding:0 0.5em;line-height:2em}.tjs-menu.svelte-argoi9 li.tjs-menu-item.svelte-argoi9.svelte-argoi9:hover{color:var(--typhonjs-color-text-primary, #FFF);text-shadow:0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red))}.tjs-menu.svelte-argoi9 li.tjs-menu-item.svelte-argoi9>i.svelte-argoi9{width:1em;margin-right:5px}");
}

const get_after_slot_changes$1 = dirty => ({});
const get_after_slot_context$1 = ctx => ({});

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	return child_ctx;
}

const get_before_slot_changes$1 = dirty => ({});
const get_before_slot_context$1 = ctx => ({});

// (152:6) {#each items as item}
function create_each_block$1(ctx) {
	let li;
	let i;
	let i_class_value;
	let t_value = localize(/*item*/ ctx[17].label) + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[13](/*item*/ ctx[17]);
	}

	return {
		c() {
			li = element("li");
			i = element("i");
			t = text(t_value);
			attr(i, "class", i_class_value = "" + (null_to_empty(/*item*/ ctx[17].icon) + " svelte-argoi9"));
			attr(li, "class", "tjs-menu-item svelte-argoi9");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, i);
			append(li, t);

			if (!mounted) {
				dispose = listen(li, "click", stop_propagation(prevent_default(click_handler)));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*items*/ 1 && i_class_value !== (i_class_value = "" + (null_to_empty(/*item*/ ctx[17].icon) + " svelte-argoi9"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*items*/ 1 && t_value !== (t_value = localize(/*item*/ ctx[17].label) + "")) set_data(t, t_value);
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
			attr(ol, "class", "tjs-menu-items svelte-argoi9");
			attr(nav, "class", "tjs-menu svelte-argoi9");
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
					listen(window, "blur", /*onWindowBlur*/ ctx[6]),
					listen(document.body, "pointerdown", /*onClose*/ ctx[5]),
					listen(document.body, "wheel", /*onClose*/ ctx[5]),
					action_destroyer(/*efx*/ ctx[1].call(null, nav)),
					listen(nav, "click", stop_propagation(prevent_default(click_handler_1$1))),
					listen(nav, "wheel", stop_propagation(prevent_default(wheel_handler)))
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

			if (dirty & /*onClick, items, localize*/ 17) {
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
				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[3], {}, true);
				nav_transition.run(1);
			});

			current = true;
		},
		o(local) {
			transition_out(before_slot, local);
			transition_out(after_slot, local);
			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, /*animate*/ ctx[3], {}, false);
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

const click_handler_1$1 = () => null;
const wheel_handler = () => null;

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	const s_DEFAULT_OFFSET = { x: 0, y: 0 };
	let { menu } = $$props;
	let { items } = $$props;
	let { offset } = $$props;
	let { styles } = $$props;
	let { efx } = $$props;
	let { transitionOptions } = $$props;

	// Bound to the nav element / menu.
	let menuEl;

	// Stores if this context menu is closed.
	let closed = false;

	/**
 * Provides a custom transform allowing inspection of the element to change positioning styles based on the
 * height / width of the element and the containing stacking context element. This allows the menu to expand left or
 * right when the menu exceeds the bounds of the containing stacking context element.
 *
 * @param {HTMLElement} node - nav element.
 *
 * @returns {object} Transition object.
 */
	function animate(node) {
		const result = getStackingContext(node.parentElement);

		if (!(result?.node instanceof HTMLElement)) {
			console.warn(`'TJSMenu.animate warning: Could not locate parent stacking context element.`);
			return;
		}

		const stackingContextRect = result?.node.getBoundingClientRect();
		const stackingContextRight = stackingContextRect.x + stackingContextRect.width;
		const nodeRect = node.getBoundingClientRect();
		const parentRect = node.parentElement.getBoundingClientRect();
		const adjustedOffset = { ...s_DEFAULT_OFFSET, ...offset };
		node.style.top = `${adjustedOffset.y + parentRect.height}px`;

		// Check to make sure that the menu width does not exceed the right side of the stacking context element.
		// If not open to the right.
		if (parentRect.x + nodeRect.width < stackingContextRight) {
			node.style.left = `${adjustedOffset.x}px`;
			node.style.removeProperty('right');
		} else // Open left.
		{
			node.style.right = `${adjustedOffset.x}px`;
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

	/**
 * Closes menu when browser window is blurred.
 */
	function onWindowBlur() {
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
		animate,
		onClick,
		onClose,
		onWindowBlur,
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
			instance$1,
			create_fragment$1,
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

/* src\component\standard\menu\context\TJSContextMenu.svelte generated by Svelte v3.49.0 */

const { document: document_1 } = globals;

function add_css(target) {
	append_styles(target, "svelte-ugn418", ".tjs-context-menu.svelte-ugn418.svelte-ugn418.svelte-ugn418{position:fixed;width:fit-content;font-size:14px;box-shadow:0 0 10px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));height:max-content;min-width:20px;max-width:360px;background:var(--typhonjs-color-content-window, #23221d);border:1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));border-radius:5px;color:var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));text-align:start}.tjs-context-menu.svelte-ugn418 ol.tjs-context-items.svelte-ugn418.svelte-ugn418{list-style:none;margin:0;padding:0}.tjs-context-menu.svelte-ugn418 li.tjs-context-item.svelte-ugn418.svelte-ugn418{padding:0 0.5em;line-height:2em}.tjs-context-menu.svelte-ugn418 li.tjs-context-item.svelte-ugn418.svelte-ugn418:hover{color:var(--typhonjs-color-text-primary, #FFF);text-shadow:0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red))}.tjs-context-menu.svelte-ugn418 li.tjs-context-item.svelte-ugn418>i.svelte-ugn418{margin-right:5px}");
}

const get_after_slot_changes = dirty => ({});
const get_after_slot_context = ctx => ({});

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[19] = list[i];
	return child_ctx;
}

const get_before_slot_changes = dirty => ({});
const get_before_slot_context = ctx => ({});

// (121:8) {#each items as item}
function create_each_block(ctx) {
	let li;
	let i;
	let i_class_value;
	let t_value = localize(/*item*/ ctx[19].label) + "";
	let t;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[14](/*item*/ ctx[19]);
	}

	return {
		c() {
			li = element("li");
			i = element("i");
			t = text(t_value);
			attr(i, "class", i_class_value = "" + (null_to_empty(/*item*/ ctx[19].icon) + " svelte-ugn418"));
			attr(li, "class", "tjs-context-item svelte-ugn418");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, i);
			append(li, t);

			if (!mounted) {
				dispose = listen(li, "click", stop_propagation(prevent_default(click_handler)));
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*items*/ 2 && i_class_value !== (i_class_value = "" + (null_to_empty(/*item*/ ctx[19].icon) + " svelte-ugn418"))) {
				attr(i, "class", i_class_value);
			}

			if (dirty & /*items*/ 2 && t_value !== (t_value = localize(/*item*/ ctx[19].label) + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment(ctx) {
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
	const before_slot = create_slot(before_slot_template, ctx, /*$$scope*/ ctx[11], get_before_slot_context);
	let each_value = /*items*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const after_slot_template = /*#slots*/ ctx[12].after;
	const after_slot = create_slot(after_slot_template, ctx, /*$$scope*/ ctx[11], get_after_slot_context);

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

			/*nav_binding*/ ctx[15](nav);
			current = true;

			if (!mounted) {
				dispose = [
					listen(window, "blur", /*onWindowBlur*/ ctx[7]),
					listen(document_1.body, "pointerdown", /*onClose*/ ctx[6]),
					listen(document_1.body, "wheel", /*wheel_handler*/ ctx[13]),
					listen(nav, "click", stop_propagation(prevent_default(click_handler_1)))
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
						: get_slot_changes(before_slot_template, /*$$scope*/ ctx[11], dirty, get_before_slot_changes),
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
				if (after_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot_base(
						after_slot,
						after_slot_template,
						ctx,
						/*$$scope*/ ctx[11],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
						: get_slot_changes(after_slot_template, /*$$scope*/ ctx[11], dirty, get_after_slot_changes),
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
			/*nav_binding*/ ctx[15](null);
			if (detaching && nav_transition) nav_transition.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

const click_handler_1 = () => null;

function instance($$self, $$props, $$invalidate) {
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
 * @param {PointerEvent|MouseEvent}  event - Pointer or mouse event from document body click / scroll wheel.
 *
 * @param {boolean}                  [isWheel=false] - True when scroll wheel; do not perform 2nd early out test.
 */
	function onClose(event, isWheel = false) {
		// Early out if the pointer down is inside the menu element.
		if (event.target === menuEl || menuEl.contains(event.target)) {
			return;
		}

		// Early out if the event page X / Y is the same as this context menu.
		if (!isWheel && Math.floor(event.pageX) === x && Math.floor(event.pageY) === y) {
			return;
		}

		if (!closed) {
			dispatch('close');
			closed = true;
			outroAndDestroy(local);
		}
	}

	/**
 * Closes context menu when browser window is blurred.
 */
	function onWindowBlur() {
		if (!closed) {
			dispatch('close');
			closed = true;
			outroAndDestroy(local);
		}
	}

	const wheel_handler = event => onClose(event, true);
	const click_handler = item => onClick(item.onclick);

	function nav_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			menuEl = $$value;
			$$invalidate(3, menuEl);
		});
	}

	$$self.$$set = $$props => {
		if ('id' in $$props) $$invalidate(0, id = $$props.id);
		if ('x' in $$props) $$invalidate(8, x = $$props.x);
		if ('y' in $$props) $$invalidate(9, y = $$props.y);
		if ('items' in $$props) $$invalidate(1, items = $$props.items);
		if ('zIndex' in $$props) $$invalidate(2, zIndex = $$props.zIndex);
		if ('transitionOptions' in $$props) $$invalidate(10, transitionOptions = $$props.transitionOptions);
		if ('$$scope' in $$props) $$invalidate(11, $$scope = $$props.$$scope);
	};

	return [
		id,
		items,
		zIndex,
		menuEl,
		animate,
		onClick,
		onClose,
		onWindowBlur,
		x,
		y,
		transitionOptions,
		$$scope,
		slots,
		wheel_handler,
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
			instance,
			create_fragment,
			safe_not_equal,
			{
				id: 0,
				x: 8,
				y: 9,
				items: 1,
				zIndex: 2,
				transitionOptions: 10
			},
			add_css
		);
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
      '--tjs-input-cursor': 'inherit',
      '--tjs-input-height': 'height' in props ? props.height : 'var(--form-field-height)',
      '--tjs-input-min-width': 'min-width' in props ? props['min-width'] : '20px',
      '--tjs-input-width': 'width' in props ? props.width : 'calc(100% - 2px)'
   });
}

export { TJSContextMenu, TJSIconButton, TJSIconFolder, TJSInput, TJSMenu, TJSPositionControlLayer, TJSSelect, TJSSvgFolder, TJSToggleIconButton };
//# sourceMappingURL=index.js.map
