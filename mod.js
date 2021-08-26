export function h(tag, props, ...children) {
  return {
    tag,
    props: { ...props, children },
  };
}

export const Fragment = "fragment";

const entities = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&#39;",
}

function escape(str) {
  let result = "";
  for (const char of str) {
    result += entities[char] ?? char;
  }
  return result;
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

function block(tag) {
  switch (tag) {
    case "address":
    case "article":
    case "aside":
    case "blockquote":
    case "details":
    case "dialog":
    case "dd":
    case "div":
    case "dl":
    case "dt":
    case "fieldset":
    case "figcaption":
    case "figure":
    case "footer":
    case "form":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
    case "header":
    case "hgroup":
    case "hr":
    case "li":
    case "main":
    case "nav":
    case "ol":
    case "p":
    case "pre":
    case "section":
    case "table":
    case "ul":
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

export async function render(node) {
  if (Array.isArray(node)) {
    return (
      await Promise.all(node.map((n) => render(n)))
    ).join("");
  }

  if (empty(node)) {
    return "";
  }

  if (textual(node)) {
    return escape(String(node));
  }

  if (typeof node.tag === "function") {
    return render(await node.tag(node.props));
  }

  if (selfClosing(node.tag)) {
    return `<${node.tag} />`;
  }

  const innerHTML = (
    await Promise.all(node.props.children?.map((child) => render(child)))
  ).join("");

  if (node.tag === Fragment) {
    return innerHTML;
  }

  return `<${node.tag}>${innerHTML}</${node.tag}>`;
}



// inline tag always new line
// if content longer > n, format as multiline
// no wrapping long lines???? preact doesn't do it
// no wrapping attrs
