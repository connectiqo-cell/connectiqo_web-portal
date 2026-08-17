import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const PUBLIC = path.join(process.cwd(), 'public');
const OUT = path.join(PUBLIC, 'optimized');

async function ensureOut(){
  try{ await fs.mkdir(OUT, { recursive: true }) }catch(e){}
}

async function optimizeFile(file){
  const input = path.join(PUBLIC, file);
  const base = path.basename(file, path.extname(file));
  const outWebp = path.join(OUT, base + '.webp');
  const outAvif = path.join(OUT, base + '.avif');
  try{
    const img = sharp(input);
    const meta = await img.metadata();
    const width = Math.min(meta.width || 1200, 1200);
    await img.resize({ width }).webp({ quality: 75 }).toFile(outWebp);
    await img.resize({ width }).avif({ quality: 60 }).toFile(outAvif);
    console.log('Optimized', file, '->', path.relative(PUBLIC,outWebp));
  }catch(e){
    console.error('Failed', file, e.message);
  }
}

async function main(){
  await ensureOut();
  const candidates = ['music_mentor.png','stocktrader.png','ai_expert.png','wellness_coach.png'];
  const existing = [];
  for(const c of candidates){
    try{ await fs.access(path.join(PUBLIC,c)); existing.push(c) }catch(e){}
  }
  if(existing.length===0){ console.log('No target images found'); return }
  for(const f of existing) await optimizeFile(f);
  console.log('Done');
}

main().catch(e=>{ console.error(e); process.exit(1) });
