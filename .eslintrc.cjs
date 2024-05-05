module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
    "prettier",
    "airbnb",
    "airbnb/hooks",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["@typescript-eslint", "prettier"],
  ignorePatterns: ["**/node_modules/**", "**/dist/**", "src-tauri"],
  rules: {
    "linebreak-style": ["error", process.platform === "win32" ? "windows" : "unix"],

    "prettier/prettier": 1,

    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-shadow": "off",

    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "off",

    "require-await": "warn",
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["vite.config.ts", "scripts/**"] },
    ],

    // Airbnb overrides
    "comma-dangle": "off",
    "no-useless-escape": "off",
    "object-curly-newline": "off",
    "vue/no-multiple-template-root": "off",
    "consistent-return": "off",
    camelcase: "off",
    "import/no-unresolved": "off",
    "import/extensions": "off",
    "import/prefer-default-export": "off",
    "operator-linebreak": "off",
    "lines-between-class-members": "off",
    "no-use-before-define": ["error", { functions: false }],
    "arrow-body-style": "off",
    "no-param-reassign": ["error", { props: false }],
    "max-classes-per-file": "off",
    "default-case": "off",
    "no-restricted-syntax": "off",
    "no-continue": "off",
    quotes: "off",

    "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx", ".tsx"] }],
    "react/react-in-jsx-scope": "off",
    "react/require-default-props": "off",
    "jsx-a11y/click-events-have-key-events": "off",
  },
};
