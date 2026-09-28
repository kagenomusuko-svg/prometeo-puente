import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromLegacyCalculateResponse, toLegacyCalculateRequest } from "../src/motor-adapter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chain = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/canonical-case.json"), "utf8"));
const legacyResponse = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/legacy-delta-response.json"), "utf8"));
const contract = JSON.parse(fs.readFileSync(path.join(root, "contracts/prometeo-contract.json"), "utf8"));

assert.equal(contract.contractId, "prometeo-contracts");
assert.equal(contract.contractVersion, "0.2.0");

assert.equal(chain.sourceDocument.state, "normalized");
assert.equal(chain.languageProposal.documentId, chain.sourceDocument.id);
assert.equal(chain.languageProposal.requiresHumanConfirmation, true);
assert.ok(chain.languageProposal.propositions.every((item) => item.state === "proposed"));
assert.ok(chain.languageProposal.candidates.every((item) => item.state === "proposed"));
assert.ok(chain.languageProposal.hypotheses.every((item) => item.status === "proposed"));
assert.equal(chain.languageProposal.contextReferences[0].sourceRef, "kagenomusuko-svg/Paradigma@map-commit");
assert.equal(chain.languageProposal.contextReferences[0].evidenceStatus, "explicit");

assert.equal(chain.decision.provenance.kind, "human");
assert.equal(chain.decision.decidedBy, chain.decision.provenance.actorId);
assert.equal(chain.confirmedModel.state, "confirmed");
assert.ok(chain.confirmedModel.decisions.includes(chain.decision.id));
assert.equal(chain.confirmedModel.provenance.sourceObjectId, chain.decision.id);

assert.equal(chain.motorRequest.modelId, chain.confirmedModel.id);
assert.equal(chain.motorRequest.provenance.sourceObjectId, chain.confirmedModel.id);
assert.equal(chain.motorRequest.provenance.actorId, "prometeo-proyeccion");

const legacyRequest = toLegacyCalculateRequest(chain.motorRequest);
assert.equal(legacyRequest.formula, chain.motorRequest.formulaId);

const adapted = fromLegacyCalculateResponse(chain.motorRequest, legacyResponse, {
  motorVersion: "source:prometeo-motor-calculo/motor.py@432ac9578da8862d6605b18071576af02b042bce",
  calculatedAt: "2026-09-28T18:35:00Z",
});
assert.equal(adapted.motorResult.requestId, chain.motorRequest.id);
assert.equal(adapted.motorResult.traceId, adapted.calculationTrace.id);
assert.equal(adapted.calculationTrace.requestId, chain.motorRequest.id);
assert.deepEqual(adapted.motorResult.result, legacyResponse.result);

const reportInput = {
  caseId: chain.sourceDocument.caseId,
  modelId: chain.confirmedModel.id,
  sourceDocument: chain.sourceDocument,
  languageProposal: chain.languageProposal,
  analystDecision: chain.decision,
  confirmedModel: chain.confirmedModel,
  contextReferences: chain.languageProposal.contextReferences,
  motorResult: adapted.motorResult,
  calculationTrace: adapted.calculationTrace,
};
assert.equal(reportInput.caseId, chain.sourceDocument.caseId);
assert.equal(reportInput.modelId, chain.confirmedModel.id);
assert.deepEqual(reportInput.contextReferences, chain.languageProposal.contextReferences);
assert.equal(reportInput.motorResult.requestId, chain.motorRequest.id);
assert.equal(reportInput.calculationTrace.requestId, chain.motorRequest.id);

console.log("PASS: vertical slice reproducible desde documento hasta entrada de informe");
