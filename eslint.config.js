import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { languageOptions: { globals: { ...globals.browser, process: "readonly" } } },
  pluginJs.configs.recommended,
  {
    ignores: ["node_modules"],
  },
  {
    rules: {
      // "no-unused-vars": ["error", { varsIgnorePattern: "^_" }], // Ignore variables starting with _
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
