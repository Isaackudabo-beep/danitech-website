import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/admin/submissions.js';

const id = '6a7e2db4-3153-4a66-88b0-a03ea5587a12';
const sample = { id, name: 'Test Sender', email: 'sender@example.test', service: 'Web Development', message: 'A private test inquiry', status: 'new', created_at: '2026-01-01T00:00:00Z' };
function response() { return { headers: {}, setHeader(k,v){this.headers[k]=v;}, status(n){this.code=n;return this;}, json(body){this.body=body;return body;} }; }
function setup(rows = []) { const calls=[]; const sql={query:async(text,params=[])=>{calls.push({text,params}); if(text.includes('count(*)'))return [{total:rows.length}]; if(text.startsWith('SELECT id, name'))return rows; if(text.includes('UPDATE contact_submissions'))return [{...sample,status:params[0]}]; if(text.includes('DELETE FROM contact_submissions'))return [{id}]; return [];}}; return {calls,handler:createHandler({getSqlFn:()=>sql,authorizeAdminFn:async()=>({id:'admin',email:'admin@example.test'})})}; }

test('authenticated inbox retrieves private contact submissions and total count', async () => {
  const {calls,handler}=setup([sample]); const res=response();
  await handler({method:'GET',query:{limit:'50',offset:'0'}},res);
  assert.equal(res.code,200); assert.deepEqual(res.body.items,[sample]); assert.equal(res.body.total,1);
  assert.match(calls[0].text,/FROM contact_submissions ORDER BY created_at DESC/);
});

test('inbox status updates and delete use parameterized ids', async () => {
  const {calls,handler}=setup(); const patchRes=response();
  await handler({method:'PATCH',query:{id},body:{status:'read'}},patchRes);
  assert.equal(patchRes.code,200); assert.equal(calls[0].params[0],'read'); assert.equal(calls[0].params[1],id);
  const deleteRes=response(); await handler({method:'DELETE',query:{id}},deleteRes);
  assert.equal(deleteRes.code,200); assert.deepEqual(calls[1].params,[id]);
});

test('invalid status is rejected and unauthorized access never reaches database', async () => {
  const {calls,handler}=setup(); const bad=response();
  await handler({method:'PATCH',query:{id},body:{status:'secret'}},bad);
  assert.equal(bad.code,400);
  let dbCalled=false; const unauthorized=createHandler({getSqlFn:()=>{dbCalled=true;throw Error('should not connect');},authorizeAdminFn:async(_req,res)=>{res.status(401).json({error:'no auth'});return null;}});
  const denied=response(); await unauthorized({method:'GET',query:{}},denied);
  assert.equal(denied.code,401); assert.equal(dbCalled,false); assert.equal(calls.length,0);
});
