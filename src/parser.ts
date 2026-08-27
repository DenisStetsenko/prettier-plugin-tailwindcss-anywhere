import { type ParserOptions, type Plugin, format } from "prettier";
import * as prettierPluginTailwindcss from "prettier-plugin-tailwindcss";
import type { AnywhereNode } from "./types.js";

export const parse = async (
  text: string,
  options: ParserOptions,
): Promise<AnywhereNode> => {
  let formattedText = text;
  const regex = options.regex as string;

  // Forward the user's prettier-plugin-tailwindcss options (and the file path
  // it resolves the Tailwind config against) to the nested format() call,
  // otherwise the plugin sorts against the default theme only.
  const tailwindOptions = Object.fromEntries(
    Object.keys(prettierPluginTailwindcss.options)
      .filter((key) => options[key] !== undefined)
      .map((key) => [key, options[key]]),
  );

  const matches = text.matchAll(new RegExp(regex, "g"));

  const map = new Map();

  for (const match of matches) {
    const original = match[0];
    const value = match[1];

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

    const fixed = original.replace(value, fixedValue);

    map.set(original, fixed);
  }

  for (const [original, fixed] of map) {
    formattedText = formattedText.replaceAll(original, fixed);
  }

  return {
    body: formattedText,
    start: 0,
    end: text.length,
  };
};
