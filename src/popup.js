// Note: Using the CSP compliant build of vue for popup.js
// https://github.com/vuejs/vue/tree/csp/dist
// chrome.storage.local.set({ instanceList: [] })

var instanceData = {
	instances: ['Surf', 'Desktop']
}
var currentInstance = { name: '' }

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
		}
	})

}

// Code to highlight buttons on page
function highlightButtons() {
	var buttons = document.querySelectorAll('button')
	var txtButtons = []
	for (button of buttons) {
		if (button.textContent != '') {
			button.style.border = '10px red solid'
			txtButtons.push(button)
		}
	}
}