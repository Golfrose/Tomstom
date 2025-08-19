import functions from "firebase-functions";
import fetch from "node-fetch";
import corsLib from "cors";

const cors = corsLib({ origin: true });

// ✅ ระบุดอเมน API ที่อนุญาต (แก้ให้เป็นโดเมนจริงของคุณ)
const ALLOWED_HOSTS = new Set([
  "third.api.example"
]);

export const apiProxy = functions
  .runWith({ secrets: ["THIRD_PARTY_API_KEY"] })
  .https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      try {
        if (req.method === "OPTIONS") return res.status(204).end();

        const targetUrl = (req.query.url || "") + "";
        if (!targetUrl) return res.status(400).json({ error: "Missing url" });

        let urlObj;
        try { urlObj = new URL(targetUrl); } catch { return res.status(400).json({ error: "Invalid url" }); }
        if (!ALLOWED_HOSTS.has(urlObj.host)) {
          return res.status(403).json({ error: "Host not allowed" });
        }

        const apiKey = process.env.THIRD_PARTY_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Server not configured" });

        const upstreamOptions = {
          method: req.method,
          headers: { "Authorization": `Bearer ${apiKey}` }
        };

        const ct = req.header("content-type");
        if (ct) upstreamOptions.headers["content-type"] = ct;

        if (!["GET", "HEAD"].includes(req.method) && req.rawBody) {
          upstreamOptions.body = req.rawBody;
        }

        const upstream = await fetch(targetUrl, upstreamOptions);
        const contentType = upstream.headers.get("content-type") || "";
        res.status(upstream.status);
        if (contentType.includes("application/json")) {
          const json = await upstream.json();
          return res.json(json);
        } else {
          const buf = await upstream.arrayBuffer();
          res.set("content-type", contentType || "application/octet-stream");
          return res.send(Buffer.from(buf));
        }
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal error" });
      }
    });
  });
