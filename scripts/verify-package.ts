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
    protocol: 3,
    plugin: { id: m.id },
    host: { name: "Clean package check", version: "0.10.0" },
    capabilities: [...m.capabilities.required, ...m.capabilities.optional],
  });
  let ids = 0;
  /** Sends an event; protocol 3 events carry an id and say who sent them. */
  const event = (surface: string, instance: string, name: string, payload?: unknown) => {
    const id = `check-${++ids}-${name}`;
    send({ type: "event", id, surface, instance, name, ...(payload !== undefined ? { payload } : {}), origin: instance === "person" ? "person" : "agent", ...(instance === "person" ? {} : { agent: "Package check" }) });
    return id;
  };
  let buffer = "",
    ready = false,
    deferred = false,
    prepared = false,
    declared = false,
    redeclared = false,
    agentView = false,
    floatingPanel = false,
    agentData = false,
    navigated = false;
  const results = new Map<string, { handled: boolean; error?: string; data?: unknown }>();
  let addId = "", goId = "";
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
      // Protocol 3: declarations (views, actions, forms) arrive in hello; every event gets a result.
      if (msg.type === "hello")
        declared = msg.protocol === 3 && "screen:views" in (msg.declarations?.views ?? {}) && msg.declarations?.actions?.["add-item"]?.effect === "write" && msg.declarations?.forms?.["item-pane"]?.effect === "write";
      if (msg.type === "ready") {
        ready = true;
        for (const s of m.screens)
          send({ type: "open", surface: `screen:${s.id}`, instance: "person" });
        send({ type: "open", surface: "quick", instance: "person" });
        send({ type: "open", surface: "floating", instance: "person" });
        send({ type: "open", surface: "screen:views", instance: agent });
        send({ type: "open", surface: "screen:actions", instance: agent });
      }
      if (msg.type === "render") {
        if (msg.instance === "person") rendered.add(msg.surface);
        // Asking from the bar grows it into a panel with the answer.
        if (msg.surface === "floating" && msg.tree.mode === "panel" && JSON.stringify(msg.tree).includes("A canned answer"))
          floatingPanel = true;
        if (rendered.size === surfaces && !deferred) {
          deferred = true;
          // An agent's search is applied by the SDK to its own instance only.
          event("screen:views", agent, "search", { query: "guide" });
          // A label filter changes the declaration: the SDK sends it again.
          event("screen:views", "person", "add-label", { rowId: "view-from-data" });
          event("floating", "person", "floating-ask", { composer: "floating-ask", text: "Hello" });
          // An agent's write returns the new item's id; navigation is tagged with its event.
          addId = event("screen:actions", agent, "add-item", { rowId: "effects" });
          goId = event("screen:actions", "person", "go-views", { rowId: "results" });
          event("screen:lifecycle", "person", "defer");
          send({ type: "prepare", requestId: "blocked", reason: "upgrade" });
        }
      }
      if (msg.type === "view" && msg.instance === agent && msg.view.search === "guide")
        agentView = true;
      if (msg.type === "declarations" && "label-size" in (msg.declarations.views["screen:views"]?.filters ?? {}))
        redeclared = true;
      if (msg.type === "result") {
        results.set(msg.id, msg);
        if (msg.id === addId && msg.handled && typeof (msg.data as { id?: unknown })?.id === "string") agentData = true;
      }
      if (msg.type === "navigate" && msg.event === goId && msg.screen === "views") navigated = true;
      if (msg.type === "prepared" && msg.requestId === "blocked") {
        if (msg.ready) throw Error("Expected deferral");
        event("screen:lifecycle", "person", "defer");
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
    !floatingPanel ||
    !agentData ||
    !navigated ||
    results.size !== ids ||
    [...results.values()].some((r) => r.error)
  )
    throw Error("Demo clean package contract failed");
  console.log(
    `Clean demo package: protocol 3 declarations, a result for each of ${ids} events, an agent's write returning data, tagged navigation, views in an agent instance, redeclaration, all screens/quick/floating (bar to panel), prepare deferral/retry, shutdown pass.`,
  );
} finally {
  rmSync(root, { recursive: true, force: true });
}
