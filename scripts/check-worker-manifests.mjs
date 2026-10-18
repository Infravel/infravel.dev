import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Execute the actual inlined loader, without initializing the full Worker or
// printing preview/draft-mode keys. File presence alone did not catch error 1101.
try {
  const expected = JSON.parse(
    readFileSync(".next/server/preview-props.json", "utf8"),
  );
  const copied = JSON.parse(
    readFileSync(
      ".open-next/server-functions/default/.next/server/preview-props.json",
      "utf8",
    ),
  );
  assert.deepEqual(copied, expected);
  const source = ts.createSourceFile(
    "handler.mjs",
    readFileSync(".open-next/server-functions/default/handler.mjs", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const loaders = [];
  function visit(node) {
    if (
      ts.isFunctionDeclaration(node) &&
      /^loadManifest\d*$/.test(node.name?.text ?? "")
    ) {
      const code = node.getText(source);
      if (code.includes("Unexpected loadManifest")) loaders.push(code);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(loaders.length > 0);
  for (const code of loaders) {
    const result = runInNewContext(
      `(${code})("/.next/server/preview-props.json")`,
      { sharedCache: new Map() },
      { timeout: 1000 },
    );
    assert.deepEqual(JSON.parse(JSON.stringify(result)), expected);
  }
  console.log("OpenNext preview-props loader regression check passed.");
} catch {
  // Assertion diffs and evaluated source can contain private draft-mode keys.
  console.error(
    "OpenNext preview-props loader regression check failed. Rebuild with the compatible adapter; see docs/worker-runtime.md.",
  );
  process.exitCode = 1;
}
