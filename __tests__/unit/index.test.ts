import { format } from "prettier";
import * as prettierPluginTailwindcss from "prettier-plugin-tailwindcss";
import { describe, expect, it } from "vitest";
import * as plugin from "../../src/index.js";

describe("index", () => {
  it("without options", async () => {
    const result = await format(
      `{% block foo %}<div class="items-center ms-auto flex gap-[1.5rem] flex ms-auto">{{ bar }}</div>{% endblock %}`,
      {
        parser: "anywhere",
        // @ts-ignore
        plugins: [plugin],
      },
    );

    expect(result).toMatchInlineSnapshot(`
      "{% block foo %}<div class="ms-auto flex items-center gap-[1.5rem]">{{ bar }}</div>{% endblock %}"
    `);
  });

  it("with regex option", async () => {
    const result = await format(
      `{% block foo %}<div class="items-center ms-auto flex gap-[1.5rem] flex ms-auto {% if buz %}is-buz{% endif %}">{{ bar }}</div>{% endblock %}`,
      {
        parser: "anywhere",
        // @ts-ignore
        plugins: [plugin],
        regex: 'class="([^{}"]*)(?:"| {)',
      },
    );

    expect(result).toMatchInlineSnapshot(`
      "{% block foo %}<div class="ms-auto flex items-center gap-[1.5rem] {% if buz %}is-buz{% endif %}">{{ bar }}</div>{% endblock %}"
    `);
  });

  it("forwards prettier-plugin-tailwindcss options", async () => {
    const result = await format(`<div class="p-0 container m-0 p-0"></div>`, {
      parser: "anywhere",
      // @ts-ignore
      plugins: [prettierPluginTailwindcss, plugin],
      tailwindPreserveDuplicates: true,
    });

    expect(result).toMatchInlineSnapshot(`
      "<div class="container m-0 p-0 p-0"></div>"
    `);
  });

  it("repeating classes", async () => {
    const result = await format(
      `<div class="p-0 container m-0"></div><div class="p-0 container m-0"></div><div class="p-0 container m-0"></div>`,
      {
        parser: "anywhere",
        // @ts-ignore
        plugins: [plugin],
      },
    );

    expect(result).toMatchInlineSnapshot(`
      "<div class="container m-0 p-0"></div><div class="container m-0 p-0"></div><div class="container m-0 p-0"></div>"
    `);
  });
});
