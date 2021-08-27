/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, renderJSX } from "./mod.js";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const AsyncElement = async ({ ms, children }) => {
  await delay(ms);
  return <x-async data-ms={ms}>{children}</x-async>;
};

const jsx = (
  <>
    <header style={{ marginBottom: "0px", color: "#333" }}>
      <h1>Hello World</h1>
    </header>
    <hr />
    <main class="main-section">
      <AsyncElement ms={50}>
        <AsyncElement ms={30} />
        <AsyncElement ms={50} />
        <AsyncElement ms={50}>
          Sometimes in life, random things can blind-side you.
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
      <div dangerouslySetInnerHTML={{__html: '<q><b> html content </b><b> html content </b></q>'}} />
    </main>
    <hr />
    <footer>
      We're all in this alone.
    </footer>
  </>
);

console.time("total");
const html = await renderJSX(jsx);
console.timeEnd("total");

console.log(html);
// console.log(Deno.inspect(html, { depth: 99 }))
