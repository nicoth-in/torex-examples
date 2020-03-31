'use strict';

class SharedStorage extends EventTarget {
	constructor(parent) {
      super();
      this.storage = {};
      this.parent = parent;
    }
  set(name, value) {
  	let st = this.getParentStorage();
  	if(st) {
    	return st.set(name, value);
    } else {
    	this.storage[name] = value;
      this.parent.dispatchEvent(new Event("sharedstoragechanged", {
        bubbles: true,
        cancelable: false,
      }));
    }
  }
  get(name) {
  	let st = this.getParentStorage();
  	if(st) {
    	return st.get(name);
    } else {
    	return this.storage[name];
    }
  }
  clear() {
  	let st = this.getParentStorage();
  	if(st) {
    	return st.clear();
    } else {
      let s = this.storage;
      this.storage = {};
      return s;
    }
  }
  getParentStorage() {
  	if(!this.parent.parentNode) ;
    else if(this.parent.parentNode.sharedStorage) {
    	return this.parent.parentNode.sharedStorage;
    }
    return false;
  }
}

function Randomize() {
	return Array.apply(0, Array(16)).map(function() {
    return (function(charset){
        return charset.charAt(Math.floor(Math.random() * charset.length))
    }('abcdefghijklmnopqrstuvwxyz-'));
	}).join('')
}

class NodeConstructor {
	constructor(ray) {
		this.c = ray.c;
		switch (ray.type) {
			case "native":
				break;
			case "tag":
				if(!customElements.get(ray.custom)) {
					this.customize(ray.custom, ray.tag);
				}
				break;
			case "custom":
				if(!customElements.get(ray.custom)) {
					try {
						this.customize(ray.custom, ray.tag);
					}
					catch(e) {
						//console.error(e);
					}
				}
				break;
			case "default":
				try {
					this.customize("igniter-"+ray.custom, ray.tag);
				}
				catch(e) {
					//console.error(e);
				}
				break;
		}
		let answer = Reflect.construct(ray.from, [], ray.c);

		for(let v in ray.attr) {
			answer.setAttribute(v, ray.attr[v]);
		}

		for(let item of ray.items) {
			answer.appendChild(item);
		}

		if(answer) this.storageSet(answer);
    return answer;
  }
  customize(name, from) {
  	customElements.define(name, this.c, { extends: from });
  }
  storageSet(node) {
  	node.sharedStorage = new SharedStorage(node);
  }
}

class Ray {
	constructor(options) {
		this.tag = options.tag;
		this.c = options.c;
		this.from = options.from;
		if(options.native) {
			this.type = "native";
		} else if(this.c.name.toLowerCase() == this.tag.toLowerCase()) {
			if(this.custom) console.error("You can't customize default elements. Create a new class and extend this element.");
			this.type = "tag";
			this.custom = "igniter-"+this.tag;
		} else if(options.custom) {
			this.type = "custom";
			this.custom = options.custom;
		} else {
			this.type = "default";
			this.custom = false;
			this.genCustom();
		}

		this.attr = options.attr || {};
		this.items = options.items || [];

		if(!(this.items instanceof Array)) {
			this.items = [this.items];
		}

	}
	genCustom() {
		while(customElements.get(this.custom)||(!this.custom)) {
			this.custom = Randomize();
		}
	}
}

const ElementKeys = [
    "a",
    "abbr",
    "acronym",
    "address",
    "applet",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "basefont",
    "bdi",
    "bdo",
    "bgsound",
    "big",
    "blink",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "center",
    "cite",
    "code",
    "col",
    "colgroup",
    "command",
    "content",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "font",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "image",
    "img",
    "input",
    "ins",
    "isindex",
    "kbd",
    "keygen",
    "label",
    "legend",
    "li",
    "link",
    "listing",
    "main",
    "map",
    "mark",
    "marquee",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "multicol",
    "nav",
    "nextid",
    "nobr",
    "noembed",
    "noframes",
    "noscript",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "plaintext",
    "pre",
    "progress",
    "q",
    "rb",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "shadow",
    "slot",
    "small",
    "source",
    "spacer",
    "span",
    "strike",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "tt",
    "u",
    "ul",
    "var",
    "video",
    "wbr",
    "xmp"
  ];

const Torex = {};

class Generator {
	constructor() {

		const scope = this;

		for (let key of this.getElements()) {
			let className = key[0].toUpperCase() + key.slice(1);
			let prototypeName = document.createElement(key).constructor;
			let classPrototypeName = "Torex" + prototypeName.name.substring(4, prototypeName.name.length);

			if(!scope[classPrototypeName]) {
				scope[classPrototypeName] = class {
					constructor(i) {
						return new NodeConstructor(scope.createRay(this.constructor, prototypeName, i));
					}
				};
				Reflect.setPrototypeOf(scope[classPrototypeName].prototype, prototypeName.prototype);
				Reflect.setPrototypeOf(scope[classPrototypeName], prototypeName);
				Reflect.defineProperty(scope[classPrototypeName], "name", { value: classPrototypeName });
			}

			Torex[className] = class extends scope[classPrototypeName] {
				constructor(o) {
					if(o) o.tag = key;
					super(o);
				}
			};

			Reflect.defineProperty(Torex[className], "name", { value: className });

		}
	}
	createRay(c, from, opt) {
		return (opt) ?
			new Ray({
				native:false,
				from: from,
				c: c,
				...opt
			}) :
			new Ray({
				native: true,
				from: from,
				c: c,
				...opt
			});
	}
	getElements() {
		return ElementKeys;
	}
}

let generatorContext = new Generator();

console.log(Torex);
