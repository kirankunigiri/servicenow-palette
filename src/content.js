var onload2 = function(){};

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(request);
	  if (request.cmd === "addShortcut") {
		  highlightButtons()
	  }
	}
);

// const MAX_RESULTS_PER_SECTION = 8

window.onload = () => {

	// chrome.runtime.onMessage.addListener(
	// 	function(request, sender, sendResponse) {
	// 	  if (request.cmd === "activateInstance") {
	// 		  console.log('activate instance');
	// 		  sendResponse({farewell: "goodbye"});
	// 	  }
	// 	}
	// )

	// fetch('https://desktop.service-now.com/api/now/table/sc_task')

	// console.log('window ready');
	// const url = location.href
	// const pattern = /.*\.service-now\.com(\/+.*)*$/
	// const matched = url.match(pattern) != null
	
	// if (!matched) {
	// 	return
	// }
	

	// TODO: Add list of urls to UI and localstorage
	

	// API Request
	// const requestSender = new XMLHttpRequest()
	// requestSender.onreadystatechange = function(response) {
	// 	if (requestSender.readyState === 4 && requestSender.status === 200) {
	// 		console.log('SUCCESS!');
	// 		console.log(response.currentTarget.response);
	// 	} else {
	// 		console.log('BIG ERROR' + JSON.stringify(response));
	// 	}
	// }


	// const instanceUrl = 'https://desktop.service-now.com/api/now/table/sc_task'
	// const instanceUrl = 'https://surf.service-now.com/api/now/table/sys_db_object?sysparm_fields=sys_name,super_class&name=sc_task'
	// requestSender.open('GET', instanceUrl, true)


	// requestSender.withCredentials = true
	// requestSender.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
	// requestSender.setRequestHeader("X-Requested-With", "XMLHttpRequest")
	// requestSender.setRequestHeader("Authorization", "Basic " + btoa('kiran.kunigiri' + ":" + 'Strtngp4fn!!1'))

	// requestSender.send()


	var myDiv = document.createElement("div");
	myDiv.className = 'spotlight'
	myDiv.id = 'spotlight';
	myDiv.innerHTML = `<div class="spotlight--background"></div>

	<!-- Input Search Field -->
	<div class="spotlight--search">
		<div id="spotlight--tags">
			<div v-for="tag in tags" :key="tag" class="spotlight--tag">{{tag.display_name}}</div>
		</div>

		<input type="text" autocomplete="off" placeholder="Search" id="spotlight--input" class="spotlight--input">
	</div>

	<div class="spotlight--divider"></div>

	<!-- View Results -->
	<div class="spotlight--results" id="spotlight--results">

		<!-- Vue loop for each section-->
		<div v-for="section in sections" :key="section.name">
			<div class="spotlight--results-title">{{ section.name }}</div>

			<!-- Vue loop for results in each section -->
			<div v-for="result in section.results" :key="result">
				<div class="spotlight--results-item" v-on:click="select($event)" v-on:mousemove="mouseover($event)" v-on:mouseleave="mouseleave($event)">{{ result.item.display_name }} <span class="variable-name">{{result.item.name}}</span> </div>
			</div>

			<div class="spotlight--results-divider"></div>
		</div>
	</div>`
	document.body.appendChild(myDiv);

	console.log('added spotlight search');
	onload2()
}









function storageSettings() {
	chrome.storage.local.get(['darkModeEnabled'], (result) => {

		// First time being run; set dark mode to false
		if (!result.darkModeEnabled) {
			chrome.storage.local.set({ darkModeEnabled: false })
			result.darkModeEnabled = false
		}
	})
}