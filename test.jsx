/** @jsx h */
/** @jsxFrag Fragment */

import { Fragment, h, render } from "./mod.js";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const AsyncElement = async ({ ms, children }) => {
  await delay(ms);
  return <x-async data-ms={ms}>{children}</x-async>;
};

const jsx = (
  <>
    <header>
      <h1>Hello World</h1>
    </header>
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
        <textarea value="bar" />
      </form>
      <p>
        {123}
        <span>If you wait for tomorrow, tomorrow comes.</span>
        If you don't wait for tomorrow, <b>tomorrow comes.</b>
      </p>
    </main>
    <footer></footer>
  </>
);

console.time("total");
const html = await render(jsx);
console.timeEnd("total");

console.log(html);
// console.log(Deno.inspect(jsx, { depth: 99 }))
