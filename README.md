## Server-side JSX for Deno

A simple JSX library for server-side rendering with Deno.

#### Basic example

```jsx
/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h, renderJSX } from "./mod.js";

const html = await renderJSX(
  <h1>Hello World 😎</h1>,
);
```

#### Async components

Supports functional components. Asynchronous components are resolved
concurrently.

```jsx
const Welcome = async function ({ userId }) {
  const user = await findUser(userId);
  return <span>Welcome, {user.name}!</span>;
};

const html = await renderJSX(
  <page>
    <Welcome userId={id} />
  </page>,
);
```

#### Partial rendering

Passing a target id will only render the target HTML element.

```jsx
const partial = await renderJSX(<Page />, { targetElementId: "search-form" });
// <form id="search-form">...</form>
```

##### TODO

- write more tests
- stream output?
- typescript?
- memoize components
