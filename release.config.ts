import {
  json,
  packagePlugin,
  run,
  updateJSONVersion,
  type ReleaseConfig,
} from "@toolbelt/sdk/release";
export default {
  repo: "tkarakai/toolbelt-sdk-demo",
  hostVersion: "0.2.2",
  products: {
    plugin: {
      changelog: "CHANGELOG.md",
      version: () => json("toolbelt.json").version,
      async setVersion(v) {
        await updateJSONVersion("package.json", v);
        await updateJSONVersion("toolbelt.json", v);
      },
      async build() {
        await run(["bun", "scripts/build.ts"]);
        return packagePlugin("dist/package", "artifacts", "0.2.2", []);
      },
    },
  },
} satisfies ReleaseConfig;
