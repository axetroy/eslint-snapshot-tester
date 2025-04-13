import type eslint from "eslint";

const pluginModule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "禁止使用 var 声明变量",
			category: "Best Practices",
			recommended: true,
			url: "https://eslint.org/docs/rules/no-var",
		},
		fixable: "code", // 支持自动修复
		schema: [], // 无配置选项
		messages: {
			unexpectedVar: "禁止使用 'var'，请改用 'let' 或 'const'。",
		},
	},

	create(context) {
		const sourceCode = context.sourceCode;

		return {
			VariableDeclaration(node) {
				if (node.kind === "var") {
					context.report({
						node,
						messageId: "unexpectedVar",
						fix(fixer) {
							// 自动将 var 替换为 let（简单示例，实际需根据作用域判断用 let/const）
							return fixer.replaceText(node, sourceCode.getText(node).replace(/var\b/, "let"));
						},
					});
				}
			},
		};
	},
} as eslint.Rule.RuleModule;

export default pluginModule;
