import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath,['--test','tests/browser.test.mjs'],{stdio:'inherit',env:{...process.env,R3_BROWSER_TEST:'1'}});
if(r.error)throw r.error;process.exit(r.status??1);
