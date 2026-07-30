const https = require('https');
const fs = require('fs');

const TOKEN = 'ghp_REDACTED_TOKEN_PLACEHOLDER';
const REPO = 'Jirnyak/mamabroker';
const PATH = 'index.html';
const FILE_PATH = './index.html';

const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
const base64Content = Buffer.from(fileContent).toString('base64');

// First check if the file exists to get its SHA
const getOptions = {
    hostname: 'api.github.com',
    path: `/repos/${REPO}/contents/${PATH}`,
    method: 'GET',
    headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    }
};

const req = https.request(getOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        let sha = null;
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                sha = json.sha;
            } catch (e) {}
        }

        // Now update or create the file
        const putData = JSON.stringify({
            message: 'Add premium fintech index.html',
            content: base64Content,
            ...(sha && { sha })
        });

        const putOptions = {
            hostname: 'api.github.com',
            path: `/repos/${REPO}/contents/${PATH}`,
            method: 'PUT',
            headers: {
                'User-Agent': 'Node.js',
                'Authorization': `Bearer ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(putData)
            }
        };

        const putReq = https.request(putOptions, (putRes) => {
            let putResponseData = '';
            putRes.on('data', (chunk) => putResponseData += chunk);
            putRes.on('end', () => {
                if (putRes.statusCode === 200 || putRes.statusCode === 201) {
                    console.log('Successfully pushed index.html to GitHub API');
                } else {
                    console.error('Error pushing to GitHub:', putRes.statusCode, putResponseData);
                }
            });
        });

        putReq.on('error', (e) => {
            console.error('Error with PUT request:', e);
        });

        putReq.write(putData);
        putReq.end();
    });
});

req.on('error', (e) => {
    console.error('Error with GET request:', e);
});

req.end();
