import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/content.js';

function response(){return{headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return body;}};}

test('public content endpoint rejects private and unknown table names',async()=>{
 const res=response();await handler({method:'GET',query:{type:'admin_users'}},res);assert.equal(res.code,400);
});
