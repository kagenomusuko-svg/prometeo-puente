import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runEcosystemSlice } from "../src/ecosystem-slice.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chain = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/canonical-case.json"), "utf8"));
const fixtureResponse = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/legacy-delta-response.json"), "utf8"));
const contract = JSON.parse(fs.readFileSync(path.join(root, "contracts/prometeo-contract.json"), "utf8"));

if (!process.env.PROMETEO_PROYECCION_PATH || !process.env.PROMETEO_INFORME_PATH) {
  throw new Error("PROMETEO_PROYECCION_PATH y PROMETEO_INFORME_PATH son obligatorios para el vertical slice completo");
}

const { projectConfirmedModel } = await import(pathToFileURL(process.env.PROMETEO_PROYECCION_PATH).href);
const { buildReport } = await import(pathToFileURL(process.env.PROMETEO_INFORME_PATH).href);

const projectedRequest = projectConfirmedModel({
  confirmedModel: chain.confirmedModel,
  requestId: chain.motorRequest.id,
  formulaId: chain.motorRequest.formulaId,
  formulaVersion: chain.motorRequest.formulaVersion,
  parameters: chain.motorRequest.parameters,
  discipline: chain.motorRequest.discipline,
  createdBy: chain.motorRequest.createdBy,
  createdAt: chain.motorRequest.createdAt,
});
assert.deepEqual(projectedRequest, chain.motorRequest);

let legacyResponse = fixtureResponse;
if (process.env.PROMETEO_MOTOR_URL) {
  const response = await fetch(process.env.PROMETEO_MOTOR_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      formula: chain.motorRequest.formulaId,
      data: chain.motorRequest.parameters,
      discipline: chain.motorRequest.discipline,
    }),
  });
  assert.equal(response.ok, true, "motor HTTP debe responder correctamente");
  legacyResponse = await response.json();
}

const execute = () => runEcosystemSlice({
  chain,
  legacyResponse,
  contract,
  buildReport,
  calculatedAt: "2026-09-28T18:35:00Z",
  generatedAt: "2026-09-28T18:36:00Z",
});
const first = execute();
const second = execute();

assert.deepEqual(first.adapted.motorResult.result, legacyResponse.result);
assert.equal(first.adapted.motorResult.requestId, chain.motorRequest.id);
assert.equal(first.report.caseId, chain.sourceDocument.caseId);
assert.equal(first.report.modelId, chain.confirmedModel.id);
assert.deepEqual(first.report.contextReferences, chain.languageProposal.contextReferences);
assert.deepEqual(first.report.sections.find((section) => section.id === "context").references, first.report.contextReferences);
assert.deepEqual(first.report.sections.find((section) => section.id === "result").value, first.adapted.motorResult.result);
assert.deepEqual(first.report, second.report);

console.log("PASS: vertical slice completo reproducible desde ConfirmedModel hasta ReportModel");
