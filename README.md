# eslint-snapshot-tester

[![Badge](https://img.shields.io/badge/link-996.icu-%23FF4D5B.svg?style=flat-square)](https://996.icu/#/en_US)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg?style=flat-square)](https://github.com/996icu/996.ICU/blob/master/LICENSE)
![Node](https://img.shields.io/badge/node-%3E=22.14.0-blue.svg?style=flat-square)
[![npm version](https://badge.fury.io/js/eslint-snapshot-tester.svg)](https://badge.fury.io/js/eslint-snapshot-tester)

A library for testing ESLint rules with snapshot testing. It is based on `node:test`

## Installation

```bash
npm install eslint-snapshot-tester --save
```

## Usage

```js
// import via esm
import { getTester } from "eslint-snapshot-tester";

// import via cjs
const { getTester } = require("eslint-snapshot-tester");
```

```js
// no-var.test.js
const { getTester } = require("eslint-snapshot-tester");

const test = getTester("test");

test("no-var", noVarRule, {
	valid: ["const foo = 1;", "let foo = 1;"],
	invalid: ["var foo = 1;"],
});
```

Then run the test `node --test test.js --test-update-snapshots`

Then add the test script to `package.json`

```diff
{
  "scripts": {
+	"test": "node --test **/*.test.js",
+	"test:update-snapshots": "npm run test --test-update-snapshots"
  }
}
```

## License

The [Anti 996 License](LICENSE)
