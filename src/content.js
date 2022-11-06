const DEBUG = false;

function log(msg) {
  if (DEBUG || window.__hide_blue_checks_debug) {
    console.log(msg);
  }
}

log('💈 Content script loaded for', chrome.runtime.getManifest().name);

function getTimeline() {
  return new Promise((resolve) => {
    const t = setInterval(() => {
      let elt = document.querySelector('[aria-label="Timeline: Your Home Timeline"] div');
      if (!elt) {
        elt = document.querySelector('[aria-label="Timeline: Conversation"] div');
      }

      const stillLoading =
        elt &&
        (elt.children.length === 0 ||
          (elt.children.length === 1 && elt.children[0].getAttribute('role') === 'progressbar'));
      if (stillLoading) {
        // Not actually a timeline
        log('progressbar waiting');
        return;
      }

      if (elt) {
        clearTimeout(t);
        resolve(elt);
      }
    }, 200);
  });
}

let currentObserver;
let initializing = false;
async function init() {
  if (initializing) {
    return;
  }

  initializing = true;
  const timeline = await getTimeline();
  log('got timeline', timeline);

  const hideTweets = () => {
    const affected = [];
    for (const node of Array.from(timeline.children)) {
      if (node.querySelector('[aria-label="Verified account"]')) {
        node.style.display = 'none';
        affected.push(node);
      }
    }

    log('Hid these nodes:', affected);
  };

  if (currentObserver) {
    currentObserver.disconnect();
  }

  currentObserver = new MutationObserver(hideTweets);
  currentObserver.observe(timeline, {
    childList: true,
  });

  hideTweets();
  initializing = false;
}

let previousUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== previousUrl) {
    log(`URL changed to ${location.href}`);
    previousUrl = window.location.href;
    init();
  }
});
urlObserver.observe(document, { subtree: true, childList: true });

init();
