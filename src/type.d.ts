import type { TestContext } from "node:test";
import { test as nativeTest } from "node:test";
import type eslint from "eslint";

// Port from node:test
export type TestFn = (t: TestContext, done: (result?: any) => void) => void | Promise<void>;

type ExtractTestOptions<T> = T extends {
	(name: string, options: infer O, fn: TestFn): any;
	(options: infer O, fn: TestFn): any;
	(...args: any): any;
}
	? O
	: never;

export type TestOptions = ExtractTestOptions<typeof nativeTest>;

export interface TestCase {
	valid: Array<string | eslint.RuleTester.ValidTestCase>;
	invalid: Array<string | eslint.RuleTester.InvalidTestCase>;
}

export declare function test(name: string, rule: eslint.Rule.RuleModule, testCase: TestCase, options?: TestOptions): void;

export declare function getTester(baseConfig?: eslint.Linter.Config): typeof test;
