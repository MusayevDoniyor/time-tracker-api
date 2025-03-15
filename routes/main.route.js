const router = require("express").Router();

router.get("/", (req, res) => {
  const baseURL = req.protocol + "://" + req.get("host");

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time-Tracker API</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; }
            h1 { color: #333; }
            h2 { color: #666; }
            .routes { margin-top: 20px; text-align: left; display: inline-block; }
            .route-box { padding: 10px; margin: 10px 0; background: white; border-left: 5px solid #007BFF; box-shadow: 2px 2px 10px rgba(0,0,0,0.1); }
            code { background: #eee; padding: 2px 5px; border-radius: 5px; font-family: monospace; }
            a { text-decoration: none; color: #007BFF; font-weight: bold; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <h1>🚀 Welcome to Time-Tracker API</h1>
        <h2>API Endpoints</h2>
        <p>Base URL: <strong><code>${baseURL}</code></strong></p>
        
        <div class="routes">
            <div class="route-box">
                <strong>📌 Workers API</strong>
                <ul>
                    <li>🔹 <code>GET ${baseURL}/api/workers</code> - Get all workers</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers</code> - Create a new worker</li>
                    <li>🔹 <code>GET ${baseURL}/api/workers/:id</code> - Get worker by ID</li>
                    <li>🔹 <code>PUT ${baseURL}/api/workers/:id</code> - Update worker</li>
                    <li>🔹 <code>DELETE ${baseURL}/api/workers/:id</code> - Delete worker</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers/:id/workday</code> - Add work day</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers/:id/leave</code> - Add leave</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers/:id/fine</code> - Apply fine</li>
                    <li>🔹 <code>GET ${baseURL}/api/workers/:id/salary</code> - Get salary details</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers/:id/check-in</code> - Worker check-in</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers/:id/check-out</code> - Worker check-out</li>
                    <li>🔹 <code>POST ${baseURL}/api/workers/:id/outside</code> - Worker outside</li>
                </ul>
            </div>

            <div class="route-box">
                <strong>📌 Holidays API</strong>
                <ul>
                    <li>🔹 <code>GET ${baseURL}/api/holidays</code> - Get all holidays</li>
                    <li>🔹 <code>POST ${baseURL}/api/holidays</code> - Add a new holiday</li>
                </ul>
            </div>

            <div class="route-box">
                <strong>📌 Branches API</strong>
                <ul>
                    <li>🔹 <code>GET ${baseURL}/api/branches</code> - Get all branches</li>
                    <li>🔹 <code>POST ${baseURL}/api/branches</code> - Create a new branch</li>
                    <li>🔹 <code>GET ${baseURL}/api/branches/:id</code> - Get branch by ID</li>
                    <li>🔹 <code>PUT ${baseURL}/api/branches/:id</code> - Update branch</li>
                    <li>🔹 <code>DELETE ${baseURL}/api/branches/:id</code> - Delete branch</li>
                </ul>
            </div>
        </div>
        
        <p><strong>📜 Documentation:</strong> <a href=${baseURL} target="_blank">API Docs</a></p>
    </body>
    </html>
  `);
});

module.exports = router;
