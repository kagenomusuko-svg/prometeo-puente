import {fromLegacyCalculateResponse,toLegacyCalculateRequest,BridgeError} from "./motor-adapter.mjs";

export {BridgeError};

function baseUrl(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new BridgeError("MISSING_BASE_URL", "baseUrl must be a non-empty string");
  }
  return value.replace(/\/$/, "");
}

export async function postLegacyCalculate({baseUrl:root,motorRequest,fetchImpl=globalThis.fetch}) {
  const url=baseUrl(root)+"/calculate";
  const legacyRequest=toLegacyCalculateRequest(motorRequest);
  if (typeof fetchImpl !== "function") {
    throw new BridgeError("MISSING_FETCH", "fetch implementation is required");
  }

  let response;
  try {
    response=await fetchImpl(url,{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(legacyRequest)
    });
  } catch (error) {
    throw new BridgeError("MOTOR_UNREACHABLE", error instanceof Error ? error.message : String(error));
  }

  if (!response || typeof response.ok !== "boolean") {
    throw new BridgeError("INVALID_TRANSPORT_RESPONSE", "transport did not return a Response-like object");
  }
  if (!response.ok) {
    let detail="";
    try { detail=await response.text(); } catch {}
    throw new BridgeError("MOTOR_HTTP_ERROR", "motor returned HTTP " + response.status + (detail ? ": " + detail : ""));
  }

  try {
    return await response.json();
  } catch (error) {
    throw new BridgeError("MOTOR_INVALID_JSON", error instanceof Error ? error.message : String(error));
  }
}

export async function executeMotorRequest({baseUrl,motorRequest,motorVersion,calculatedAt,fetchImpl=globalThis.fetch}) {
  const legacyResponse=await postLegacyCalculate({baseUrl,motorRequest,fetchImpl});
  return fromLegacyCalculateResponse(motorRequest,legacyResponse,{motorVersion,calculatedAt});
}
