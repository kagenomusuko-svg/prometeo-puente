import assert from "node:assert/strict";
import {BridgeError,fromLegacyCalculateResponse,toLegacyCalculateRequest} from "../src/motor-adapter.mjs";

const request={
  id:"request-1",modelId:"model-1",modelVersion:"1.0.0",
  formulaId:"delta",formulaVersion:"0.1.0",
  parameters:{r_star:["1","0"],alpha:["0","0"]},
  discipline:"universal",createdBy:"projection-1",
  createdAt:"2026-09-28T15:00:00Z",
  provenance:{kind:"deterministic-system",actorId:"projection-1",
    recordedAt:"2026-09-28T15:00:00Z",sourceObjectId:"model-1",sourceVersion:"1.0.0"}
};

const legacyRequest=toLegacyCalculateRequest(request);
assert.deepEqual(legacyRequest,{
  formula:"delta",
  data:{r_star:["1","0"],alpha:["0","0"]},
  discipline:"universal"
});

const legacyResponse={
  formula:"delta",
  inputs:legacyRequest.data,
  result:[{"numerator":1,"denominator":1},{"numerator":0,"denominator":1}],
  trace:[{step:1,operation:"subtract",inputs:{a:"1",b:"0"},result:{"numerator":1,"denominator":1}}],
  taxonomy_id:"universal",
  taxonomy_name:"Universal"
};

const adapted=fromLegacyCalculateResponse(request,legacyResponse,{
  motorVersion:"motor-0.1.0",
  calculatedAt:"2026-09-28T15:00:01Z"
});
assert.equal(adapted.motorResult.requestId,"request-1");
assert.equal(adapted.motorResult.formulaVersion,"0.1.0");
assert.equal(adapted.motorResult.traceId,adapted.calculationTrace.id);
assert.equal(adapted.calculationTrace.steps.length,1);
assert.equal(adapted.externalMetadata.taxonomy_id,"universal");

assert.throws(
  ()=>toLegacyCalculateRequest({...request,provenance:{...request.provenance,sourceObjectId:"other-model"}}),
  error=>error instanceof BridgeError&&error.code==="INVALID_PROVENANCE"
);
assert.throws(
  ()=>fromLegacyCalculateResponse(request,{...legacyResponse,formula:"rstar"},{motorVersion:"motor-0.1.0",calculatedAt:"2026-09-28T15:00:01Z"}),
  error=>error instanceof BridgeError&&error.code==="FORMULA_MISMATCH"
);
assert.throws(
  ()=>fromLegacyCalculateResponse(request,legacyResponse,{calculatedAt:"2026-09-28T15:00:01Z"}),
  error=>error instanceof BridgeError&&error.code==="MISSING_FIELD"
);

console.log("PASS: puente de contrato, correlación y preservación de traza");
