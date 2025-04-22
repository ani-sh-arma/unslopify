function isLowEffort(text) {
  return /10 things you must/i.test(text);
}

function hideLowEffortTweets() {
  chrome.storage.local.get(["filterEnabled"], (result) => {
    if (!result.filterEnabled) return;

    const tweets = document.querySelectorAll("article");
    tweets.forEach((tweet) => {
      const textContent = tweet.innerText;
      if (isLowEffort(textContent)) {
        tweet.style.display = "none";
      }
    });
  });
}

// Run periodically to catch new tweets
setInterval(hideLowEffortTweets, 1000);
