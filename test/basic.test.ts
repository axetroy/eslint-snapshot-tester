import { getTester } from "../src/index";
import noVarPlugin from "./plugin/no-var";

const test = getTester(__filename);

test("no-var", noVarPlugin, {
	valid: ["const a = 1;"],
	invalid: ["var a = 1;"],
});
