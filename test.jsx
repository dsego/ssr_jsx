/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, renderJSX } from "./mod.js";
import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";


String.prototype.dedent = function() {
  const len = this.match(/^\s+/gm).reduce((res, str) => Math.min(str.length, res), 999)
  return this.replace(new RegExp(`^([ |\\t]{${len}})`, 'gm'), '')
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
    '<aside><a href="#">Link</a><dfn><abbr title="Cascading Style Sheets">CSS</abbr></dfn></aside>'
  );

  assertEquals(
    await renderJSX(jsx, { pretty: true, tab: '  ' }),
    `<aside>
      <a href="#">Link</a>
      <dfn>
        <abbr title="Cascading Style Sheets">CSS</abbr>
      </dfn>
    </aside>`.dedent()
  );
});

Deno.test("testing example", async () => {
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
