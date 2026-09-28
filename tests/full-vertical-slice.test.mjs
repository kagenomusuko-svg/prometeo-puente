import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromLegacyCalculateResponse, toLegacyCalculateRequest } from "../src/motor-adapter.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chain = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/canonical-case.json"), "utf8"));
const legacyResponse = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/legacy-delta-response.json"), "utf8"));
const contractReference = JSON.parse(fs.readFileSync(path.join(root, "contracts/prometeo-contract.json"), "utf8"));

const legacyRequest = toLegacyCalculateRequest(chain.motorRequest);
assert.equal(legacyRequest.formula, chain.motorRequest.formulaId);

const adapted = fromLegacyCalculateResponse(chain.motorRequest, legacyResponse, {
  motorVersion: "source:prometeo-motor-calculo/motor.py@432ac9578da8862d6605b18071576af02b042bce",
  calculatedAt: "2026-09-28T18:35:00Z",
});

const reportInput = {
  caseId: chain.sourceDocument.caseId,
  modelId: chain.confirmedModel.id,
  motorResult: adapted.motorResult,
  calculationTrace: adapted.calculationTrace,
  contextReferences: chain.languageProposal.contextReferences,
};

assert.equal(contractReference.contractId, "prometeo-contracts");
assert.equal(contractReference.contractVersion, "0.2.0");
assert.equal(contractReference.sourceRepository, "kagenomusuko-svg/prometeo-esquema");
assert.equal(reportInput.caseId, "case-canonical-001");
assert.equal(reportInput.contextReferences[0].sourceRef, "kagenomusuko-svg/Paradigma@map-commit");
assert.equal(reportInput.contextReferences[0].evidenceStatus, "explicit");
assert.equal(reportInput.contextReferences[0].category, "nodes");
assert.deepEqual(reportInput.contextReferences[0].locator, { workId: "metrologia-causal", section: "R*" });
assert.deepEqual(reportInput.contextReferences, chain.languageProposal.contextReferences);
assert.equal(reportInput.modelId, chain.motorRequest.modelId);
assert.equal(reportInput.motorResult.requestId, chain.motorRequest.id);
assert.deepEqual(reportInput.motorResult.result, legacyResponse.result);
assert.equal(reportInput.motorResult.traceId, reportInput.calculationTrace.id);
assert.equal(reportInput.calculationTrace.steps.length, legacyResponse.trace.length);
assert.equal(adapted.externalMetadata.taxonomy_id, "universal");

console.log("PASS: caso canónico completo hasta entrada de informe");
