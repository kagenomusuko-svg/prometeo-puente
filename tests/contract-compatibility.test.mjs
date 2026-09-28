import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runEcosystemSlice } from "../src/ecosystem-slice.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chain = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/canonical-case.json"), "utf8"));
const legacyResponse = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/legacy-delta-response.json"), "utf8"));
const contract = JSON.parse(fs.readFileSync(path.join(root, "contracts/prometeo-contract.json"), "utf8"));

const output = runEcosystemSlice({ chain, legacyResponse, contract });
assert.equal(output.report, null);
assert.equal(output.adapted.motorResult.requestId, chain.motorRequest.id);
assert.deepEqual(output.reportInput.contextReferences, chain.languageProposal.contextReferences);
assert.equal(output.reportInput.confirmedModel.state, "confirmed");

assert.throws(
  () => runEcosystemSlice({
    chain: { ...chain, languageProposal: { ...chain.languageProposal, requiresHumanConfirmation: false } },
    legacyResponse,
    contract,
  }),
  (error) => error.code === "MISSING_HUMAN_CONFIRMATION",
);

assert.throws(
  () => runEcosystemSlice({
    chain: { ...chain, decision: { ...chain.decision, provenance: { kind: "language-agent" } } },
    legacyResponse,
    contract,
  }),
  (error) => error.code === "NON_HUMAN_DECISION",
);

console.log("PASS: puente valida cadena completa sin asumir promociones implícitas");
