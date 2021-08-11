window.onload = () => {
	console.log('window ready');
	const url = location.href
	const pattern = /.*\.service-now\.com(\/+.*)*$/
	const matched = url.match(pattern) != null
	console.log('matched servicenow' + matched)

	if (!matched) {
		return
	}

	// TODO: Add list of urls to UI and localstorage

	// document.querySelector('#end').prepend(button)

	// API Request
	const requestSender = new XMLHttpRequest()
	requestSender.onreadystatechange = function(response) {
		// console.log(requestSender);
		// console.log(response.currentTarget);
		// return
		if (requestSender.readyState === 4 && requestSender.status === 200) {
			console.log('SUCCESS!');
			console.log(response.currentTarget.response);
		} else {
			console.log('BIG ERROR' + JSON.stringify(response));
		}
	}
	// const instanceUrl = 'https://desktop.service-now.com/api/now/table/sc_task'
	const instanceUrl = 'https://surf.service-now.com/api/now/table/sys_db_object?sysparm_fields=sys_name,super_class&name=sc_task'
	requestSender.open('GET', instanceUrl, true)
	// requestSender.withCredentials = true
	// requestSender.setRequestHeader('Access-Control-Allow-Origin', '*')
	// requestSender.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
	// requestSender.setRequestHeader("X-Requested-With", "XMLHttpRequest")
	// requestSender.setRequestHeader("Authorization", "Basic " + btoa('kiran.kunigiri' + ":" + 'Strtngp4fn!!1'))
	// requestSender.send()

	var myDiv = document.createElement("div");
	myDiv.className = 'spotlight'
	myDiv.id = 'spotlight';
	myDiv.innerHTML = `<div class="spotlight--background"></div>

	<!-- Input Search Field -->
	<input type="text" data-role="taginput" data-tag-trigger="Comma" placeholder="Search" id="spotlight--search" class="spotlight--search" />
	<div class="spotlight--divider"></div>

	<!-- View Results -->
	<div class="spotlight--results" id="spotlight--results">

		<!-- Vue loop for each section-->
		<div v-for="section in sections" :key="section.name">
			<div class="spotlight--results-title">{{ section.name }}</div>

			<!-- Vue loop for results in each section -->
			<div v-for="result in section.results" :key="result">
				<div class="spotlight--results-item" v-on:click="select($event)">{{ result.display_name }} <span
						class="variable-name">{{result.name}}</span> </div>
			</div>

			<div class="spotlight--results-divider"></div>
		</div>
	</div>`
	document.body.appendChild(myDiv);
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