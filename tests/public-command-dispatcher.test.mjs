import { strict as assert } from "node:assert";
import { BridgeCommandError, createPublicCommandDispatcher, dispatchPublicCommand } from "../src/public-command-dispatcher.mjs";

const base = {
  caseId: "case-1", expectedVersion: "1.0.0", actorId: "analyst-1", occurredAt: "2026-09-29T14:30:00Z", reason: "Decisión explícita",
  provenance: { kind: "human", actorId: "analyst-1", recordedAt: "2026-09-29T14:30:00Z" },
};
const calls = [];
const handlers = {
  "record-analyst-decision": async (command) => { calls.push(command); return { accepted: true, decisionId: "decision-1" }; },
  "request-calculation": (command) => { calls.push(command); return { accepted: true, requestId: "request-1" }; },
};

const decision = await dispatchPublicCommand({
  ...base, operation: "record-analyst-decision",
  payload: { action: "confirm", targetObjectId: "hypothesis-1", resultingObjectId: "model-1", resultingVersion: "1.0.0" },
}, { handlers });
assert.deepEqual(decision, { accepted: true, decisionId: "decision-1" });
assert.equal(calls[0].payload.resultingObjectId, "model-1");

const dispatcher = createPublicCommandDispatcher(handlers);
const calculation = await dispatcher({
  ...base, operation: "request-calculation",
  payload: { modelId: "model-1", discipline: "universal" },
}, { handlers });
assert.equal(calculation.requestId, "request-1");

await assert.rejects(
  () => dispatchPublicCommand({
    ...base, operation: "record-analyst-decision", actorId: "prometeo-lenguaje",
    provenance: { kind: "language-agent", actorId: "prometeo-lenguaje", recordedAt: base.occurredAt },
    payload: { action: "confirm", targetObjectId: "h", resultingObjectId: "m", resultingVersion: "1.0.0" },
  }, { handlers }),
  (error) => error instanceof BridgeCommandError && error.code === "NON_HUMAN_DECISION",
);

await assert.rejects(
  () => dispatchPublicCommand({ ...base, operation: "request-calculation", payload: { modelId: "model-1", result: [] } }, { handlers }),
  (error) => error instanceof BridgeCommandError && error.code === "CALCULATION_OUTPUT_FORBIDDEN",
);

await assert.rejects(
  () => dispatchPublicCommand({ ...base, operation: "request-report", payload: {} }, { handlers }),
  (error) => error instanceof BridgeCommandError && error.code === "MISSING_HANDLER",
);

console.log("PASS: puente valida y despacha comandos públicos sin asumir autoridad");
