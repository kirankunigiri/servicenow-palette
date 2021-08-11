// -------------------------------------------------------------------------
// Global Variables
// -------------------------------------------------------------------------
var selection
var selectionIndex = -1
var filterState = {
	current: "Tables",
	TABLE: "Tables",
	FIELD: "Fields",
	OPERATOR: "Operators",
	TEXT: "Enter your search query",
}
var resultsData = getData(filterState.current, '')
// console.log(resultsData);
var tagsData = {
	tags: [
		// {name: 'sc_task', display_name: 'Catalog Task'},
		// {name: 'cost', display_name: 'Cost'},
		// {name: 'equals', display_name: '='}
	]
}

function toggleSpotlightSearch() {
	var x = document.getElementById("spotlight");
	if (x.style.display === "none") {
		x.style.display = "flex";
	} else {
		x.style.display = "none";
	}
}

function clearSearch() {
	getSpotlightInput().value = ''
	tagsData.tags = []
	resultsData.sections = getData(filterState.current, '').sections
}

function getSpotlightInput() {
	return document.getElementById('spotlight--input')
}
function getSearchText() {
	return getSpotlightInput().value
}
function getTableTag() {
	if (tagsData.tags.length > 0) {
		return tagsData.tags[0]
	}
}
function getFilterURL() {
	var table = getTableTag()
	var tags = tagsData.tags
	var filters = []
	for (var i = 1; i < tags.length; i+= 3) {
		var filter = tags[i].name + tags[i+1].display_name + tags[i+2].display_name
		filters.push(filter)
	}
	return getFilterBlockSearch(table, filters)
}



// -------------------------------------------------------------------------
// General Functions
// -------------------------------------------------------------------------
console.log('started');

// Resets arrow selection when new input is typed
function resetArrowSelection() {
	selectionIndex = -1
	for (elem of document.getElementsByClassName('spotlight--results-item')) {
		elem.classList.remove('spotlight--results-item_selected');
	}
}

// Used to get the active row selection data item, and section name, on click/tab/enter
function getActiveSelection() {
	if (selectionIndex == -1) {
		selectionIndex = 0
	}
	var total = 0
	for (i in resultsData.sections) {
		total += resultsData.sections[i].results.length
		if (selectionIndex < total) {
			var rowIndex = selectionIndex - (total - resultsData.sections[i].results.length)
			if (rowIndex < 0) { rowIndex = 0 }
			var item = resultsData.sections[i].results[rowIndex].item
			item.section = resultsData.sections[i].name
			return item
		}
	}
}

function updateFilterState() {
	const tagCount = tagsData.tags.length
	if (tagCount == 0) {
		filterState.current = filterState.TABLE
	} else {
		let index = (tagCount - 1) % 3
		filterState.current = [filterState.FIELD, filterState.OPERATOR, filterState.TEXT][index]
	}
}

// Updates the filter state and gets the appropriate tables
function updateResults() {
	updateFilterState()
	resultsData.sections = getData(filterState.current, getSearchText(), getTableTag()).sections
}

function addTag() {
	selection = getActiveSelection()
	// Only allow tags for filters. TODO: Only add filter tags for DBs with the filter property. They will also contain an array of DBs that will be used, and whether this can be repeated infinitely
	if (selection && ![DB_TABLES.name, DB_OPERATORS.name, DB_FIELDS.name].includes(selection.section)) {
		return
	}
	updateFilterState()

	// Create tag values
	var tagDisplayName
	var tagID

	// If we're in the text state, just directly add that as a tag
	if (filterState.current == filterState.TEXT) {
		if (getSearchText() == '') { return }
		tagDisplayName = getSearchText()
		tagID = 'text'
	} else {
		// If we're not in a text state, then we will use the selection
		tagDisplayName = selection.display_name
		var tagID = selection.name
	}

	// Adding the table tag. We should also load the filters to get ready for filtering mode
	tagsData.tags.push({name: tagID, display_name: tagDisplayName})
	getSpotlightInput().value = ''
	
	updateResults()
	selectionIndex = -1
}

// Updates the UI with the newly selected row (hover or arrow keys)
function updateSelectedRow() {
	for (elem of document.getElementsByClassName('spotlight--results-item')) {
		elem.classList.remove('spotlight--results-item_selected');
	}
	var selectedItem = document.getElementsByClassName('spotlight--results-item').item(selectionIndex)
	if (selectedItem) { selectedItem.classList.add('spotlight--results-item_selected') }
}



// -------------------------------------------------------------------------
// Keyboard Shortcuts
// -------------------------------------------------------------------------
var shortcutsDisabled = false
var listenerDivs = []
function windowKeyDown(e) {
	if (shortcutsDisabled) {
		return
	}
	// console.log(e);
	// e.preventDefault()

	// Modifier
	var modifierActive = e.ctrlKey || e.metaKey

	// Control I
	if (modifierActive && e.key.toLowerCase() == 'i') {
		console.log('SHORTCUT ACTIVATE');
		toggleSpotlightSearch()
		getSpotlightInput().focus()

		shortcutsDisabled = true
		setTimeout(function(){
			shortcutsDisabled = false
		  },5);
	}
}


// -------------------------------------------------------------------------
// Document Ready
// -------------------------------------------------------------------------
onload2 = function() {

	// Add a ton of listeners to document, html, and iframes
	document.addEventListener("keydown", windowKeyDown)

	var iframes = document.querySelectorAll('iframe')
	for (var iframe of iframes) {
		listenerDivs.push(document)
		iframe.contentWindow.document.addEventListener("keydown", windowKeyDown)
	}

	var htmlDivs = document.querySelectorAll('html')
	for (var htmlDiv of htmlDivs) {
		listenerDivs.push(htmlDiv)
		htmlDiv.addEventListener("keydown", windowKeyDown)
	}

	// Reset and re-add listeners when the DOM changes
	var observer = new MutationObserver(function(mutations) {
		for (listenerDiv of listenerDivs) {
			listenerDiv.removeEventListener("keydown", windowKeyDown)
		}

		console.log('CHANGES MADE');
		var htmlDivs = document.querySelectorAll('html')
		for (var htmlDiv of htmlDivs) {
			listenerDivs.push(htmlDiv)
			htmlDiv.addEventListener("keydown", windowKeyDown)
		}
		var iframes = document.querySelectorAll('iframe')
		for (var iframe of iframes) {
			listenerDivs.push(iframe.contentWindow.document)
			iframe.contentWindow.document.addEventListener("keydown", windowKeyDown)
		}
	 });
	 observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});


	 
	// Spotlight input text changed
	document.getElementById('spotlight--input').addEventListener('input', function() {
		resetArrowSelection()
		updateResults()
	})

	// Detect arrow keys to move the focused element
	document.getElementById('spotlight').addEventListener("keydown", e => {

		// Down key
		var resultsElems = document.getElementsByClassName('spotlight--results-item')
		if (e.keyCode == 40 && selectionIndex < resultsElems.length - 1) {
			selectionIndex += 1
			updateSelectedRow()

			// Scroll down
			var newItem = document.getElementsByClassName('spotlight--results-item').item(selectionIndex)
			var parent = document.getElementById('spotlight--results')
			var itemPos = newItem.offsetTop - parent.offsetTop
			var diff = itemPos + newItem.offsetHeight - parent.offsetHeight
			if (diff > 0) {
				parent.scrollTop = diff + 6
			}
		}

		// Up Key
		if (e.keyCode == 38 && selectionIndex > -1) {
			selectionIndex -= 1
			updateSelectedRow()
			var parent = document.getElementById('spotlight--results')
			if (selectionIndex >= 0) {
				// Scroll up
				var newItem = document.getElementsByClassName('spotlight--results-item').item(selectionIndex)
				var itemPos = newItem.offsetTop - parent.offsetTop
				var diff = parent.scrollTop - itemPos
				if (diff > 0) {
					parent.scrollTop = parent.scrollTop - diff - 4
				}
			}
			// If at top, scroll all the way up. (without this, it will not scroll over the section title)
			if (selectionIndex == -1) {
				parent.scrollTop = 0
			}
		}

		// Tab key
		if (e.keyCode == 9) {
			e.preventDefault()
			// Automatically tab into first element if nothing is selected
			// if (selectionIndex == -1) { 
			// 	document.querySelectorAll('.spotlight--results-item')[0].click() 
			// 	return
			// }

			// Updates
			updateSelectedRow()
			addTag()

			// Bring focus back to the search key
			getSpotlightInput().focus()
		}

		// Backspace key - if cursor is at start, delete last tag
		// If the entire text is highlighted (check if cursor at 0 and end at the same time), then don't delete the tag
		if (e.keyCode == 8) {
			var startPos = getSpotlightInput().selectionStart
			var cursorAtEnd = getSpotlightInput().selectionEnd == getSearchText().length && getSearchText().length > 0
			if (startPos == 0 && !cursorAtEnd && tagsData.tags.length > 0) { tagsData.tags.pop() }
			updateResults()
		}

		// Escape key (exit spotlight)
		if (e.keyCode == 27) {
			toggleSpotlightSearch()
		}

		// Enter Key - change page
		if (e.keyCode == 13) {
			var url
			var numTags = tagsData.tags.length
			if (numTags > 1) {
				// FILTER SEARCH
				// There is more than one tag, so apply filters. It has to be divisible by 3 so the filters are proper
				console.log((numTags-1) % 3)
				if ((numTags-1) % 3 == 0) {
					url = getFilterURL()
				} else if ((numTags-1) % 3 == 2) {
					addTag()
					url = getFilterURL()
				} else {
					return
				}
			} else if (getSearchText().length > 0 && numTags == 1) {
				// GENERAL TEXT SEARCH
				// Someone has entered in text. Check if there is a tag, and only proceed if there is 1 tag
				var tableName = getTableTag()
				url = `https://desktop.service-now.com/${tableName}_list.do?sysparm_query=GOTO123TEXTQUERY321=${getSearchText()}`;
			} else {
				// LIST TABLE
				// Get whatever is currently selected
				url = `https://desktop.service-now.com/nav_to.do?uri=%2F${getActiveSelection().name}_list.do`
			}
			// var tab = tabGroup.getActiveTab()
			// tab.webview.loadURL(url)
			toggleSpotlightSearch()
			clearSearch()
		}
	})


	// Vue - table of results and click events
	var resultsApp = new Vue({
		el: '#spotlight--results',
		data: resultsData,
		methods: {
			// Mouse Click
			select: function (event) {
				selectionIndex = indexInClass(document.getElementsByClassName('spotlight--results-item'), event.currentTarget)
				getSpotlightInput().focus()
				addTag()
			},
			// Mouse Hover
			mouseover: function (event) {
				selectionIndex = indexInClass(document.getElementsByClassName('spotlight--results-item'), event.currentTarget)
				updateSelectedRow()
			}
		}
	})

	// Vue - table of results and click events
	var tagsApp = new Vue({
		el: '#spotlight--tags',
		data: tagsData
	})

}


function indexInClass(collection, node) {
	for (var i = 0; i < collection.length; i++) {
	  if (collection[i] === node)
		return i;
	}
	return -1;
}



// -------------------------------------------------------------------------
// URL Helper
// -------------------------------------------------------------------------
function getFilterBlockSearch(tableName, filters) {
	var searchString = ""
	filters.forEach(function(filter) {
		var operator = "";
		var param0 = "";
		var param1 = "";

		if (filter.includes(">=")) {
			operator = ">=";
			filter = filter.split(">=");
			param0 = filter[0];
			param1 = filter[1];

			searchString = searchString + "^";
			searchString = searchString + param0 + operator + param1 + "^OR";
			searchString = searchString + param0 + "LIKE" + param1;
		} else if (filter.includes("<=")) {
			operator = "<=";
			filter = filter.split("<=");
			param0 = filter[0];
			param1 = filter[1];

			searchString = searchString + "^";
			searchString = searchString + param0 + operator + param1 + "^OR";
			searchString = searchString + param0 + "LIKE" + param1;
		} else if (filter.includes("!=")) {
			operator = "!=";
			filter = filter.split("!=");
			param0 = filter[0];
			param1 = filter[1];

			searchString = searchString + "^";
			searchString = searchString + param0 + operator + param1;
		} else if (filter.includes("<")) {
			operator = "<";
			filter = filter.split("<");
			param0 = filter[0];
			param1 = filter[1];

			searchString = searchString + "^";
			searchString = searchString + param0 + operator + param1;
		} else if (filter.includes(">")) {
			operator = ">";
			filter = filter.split(">");
			param0 = filter[0];
			param1 = filter[1];

			searchString = searchString + "^";
			searchString = searchString + param0 + operator + param1;
		} else if (filter.includes("=")) {
			operator = "=";
			filter = filter.split("=");
			param0 = filter[0];
			param1 = filter[1];

			searchString = searchString + "^";
			searchString = searchString + param0 + operator + param1 + "^OR";
			searchString = searchString + param0 + "LIKE" + param1;
		}
	});

	searchString = searchString.slice(1, searchString.length)

    return `https://desktop.service-now.com/${tableName}_list.do?sysparm_query=${searchString}`;
}