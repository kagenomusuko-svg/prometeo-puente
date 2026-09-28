import { fromLegacyCalculateResponse, toLegacyCalculateRequest } from "./motor-adapter.mjs";

function requiredObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const error = new Error(field + " must be an object");
    error.code = "INVALID_CHAIN";
    throw error;
  }
}

function validateChain(chain) {
  requiredObject(chain, "chain");
  for (const field of ["sourceDocument", "languageProposal", "decision", "confirmedModel", "motorRequest"]) {
    requiredObject(chain[field], "chain." + field);
  }
  if (chain.languageProposal.documentId !== chain.sourceDocument.id) {
    const error = new Error("language proposal must reference source document");
    error.code = "DOCUMENT_MISMATCH";
    throw error;
  }
  if (chain.languageProposal.requiresHumanConfirmation !== true) {
    const error = new Error("language proposal requires human confirmation");
    error.code = "MISSING_HUMAN_CONFIRMATION";
    throw error;
  }
  if (!Array.isArray(chain.languageProposal.contextReferences)) {
    const error = new Error("language proposal contextReferences must be an array");
    error.code = "INVALID_CONTEXT_REFERENCES";
    throw error;
  }
  if (chain.decision.provenance?.kind !== "human") {
    const error = new Error("bridge requires human decision provenance");
    error.code = "NON_HUMAN_DECISION";
    throw error;
  }
  if (chain.confirmedModel.state !== "confirmed") {
    const error = new Error("bridge requires confirmed model");
    error.code = "INVALID_MODEL_STATE";
    throw error;
  }
  if (chain.motorRequest.modelId !== chain.confirmedModel.id) {
    const error = new Error("motor request must reference confirmed model");
    error.code = "MODEL_MISMATCH";
    throw error;
  }
}

export function runEcosystemSlice({
  chain,
  legacyResponse,
  contract,
  buildReport = null,
  motorVersion = "source:prometeo-motor-calculo/motor.py@432ac9578da8862d6605b18071576af02b042bce",
  calculatedAt = "2026-09-28T18:35:00Z",
  generatedAt = "2026-09-28T18:36:00Z",
}) {
  validateChain(chain);
  const legacyRequest = toLegacyCalculateRequest(chain.motorRequest);
  const adapted = fromLegacyCalculateResponse(chain.motorRequest, legacyResponse, {
    motorVersion,
    calculatedAt,
  });
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
    caseReduction: chain.caseReduction ?? null,
  };
  const report = buildReport ? buildReport({
    ...reportInput,
    generatedAt,
    generatedBy: "prometeo-informe",
  }) : null;
  return { contract, legacyRequest, adapted, reportInput, report };
}
