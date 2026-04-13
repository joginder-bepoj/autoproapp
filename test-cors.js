const https = require('https');

const options = {
  hostname: 'api.americankeysupply.com',
  port: 443,
  path: '/V1/vehicle_category_list/categoryList.json',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost',
    'Access-Control-Request-Method': 'GET',
    'User-Agent': 'Mozilla/5.0'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
