export function h(tag, props, ...children) {
  return {
    tag,
    props: { ...props, children },
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
  let result = "";
  for (const char of str) {
    result += HTML_ENTITIES[char] ?? char;
  }
  return result;
}

// TODO: append px to numeric values
function css(obj) {
  return Object.entries(obj).map(([p, v]) => `${kebab(p)}: ${v}`).join("; ");
}

// render HTML attributes
function attrs(props) {
  let result = "";
  const { style, children, dangerouslySetInnerHTML, ...rest } = props;
  if (style) {
    result += ` style="${css(style)}"`;
  }
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === "boolean") {
      result += ` ${key}`;
    } else {
      result += ` ${key}="${encode(String(value))}"`;
    }
  }
  return result;
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
  switch (typeof node) {
    case "undefined":
    case "boolean":
    case "null":
      return true;
  }
  return false;
}

function textual(node) {
  switch (typeof node) {
    case "number":
    case "string":
    case "bigint":
      return true;
  }
  return false;
}

// Run all (async) functions and return a tree of simple object nodes
async function resolve(node) {
  if (Array.isArray(node)) {
    return (
      await Promise.all(node.map((n) => resolve(n)))
    );
  }

  if (typeof node === "object") {
    if (typeof node?.tag === "function") {
      const res = await resolve(await node.tag(node.props));
      const { tag, props: { children, ...rest } } = res;
      return {
        tag,
        props: {
          ...(res.props.children && { children: res.props.children[0] }), // unwrap children
          ...rest,
        },
      };
    }
    const { tag, props: { children, ...rest } } = node;
    return {
      tag,
      props: {
        children: await Promise.all(
          node.props.children?.map((child) => resolve(child)),
        ),
        ...rest,
      },
    };
  }

  return node;
}

function render(node, pad = "", options = {}) {
  if (empty(node)) {
    return "";
  }

  const { pretty = true, maxInlineContentWidth = 40 } = options;
  let { tab = "    " } = options;

  let newline = "\n";

  if (!pretty) {
    newline = "";
    pad = "";
    tab = "";
  }

  if (textual(node)) {
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

  if (node.props.dangerouslySetInnerHTML?.__html) {
    blockFormat = true;
    innerHTML = pad + tab + node.props.dangerouslySetInnerHTML?.__html;
  } else {
    const children = node.props.children ?? [];
    blockFormat = (
      node.tag !== "pre" &&
      children.length &&
      (
        children.length > 1 ||
        children[0]?.tag ||
        String(children[0] ?? "").length > maxInlineContentWidth
      )
    );
    const padpad = node.tag !== Fragment && blockFormat ? pad + tab : "";
    innerHTML = children.map((child) => render(child, padpad, options)).join(
      newline,
    );
  }

  if (node.tag === Fragment) {
    return innerHTML;
  }

  if (blockFormat) {
    innerHTML = `${newline}${innerHTML}${newline}${pad}`;
  }

  return pad + `<${node.tag}${attrs(node.props)}>${innerHTML}</${node.tag}>`;
}

export async function renderJSX(jsx, options) {
  return render(await resolve(jsx), "", options);
}
