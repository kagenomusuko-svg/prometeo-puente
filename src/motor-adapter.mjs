import {createHash} from "node:crypto";

export class BridgeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BridgeError";
    this.code = code;
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new BridgeError("MISSING_FIELD", field + " must be a non-empty string");
  }
}

function stableJson(value) {
  return JSON.stringify(value);
}

function traceIdFor(requestId, formulaId, formulaVersion, inputs, trace) {
  const payload = stableJson({requestId, formulaId, formulaVersion, inputs, trace});
  return "trace:" + createHash("sha256").update(payload).digest("hex");
}

export function toLegacyCalculateRequest(motorRequest) {
  if (!motorRequest || typeof motorRequest !== "object") {
    throw new BridgeError("MISSING_REQUEST", "motorRequest is required");
  }
  for (const field of ["id","modelId","modelVersion","formulaId","formulaVersion","discipline","createdBy","createdAt"]) {
    requiredString(motorRequest[field], "motorRequest." + field);
  }
  if (!motorRequest.provenance || motorRequest.provenance.sourceObjectId !== motorRequest.modelId) {
    throw new BridgeError("INVALID_PROVENANCE", "request provenance must point to modelId");
  }
  if (!motorRequest.parameters || typeof motorRequest.parameters !== "object" || Array.isArray(motorRequest.parameters)) {
    throw new BridgeError("INVALID_PARAMETERS", "motorRequest.parameters must be an object");
  }

  return {
    formula: motorRequest.formulaId,
    data: motorRequest.parameters,
    discipline: motorRequest.discipline
  };
}

export function fromLegacyCalculateResponse(motorRequest, legacyResponse, {motorVersion, calculatedAt}) {
  toLegacyCalculateRequest(motorRequest);
  requiredString(motorVersion, "motorVersion");
  requiredString(calculatedAt, "calculatedAt");

  if (!legacyResponse || typeof legacyResponse !== "object") {
    throw new BridgeError("MISSING_RESPONSE", "legacy response is required");
  }
  for (const field of ["formula","inputs","result","trace"]) {
    if (!(field in legacyResponse)) {
      throw new BridgeError("INCOMPLETE_RESPONSE", "legacy response is missing " + field);
    }
  }
  if (legacyResponse.formula !== motorRequest.formulaId) {
    throw new BridgeError("FORMULA_MISMATCH", "legacy response formula does not match request");
  }
  if (!Array.isArray(legacyResponse.trace)) {
    throw new BridgeError("INVALID_TRACE", "legacy response trace must be an array");
  }

  const traceId = traceIdFor(
    motorRequest.id,
    motorRequest.formulaId,
    motorRequest.formulaVersion,
    legacyResponse.inputs,
    legacyResponse.trace
  );

  const motorResult = {
    id: "result:" + motorRequest.id + ":" + traceId.slice(-16),
    requestId: motorRequest.id,
    formulaId: motorRequest.formulaId,
    formulaVersion: motorRequest.formulaVersion,
    inputs: legacyResponse.inputs,
    result: legacyResponse.result,
    traceId,
    motorVersion,
    calculatedAt,
    provenance: {
      kind: "prometeo-motor-calculo",
      actorId: "prometeo-motor-calculo",
      recordedAt: calculatedAt,
      sourceObjectId: motorRequest.id,
      sourceVersion: motorRequest.modelVersion,
      reason: "Adapted legacy motor response"
    }
  };

  return {
    motorResult,
    calculationTrace: {
      id: traceId,
      requestId: motorRequest.id,
      steps: legacyResponse.trace,
      reproducibilityHash: traceId.slice("trace:".length),
      provenance: motorResult.provenance
    },
    externalMetadata: {
      taxonomy_id: legacyResponse.taxonomy_id,
      taxonomy_name: legacyResponse.taxonomy_name
    }
  };
}
