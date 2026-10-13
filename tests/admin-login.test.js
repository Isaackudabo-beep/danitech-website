import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, getLoginRateLimitSalt } from '../api/admin/auth.js';
import { hashPassword } from '../lib/server/admin-auth.js';

function response(){return{headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return body;}};}

test('private auth endpoint denies a request without a session before accessing Neon',async()=>{
 let connected=false;const handler=createHandler({getSqlFn:()=>{connected=true;throw Error('unexpected');}});
 const res=response();await handler({method:'GET',headers:{host:'localhost'}},res);assert.equal(res.code,401);assert.equal(res.body.error,'Authentication required.');assert.equal(connected,false);
});

test('valid credentials create a database session and secure HTTP-only cookie',async()=>{
 const password='long-password-only-for-this-unit-test';const hash=await hashPassword(password);const queries=[];
 const sql={query:async(text,params=[])=>{queries.push({text,params});if(text.startsWith('INSERT INTO admin_login_limits'))return[{attempt_count:1}];if(text.startsWith('SELECT id, email'))return[{id:'admin-id',email:'admin@example.test',password_salt:hash.salt,password_hash:hash.hash}];return[];}};
 const handler=createHandler({getSqlFn:()=>sql});const res=response();
 await handler({method:'POST',headers:{host:'danitech.example',origin:'https://danitech.example','x-forwarded-proto':'https'},body:{email:'ADMIN@example.test',password}},res);
 assert.equal(res.code,200);assert.equal(res.body.authenticated,true);assert.match(res.headers['Set-Cookie'],/HttpOnly/);assert.match(res.headers['Set-Cookie'],/SameSite=Strict/);assert.match(res.headers['Set-Cookie'],/Secure/);
 assert.equal(queries.some((query)=>query.text.startsWith('INSERT INTO admin_sessions')),true);
});

test('invalid credentials do not create a session',async()=>{
 const sql={query:async(text)=>text.startsWith('INSERT INTO admin_login_limits')?[{attempt_count:1}]:[]};
 const handler=createHandler({getSqlFn:()=>sql});const res=response();
 await handler({method:'POST',headers:{host:'danitech.example',origin:'https://danitech.example','x-forwarded-proto':'https'},body:{email:'missing@example.test',password:'wrong-password-value'}},res);
 assert.equal(res.code,401);assert.equal(res.headers['Set-Cookie'],undefined);
});

test('login attempts are rate-limited before password verification',async()=>{
 let passwordLookup=false;
 const sql={query:async(text)=>{if(text.startsWith('INSERT INTO admin_login_limits'))return[{attempt_count:9}];if(text.startsWith('SELECT id, email'))passwordLookup=true;return[];}};
 const handler=createHandler({getSqlFn:()=>sql});const res=response();
 await handler({method:'POST',headers:{host:'danitech.example',origin:'https://danitech.example','x-forwarded-proto':'https'},body:{email:'admin@example.test',password:'password-value'}},res);
 assert.equal(res.code,429);assert.equal(passwordLookup,false);
});

test('production requires a 32-byte hexadecimal login-rate-limit salt',()=>{
 assert.equal(getLoginRateLimitSalt({NODE_ENV:'production',ADMIN_LOGIN_SALT:'short'}),null);
 const salt='a1'.repeat(32);
 assert.equal(getLoginRateLimitSalt({NODE_ENV:'production',ADMIN_LOGIN_SALT:salt}),salt);
 assert.equal(getLoginRateLimitSalt({NODE_ENV:'development'}),'danitech-local-login-rate-limit');
});
