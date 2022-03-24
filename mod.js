export function h(tag, props, ...children) {
  return {
    tag,
    props: {
      ...props,
      children: children.flat(),
    },
  };
}

export const Fragment = "fragment";

const HTML_ENTITIES = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
};

function encode(str) {
  return str.replace(/[<>&"]/g, (char) => HTML_ENTITIES[char]);
}

// https://stackoverflow.com/a/45392255/156372
function unitless(prop) {
  switch (prop.toLowerCase()) {
    case "area":
    case "animationiterationcount":
    case "borderimageslice":
    case "borderimagewidth":
    case "columncount":
    case "counterincrement":
    case "counterreset":
    case "flex":
    case "flexgrow":
    case "flexshrink":
    case "fontsizeadjust":
    case "fontweight":
    case "lineheight":
    case "navindex":
    case "opacity":
    case "order":
    case "orphans":
    case "tabsize":
    case "widows":
    case "zindex":
    case "pitchrange":
    case "richness":
    case "speechrate":
    case "stress":
    case "volume":
    case "floodopacity":
    case "maskboxoutset":
    case "maskborderoutset":
    case "maskboxwidth":
    case "maskborderwidth":
    case "shapeimagethreshold":
      return true;
  }
  return false;
}

// append 'px' to numeric values (except for unitless props)
function dimension(prop, value) {
  if (
    typeof value === "number" && Number.isFinite(value) && !unitless(prop) &&
    value !== 0
  ) {
    return `${value}px`;
  }
  return value;
}

function css(obj) {
  return Object.entries(obj).map(([prop, val]) => (
    `${kebab(prop)}: ${dimension(prop, val)}`
  )).join("; ");
}

// https://meiert.com/en/blog/boolean-attributes-of-html/
function isBooleanAttr(attr) {
  switch (attr) {
    case "allowfullscreen":
    case "allowpaymentrequest":
    case "async":
    case "autofocus":
    case "autoplay":
    case "checked":
    case "controls":
    case "default":
    case "defer":
    case "disabled":
    case "formnovalidate":
    case "hidden":
    case "ismap":
    case "itemscope":
    case "loop":
    case "multiple":
    case "muted":
    case "nomodule":
    case "novalidate":
    case "open":
    case "playsinline":
    case "readonly":
    case "required":
    case "reversed":
    case "selected":
    case "truespeed":
      return true;
  }
  return false;
}

// render HTML attributes
function attrs(props = {}) {
  return Object.entries(props).map(([key, value]) => {
    switch (key) {
      case "dangerouslySetInnerHTML":
      case "children":
        return "";
      case "style":
        return ` style="${css(value)}"`;
      default:
        if (isBooleanAttr(key)) {
          return value ? ` ${key}` : "";
        } else {
          return ` ${key}="${String(value).replace('"', "&quot;")}"`;
        }
    }
  }).join("");
}

// convert camelCase to kebab-case
function kebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function selfClosing(tag) {
  switch (tag) {
    case "area":
    case "base":
    case "br":
    case "col":
    case "embed":
    case "hr":
    case "img":
    case "input":
    case "link":
    case "meta":
    case "param":
    case "source":
    case "track":
    case "wbr":
      return true;
  }
  return false;
}

function empty(node) {
  switch (node) {
    case undefined:
    case null:
    case true:
    case false:
      return true;
  }
  return false;
}

// Run all (async) functions and return a tree of simple object nodes.
// If a targetElementId is provided, only return the target node.
async function resolve(node, targetElementId = null) {
  let target = null;

  const _resolve = async (n, isSubtree = false) => {
    // already found the target element somewhere else
    //  - exit unless we're in the target's sub-tree
    if (target && !isSubtree) return null;

    // searching for the target element, mark it if found
    if (targetElementId && targetElementId === n?.props?.id) {
      target = n;
      isSubtree = true;
    }

    if (typeof n?.tag === "function") {
      n = await _resolve(await n.tag(n.props), isSubtree);
    }

    // recursively traverse and resolve all children of this node
    if (n?.props?.children) {
      n.props.children = await Promise.all(
        n.props.children?.map((child) => _resolve(child, isSubtree)),
      );
    }
    return n;
  };

  const root = await _resolve(node);
  return target ?? root;
}

function render(node, pad = "", options) {
  if (empty(node)) {
    return "";
  }

  const { maxInlineContentWidth, tab, newline } = options;

  if (typeof node !== "object") {
    return pad + encode(String(node));
  }

  if (selfClosing(node.tag)) {
    return pad + `<${node.tag}${attrs(node.props)} />`;
  }

  // special case to handle <textarea value="foo" />
  if (node.tag === "textarea") {
    const { value, children, ...rest } = node.props;
    // note: we're okay with rendering [object Object] for non-string children
    return pad + `<textarea${attrs(rest)}>${value ?? children}</textarea>`;
  }

  let innerHTML = "";

  // draw tag on multiple lines
  let blockFormat = false;

  if (node.props?.dangerouslySetInnerHTML?.__html) {
    blockFormat = true;
    innerHTML = pad + tab + node.props.dangerouslySetInnerHTML?.__html;
  } else {
    const children = node.props?.children ?? [];

    // only text
    if (children.every((child) => typeof child !== "object")) {
      innerHTML = encode(children.join(""));
      blockFormat = node.tag !== "pre" &&
        innerHTML.length > maxInlineContentWidth;
      if (blockFormat) {
        innerHTML = pad + tab + innerHTML;
      }
    } else {
      blockFormat = node.tag !== "pre";
      const padpad = node.tag !== Fragment && blockFormat ? pad + tab : "";
      innerHTML = children.map((child) => render(child, padpad, options)).join(
        newline,
      );
    }
  }

  if (node.tag === Fragment) {
    return innerHTML;
  }

  if (blockFormat) {
    innerHTML = `${newline}${innerHTML}${newline}${pad}`;
  }

  return pad + `<${node.tag}${attrs(node.props)}>${innerHTML}</${node.tag}>`;
}

export async function renderJSX(jsx, options = {}) {
  // options with defaults
  const {
    pretty = true,
    maxInlineContentWidth = 40,
    tab = "    ",
    newline = "\n",
    targetElementId = null,
  } = options;

  const node = await resolve(jsx, targetElementId);

  return render(node, "", {
    maxInlineContentWidth,
    tab: pretty ? tab : "",
    newline: pretty ? newline : "",
  });
}
