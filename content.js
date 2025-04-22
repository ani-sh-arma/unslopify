const SLOP_KEYWORDS = [
  /10 things you must/i,
  /you won't believe/i,
  /this is crazy/i,
  /breaking news/i,
  /top \d+/i,
  /unbelievable/i,
  /shocking/i,
];

function keywordSlopScore(text) {
  let score = 0;
  SLOP_KEYWORDS.forEach((regex) => {
    if (regex.test(text)) score += 0.15;
  });

  const hashtags = (text.match(/#[\w]+/g) || []).length;
  if (hashtags > 5) score += 0.2;

  return score;
}

function spamSlopScore(text) {
  let score = 0;
  if (/(bit\.ly|tinyurl\.com)/i.test(text)) score += 0.2;
  if (/(.)\1{4,}/.test(text)) score += 0.15;
  if ((text.match(/[\p{Emoji}]/gu) || []).length > 5) score += 0.1;
  return score;
}

function getTweetText(tweetNode) {
  // Try to find the main tweet text within the article
  const tweetTextNode = tweetNode.querySelector("div[lang]");
  return tweetTextNode?.innerText || tweetNode.innerText || "";
}

function getSlopScore(text) {
  const keywordScore = keywordSlopScore(text);
  const spamScore = spamSlopScore(text);
  const sentimentScore = window.sentimentSlopScore
    ? window.sentimentSlopScore(text)
    : 0;

  const total = keywordScore + spamScore + sentimentScore;
  return Math.min(total, 1); // clamp
}

function hideSlopTweets() {
  const tweets = document.querySelectorAll("article");

  tweets.forEach((tweet) => {
    if (tweet.classList.contains("thread-filter-hidden")) return;

    const textContent = getTweetText(tweet);
    const score = getSlopScore(textContent);

    if (score >= 0.25) {
      tweet.style.display = "none";
      tweet.classList.add("thread-filter-hidden");
    }
  });
}

function showPreviouslyHiddenTweets() {
  const hiddenTweets = document.querySelectorAll(
    "article.thread-filter-hidden"
  );
  hiddenTweets.forEach((tweet) => {
    tweet.style.display = "";
    tweet.classList.remove("thread-filter-hidden");
  });
}

function handleFiltering() {
  try {
    chrome.storage.local.get(["filterEnabled"], (result) => {
      if (chrome.runtime.lastError) {
        clearInterval(filteringInterval);
        return;
      }

      if (result.filterEnabled) {
        hideSlopTweets();
      } else {
        showPreviouslyHiddenTweets();
      }
    });
  } catch (error) {
    console.error("Error accessing storage:", error);
    clearInterval(filteringInterval);
  }
}

const filteringInterval = setInterval(handleFiltering, 1000);
