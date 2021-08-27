export function h(tag, props, ...children) {
  return {
    tag,
    props: { ...props, children },
  };
}

export const Fragment = "fragment";

const ENTITIES = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
};

function encode(str) {
  let result = "";
  for (const char of str) {
    result += ENTITIES[char] ?? char;
  }
  return result;
}

// TODO: add px to numeric values
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
  for (const key in rest) {
    if (typeof rest[key] === "boolean") {
      result += ` ${key}`;
    } else {
      result += ` ${key}="${encode(String(rest[key]))}"`;
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
export async function resolve(node) {
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

// TODO: add to options
const TAB = "    ";

export function render(node, pad = "") {
  if (empty(node)) {
    return "";
  }

  if (textual(node)) {
    return pad + encode(String(node));
  }

  if (selfClosing(node.tag)) {
    return pad + `<${node.tag}${attrs(node.props)} />`;
  }

  if (node.tag === "textarea" && "value" in node.props) {
    const { value, ...rest } = node.props;
    return pad + `<textarea${attrs(rest)}>${value}</textarea>`;
  }

  let innerHTML = "";
  let block = false;

  if (node.props.dangerouslySetInnerHTML?.__html) {
    block = true;
    innerHTML = pad + TAB + node.props.dangerouslySetInnerHTML?.__html;
  } else {
    const children = node.props.children ?? [];
    block = children.length && (
      children.length > 1 ||
      children[0]?.tag ||
      String(children[0] ?? "").length > 40
    );
    const padpad = node.tag !== Fragment && block ? pad + TAB : "";
    innerHTML = children.map((child) => render(child, padpad)).join("\n");
  }

  if (node.tag === Fragment) {
    return innerHTML;
  }

  if (block) {
    innerHTML = `\n${innerHTML}\n${pad}`;
  }

  return pad + `<${node.tag}${attrs(node.props)}>${innerHTML}</${node.tag}>`;
}

export async function renderJSX(jsx) {
  return render(await resolve(jsx));
}
