export class BridgeCommandError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BridgeCommandError";
    this.code = code;
  }
}

const OPERATIONS = new Set([
  "create-case",
  "add-source",
  "request-proposals",
  "record-analyst-decision",
  "request-projection",
  "request-calculation",
  "request-report",
]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BridgeCommandError("INVALID_OBJECT", field + " must be an object");
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new BridgeCommandError("MISSING_FIELD", field + " must be a non-empty string");
  }
}

function validateCommand(command) {
  object(command, "command");
  requiredString(command.operation, "command.operation");
  if (!OPERATIONS.has(command.operation)) {
    throw new BridgeCommandError("UNKNOWN_OPERATION", command.operation);
  }
  if (command.operation !== "create-case") requiredString(command.caseId, "command.caseId");
  if (command.operation !== "create-case") requiredString(command.expectedVersion, "command.expectedVersion");
  requiredString(command.actorId, "command.actorId");
  requiredString(command.occurredAt, "command.occurredAt");
  requiredString(command.reason, "command.reason");
  object(command.provenance, "command.provenance");
  requiredString(command.provenance.actorId, "command.provenance.actorId");
  requiredString(command.provenance.recordedAt, "command.provenance.recordedAt");
  if (command.provenance.actorId !== command.actorId) {
    throw new BridgeCommandError("ACTOR_MISMATCH", "provenance.actorId must equal actorId");
  }
  object(command.payload, "command.payload");
  if (command.operation === "record-analyst-decision") {
    if (command.provenance.kind !== "human" || command.actorId === "prometeo-lenguaje") {
      throw new BridgeCommandError("NON_HUMAN_DECISION", "only a human actor may record an analyst decision");
    }
    requiredString(command.payload.action, "command.payload.action");
    requiredString(command.payload.targetObjectId, "command.payload.targetObjectId");
    requiredString(command.payload.resultingObjectId, "command.payload.resultingObjectId");
    requiredString(command.payload.resultingVersion, "command.payload.resultingVersion");
  }
  if (command.operation === "request-calculation") {
    requiredString(command.payload.modelId, "command.payload.modelId");
    if ("result" in command.payload || "trace" in command.payload) {
      throw new BridgeCommandError("CALCULATION_OUTPUT_FORBIDDEN", "public commands cannot provide calculation output");
    }
  }
  return command;
}

export async function dispatchPublicCommand(command, { handlers } = {}) {
  validateCommand(command);
  object(handlers, "handlers");
  const handler = handlers[command.operation];
  if (typeof handler !== "function") {
    throw new BridgeCommandError("MISSING_HANDLER", command.operation);
  }
  return handler({
    operation: command.operation,
    caseId: command.caseId ?? null,
    actorId: command.actorId,
    occurredAt: command.occurredAt,
    reason: command.reason,
    expectedVersion: command.expectedVersion ?? null,
    provenance: command.provenance,
    payload: { ...command.payload },
  });
}

export function createPublicCommandDispatcher(handlers) {
  return (command) => dispatchPublicCommand(command, { handlers });
}
