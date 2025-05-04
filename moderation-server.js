const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/moderate", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "No content provided" });
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/moderations",
      { input: content },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = response.data.results[0];
    res.json({ flagged: result.flagged, categories: result.categories });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Moderation API error", details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT);
