const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SECOP_API = "https://www.datos.gov.co/api/views/p6dx-8zbt/rows.json";
const APP_TOKEN = "1GAPftJcOl9QDpfcWlwFeEqxC";

app.get("/api/recent", async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const url = `${SECOP_API}?$limit=${limit}&$order=fecha_de_publicacion_del DESC`;

    console.log("📅 Procesos recientes");
    console.log("⏳ Conectando...");

    const response = await axios.get(url, {
      headers: {
        "X-App-Token": APP_TOKEN,
      },
      timeout: 10000, // 10 segundos
    });

    const data = response.data;
    console.log("✅ Respondió:", data.length, "procesos");

    res.json({
      success: true,
      count: Array.isArray(data) ? data.length : 0,
      data: Array.isArray(data) ? data.slice(0, limit) : [],
    });
  } catch (error) {
    console.error("❌ Error:", error.code || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("✅ Proxy API running on http://0.0.0.0:3000");
});
