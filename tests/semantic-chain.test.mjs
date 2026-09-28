import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toLegacyCalculateRequest } from "../src/motor-adapter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chain = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/canonical-case.json"), "utf8"));

assert.equal(chain.sourceDocument.state, "normalized");
assert.equal(chain.languageProposal.documentId, chain.sourceDocument.id);
assert.ok(chain.languageProposal.propositions.every((item) => item.state === "proposed"));
assert.ok(chain.languageProposal.candidates.every((item) => item.state === "proposed"));
assert.equal(chain.languageProposal.requiresHumanConfirmation, true);
assert.equal(chain.languageProposal.contextReferences[0].sourceRef, "kagenomusuko-svg/Paradigma@map-commit");
assert.equal(chain.languageProposal.contextReferences[0].evidenceStatus, "explicit");
assert.equal(chain.decision.provenance.kind, "human");
assert.equal(chain.confirmedModel.state, "confirmed");
assert.equal(chain.confirmedModel.provenance.kind, "human");
assert.equal(chain.confirmedModel.decisions[0], chain.decision.id);
assert.equal(chain.motorRequest.provenance.sourceObjectId, chain.confirmedModel.id);

const legacyRequest = toLegacyCalculateRequest(chain.motorRequest);
assert.equal(legacyRequest.formula, "delta");
assert.deepEqual(legacyRequest.data, chain.motorRequest.parameters);
console.log("PASS: ingesta -> propuestas -> decisión humana -> modelo -> MotorRequest");
