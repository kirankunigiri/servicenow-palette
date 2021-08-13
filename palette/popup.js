// Note: Using the CSP compliant build of vue for popup.js
// https://github.com/vuejs/vue/tree/csp/dist
// chrome.storage.local.set({ instanceList: [] })

chrome.runtime.connect({ name: "popup" });

var instanceData = {
	instances: [],
	tabs: []
}
var keymapData = {
	keymaps: [
	]
}
var showHints = true
// chrome.storage.local.set({ keymapList: keymapData.keymaps })
var currentInstance = { name: '' }
var activeKeys = new Set()

function reloadTab() {
	chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
		chrome.tabs.reload(tabs[0].id)
		window.close();
	})
}

// To activate an instance, we reload the current tab
function activateInstance() {
	instanceData.instances.push(currentInstance.name)
	chrome.storage.local.set({ instanceList: instanceData.instances })
	reloadTab()
}

// Load keyboard shortcuts
chrome.storage.local.get(['keymapList'], (result) => {
	if (!result.keymapList) {
		// First time default keyboard shortcuts. If using mac, use Command Key instead
		var modifierKey = "ControlLeft"
		if (navigator.platform.toUpperCase().indexOf('MAC')>=0) modifierKey="MetaLeft"
		keymapData.keymaps = [
			{ name: 'Palette Search', xpath: "palette_search", mapping: [modifierKey, "KeyI"]},
			{ name: 'Update', xpath: "//*[@id='sysverb_update']", mapping: [modifierKey, "KeyS"]},
			{ name: 'Delete', xpath: "//*[@id='sysverb_delete']", mapping: [modifierKey, "Backspace"]}
		]
		chrome.storage.local.set({ keymapList: keymapData.keymaps })
	} else {
		keymapData.keymaps = result.keymapList
	}
})

function updateHints(checked) {
	console.log('updating to ' + checked);
	if (checked) {
		[...document.styleSheets[0].cssRules].find(x=> x.selectorText=='.hint').style.display='block'
		chrome.storage.local.set({ showHints: true })
	} else {
		console.log('showhint is now false');
		[...document.styleSheets[0].cssRules].find(x=> x.selectorText=='.hint').style.display='none'
		chrome.storage.local.set({ showHints: false })
	}
}


window.onload = () => {
	console.log('window ready');
	
	// Get the active tab url
	// If it matches the service-now url regex, add it has a host
	chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
		var url = new URL(tabs[0].url)
		currentInstance.name = url.host

		// Get list of instances from local storage
		chrome.storage.local.get(['instanceList'], (result) => {
			if (!result.instanceList) {
				chrome.storage.local.set({ instanceList: [] })
			} else {
				instanceData.instances = result.instanceList
			}
			if (instanceData.instances.includes(currentInstance.name)) {
				document.getElementById('currentInstanceInput').checked = true
			}
		})
	})

	chrome.storage.local.get(['showHints'], (result) => {
		console.log('original:' + result.showHints)
		// First time showHints
		if (typeof result.showHints === 'undefined') {
			chrome.storage.local.set({ showHints: true})
			showHints = true
		} else {
			showHints = result.showHints
		}
		console.log('starting: ' + showHints);
		document.getElementById('showHintsInput').checked = showHints
		updateHints(showHints)
	})

	var curentInstanceApp = new Vue({
		el: '#currentInstance',
		data: currentInstance,
		methods: {
			// Activation checkbox changed
			check(e) {
				if (e.target.checked) {
					// Add instance to list
					activateInstance()
				} else {
					// Remove instance from list
					const list = instanceData.instances
					list.splice(list.indexOf(currentInstance.name), 1)
					chrome.storage.local.set({ instanceList: list })
					reloadTab()
				}
			},
			hintChanged(e) {
				console.log('vue says changed')
				updateHints(e.target.checked)
			}
		}
	})

	// Vue - list of instances
	var instancesApp = new Vue({
		el: '#now-instances',
		data: instanceData,
		methods: {
			doDelete: function (index) {
				const deleted = instanceData.instances.splice(index, 1)
				chrome.storage.local.set({ instanceList: instanceData.instances })
				if (deleted == currentInstance.name) {
					document.getElementById('currentInstanceInput').checked = false
					reloadTab()
				}
			},
			filterTabsByInstance(instance) {
				// return instanceData.tabs
				return instanceData.tabs.filter(function(tab) {
					var url = new URL(tab.url)
					return url.host === instance
				})
			},
			clickTab(e) {
				var key = parseInt(e.target.getAttribute('key'))
				chrome.tabs.update(key, {selected: true});
			},
			clickInstance(e) {
				if (e.target.className != 'instance-row') {return}
				var key = e.target.getAttribute('key')
				chrome.tabs.create({url: `https://${key}`})
			}
		}
	})

	setTimeout(function(){ 
		// Add deletion for keymaps (broken with vue)
		var elements = document.getElementsByClassName('keymap-delete')
		for (elem of elements) {
			elem.addEventListener('click', function(e) {
				var key = e.target.parentElement.getAttribute('key')
				var index = keymapData.keymaps.map(item => item.xpath).indexOf(key)
				console.log(index);
				keymapData.keymaps.splice(index, 1)
				keymapData.keymaps = [...keymapData.keymaps]
				chrome.storage.local.set({ keymapList: keymapData.keymaps })
			})
		}
	}
	, 500);

	chrome.tabs.query({currentWindow: true}, function (tabs) {
		instanceData.tabs = tabs
		for (tab of tabs) {
			var url = new URL(tab.url)
		}
	})

}


// Vue - list of instances
var keymapsApp = new Vue({
	el: '#shortcuts',
	data: keymapData,
	methods: {
		keyup: function(e) {
			activeKeys.delete(e.code)
			// For macOS, the command keyUp event blocks all other keyUp events. Instead, we can manually clear the activeKeys
			if (e.code == 'MetaLeft' || e.code == 'MetaRight') { activeKeys.clear() }
		},
		keydown: function(e) {
			e.preventDefault()
			activeKeys.add(e.code)
			console.log(activeKeys);
			var key = e.target.getAttribute('key')
			var index = keymapData.keymaps.map(item => item.xpath).indexOf(key);

			keymapData.keymaps[index].mapping = Array.from(activeKeys)
			keymapData.keymaps = [...keymapData.keymaps]
			chrome.storage.local.set({ keymapList: keymapData.keymaps })
		},
		addShortcut: function() {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {cmd: "addShortcut"});
			});
		}
	}
})
