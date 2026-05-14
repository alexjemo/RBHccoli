const fs = require('fs');
const files = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/admin.js',
  'js/database-api.js',
  'webapp.md',
  'supabase_schema.sql'
];

const payload = files.map(f => {
  return {
    path: f,
    content: fs.readFileSync(f, 'utf8')
  };
});

fs.writeFileSync('payload.json', JSON.stringify(payload, null, 2));
