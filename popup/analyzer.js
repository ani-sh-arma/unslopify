import Sentiment from "sentiment";

const sentiment = new Sentiment();

function sentimentSlopScore(text) {
  const result = sentiment.analyze(text);
  const absScore = Math.abs(result.comparative);
  return absScore > 0.7 ? 0.2 : 0;
}

window.sentimentSlopScore = sentimentSlopScore;
