// Vérification automatique de FandoMasters : le jeu doit se charger sans aucune erreur.
// Usage : node verifier.mjs index.html [test/index.html ...]
import fs from 'fs';
import http from 'http';
import path from 'path';
import { chromium } from 'playwright';

const fichiers = process.argv.slice(2);
if (!fichiers.length) { console.error('Indiquez au moins un fichier HTML.'); process.exit(2); }
let echecs = 0;
const dire = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) echecs++; };

// 1. Le code JavaScript se compile (une faute de frappe = site blanc pour tout le monde)
for (const f of fichiers) {
  const html = fs.readFileSync(f, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m => !/type\s*=\s*["'](?!module|text\/javascript)/i.test(m[1]));
  let ok = true;
  for (const [i, m] of scripts.entries()) {
    try { new Function(m[2]); } catch (e) { ok = false; console.log(`   script n°${i + 1} : ${e.message}`); }
  }
  dire(ok, `${f} : ${scripts.length} bloc(s) de code compilent`);
  const build = (html.match(/BUILD\s*=\s*"([^"]+)"/) || [])[1];
  dire(!!build, `${f} : numéro de version présent (${build || 'absent'})`);
  dire(fs.statSync(f).size < 25e6, `${f} : taille raisonnable (${(fs.statSync(f).size / 1e6).toFixed(1)} Mo)`);
}

// 2. Le jeu démarre dans un vrai navigateur, sans erreur, réseau extérieur coupé
const racine = process.cwd();
const serveur = http.createServer((req, res) => {
  const p = path.join(racine, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p.endsWith('/') ? p + 'index.html' : p, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': p.endsWith('.html') || p.endsWith('/') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    res.end(data);
  });
}).listen(0);
const port = serveur.address().port;
const opts = process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {};
const nav = await chromium.launch(opts);
for (const f of fichiers) {
  for (const [w, h, nom] of [[390, 844, 'téléphone'], [1440, 900, 'ordinateur']]) {
    const page = await nav.newPage({ viewport: { width: w, height: h } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(String(e.message || e)));
    await page.route('**/*', r => r.request().url().startsWith(`http://127.0.0.1:${port}/`) ? r.continue() : r.abort());
    await page.goto(`http://127.0.0.1:${port}/${f}`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const visible = await page.evaluate(() => document.body && document.body.innerText.trim().length > 20);
    dire(!erreurs.length, `${f} (${nom}) : aucune erreur JavaScript au démarrage`);
    erreurs.slice(0, 5).forEach(e => console.log('   ' + e.slice(0, 300)));
    dire(visible, `${f} (${nom}) : l'écran n'est pas blanc`);
    await page.close();
  }
}
await nav.close(); serveur.close();
console.log(echecs ? `\n${echecs} problème(s) : NE PAS mettre en ligne.` : '\nTout est bon.');
process.exit(echecs ? 1 : 0);
