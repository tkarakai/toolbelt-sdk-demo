import { expect, test } from "bun:test";
import { caseCollisions } from "../scripts/check-case";

test("paths a Mac would treat as one file are reported", () => {
	expect(caseCollisions(["index.js", "assets/a.svg", "assets/b.svg"])).toEqual([]);
	expect(caseCollisions(["README.md", "readme.md"])).toEqual([["README.md", "readme.md"]]);
	// Folders count too, and so does Unicode normalization (é as one character or e + accent).
	expect(caseCollisions(["Assets/a.svg", "assets/b.svg"])).toEqual([["Assets", "assets"]]);
	expect(caseCollisions(["café.txt", "café.txt"])).toEqual([["café.txt", "café.txt"]]);
});
