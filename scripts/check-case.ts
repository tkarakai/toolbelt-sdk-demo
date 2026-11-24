// Fails when two paths would be the same file on a Mac. macOS disks ignore letter case and
// Unicode normalization, Linux doesn't, so a portable plugin built on Linux checks it here.
// Usage: bun scripts/check-case.ts [--git] [folder...]  (--git checks the tracked files)
import { readdirSync } from "node:fs";

/** Groups of paths (files and the folders above them) that a Mac would treat as one. */
export function caseCollisions(paths: string[]): string[][] {
	const seen = new Map<string, Set<string>>();
	for (const path of paths) {
		const parts = path.split("/").filter(Boolean);
		for (let i = 1; i <= parts.length; i++) {
			const sub = parts.slice(0, i).join("/");
			const key = sub.normalize("NFD").toLowerCase();
			const names = seen.get(key) ?? new Set<string>();
			names.add(sub);
			seen.set(key, names);
		}
	}
	return [...seen.values()].filter((names) => names.size > 1).map((names) => [...names].sort());
}

async function trees(args: string[]): Promise<[string, string[]][]> {
	const out: [string, string[]][] = [];
	for (const arg of args) {
		if (arg === "--git") {
			const files = (await Bun.$`git ls-files -z`.text()).split("\0").filter(Boolean);
			out.push(["tracked files", files]);
		} else {
			const files = readdirSync(arg, { recursive: true, encoding: "utf8" }).map((p) => p.replaceAll("\\", "/"));
			out.push([arg, files]);
		}
	}
	return out;
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	if (!args.length) throw new Error("Usage: bun scripts/check-case.ts [--git] [folder...]");
	let failed = false;
	for (const [name, files] of await trees(args)) {
		for (const group of caseCollisions(files)) {
			failed = true;
			console.error(`${name}: these would be the same file on a Mac: ${group.join(", ")}`);
		}
	}
	if (failed) process.exit(1);
}
