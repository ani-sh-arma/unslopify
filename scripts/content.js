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
  if (text.includes("#connect")) return 0.25;
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

// Local flag for filter state
window.isFilterEnabled = true; // default to enabled

// Initialize by getting the current state from storage
try {
  chrome.storage.local.get(["filterEnabled"], (result) => {
    if (chrome.runtime.lastError) {
      console.warn(
        "Using default settings due to:",
        chrome.runtime.lastError.message
      );
      return; // Keep default value
    }
    // Update local flag with stored value (default to true if not set)
    window.isFilterEnabled = result.filterEnabled !== false;
  });
} catch (e) {
  console.warn("Could not access storage, using default settings");
  // Keep default value (true)
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "toggleFiltering") {
    window.isFilterEnabled = message.enabled;
    // Apply changes immediately
    if (window.isFilterEnabled) {
      hideSlopTweets();
      hideAds();
    } else {
      showPreviouslyHiddenTweets();
    }
  }
  return true; // Keep message channel open for async responses
});

function handleFiltering() {
  // Use the local flag instead of checking storage every time
  if (window.isFilterEnabled) {
    hideSlopTweets();
    hideAds();
  }
  // We don't need an else case here since we only want to hide new content
  // Showing previously hidden content happens when the toggle changes
}

// Set up the filtering interval with a more reasonable refresh rate
const filteringInterval = setInterval(handleFiltering, 2000);

// Add message listener to respond with hidden count
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getHiddenCount") {
    const hiddenTweets = document.querySelectorAll(
      "article.thread-filter-hidden"
    );
    const adTweets = document.querySelectorAll("article.ad-hidden");
    const slopTweets = document.querySelectorAll(
      "article.thread-filter-hidden:not(.ad-hidden)"
    );

    sendResponse({
      total: hiddenTweets.length,
      slop: slopTweets.length,
      ads: adTweets.length,
    });
  }
  return true; // Keep the message channel open for async response
});

function hideAds() {
  // Find promoted tweets (ads) - they usually have a "promoted" label
  const promotedLabels = document.querySelectorAll(
    '[data-testid="promotedIndicator"]'
  );

  promotedLabels.forEach((label) => {
    // Find the parent article element
    const adTweet = label.closest("article");
    if (adTweet && !adTweet.classList.contains("thread-filter-hidden")) {
      adTweet.style.display = "none";
      adTweet.classList.add("thread-filter-hidden");
      adTweet.classList.add("ad-hidden");
    }
  });

  // Find official ads marked with "Ad" label in span tags
  const spans = document.querySelectorAll("span");
  spans.forEach((span) => {
    if (span.textContent === "Ad") {
      const adTweet = span.closest("article");
      if (adTweet && !adTweet.classList.contains("thread-filter-hidden")) {
        adTweet.style.display = "none";
        adTweet.classList.add("thread-filter-hidden");
        adTweet.classList.add("ad-hidden");
      }
    }
  });

  // Alternative method: look for "Promoted" or "Sponsored" text in tweets
  const tweets = document.querySelectorAll(
    "article:not(.thread-filter-hidden)"
  );
  tweets.forEach((tweet) => {
    if (
      tweet.innerText.includes("Promoted") ||
      tweet.innerText.includes("Sponsored")
    ) {
      tweet.style.display = "none";
      tweet.classList.add("thread-filter-hidden");
      tweet.classList.add("ad-hidden");
    }
  });
}
