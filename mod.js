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

const SELF_CLOSING_TAG = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
}

const EMPTY = {
  undefined: true,
  boolean: true,
  null: true,
}

const TEXTUAL = {
  number: true,
  string: true,
  bigint: true,
}

// Run all (async) functions and return a tree of simple object nodes
async function resolve(node) {
  if (typeof node?.tag === "function") {
    node = await resolve(await node.tag(node.props));
    node.props.children = node.props.children[0]; // unwrap array
  }
  if (node.props?.children) {
    node.props.children = await Promise.all(
      node.props.children?.map((child) => resolve(child)),
    );
  }
  return node;
}


function render(root, pad = "", options = {}) {
  const {
    pretty = true,
    maxInlineContentWidth = 40
  } = options;
  let {
    tab = "    ",
    newline = "\n"
  } = options;

  if (!pretty) {
    newline = "";
    pad = "";
    tab = "";
  }

  const wmap = new WeakMap()
  const stack = [root]
  let html = ''

  while (stack.length) {

    const node = stack.pop()

    if (EMPTY[typeof node]) {
      continue;
    }

    if (TEXTUAL[typeof node]) {
      html += pad + encode(String(node));
      continue;
    }

    if (SELF_CLOSING_TAG[node.tag]) {
      html += pad + `<${node.tag}${attrs(node.props)} />` + newline;
      continue;
    }

    // special case to handle <textarea value="foo" />
    if (node.tag === "textarea") {
      const { value, children, ...rest } = node.props;
      // note: we're okay with rendering [object Object] for non-string children
      html += pad + `<textarea${attrs(rest)}>${value ?? children}</textarea>` + newline;
      continue;
    }

    if (node.tag === Fragment) {
      let i = node.props.children.length
      while (i--) stack.push(node.props.children[i])
      continue;
    }

    const meta = wmap.get(node)

    // close tag
    if (meta?.open) {
      html += `</${node.tag}>`
      html += newline
      continue
    }


    if (node.props.dangerouslySetInnerHTML?.__html) {
      const innerHTML = pad + tab + node.props.dangerouslySetInnerHTML?.__html;

      html += pad + `<${node.tag}${attrs(node.props)}>`;
      html += `${newline}${innerHTML}${newline}${pad}`
      html += `</${node.tag}>`+newline
      continue
    } else {
      const {children} = node.props

      const inline = (
        node.tag === "pre" ||
        (children.length === 1 && TEXTUAL[typeof children[0]] &&  String(children[0] ?? "").length <= maxInlineContentWidth)
      )

      html += pad + `<${node.tag}${attrs(node.props)}>`;

      if (!inline) html += newline

      // push back onto stack and mark as open, so we know we need to close the tag
      stack.push(node)
      wmap.set(node, {open: true, inline})

      let i = node.props.children.length
      while (i--) stack.push(node.props.children[i])
    }

  }

  return html







  // if (node.props.dangerouslySetInnerHTML?.__html) {
  //   blockFormat = true;
  //   innerHTML = pad + tab + node.props.dangerouslySetInnerHTML?.__html;
  // } else {
  //   const children = node.props.children ?? [];
  //   blockFormat = (
  //     node.tag !== "pre" &&
  //     children.length &&
  //     (
  //       children.length > 1 ||
  //       children[0]?.tag ||
  //       String(children[0] ?? "").length > maxInlineContentWidth
  //     )
  //   );
  //   const padpad = node.tag !== Fragment && blockFormat ? pad + tab : "";
  //   innerHTML = children.map((child) => render(child, padpad, options)).join(
  //     newline,
  //   );
  // }



  // if (blockFormat) {
  //   innerHTML = `${newline}${innerHTML}${newline}${pad}`;
  // }


}

export async function renderJSX(jsx, options) {
  return render(await resolve(jsx), "", options);
}
