const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;

app.post("/moderate", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "No content provided" });
  try {
    const perspectiveRes = await axios.post(
      "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" +
        PERSPECTIVE_API_KEY,
      {
        comment: { text: content },
        languages: ["en"],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {},
          IDENTITY_ATTACK: {},
          SEXUALLY_EXPLICIT: {},
          FLIRTATION: {},
        },
      }
    );
    const attr = perspectiveRes.data.attributeScores;
    // Lowered thresholds for more sensitivity
    const flagged =
      (attr.TOXICITY && attr.TOXICITY.summaryScore.value > 0.5) ||
      (attr.SEVERE_TOXICITY && attr.SEVERE_TOXICITY.summaryScore.value > 0.4) ||
      (attr.INSULT && attr.INSULT.summaryScore.value > 0.5) ||
      (attr.PROFANITY && attr.PROFANITY.summaryScore.value > 0.5) ||
      (attr.THREAT && attr.THREAT.summaryScore.value > 0.4) ||
      (attr.IDENTITY_ATTACK && attr.IDENTITY_ATTACK.summaryScore.value > 0.4) ||
      (attr.SEXUALLY_EXPLICIT &&
        attr.SEXUALLY_EXPLICIT.summaryScore.value > 0.5);
    // Log scores for debugging
    console.log("Perspective scores:", JSON.stringify(attr, null, 2));
    res.json({
      flagged,
      scores: attr,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Perspective API error", details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Moderation server running on port ${PORT}`);
});
