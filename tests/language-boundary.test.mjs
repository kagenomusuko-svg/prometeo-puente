import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createPublicCommandDispatcher, BridgeCommandError } from "../src/public-command-dispatcher.mjs";

const requiredEnvironment = ["PROMETEO_INGESTA_PATH", "PROMETEO_LENGUAJE_PATH"];

if (requiredEnvironment.some((name) => !process.env[name])) {
  console.log("SKIP: frontera lingüística requiere PROMETEO_INGESTA_PATH y PROMETEO_LENGUAJE_PATH");
} else {
  const { normalizeTextDocument } = await import(
    pathToFileURL(process.env.PROMETEO_INGESTA_PATH).href
  );
  const { registerLanguageProposals } = await import(
    pathToFileURL(process.env.PROMETEO_LENGUAJE_PATH).href
  );

  const sourceDocument = normalizeTextDocument({
    id: "document-language-boundary-001",
    caseId: "case-language-boundary-001",
    text: "A realizó X y se reporta Y.",
    recordedAt: "2026-09-29T16:00:00Z",
  });

  const dispatcher = createPublicCommandDispatcher({
    "request-proposals": ({ payload }) => registerLanguageProposals(payload),
  });

  const proposal = await dispatcher({
    operation: "request-proposals",
    caseId: sourceDocument.caseId,
    expectedVersion: "1.0.0",
    actorId: "prometeo-lenguaje",
    occurredAt: "2026-09-29T16:01:00Z",
    reason: "Registrar propuestas lingüísticas",
    provenance: {
      kind: "language-agent",
      actorId: "prometeo-lenguaje",
      recordedAt: "2026-09-29T16:01:00Z",
    },
    payload: {
      document: sourceDocument,
      propositions: [{
        id: "proposition-language-boundary-001",
        fragmentId: sourceDocument.fragments[0].id,
        text: "A realizó X y se reporta Y.",
        modality: "reported",
      }],
      candidates: [{
        id: "candidate-language-boundary-001",
        propositionId: "proposition-language-boundary-001",
        category: "relation",
        label: "X podría relacionarse con Y",
      }],
      hypotheses: [{
        id: "hypothesis-language-boundary-001",
        caseId: sourceDocument.caseId,
        label: "H1",
        candidateIds: ["candidate-language-boundary-001"],
      }],
      recordedAt: "2026-09-29T16:01:00Z",
    },
  });

  assert.equal(proposal.requiresHumanConfirmation, true);
  assert.equal(proposal.propositions[0].state, "proposed");
  assert.equal(proposal.candidates[0].state, "proposed");
  assert.equal(proposal.hypotheses[0].status, "proposed");
  assert.equal(Object.hasOwn(proposal, "confirmedModel"), false);

  await assert.rejects(
    () => dispatcher({
      operation: "record-analyst-decision",
      caseId: sourceDocument.caseId,
      expectedVersion: "1.0.0",
      actorId: "prometeo-lenguaje",
      occurredAt: "2026-09-29T16:02:00Z",
      reason: "Intento inválido de promoción",
      provenance: {
        kind: "language-agent",
        actorId: "prometeo-lenguaje",
        recordedAt: "2026-09-29T16:02:00Z",
      },
      payload: {
        decision: {
          action: "confirm",
          targetObjectId: "hypothesis-language-boundary-001",
          resultingObjectId: "model-language-boundary-001",
          resultingVersion: "1.0.0",
        },
      },
    }),
    (error) => error instanceof BridgeCommandError && error.code === "NON_HUMAN_DECISION",
  );

  console.log("PASS: lenguaje propone y el puente bloquea su promoción");
}
