const fs = require('fs');
const file = 'server/index.js';

try {
    let c = fs.readFileSync(file, 'utf8');
    if (!c.includes("app.use((req, res, next)")) {
        // Find a safe mounting point right beneath app initialization
        const searchStr = 'const app = express();';
        if (c.includes(searchStr)) {
            const corsMiddleware = "\n\n// Enable Universal Inbound CORS Headers (Auto-Injected via Script)\napp.use((req, res, next) => {\n  res.setHeader('Access-Control-Allow-Origin', '*');\n  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');\n  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');\n  if (req.method === 'OPTIONS') return res.status(200).end();\n  next();\n});\n";
            c = c.replace(searchStr, searchStr + corsMiddleware);
            fs.writeFileSync(file, c, 'utf8');
            console.log('Successfully injected global CORS network headers into server/index.js!');
        } else {
            console.log('Error: Could not locate app express variable container initialization line.');
        }
    } else {
        console.log('CORS rules already present inside the target configuration.');
    }
} catch (err) {
    console.error('File patch sequence failed:', err.message);
}
