import { type ParserOptions, type Plugin, format } from "prettier";
import * as prettierPluginTailwindcss from "prettier-plugin-tailwindcss";
import type { AnywhereNode } from "./types.js";

export const parse = async (
  text: string,
  options: ParserOptions,
): Promise<AnywhereNode> => {
  let formattedText = "";
  let lastIndex = 0;
  const regex = options.regex as string;

  // Forward the user's prettier-plugin-tailwindcss options (and the file path
  // it resolves the Tailwind config against) to the nested format() call,
  // otherwise the plugin sorts against the default theme only.
  const tailwindOptions = Object.fromEntries(
    Object.keys(prettierPluginTailwindcss.options)
      .filter((key) => options[key] !== undefined)
      .map((key) => [key, options[key]]),
  );

  // The "d" flag records where each group matched, so that only the captured
  // text is replaced, not every identical string elsewhere in the file.
  const matches = text.matchAll(new RegExp(regex, "dg"));

  for (const match of matches) {
    // Take the first group that participated in the match, so that a regex can
    // use alternation to cover several places where classes appear, each
    // branch carrying its own capturing group.
    const group = match.findIndex(
      (value, index) => index > 0 && value !== undefined,
    );

    if (group === -1) {
      continue;
    }

    const value = match[group];
    const [start, end] = match.indices[group];

    // A group captured inside a lookaround can overlap text already replaced,
    // so it is left as is.
    if (start < lastIndex) {
      continue;
    }

    const fixedValue = (
      await format(`<div class="${value}"></div>`, {
        ...tailwindOptions,
        filepath: options.filepath,
        parser: "html",
        // v0.8 types its parsers as possibly lazy, which Prettier's Plugin
        // type does not allow, although it accepts them at runtime.
        plugins: [prettierPluginTailwindcss as unknown as Plugin],
      })
    ).match(/class="([^"]*)"/)?.[1];

    formattedText += text.slice(lastIndex, start) + fixedValue;
    lastIndex = end;
  }

  formattedText += text.slice(lastIndex);

  return {
    body: formattedText,
    start: 0,
    end: text.length,
  };
};
