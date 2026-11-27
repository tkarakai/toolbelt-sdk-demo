const archive =
  "artifacts/toolbelt-sdk-demo-" +
  JSON.parse(await Bun.file("toolbelt.json").text()).version +
  "-portable.tar.gz";
import { $ } from "bun";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parsePackageManifest } from "@toolbelt/sdk/package";
const root = mkdtempSync(join(tmpdir(), "sdk-demo-package-"));
try {
  const pkg = join(root, "package"),
    data = join(root, "data");
  mkdirSync(pkg);
  mkdirSync(data);
  await $`tar -xzf ${archive} -C ${pkg}`;
  const m = parsePackageManifest(
    await Bun.file(join(pkg, "toolbelt.json")).json(),
  );
  const proc = Bun.spawn([process.execPath, join(pkg, "index.js")], {
    cwd: root,
    env: {
      PATH: "/usr/bin:/bin",
      HOME: root,
      TOOLBELT_PLUGIN: m.id,
      TOOLBELT_PLUGIN_VERSION: m.version,
      TOOLBELT_DATA_DIR: data,
      TOOLBELT_PACKAGE_ROOT: pkg,
    },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "inherit",
    timeout: 10000,
  });
  const send = (m: unknown) => proc.stdin.write(JSON.stringify(m) + "\n");
  send({
    type: "hello",
    protocol: 2,
    plugin: { id: m.id },
    host: { name: "Clean package check", version: "0.7.1" },
  });
  let buffer = "",
    ready = false,
    deferred = false,
    prepared = false,
    declared = false,
    redeclared = false,
    agentView = false,
    floatingPanel = false;
  const surfaces = m.screens.length + 2;
  const rendered = new Set<string>();
  const agent = "agent:package-check";
  for await (const bytes of proc.stdout) {
    buffer += new TextDecoder().decode(bytes);
    let at;
    while ((at = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, at);
      buffer = buffer.slice(at + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      // Protocol 2: the view declarations arrive in hello, every message names its instance.
      if (msg.type === "hello")
        declared = msg.protocol === 2 && "screen:views" in (msg.views ?? {});
      if (msg.type === "ready") {
        ready = true;
        for (const s of m.screens)
          send({ type: "open", surface: `screen:${s.id}`, instance: "person" });
        send({ type: "open", surface: "quick", instance: "person" });
        send({ type: "open", surface: "floating", instance: "person" });
        send({ type: "open", surface: "screen:views", instance: agent });
      }
      if (msg.type === "render") {
        if (msg.instance === "person") rendered.add(msg.surface);
        // Asking from the bar grows it into a panel with the answer.
        if (msg.surface === "floating" && msg.tree.mode === "panel" && JSON.stringify(msg.tree).includes("A canned answer"))
          floatingPanel = true;
        if (rendered.size === surfaces && !deferred) {
          deferred = true;
          // An agent's search is applied by the SDK to its own instance only.
          send({ type: "event", surface: "screen:views", instance: agent, name: "search", payload: { query: "guide" } });
          // A label filter changes the declaration: the SDK sends it again.
          send({ type: "event", surface: "screen:views", instance: "person", name: "add-label" });
          send({ type: "event", surface: "floating", instance: "person", name: "floating-ask", payload: { composer: "floating-ask", text: "Hello" } });
          send({ type: "event", surface: "screen:lifecycle", instance: "person", name: "defer" });
          send({ type: "prepare", requestId: "blocked", reason: "upgrade" });
        }
      }
      if (msg.type === "view" && msg.instance === agent && msg.view.search === "guide")
        agentView = true;
      if (msg.type === "views" && "label-size" in (msg.views["screen:views"]?.filters ?? {}))
        redeclared = true;
      if (msg.type === "prepared" && msg.requestId === "blocked") {
        if (msg.ready) throw Error("Expected deferral");
        send({ type: "event", surface: "screen:lifecycle", instance: "person", name: "defer" });
        send({ type: "prepare", requestId: "ready", reason: "upgrade" });
      }
      if (msg.type === "prepared" && msg.requestId === "ready") {
        if (!msg.ready) throw Error("Expected readiness");
        prepared = true;
        send({ type: "shutdown" });
        proc.stdin.end();
      }
    }
  }
  if (
    (await proc.exited) !== 0 ||
    !ready ||
    !prepared ||
    rendered.size !== surfaces ||
    !declared ||
    !redeclared ||
    !agentView ||
    !floatingPanel
  )
    throw Error("Demo clean package contract failed");
  console.log(
    "Clean demo package: protocol 2 views, an agent instance, redeclaration, all screens/quick/floating (bar to panel), prepare deferral/retry, shutdown pass.",
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
