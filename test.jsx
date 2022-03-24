/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, renderJSX } from "./mod.js";
import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

function dedent(strings, ...params) {
  const str = strings.reduce((prev, string, i) =>
    prev + string + (params[i] ?? "")
  );
  const len = str.match(/^\s+/gm)?.reduce(
    (res, str) => Math.min(str.length, res),
    999,
  ) || 0;
  return str
    .replace(/^\n/, "")
    .replace(/\n\s*$/, "")
    .replace(new RegExp(`^([ |\\t]{${len}})`, "gm"), "");
}

Deno.test("pretty print", async () => {
  const jsx = (
    <>
      <aside>
        <a href="#">Link</a>
        <dfn>
          <abbr title="Cascading Style Sheets">
            CSS
          </abbr>
        </dfn>
      </aside>
    </>
  );
  assertEquals(
    await renderJSX(jsx, { pretty: false }),
    '<aside><a href="#">Link</a><dfn><abbr title="Cascading Style Sheets">CSS</abbr></dfn></aside>',
  );

  assertEquals(
    await renderJSX(jsx, { pretty: true, tab: "  " }),
    dedent`<aside>
      <a href="#">Link</a>
      <dfn>
        <abbr title="Cascading Style Sheets">CSS</abbr>
      </dfn>
    </aside>`,
  );
});

Deno.test("textarea has value prop, no children ", async () => {
  assertEquals(
    await renderJSX(<textarea value="foo" />),
    "<textarea>foo</textarea>",
  );
});

Deno.test("textarea has value prop & children ", async () => {
  assertEquals(
    await renderJSX(<textarea value="foo">bar</textarea>),
    "<textarea>foo</textarea>",
  );
});

Deno.test("textarea with value prop as undefined", async () => {
  assertEquals(
    await renderJSX(<textarea value={undefined}>bar</textarea>),
    "<textarea>bar</textarea>",
  );
});

Deno.test("textarea with value prop as null ", async () => {
  assertEquals(
    await renderJSX(<textarea value={null}>bar</textarea>),
    "<textarea>bar</textarea>",
  );
});

Deno.test("textarea without value prop, ", async () => {
  assertEquals(
    await renderJSX(<textarea>bar</textarea>),
    "<textarea>bar</textarea>",
  );
});

Deno.test("self-closing textarea without value prop", async () => {
  assertEquals(
    await renderJSX(<textarea />),
    "<textarea></textarea>",
  );
});

Deno.test("preformatted text", async () => {
  assertEquals(
    await renderJSX(
      <pre>
        {dedent`
        foo
          bar
      `}
      </pre>,
    ),
    `<pre>  foo\n    bar</pre>`,
  );
});

Deno.test("pretty printing doesn't format content of textarea & pre tags", async () => {
  assertEquals(
    await renderJSX(
      <>
        <p>
          We can all fight against loneliness by engaging in random acts of
          kindness.
        </p>
        <pre>
          We can all fight against loneliness by engaging in random acts of
          kindness.
        </pre>
        <textarea>
          We can all fight against loneliness by engaging in random acts of
          kindness.
        </textarea>
      </>,
    ),
    dedent`<p>
        We can all fight against loneliness by engaging in random acts of kindness.
    </p>
    <pre>We can all fight against loneliness by engaging in random acts of kindness.</pre>
    <textarea>We can all fight against loneliness by engaging in random acts of kindness.</textarea>`,
  );
});

Deno.test("href values", async () => {
  assertEquals(
    await renderJSX(<a id={'"'} href="http://example.com?foo=bar&baz">bar</a>),
    `<a id="&quot;" href="http://example.com?foo=bar&baz">bar</a>`,
  );
});

Deno.test("html entities", async () => {
  assertEquals(
    await renderJSX(<>{'<&">'}</>),
    `&lt;&amp;&quot;&gt;`,
  );
});

Deno.test("pretty options", async () => {
  assertEquals(
    await renderJSX(<aside>Nobody got a guided tour</aside>, {
      maxInlineContentWidth: 10,
      tab: "\t",
      newline: "\n\n",
    }),
    `<aside>\n\n\tNobody got a guided tour\n\n</aside>`,
  );
});

Deno.test("big example", async () => {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const AsyncElement = async ({ ms, children }) => {
    await delay(ms);
    return <x-async data-ms={ms}>{children}</x-async>;
  };

  const jsx = (
    <>
      <header style={{ marginBottom: "0px", color: "#333" }}>
        <h1>Hello World 😎</h1>
      </header>
      <hr />
      <main class="main-section">
        <AsyncElement ms={50}>
          <AsyncElement ms={30} />
          <AsyncElement ms={50} />
          <AsyncElement ms={50}>
            Sometimes in life, random things can blind-side you. 🌸🌸🌸
          </AsyncElement>
        </AsyncElement>
        <form>
          <input type="text" value="foo" />
          <input type="checkbox" checked />
          <br />
          <textarea value="bar" />
        </form>
        <p>
          {123}
          <span>
            If you wait for tomorrow, tomorrow comes. If you wait for tomorrow,
            tomorrow comes.
          </span>
          If you don't wait for tomorrow, <b>tomorrow comes.</b>
        </p>
        <div
          dangerouslySetInnerHTML={{
            __html: "<q><b> html content </b><b> html content </b></q>",
          }}
        />
      </main>
      <hr />
      <footer>
        We're all in this alone. 😱
        <small>We're all in this alone.</small>
      </footer>
    </>
  );

  const expected = (
    dedent`<header style="margin-bottom: 0px; color: #333">
        <h1>Hello World 😎</h1>
    </header>
    <hr />
    <main class="main-section">
        <x-async data-ms="50">
            <x-async data-ms="30"></x-async>
            <x-async data-ms="50"></x-async>
            <x-async data-ms="50">
                Sometimes in life, random things can blind-side you. 🌸🌸🌸
            </x-async>
        </x-async>
        <form>
            <input type="text" value="foo" />
            <input type="checkbox" checked />
            <br />
            <textarea>bar</textarea>
        </form>
        <p>
            123
            <span>
                If you wait for tomorrow, tomorrow comes. If you wait for tomorrow, tomorrow comes.
            </span>
            If you don't wait for tomorrow, ${""}
            <b>tomorrow comes.</b>
        </p>
        <div>
            <q><b> html content </b><b> html content </b></q>
        </div>
    </main>
    <hr />
    <footer>
        We're all in this alone. 😱
        <small>We're all in this alone.</small>
    </footer>`
  );

  const html = await renderJSX(jsx);
  assertEquals(html, expected);
});

Deno.test("jsx component with children", async () => {
  const Form = ({ name }) => (
    <form>
      <button type="submit">
        Click me, {name}!
      </button>
    </form>
  );

  assertEquals(
    await renderJSX(<Form name="Le Foo" />),
    dedent`<form>
        <button type="submit">Click me, Le Foo!</button>
    </form>`,
  );
});

Deno.test("nested jsx children", async () => {
  const Foo = ({ children }) => <>{children}</>;
  const Bar = ({ children }) => <Foo>{children}</Foo>;
  const Baz = ({ children }) => <Bar>{children}</Bar>;

  assertEquals(
    await renderJSX(<Baz>Le Foo</Baz>),
    `Le Foo`,
  );
});

Deno.test("handles style dimensions", async () => {
  assertEquals(
    await renderJSX(
      <h1 style={{ margin: 10, padding: "2rem", zIndex: 2 }}>Le Foo</h1>,
    ),
    `<h1 style="margin: 10px; padding: 2rem; z-index: 2">Le Foo</h1>`,
  );
});

Deno.test("returns target element", async () => {
  const SearchForm = ({ id }) => (
    <form id={id}>
      <label for="site-search">Search the site:</label>
      <input
        type="search"
        id="site-search"
        name="q"
        aria-label="Search through site content"
      />
      <button>Search</button>
    </form>
  );
  const MainNav = () => (
    <nav>
      <SearchForm id="search-form" />
    </nav>
  );
  const Page = () => (
    <main>
      <MainNav />
      <article id="article-1" class="tech-news">
        <h2>Example</h2>
        <p>Test test test</p>
      </article>
      <article id="article-2" class="tech-news">
        <h2>Example</h2>
        <p>Test test test</p>
      </article>
    </main>
  );
  const expected = dedent`
    <form id="search-form">
        <label for="site-search">Search the site:</label>
        <input type="search" id="site-search" name="q" aria-label="Search through site content" />
        <button>Search</button>
    </form>`;
  const result = await renderJSX(<Page />, { targetElementId: "search-form" });
  assertEquals(expected, result);
});

Deno.test("boolean attributes", async () => {
  assertEquals(
    await renderJSX(<input hidden />),
    `<input hidden />`,
  );
  assertEquals(
    await renderJSX(<input disabled="disabled" />),
    `<input disabled />`,
  );
  assertEquals(
    await renderJSX(<input checked={false} disabled={true} />),
    `<input disabled />`,
  );
  assertEquals(
    await renderJSX(<input checked disabled={false} />),
    `<input checked />`,
  );
});
