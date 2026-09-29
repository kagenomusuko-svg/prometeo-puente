import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  fromLegacyCalculateResponse,
  toLegacyCalculateRequest,
} from "../src/motor-adapter.mjs";

const requiredEnvironment = [
  "PROMETEO_CASO_PATH",
  "PROMETEO_PROYECCION_PATH",
  "PROMETEO_INFORME_PATH",
  "PROMETEO_MOTOR_URL",
];

if (requiredEnvironment.some((name) => !process.env[name])) {
  console.log("SKIP: integración real requiere PROMETEO_CASO_PATH, PROMETEO_PROYECCION_PATH, PROMETEO_INFORME_PATH y PROMETEO_MOTOR_URL");
} else {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const chain = JSON.parse(
    fs.readFileSync(path.join(root, "tests/fixtures/canonical-case.json"), "utf8"),
  );

  const aggregatePath = process.env.PROMETEO_CASO_PATH;
  const confirmationPath = process.env.PROMETEO_CASO_CONFIRMATION_PATH
    ?? aggregatePath.replace(/aggregate\.mjs$/, "confirmation.mjs");

  const { confirmModel } = await import(pathToFileURL(confirmationPath).href);
  const { reconstructCaseAggregate } = await import(pathToFileURL(aggregatePath).href);
  const { projectConfirmedModel } = await import(pathToFileURL(process.env.PROMETEO_PROYECCION_PATH).href);
  const { buildReport } = await import(pathToFileURL(process.env.PROMETEO_INFORME_PATH).href);

  const confirmedModel = confirmModel({
    caseId: chain.confirmedModel.caseId,
    modelId: chain.confirmedModel.id,
    decision: chain.decision,
    nodes: chain.confirmedModel.nodes,
    relations: chain.confirmedModel.relations,
    confirmedAt: chain.decision.decidedAt,
  });

  const motorRequest = projectConfirmedModel({
    confirmedModel,
    requestId: chain.motorRequest.id,
    formulaId: chain.motorRequest.formulaId,
    formulaVersion: chain.motorRequest.formulaVersion,
    parameters: chain.motorRequest.parameters,
    discipline: chain.motorRequest.discipline,
    createdBy: chain.motorRequest.createdBy,
    createdAt: chain.motorRequest.createdAt,
  });

  const response = await fetch(process.env.PROMETEO_MOTOR_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(toLegacyCalculateRequest(motorRequest)),
  });
  assert.equal(response.ok, true, "prometeo-motor-calculo debe responder HTTP 2xx");

  const legacyResponse = await response.json();
  const adapted = fromLegacyCalculateResponse(motorRequest, legacyResponse, {
    motorVersion: process.env.PROMETEO_MOTOR_VERSION ?? "prometeo-motor-calculo@http",
    calculatedAt: process.env.PROMETEO_CALCULATED_AT ?? "2026-09-29T00:00:00Z",
  });

  const caseReduction = reconstructCaseAggregate(chain.caseEvents);
  const report = buildReport({
    caseId: chain.sourceDocument.caseId,
    modelId: confirmedModel.id,
    sourceDocument: chain.sourceDocument,
    languageProposal: chain.languageProposal,
    analystDecision: chain.decision,
    confirmedModel,
    motorResult: adapted.motorResult,
    calculationTrace: adapted.calculationTrace,
    contextReferences: chain.languageProposal.contextReferences,
    caseReduction,
    generatedAt: process.env.PROMETEO_REPORT_AT ?? "2026-09-29T00:01:00Z",
    generatedBy: "prometeo-informe",
  });

  assert.equal(report.caseId, chain.sourceDocument.caseId);
  assert.equal(report.modelId, confirmedModel.id);
  assert.equal(report.motorResultId, adapted.motorResult.id);
  assert.equal(report.sections.find((section) => section.id === "trace").traceId, adapted.calculationTrace.id);
  assert.equal(report.provenance.actorId, "prometeo-informe");

  console.log("PASS: integración real caso → proyección → motor HTTP → informe");
}
