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

  return Math.min(score, 1);
}

function spamSlopScore(text) {
  let score = 0;
  if (/(bit\.ly|tinyurl\.com)/i.test(text)) score += 0.2;
  if (/(.)\1{4,}/.test(text)) score += 0.15; // character repetition
  if ((text.match(/[\p{Emoji}]/gu) || []).length > 5) score += 0.1;
  return Math.min(score, 1);
}

function getSlopScore(text) {
  const sentimentScore = window.sentimentSlopScore
    ? window.sentimentSlopScore(text)
    : 0;

  return keywordSlopScore(text) + sentimentScore + spamSlopScore(text);
}

function isSlopTweet(text) {
  return getSlopScore(text) >= 0.7;
}

function hideSlopTweets() {
  const tweets = document.querySelectorAll("article");

  tweets.forEach((tweet) => {
    // Avoid processing tweets we already hid
    if (tweet.classList.contains("thread-filter-hidden")) return;

    const textContent = tweet.innerText;
    if (isSlopTweet(textContent)) {
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
    if (chrome.runtime.lastError) {
      console.log("Extension context invalidated, stopping interval");
      clearInterval(filteringInterval);
      return;
    }

    chrome.storage.local.get(["filterEnabled"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("Extension context invalidated, stopping interval");
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

// Store interval ID so we can clear it if needed
const filteringInterval = setInterval(handleFiltering, 1000);
