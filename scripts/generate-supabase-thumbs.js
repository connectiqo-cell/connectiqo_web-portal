import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const OUT_DIR = path.join(process.cwd(), 'public', 'avatars', 'thumbs');

async function ensureOut(){
  await fs.mkdir(OUT_DIR, { recursive: true });
}

function filenameFromUrl(url){
  try{
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop() || 'img';
    const base = seg.replace(/[^a-z0-9.-]/gi,'');
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0,8);
    return `${base.replace(/\.[^.]+$/,'')}-${hash}`;
  }catch(e){
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0,8);
    return `img-${hash}`;
  }
}

async function fetchBuffer(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Failed ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processUrl(url){
  try{
    const buf = await fetchBuffer(url);
    const name = filenameFromUrl(url);
    const outWebp = path.join(OUT_DIR, name + '.webp');
    const outJpg = path.join(OUT_DIR, name + '.jpg');
    await sharp(buf).resize(128,128,{fit:'cover'}).webp({quality:75}).toFile(outWebp);
    await sharp(buf).resize(128,128,{fit:'cover'}).jpeg({quality:80}).toFile(outJpg);
    console.log('Saved', outWebp, outJpg);
  }catch(e){
    console.error('Error processing', url, e.message);
  }
}

async function main(){
  await ensureOut();
  const txt = await fs.readFile('img-srcs.txt','utf8');
  const urls = txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(s=>s.includes('supabase.co'));
  if(urls.length===0){ console.log('No supabase urls found in img-srcs.txt'); return }
  for(const u of urls){
    console.log('Processing', u);
    await processUrl(u);
  }
  console.log('Done');
}

main().catch(e=>{ console.error(e); process.exit(1) });
