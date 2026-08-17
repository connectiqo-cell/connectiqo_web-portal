import fs from 'fs';
import { fileURLToPath } from 'url';

async function main(){
  const res = await fetch('http://localhost:3000/');
  const html = await res.text();
  const re = /<img[^>]+src=['\"]([^'\"]+)['\"]/g;
  const set = new Set();
  let m;
  while((m = re.exec(html)) !== null){
    set.add(m[1]);
  }
  fs.writeFileSync('img-srcs.txt', [...set].join('\n'));
  console.log('WROTE', [...set].length, 'image srcs to img-srcs.txt');
}

main().catch(e=>{console.error(e); process.exit(1)});
