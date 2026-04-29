const http = require('http');

const data = JSON.stringify({
    DisplayName: 'FightersEdgeAdmin',
    Email: 'admin@fighters-edge.com',
    Uid: 'mock-uid-123',
    IsEmailVerified: true,
    AccountType: 'admin'
});

const options = {
    hostname: 'localhost',
    port: 80,
    path: '/accounts',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
