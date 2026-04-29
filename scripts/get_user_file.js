const http = require('http');
const fs = require('fs');

const options = {
    hostname: 'localhost',
    port: 80,
    path: '/accounts/mock-uid-123',
    method: 'GET'
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        fs.writeFileSync('user_details.json', data);
        console.log('Data written to user_details.json');
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
