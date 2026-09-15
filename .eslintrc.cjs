module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: [
      "./apps/demo-ui/tsconfig.json",
      "./demos/context-retrieval-demo/tsconfig.json",
      "./demos/intelligent-model-routing-demo/tsconfig.json",
    ],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "airbnb-base",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project: [
          "./apps/demo-ui/tsconfig.json",
          "./demos/context-retrieval-demo/tsconfig.json",
          "./demos/intelligent-model-routing-demo/tsconfig.json",
        ],
        noWarnOnMultipleProjects: true,
      },
    },
  },
  ignorePatterns: ["dist/", "node_modules/"],
  rules: {
    "class-methods-use-this": "off",
    "import/extensions": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/tests/**/*.ts", "**/*.test.ts"],
      },
    ],
    "import/no-unresolved": "off",
    "import/prefer-default-export": "off",
    "no-await-in-loop": "off",
    "no-console": "off",
    "no-restricted-syntax": [
      "error",
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
    ],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": [
      "error",
      {
        classes: true,
        functions: false,
        typedefs: false,
        variables: true,
      },
    ],
  },
};
