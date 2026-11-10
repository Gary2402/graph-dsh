#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {validatePackage,computePackage,tracePackage,exportPackage} from '../runtime/service.mjs';
const [command,input,...rest]=process.argv.slice(2);
if(!['validate','compute','trace','export'].includes(command)||!input){console.error('Usage: node scripts/cli.mjs validate|compute|trace|export package.json [target|html|json] [new-output-file]');process.exit(2);}
try{
 const data=await readFile(input,'utf8');let result;
 if(command==='validate')result=validatePackage(data);
 if(command==='compute')result=computePackage(data);
 if(command==='trace')result=tracePackage(data,rest[0]);
 if(command==='export'){
  result=await exportPackage(data,rest[0]||'html');
  if(rest[1]){await writeFile(rest[1],result.content,{flag:'wx'});delete result.content;result.savedTo=rest[1];}
 }
 console.log(JSON.stringify(result,null,2));if(result.valid===false)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=1;}
