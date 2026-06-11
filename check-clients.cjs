const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\Casa\\Downloads\\barberos-v2\\index.html', 'utf8');

// Encontrar a função loadClientes
const idx = html.indexOf('function loadClientes');
if (idx > 0) {
  const end = html.indexOf('\n}\n', idx);
  console.log('loadClientes:');
  console.log(html.substring(idx, end + 2));
} else {
  console.log('loadClientes NOT FOUND');
}