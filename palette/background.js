chrome.runtime.onInstalled.addListener(() => {
	console.log('Installed ServiceNow Palette');
})
var instanceList = null
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "popup") {
        port.onDisconnect.addListener(function() {
			chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

				chrome.storage.local.get(['instanceList'], (result) => {
					var url = new URL(tabs[0].url)
					if (result.instanceList && result.instanceList.includes(url.host)) {
						// Code to reload tab every time window closes
						// Deemed too annoying to use
						// chrome.tabs.reload(tabs[0].id)
					}
				})
			})
        });
    }
});


// Whenever the tab changes/reloads/redirects, check if its an instance before injecting
// Only don't inject if an iframe is being loaded
chrome.webNavigation.onCommitted.addListener((details) => {
    if (!["auto_subframe", "manual_subframe"].includes(details.transitionType)) {
		console.log('looking for tabs');
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
		chrome.tabs.insertCSS(tabId, {file: "css/opensans.css" });
		chrome.tabs.insertCSS(tabId, {file: "css/spotlight.css" });
		chrome.tabs.executeScript(tabId, {file: "lib.min.js"})
		chrome.tabs.executeScript(tabId, {file: "content.js"})
		chrome.tabs.executeScript(tabId, {file: "datamanager.js"})
		chrome.tabs.executeScript(tabId, {file: "spotlight.js"})
	}
}