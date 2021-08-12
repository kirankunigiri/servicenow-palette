chrome.runtime.onInstalled.addListener(() => {
	console.log('Installed ServiceNow Palette');
})
var instanceList = null


// Whenever the tab changes/reloads/redirects, check if its an instance before injecting
chrome.webNavigation.onCommitted.addListener((details) => {
    if (["reload", "link", "typed", "generated"].includes(details.transitionType)) {
		chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
			if (details.url && details.url == tabs[0].url) {
				checkInstance(tabs[0])
			}
		})

        // If you want to run only when the reload finished (at least the DOM was loaded)
        // chrome.webNavigation.onCompleted.addListener(function onComplete() {
        //     console.log('doc load');
        //     chrome.webNavigation.onCompleted.removeListener(onComplete);
        // });
    }
});

// Track updates to instance list (from popup.js)
chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
		if (key == 'instanceList') {
			console.log('updating to new instance list');
			instanceList = newValue
		}
	}
})

// Check if the current tab is part of the instance list
function checkInstance(tab) {
	// Get list of instances from local storage
	if (instanceList == null) {
		// This is the first time; lets get instance list from storage
		chrome.storage.local.get(['instanceList'], (result) => {
			if (result.instanceList) {
				console.log('first time getting instance list');
				instanceList = result.instanceList
				injectApp(tab)
			}
		})
	} else {
		// Use existing list
		console.log(instanceList);
		injectApp(tab)
	}
}

// Inject css + js files to the tab
function injectApp(tab) {
	var tabId = tab.id
	var url = new URL(tab.url)
	if (instanceList.includes(url.host)) {
		console.log('planning to inject');
		chrome.tabs.insertCSS(tabId, {file: "spotlight.css" });
		chrome.tabs.executeScript(tabId, {file: "lib.min.js"})
		chrome.tabs.executeScript(tabId, {file: "content.js"})
		chrome.tabs.executeScript(tabId, {file: "datamanager.js"})
		chrome.tabs.executeScript(tabId, {file: "spotlight.js"})
	}
}