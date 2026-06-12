const https = require('https');

// Simular compra na Hotmart
const body = JSON.stringify({
  event: 'PURCHASE_APPROVED',
  data: {
    buyer: { 
      email: 'covalsqui.arrabal@gmail.com', 
      name: 'Covalsqui Arrabal' 
    },
    product: { name: 'BarberOS - Plano Mensal' }
  }
});

const opts = {
  hostname: 'seyadufuohsbpcqaguig.supabase.co',
  path: '/functions/v1/hotmart-webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'hottok': 'wrvhDFedIx1NKWq9VAgqEHY7bpRrGO96d119cd-2281-4911-9275-e98843b69677',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(opts, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.write(body);
req.end();