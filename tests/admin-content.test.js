import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, validateResource } from '../api/admin/content.js';
import { boundedSocialUrl, boundedUrl } from '../lib/server/admin-api.js';

const id='6a7e2db4-3153-4a66-88b0-a03ea5587a12';
function response(){return{headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return body;}};}
function setup(){const calls=[];const sql={query:async(text,params=[])=>{calls.push({text,params});if(text.startsWith('SELECT *'))return [{id,name:'Project'}];if(text.includes('RETURNING *'))return [{id,name:params[0]||'Project'}];if(text.includes('RETURNING id'))return [{id}];return[];}};return{calls,handler:createHandler({getSqlFn:()=>sql,authorizeAdminFn:async()=>({id:'admin'})})};}

test('content validators reject unsafe URLs, invalid slugs, and malformed JSON arrays',()=>{
 assert.equal(validateResource('projects',{name:'Name',slug:'bad slug',description:'',status:'',website_url:'',screenshot_url:'',display_order:0,is_published:false}),null);
 assert.equal(validateResource('partners',{name:'Partner',description:'',logo_url:'javascript:alert(1)',website_url:'',display_order:0,is_published:true}),null);
 assert.equal(validateResource('team_members',{name:'Name',role:'Developer',bio:'',image_url:'',highlights:'not-an-array',social_links:[],display_order:0,is_published:true}),null);
});

test('same-site asset paths and safe profile mail/telephone links are supported',()=>{
 assert.equal(boundedUrl('/images/team.jpg'),'/images/team.jpg');
 assert.equal(boundedUrl('//attacker.example/image.png'),null);
 assert.equal(boundedSocialUrl('mailto:person@example.test'),'mailto:person@example.test');
 assert.equal(boundedSocialUrl('tel:+234123456789'),'tel:+234123456789');
});

test('admin content CRUD uses fixed table allowlist and parameterized values',async()=>{
 const {calls,handler}=setup();
 const list=response();await handler({method:'GET',query:{type:'projects'}},list);assert.equal(list.code,200);assert.equal(list.body.items[0].name,'Project');
 const item={name:'New Project',slug:'new-project',description:'Description',status:'Building',website_url:'https://example.test',screenshot_url:'',display_order:2,is_published:true};
 const create=response();await handler({method:'POST',query:{type:'projects'},body:item},create);assert.equal(create.code,201);assert.match(calls[1].text,/INSERT INTO projects/);assert.ok(calls[1].text.includes('$1'));assert.equal(calls[1].params[0],'New Project');
 const update=response();await handler({method:'PUT',query:{type:'projects',id},body:{...item,name:'Updated'},},update);assert.equal(update.code,200);assert.match(calls[2].text,/UPDATE projects SET/);assert.equal(calls[2].params.at(-1),id);
 const remove=response();await handler({method:'DELETE',query:{type:'projects',id}},remove);assert.equal(remove.code,200);assert.deepEqual(calls[3].params,[id]);
});

test('unknown content types and unauthenticated calls are denied',async()=>{
 const {calls,handler}=setup();const unknown=response();await handler({method:'GET',query:{type:'admin_users'}},unknown);assert.equal(unknown.code,400);assert.equal(calls.length,0);
 let databaseUsed=false;const deniedHandler=createHandler({getSqlFn:()=>{databaseUsed=true;throw Error('unexpected');},authorizeAdminFn:async(_req,res)=>{res.status(401).json({error:'Authentication required'});return null;}});const denied=response();await deniedHandler({method:'GET',query:{type:'projects'}},denied);assert.equal(denied.code,401);assert.equal(databaseUsed,false);
});
