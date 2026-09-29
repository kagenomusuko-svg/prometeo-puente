import assert from "node:assert/strict";
import { createPublicCommandDispatcher } from "../src/public-command-dispatcher.mjs";

const audit = [];
const state = {};

const base = {
  caseId: "case-composition-001",
  actorId: "analyst-1",
  occurredAt: "2026-09-29T15:00:00Z",
  reason: "Confirmación explícita para prueba de composición",
  provenance: {
    kind: "human",
    actorId: "analyst-1",
    recordedAt: "2026-09-29T15:00:00Z",
  },
};

const handlers = {
  "record-analyst-decision": (command) => {
    assert.equal(command.provenance.kind, "human");
    assert.equal(command.payload.decision.action, "confirm");
    audit.push("prometeo-caso");
    state.confirmedModel = {
      id: command.payload.decision.resultingObjectId,
      version: command.payload.decision.resultingVersion,
      confirmedBy: command.actorId,
      sourceDecisionId: command.payload.decision.targetObjectId,
    };
    return state.confirmedModel;
  },

  "request-projection": (command) => {
    assert.equal(command.payload.modelId, state.confirmedModel.id);
    assert.equal(command.payload.modelVersion, state.confirmedModel.version);
    audit.push("prometeo-proyeccion");
    state.motorRequest = {
      id: "motor-request-composition-001",
      modelId: state.confirmedModel.id,
      formulaId: "universal.convergence",
      parameters: { discipline: "universal" },
    };
    return state.motorRequest;
  },

  "request-calculation": (command) => {
    assert.equal(command.payload.modelId, state.motorRequest.modelId);
    assert.equal("result" in command.payload, false);
    assert.equal("trace" in command.payload, false);
    audit.push("prometeo-motor-calculo");
    state.motorResult = {
      requestId: state.motorRequest.id,
      result: { R: "3/2" },
      motorVersion: "test-motor@composition",
    };
    state.calculationTrace = {
      id: "trace-composition-001",
      requestId: state.motorRequest.id,
      steps: [{ operation: "convergence", value: "3/2" }],
    };
    return {
      motorResult: state.motorResult,
      calculationTrace: state.calculationTrace,
    };
  },

  "request-report": (command) => {
    assert.equal(command.payload.motorResult.requestId, state.motorRequest.id);
    assert.equal(command.payload.calculationTrace.id, state.calculationTrace.id);
    assert.equal(command.payload.confirmedModel.id, state.confirmedModel.id);
    audit.push("prometeo-informe");
    state.report = {
      caseId: command.caseId,
      modelId: command.payload.confirmedModel.id,
      motorResult: command.payload.motorResult,
      calculationTrace: command.payload.calculationTrace,
      provenance: command.provenance,
    };
    return state.report;
  },
};

const dispatch = createPublicCommandDispatcher(handlers);

const confirmedModel = await dispatch({
  ...base,
  expectedVersion: "1.0.0",
  operation: "record-analyst-decision",
  payload: {
    decision: {
      action: "confirm",
      targetObjectId: "hypothesis-1",
      resultingObjectId: "model-composition-001",
      resultingVersion: "1.0.1",
    },
  },
});

const motorRequest = await dispatch({
  ...base,
  expectedVersion: "1.0.1",
  operation: "request-projection",
  payload: {
    modelId: confirmedModel.id,
    modelVersion: confirmedModel.version,
  },
});

const calculation = await dispatch({
  ...base,
  expectedVersion: "1.0.1",
  operation: "request-calculation",
  payload: {
    modelId: motorRequest.modelId,
    discipline: "universal",
  },
});

const report = await dispatch({
  ...base,
  expectedVersion: "1.0.1",
  operation: "request-report",
  payload: {
    confirmedModel,
    motorResult: calculation.motorResult,
    calculationTrace: calculation.calculationTrace,
  },
});

assert.deepEqual(audit, [
  "prometeo-caso",
  "prometeo-proyeccion",
  "prometeo-motor-calculo",
  "prometeo-informe",
]);
assert.equal(report.caseId, base.caseId);
assert.equal(report.motorResult.result.R, "3/2");
assert.equal(report.calculationTrace.steps.length, 1);
assert.equal(report.provenance.actorId, base.actorId);

console.log("PASS: composición inyectada conserva autoridades y trazabilidad");
