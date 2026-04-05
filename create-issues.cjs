const fs = require('fs');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'ttsn63';
const REPO_NAME = 'lekkr';

function makeRequest(title, week) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      title,
      body: `**Woche:** ${week}\n\n**Aufgabe:** ${title}`,
      labels: [week]
    });
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'lekkr-bot',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parse() {
  const content = fs.readFileSync('TODO.md', 'utf-8');
  const issues = [];
  let week = '';
  for (const line of content.split('\n')) {
    const w = line.match(/^##\s+Woche\s+(\d+)/);
    if (w) { week = `Woche ${w[1]}`; continue; }
    const t = line.match(/^-\s+\[\s*\]\s+(.+)$/);
    if (t && week) issues.push({ title: t[1].trim(), week });
  }
  return issues;
}

(async () => {
  const issues = parse();
  console.log(`${issues.length} Tasks gefunden\n`);
  for (let i = 0; i < issues.length; i++) {
    const r = await makeRequest(issues[i].title, issues[i].week);
    console.log(`✅ [${i+1}/${issues.length}] #${r.number} - ${issues[i].title}`);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n🚀 Fertig!');
})();
