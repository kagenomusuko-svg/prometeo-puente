import { fromLegacyCalculateResponse, toLegacyCalculateRequest } from "./motor-adapter.mjs";

export function runEcosystemSlice({
  chain,
  legacyResponse,
  contract,
  buildReport = null,
  motorVersion = "source:prometeo-motor-calculo/motor.py@432ac9578da8862d6605b18071576af02b042bce",
  calculatedAt = "2026-09-28T18:35:00Z",
  generatedAt = "2026-09-28T18:36:00Z",
}) {
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
  };
  const report = buildReport ? buildReport({
    ...reportInput,
    generatedAt,
    generatedBy: "prometeo-informe",
  }) : null;
  return { contract, legacyRequest, adapted, reportInput, report };
}
