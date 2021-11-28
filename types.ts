export type Options = {
  pretty?: boolean;
  maxInlineContentWidth: number;
  tab: string;
  newline: string;
};

export type Handler = (...args: unknown[]) => unknown;

export type Props = {
  style?: Record<string, string>;
  children?: unknown[];
  [key: string]: unknown;
};

export type NodeObject = {
  tag: string | Handler;
  props?: Props;
};

export type EmptyNode = undefined | null | boolean;
export type TextNode = string | number;
export type ArbitraryNode = EmptyNode | TextNode | NodeObject;
