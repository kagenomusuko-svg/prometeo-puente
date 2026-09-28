import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {fromLegacyCalculateResponse,toLegacyCalculateRequest} from "../src/motor-adapter.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const motorRequest=JSON.parse(fs.readFileSync(path.join(root,"tests/fixtures/projection-output.json"),"utf8"));

const legacyRequest=toLegacyCalculateRequest(motorRequest);
const simulatedMotor=()=>({
  formula:legacyRequest.formula,
  inputs:legacyRequest.data,
  result:[
    {"numerator":1,"denominator":1},
    {"numerator":0,"denominator":1}
  ],
  trace:[
    {
      "step":1,
      "operation":"subtract",
      "formula":"delta",
      "inputs":{"a":"1","b":"0"},
      "result":{"numerator":1,"denominator":1}
    },
    {
      "step":2,
      "operation":"subtract",
      "formula":"delta",
      "inputs":{"a":"0","b":"0"},
      "result":{"numerator":0,"denominator":1}
    }
  ],
  taxonomy_id:"universal",
  taxonomy_name:"Universal"
});

const adapted=fromLegacyCalculateResponse(motorRequest,simulatedMotor(),{
  motorVersion:"motor-0.1.0",
  calculatedAt:"2026-09-28T15:30:01Z"
});

assert.equal(adapted.motorResult.requestId,motorRequest.id);
assert.equal(adapted.motorResult.modelVersion,undefined);
assert.deepEqual(adapted.motorResult.result,[
  {"numerator":1,"denominator":1},
  {"numerator":0,"denominator":1}
]);
assert.equal(adapted.motorResult.traceId,adapted.calculationTrace.id);
assert.equal(adapted.calculationTrace.steps.length,2);
assert.equal(adapted.motorResult.provenance.sourceObjectId,motorRequest.id);
assert.equal(adapted.externalMetadata.taxonomy_name,"Universal");

console.log("PASS: vertical slice ConfirmedModel→MotorRequest→MotorResult");
