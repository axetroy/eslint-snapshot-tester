import nativeTest from "node:test";
import assert from "node:assert";

import { ESLint } from "eslint";
import type eslint from "eslint";
import outdent from "outdent";
import { codeFrameColumns } from "@babel/code-frame";

import type { getTester as getTesterImpl, test as testFn } from "./type";

const getTester: typeof getTesterImpl = (baseConfig = {}) => {
	const test: typeof testFn = (name, rule, testCase, options = {}) => {
		nativeTest(name, options, async (t) => {
			const { valid = [], invalid = [] } = testCase;

			const failMessages = [];
			const snapshot = [];

			// Run valid test cases
			for (const [index, validCase] of valid.entries()) {
				const code = typeof validCase === "string" ? validCase : validCase.code;
				const options = typeof validCase === "string" ? undefined : validCase.options;

				const message = await runSingleTest(baseConfig, index, rule, code, options);

				if (message) {
					failMessages.push(
						outdent`
							  The following test case should have passed but failed.

							  ${outdent`${message}`}
							`
					);
				}
			}

			// Run invalid test cases
			for (const [index, invalidCase] of invalid.entries()) {
				const code = typeof invalidCase === "string" ? invalidCase : invalidCase.code;
				const options = typeof invalidCase === "string" ? undefined : invalidCase.options;

				const message = await runSingleTest(baseConfig, index, rule, code, options);

				if (message.length > 0) {
					snapshot.push(message);
				} else {
					failMessages.push(
						outdent`
							  The following test case should have failed but passed.

							  ${wrapCodeFrame(code)}
							`
					);
				}
			}

			if (failMessages.length > 0) {
				assert.fail(failMessages.join("\n\n"));
			} else {
				t.assert.snapshot(snapshot.join("\n\n"), {
					serializers: [(value) => value],
				});
			}
		});
	};

	return test;
};

async function runSingleTest(
	baseConfig: eslint.Linter.Config,
	index: number,
	rule: eslint.Rule.RuleModule,
	code: string,
	options: Array<Record<string, any>> = []
): Promise<string> {
	const eslint = new ESLint({
		cache: false,
		overrideConfigFile: true,
		baseConfig: {
			...baseConfig,
			...({
				rules: {
					"snapshot-tester/test": ["error", ...options].filter(Boolean), // 动态注入规则,
					...(baseConfig.rules || {}),
				},
			} as unknown as eslint.Linter.Config),
		},
		plugins: {
			"snapshot-tester": { rules: { test: rule } }, // 自定义规则注入
		},
	});

	const results = await eslint.lintText(code);

	return results
		.map((result) => generateOutput(index, code, result.messages))
		.filter(Boolean)
		.join("\n\n");
}

function generateOutput(index: number, code: string, messages: Array<eslint.Linter.LintMessage>): string | void {
	if (messages.length === 0) return;

	const title = removeNewlines(code);

	const output: string[] = [
		`## invalid(${index + 1}): ${title}`,
		indent(
			outdent`
                  > Input

                  ${indent(wrapCodeFrame(code), 4)}
                `,
			2
		),
	];

	for (const [i, message] of messages.entries()) {
		output.push(...generateErrorMessage(i, messages.length, code, message));
	}

	return output.join("\n\n");
}

function generateErrorMessage(index: number, totalLength: number, code: string, message: eslint.Linter.LintMessage): string[] {
	const { line, column, endLine, endColumn } = message;
	const frame = codeFrameColumns(code, { start: { line, column }, end: { line: endLine, column: endColumn } });

	const output = [
		message.fix
			? indent(
					outdent`
                        > Output

                        ${indent(wrapCodeFrame(applySingleFix(code, message.fix)), 4)}
                      `,
					2
			  )
			: null,
		indent(
			outdent`
                  > Error ${index + 1}/${totalLength}: ${message.message}

                  ${indent(frame, 4)}
                `,
			2
		),
	].filter(Boolean);

	if (message.suggestions?.length) {
		output.push(
			indent(
				outdent`
                      ${message.suggestions
							.map((suggestion, i) => {
								const fix = suggestion.fix;

								// Apply fix
								const fixedCode = applySingleFix(code, fix);

								return outdent`
                                > Suggestion ${i + 1}/${message.suggestions.length}: ${suggestion.desc}

                                ${indent(wrapCodeFrame(fixedCode), 4)}
                              `;
							})
							.join("\n\n")}
                    `,
				2
			)
		);
	}

	return output;
}

function removeNewlines(str: string) {
	return str.replace(/[\n\r]+/g, String.raw`\n`); // 将所有换行符删除
}

function wrapCodeFrame(code: string) {
	return codeFrameColumns(code, { start: { line: 0, column: 0 } }, { linesAbove: Number.MAX_VALUE, linesBelow: Number.MAX_VALUE });
}

function applySingleFix(code: string, fix: eslint.Rule.Fix) {
	return replaceStringWithSlice(code, fix.range[0], fix.range[1], fix.text);
}

function replaceStringWithSlice(str: string, start: number, end: number, replacement: string): string {
	return str.slice(0, start) + replacement + str.slice(end);
}

function indent(input: string, count: number): string {
	const indentation = " ".repeat(count);

	return input
		.split("\n")
		.map((line) => `${indentation}${line}`)
		.join("\n");
}

export { getTester };
