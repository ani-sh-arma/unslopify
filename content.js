function isLowEffort(text) {
  return /10 things you must/i.test(text);
}

function hideLowEffortTweets() {
  const tweets = document.querySelectorAll("article");

  tweets.forEach((tweet) => {
    // Avoid processing tweets we already hid
    if (tweet.classList.contains("thread-filter-hidden")) return;

    const textContent = tweet.innerText;
    if (isLowEffort(textContent)) {
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
  chrome.storage.local.get(["filterEnabled"], (result) => {
    if (result.filterEnabled) {
      hideLowEffortTweets();
    } else {
      showPreviouslyHiddenTweets();
    }
  });
}

// Run the handler every second to catch new tweets
setInterval(handleFiltering, 1000);
