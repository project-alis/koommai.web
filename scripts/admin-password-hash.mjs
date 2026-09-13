import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import { passwordHash } from '../worker/admin-auth.js';
if(!process.stdin.isTTY)throw new Error('Run this command in an interactive terminal.');
const muted=new Writable({write(_chunk,_encoding,callback){callback();}});
const input=readline.createInterface({input:process.stdin,output:muted,terminal:true});
try{
 process.stdout.write('Admin password (16+ characters, input hidden): ');
 const password=await input.question('');
 process.stdout.write('\nConfirm password (input hidden): ');
 const confirm=await input.question('');
 process.stdout.write('\n');
 if(password!==confirm || password.length<16 || password.length>1024)throw new Error('Passwords must match and contain 16–1024 characters.');
 process.stdout.write(await passwordHash(password)+'\n');
}finally{input.close();}
