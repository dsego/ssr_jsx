/** @jsx h */
/** @jsxFrag Fragment */

// import { Fragment, h, renderToString } from "https://deno.land/x/jsx/mod.ts";

import { Fragment, h, renderJSX } from "./mod.js";

const jsx = (
  <>
    <header>
      <h1>Hello World 😎</h1>
    </header>
    <hr />
    <main class="main-section">
      Sometimes in life, random things can blind-side you. 🌸🌸🌸
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


console.time("total");
for (let i = 0; i < 10000; ++i) {
  const html = await renderJSX(jsx);
  // const html = await renderToString(jsx);
}
console.timeEnd("total");

// console.time("my-total");
// const html = await renderToString(jsx);
// console.timeEnd("my-total");
// console.log(html);
