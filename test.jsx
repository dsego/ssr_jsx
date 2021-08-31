/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, renderJSX } from "./mod.js";
import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

String.prototype.dedent = function () {
  const len = this.match(/^\s+/gm).reduce(
    (res, str) => Math.min(str.length, res),
    999,
  );
  return this.replace(new RegExp(`^([ |\\t]{${len}})`, "gm"), "");
};

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
    `<aside>
      <a href="#">Link</a>
      <dfn>
        <abbr title="Cascading Style Sheets">CSS</abbr>
      </dfn>
    </aside>`.dedent(),
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
        {`
        foo
          bar
      `.dedent()}
      </pre>,
    ),
    `<pre>\n  foo\n    bar\n</pre>`,
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
    `<p>
        We can all fight against loneliness by engaging in random acts of kindness.
    </p>
    <pre>We can all fight against loneliness by engaging in random acts of kindness.</pre>
    <textarea>We can all fight against loneliness by engaging in random acts of kindness.</textarea>`
      .dedent(),
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
    `<header style="margin-bottom: 0px; color: #333">
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
  ).dedent();

  const html = await renderJSX(jsx);
  assertEquals(html, expected);
});
