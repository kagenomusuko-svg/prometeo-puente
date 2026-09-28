import assert from "node:assert/strict";
import {BridgeError,executeMotorRequest,postLegacyCalculate} from "../src/motor-client.mjs";

const request={
  id:"request-http-001",modelId:"model-1",modelVersion:"1.0.0",
  formulaId:"delta",formulaVersion:"0.1.0",
  parameters:{r_star:["1"],alpha:["0"]},discipline:"universal",
  createdBy:"projection-1",createdAt:"2026-09-28T16:00:00Z",
  provenance:{kind:"deterministic-system",actorId:"projection-1",
    recordedAt:"2026-09-28T16:00:00Z",sourceObjectId:"model-1",sourceVersion:"1.0.0"}
};
const responsePayload={
  formula:"delta",inputs:request.parameters,
  result:[{numerator:1,denominator:1}],
  trace:[{step:1,operation:"subtract",inputs:{a:"1",b:"0"},result:{numerator:1,denominator:1}}]
};
let call;
const fetchOk=async(url,options)=>{
  call={url,options};
  return {ok:true,status:200,json:async()=>responsePayload};
};
const legacy=await postLegacyCalculate({baseUrl:"http://motor.test/",motorRequest:request,fetchImpl:fetchOk});
assert.equal(call.url,"http://motor.test/calculate");
assert.equal(call.options.method,"POST");
assert.deepEqual(JSON.parse(call.options.body),{formula:"delta",data:request.parameters,discipline:"universal"});
assert.deepEqual(legacy,responsePayload);

const adapted=await executeMotorRequest({
  baseUrl:"http://motor.test",
  motorRequest:request,
  motorVersion:"motor-0.1.0",
  calculatedAt:"2026-09-28T16:00:01Z",
  fetchImpl:fetchOk
});
assert.equal(adapted.motorResult.requestId,request.id);
assert.equal(adapted.calculationTrace.steps.length,1);

const fetchError=async()=>({ok:false,status:422,text:async()=>"{\"detail\":\"invalid\"}"});
await assert.rejects(
  ()=>postLegacyCalculate({baseUrl:"http://motor.test",motorRequest:request,fetchImpl:fetchError}),
  error=>error instanceof BridgeError&&error.code==="MOTOR_HTTP_ERROR"
);
const unreachable=async()=>{throw new Error("connection refused");};
await assert.rejects(
  ()=>postLegacyCalculate({baseUrl:"http://motor.test",motorRequest:request,fetchImpl:unreachable}),
  error=>error instanceof BridgeError&&error.code==="MOTOR_UNREACHABLE"
);

console.log("PASS: transporte HTTP explícito y errores del motor");
