const http = require('http');

http.get('http://localhost:3000/api/trees/17184', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
    });
}).on('error', err => console.error(err));
