import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runEcosystemSlice } from "../src/ecosystem-slice.mjs";
import { fromLegacyCalculateResponse } from "../src/motor-adapter.mjs";
import fs from "node:fs";

const required = ["PROMETEO_CONTEXTO_PATH", "PROMETEO_LENGUAJE_PATH", "PROMETEO_CASO_CONFIRMATION_PATH", "PROMETEO_CASO_TRANSITION_PATH", "PROMETEO_CASO_STORE_PATH", "PROMETEO_INFORME_PATH", "PROMETEO_PROYECCION_PATH"];
for (const name of required) if (!process.env[name]) throw new Error(name + " es obligatorio para el slice generativo");

const { queryParadigma } = await import(pathToFileURL(process.env.PROMETEO_CONTEXTO_PATH).href);
const { registerLanguageProposals } = await import(pathToFileURL(process.env.PROMETEO_LENGUAJE_PATH).href);
const { confirmModel } = await import(pathToFileURL(process.env.PROMETEO_CASO_CONFIRMATION_PATH).href);
const { confirmModelTransition } = await import(pathToFileURL(process.env.PROMETEO_CASO_TRANSITION_PATH).href);
const { createCaseEventStore } = await import(pathToFileURL(process.env.PROMETEO_CASO_STORE_PATH).href);
const { buildReport } = await import(pathToFileURL(process.env.PROMETEO_INFORME_PATH).href);
const { projectConfirmedModel } = await import(pathToFileURL(process.env.PROMETEO_PROYECCION_PATH).href);

const sourceDocument = {
  id: "document-generated-001",
  caseId: "case-generated-001",
  state: "normalized",
  fragments: [{ id: "fragment-generated-001", text: "A realizó X y se reporta Y.", provenance: { kind: "source", actorId: "prometeo-ingesta" } }],
};
const context = queryParadigma({
  mapDocument: {
    map_version: "f1-generated",
    schema_status: "frozen",
    phase: "F1",
    nodes: [{ id: "node-r-star", label: "R*", description: "objeto formal", locator: { workId: "metrologia-causal", section: "R*" }, status: "explicit" }],
    works: [], evidence: [], relations: [], routes: [],
  },
  query: "R*",
  sourceRef: "kagenomusuko-svg/Paradigma@map-commit",
  retrievedAt: "2026-09-28T21:00:00Z",
});
const languageProposal = registerLanguageProposals({
  document: sourceDocument,
  context,
  propositions: [{ id: "proposition-generated-001", fragmentId: "fragment-generated-001", text: "A realizó X y se reporta Y.", modality: "reported" }],
  candidates: [{ id: "candidate-generated-001", propositionId: "proposition-generated-001", category: "relation", label: "X podría relacionarse con Y" }],
  hypotheses: [{ id: "hypothesis-generated-001", caseId: sourceDocument.caseId, label: "H1", candidateIds: ["candidate-generated-001"] }],
  recordedAt: "2026-09-28T21:01:00Z",
});
assert.equal(languageProposal.hypotheses[0].status, "proposed");

const decision = {
  id: "decision-generated-001",
  caseId: sourceDocument.caseId,
  action: "confirm",
  targetObjectId: "hypothesis-generated-001",
  previousVersion: "none",
  resultingObjectId: "model-generated-001",
  resultingVersion: "1.0.0",
  decidedBy: "analyst-generated-001",
  decidedAt: "2026-09-28T21:02:00Z",
  reason: "Confirmación humana explícita.",
  provenance: { kind: "human", actorId: "analyst-generated-001", recordedAt: "2026-09-28T21:02:00Z", sourceObjectId: "hypothesis-generated-001", sourceVersion: "proposed" },
};
const confirmedModel = confirmModel({
  caseId: sourceDocument.caseId,
  modelId: "model-generated-001",
  decision,
  nodes: [{ id: "A" }, { id: "Y" }],
  relations: [{ from: "A", to: "Y", type: "confirmed" }],
  confirmedAt: "2026-09-28T21:02:00Z",
});
assert.equal(confirmedModel.state, "confirmed");

const caseRoot = {
  id: "event-case-generated-001",
  caseId: sourceDocument.caseId,
  sequence: 1,
  action: "create",
  objectType: "Case",
  objectId: sourceDocument.caseId,
  previousState: "none",
  resultingState: "draft",
  previousVersion: "none",
  resultingVersion: "1.0.0",
  occurredAt: "2026-09-28T21:01:30Z",
  reason: "Creación del expediente.",
  provenance: { kind: "human", actorId: "analyst-generated-001", recordedAt: "2026-09-28T21:01:30Z", sourceObjectId: sourceDocument.caseId, sourceVersion: "none" },
};
const store = createCaseEventStore([caseRoot]);
const transition = confirmModelTransition({
  previousEvents: store.read(sourceDocument.caseId),
  caseId: sourceDocument.caseId,
  modelId: confirmedModel.id,
  previousModel: null,
  decision,
  nodes: confirmedModel.nodes,
  relations: confirmedModel.relations,
  confirmedAt: "2026-09-28T21:02:00Z",
});
store.append(transition.event);
const caseEvents = store.read(sourceDocument.caseId);
assert.equal(caseEvents.length, 2);

const motorRequest = projectConfirmedModel({
  confirmedModel,
  requestId: "request-generated-001",
  formulaId: "delta",
  formulaVersion: "0.1.0",
  parameters: { r_star: ["1", "0"], alpha: ["0", "0"] },
  discipline: "universal",
  createdBy: "prometeo-proyeccion",
  createdAt: "2026-09-28T21:03:00Z",
});
const legacyResponse = { result: [{ numerator: 1, denominator: 1 }, { numerator: 0, denominator: 1 }], trace: [{ step: "delta", result: [{ numerator: 1, denominator: 1 }, { numerator: 0, denominator: 1 }] }], metadata: { taxonomy_id: "universal" } };
const result = runEcosystemSlice({
  chain: { sourceDocument, languageProposal, decision, confirmedModel, motorRequest, caseEvents },
  legacyResponse,
  contract: { contractId: "prometeo-contracts", contractVersion: "0.2.0" },
  buildReport,
  reconstructCaseAggregate: (events) => {
    throw new Error("El test generativo requiere el agregado oficial mediante PROMETEO_CASO_AGGREGATE_PATH");
  },
});
assert.equal(result.reportInput.caseId, sourceDocument.caseId);
assert.equal(result.reportInput.modelId, confirmedModel.id);
console.log("PASS: construcción generativa desde SourceDocument hasta MotorRequest");
