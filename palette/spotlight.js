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
// console.log(resultsData);
var tagsData = {
	tags: [
		// {name: 'sc_task', display_name: 'Catalog Task'},
		// {name: 'cost', display_name: 'Cost'},
		// {name: 'equals', display_name: '='}
	]
}
var resultsData = getData(getFilterState(), '')

function toggleSpotlightSearch() {
	var x = document.getElementById("spotlight");
	if (x.style.display == "none" || x.style.display == '') {
		x.style.display = "flex";
	} else {
		x.style.display = "none";
	}
}

function clearSearch() {
	getSpotlightInput().value = ''
	tagsData.tags = []
	resultsData.sections = getData(getFilterState(), '').sections
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
	var searchString = ''
	var tableName = tagsData.tags[0].name
	var tags = tagsData.tags
	for (var i = 1; i < tags.length; i += 3) {
		// If the tag is a choice value, use =. If its a text value, use LIKE*
		var operator = tags[i+1].display_name
		if (tags[i+2].type == 'text' && operator == '=') operator = 'LIKE'
		var param = tags[i+2].name.replaceAll(' ', '%20')
		searchString += tags[i].name + operator + param + '^'
	}
	searchString = searchString.slice(0, -1)
	return `https://${window.location.host}/${tableName}_list.do?sysparm_query=${searchString}`;
	// var table = getTableTag().name
	// var tags = tagsData.tags
	// var filters = []
	// for (var i = 1; i < tags.length; i+= 3) {
	// 	var filter = tags[i].name + tags[i+1].display_name + tags[i+2].display_name
	// 	filters.push(filter)
	// }
	// return getFilterBlockSearch(table, filters)
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
function getActiveSelection(useFirstAsDefault) {
	console.log(selectionIndex);
	if (selectionIndex == -1 && useFirstAsDefault) selectionIndex = 0
	if (selectionIndex == -1 && !useFirstAsDefault) return undefined
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

function getFilterState() {
	const tagCount = tagsData.tags.length
	if (tagCount == 0) {
		return filterState.TABLE
	} else {
		let index = (tagCount - 1) % 3
		return [filterState.FIELD, filterState.OPERATOR, filterState.TEXT][index]
	}
}

// Updates the filter state and gets the appropriate tables
function updateResults() {
	resultsData.sections = getData(getFilterState(), getSearchText(), getTableTag()).sections
}

function addTag() {
	// Only allow tags for filters. TODO: Only add filter tags for DBs with the filter property. They will also contain an array of DBs that will be used, and whether this can be repeated infinitely
	// if (selection && ![DB_TABLES.name, DB_OPERATORS.name, DB_FIELDS.name].includes(selection.section)) {
	// 	return
	// }
	if (getFilterState() == filterState.TEXT) {
		selection = getActiveSelection(false)
		console.log(selection);
	} else {
		selection = getActiveSelection(true)
	}

	// If we're in the text state, just directly add that as a tag
	if (selection == undefined) {
		if (getSearchText() == '' || getFilterState() != filterState.TEXT) { return }
		tagsData.tags.push({name: getSearchText(), display_name: getSearchText(), type: 'text'})
	} else {
		// If we're not in a text state, then we will use the selection
		tagsData.tags.push(selection)
	}

	// Get new results
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
var shortcutsDisabled = false			// used for a short cooldown to prevent multiple events firing
var listenerDivs = []					// Stores listeners for deletion
var activeKeys = new Set()				// Keeps track of actively pressed keys for shortcuts
var searchMapping = null				// https://stackoverflow.com/questions/5203407/how-to-detect-if-multiple-keys-are-pressed-at-once-using-javascript

var keymapList = [
	{ name: '', xpath: '', mapping: ''}
]
chrome.storage.local.get(['keymapList'], (result) => {
	keymapList = result.keymapList
	for (keymap of keymapList) {
		if (!keymap.mapping) { keymap.mapping = [] }
	}
	searchMapping = keymapList.filter(keymap => keymap.name == 'Palette Search')[0].mapping
	searchMapping = new Set(searchMapping)
})

// Checks if 2 sets are equal
const setEquality = (a, b) => a.size === b.size && [...a].every(value => b.has(value))

function windowKeyUp(e) {			// On key up
	activeKeys.delete(e.code)

	// For macOS, the command keyUp event blocks all other keyUp events. Instead, we can manually clear the activeKeys
	if (e.code == 'MetaLeft' || e.code == 'MetaRight') { activeKeys.clear() }
}
function windowKeyDown(e) {			// On key down
	activeKeys.add(e.code)
	if (shortcutsDisabled) { return }

	// Logs
	// console.log(e);
	// console.log(activeKeys)

	// Control I
	if (setEquality(activeKeys, searchMapping)) {
		e.preventDefault()
		toggleSpotlightSearch()
		getSpotlightInput().focus()

		shortcutsDisabled = true
		setTimeout(function(){
			shortcutsDisabled = false
		},5);
	}

	// Custom keymaps
	for (keymap of keymapList) {
		if ( keymap.name != 'Palette Search') {
			mapButton(e, new Set(keymap.mapping), keymap.xpath)
		}
	}
}

// Maps a button to a div selector
function mapButton(e, mapping, selector) {
	if (setEquality(activeKeys, mapping)) {
		e.preventDefault()
		const button = findButtonDeepXpath(selector)
		if (button) { button.click() }
	}
}

// Finds a button nested within iframes (NOT BEING USED, REPLACED WITH XPATH FUNCTION)
function findButtonDeep(selector) {
	var button = document.querySelector(selector)
	if (!button) {
		for (var iframe of document.querySelectorAll('iframe')) {
			button = iframe.contentWindow.document.querySelector(selector)
			if (button) { return button }
		}
	}
	return button
}

function findButtonDeepXpath(xpath) {
	var button = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
	if (!button) {
		for (var iframe of document.querySelectorAll('iframe')) {
			const temp = iframe.contentWindow.document
			button = temp.evaluate(xpath, temp, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
			if (button) { return button }
		}
	}
	return button
}

// Code to highlight buttons on page
function highlightButtons() {

	function foundButton() {
		// button.style.border = '10px red solid'
		button.style.backgroundColor = 'red'
		button.disabled = false

		var new_element = button.cloneNode(true);
		button.parentNode.replaceChild(new_element, button);
		new_element.onclick = function() { return false }

		new_element.addEventListener("click", function (e) {
			e.preventDefault()
			e.stopPropagation();
            e.stopImmediatePropagation()
			// Add new keyboard shortcut
			keymapList.push({ name: this.textContent, xpath: xpath(this), mapping: ''})
			chrome.storage.local.set({ keymapList: keymapList })
			location.reload()
		});
	}

	var buttons = document.querySelectorAll('button')
	for (button of buttons) {
		if (button.textContent != '') {
			foundButton(button)
		}
	}
	for (var iframe of document.querySelectorAll('iframe')) {
		var buttons = iframe.contentWindow.document.querySelectorAll('button')
		for (button of buttons) {
			if (button.textContent != '') {
				foundButton(button)
			}
		}
	}
}

// Finds the xpath of an element
function xpath(el) {
	if (typeof el == "string") return document.evaluate(el, document, null, 0, null)
	if (!el || el.nodeType != 1) return ''
	if (el.id) return "//*[@id='" + el.id + "']"
	var sames = [].filter.call(el.parentNode.children, function (x) { return x.tagName == el.tagName })
	return xpath(el.parentNode) + '/' + el.tagName.toLowerCase() + (sames.length > 1 ? '['+([].indexOf.call(sames, el)+1)+']' : '')
}



// -------------------------------------------------------------------------
// Document Ready
// -------------------------------------------------------------------------
onload2 = function() {

	// Add listeners to document, html, and iframes
	document.addEventListener("keydown", windowKeyDown)
	document.addEventListener("keyup", windowKeyUp)

	var iframes = document.querySelectorAll('iframe')
	for (var iframe of iframes) {
		listenerDivs.push(document)
		iframe.contentWindow.document.addEventListener("keydown", windowKeyDown)
		iframe.contentWindow.document.addEventListener("keyup", windowKeyUp)
	}

	var htmlDivs = document.querySelectorAll('html')
	for (var htmlDiv of htmlDivs) {
		listenerDivs.push(htmlDiv)
		htmlDiv.addEventListener("keydown", windowKeyDown)
		htmlDiv.addEventListener("keyup", windowKeyUp)
	}

	// Reset and re-add listeners when the DOM changes
	var observer = new MutationObserver(function(mutations) {
		for (listenerDiv of listenerDivs) {
			listenerDiv.removeEventListener("keydown", windowKeyDown)
			listenerDiv.removeEventListener("keyup", windowKeyUp)
		}

		var htmlDivs = document.querySelectorAll('html')
		for (var htmlDiv of htmlDivs) {
			listenerDivs.push(htmlDiv)
			htmlDiv.addEventListener("keydown", windowKeyDown)
			htmlDiv.addEventListener("keyup", windowKeyUp)
		}
		var iframes = document.querySelectorAll('iframe')
		for (var iframe of iframes) {
			listenerDivs.push(iframe.contentWindow.document)
			iframe.contentWindow.document.addEventListener("keydown", windowKeyDown)
			iframe.contentWindow.document.addEventListener("keyup", windowKeyUp)
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
			var url;
			var numTags = tagsData.tags.length
			if (numTags > 1) {
				// FILTER SEARCH
				// There is more than one tag, so apply filters. It has to be divisible by 3 so the filters are proper
				if ((numTags-1) % 3 == 0) {
					url = getFilterURL()
				} else if ((numTags-1) % 3 == 2 && (getSearchText() != '' || getActiveSelection() != undefined)){//&& getSearchText() != '') {
					console.log(getActiveSelection());
					addTag()
					url = getFilterURL()
				} else {
					return
				}
			} else if (getSearchText().length > 0 && numTags == 1) {
				// GENERAL TEXT SEARCH
				// Someone has entered in text. Check if there is a tag, and only proceed if there is 1 tag
				var tableName = getTableTag().name
				url = `https://${window.location.host}/${tableName}_list.do?sysparm_query=GOTO123TEXTQUERY321=*${getSearchText()}`;
			} else {
				// LIST TABLE
				// Get whatever is currently selected
				console.log('list table mode');
				var table
				var selection = getActiveSelection(true)
				if (tagsData.tags.length == 0 && selection) {
					table = selection.name
				} else if (getTableTag()) {
					console.log('getting table tag of ' + getTableTag().name);
					table = getTableTag().name
				}

				url = `https://${window.location.host}/nav_to.do?uri=%2F${table}_list.do`

				// Change URL if it's a module TODO: Re Enable when modules are back
				// if (selection.section == DB_MODULES.name) {
				// 	url = selection.name
				// }

			}

			console.log(url);
			window.location.href = url
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
			// Mouse Hover (use mouseover and mouseleave to fix a bug where the selection automatically moves to the mouse position as soon as you open spotlight)
			mouseover: function (event) {
				if (this.hover) return
				this.hover = true
				selectionIndex = indexInClass(document.getElementsByClassName('spotlight--results-item'), event.currentTarget)
				updateSelectedRow()
			},
			// Mouse Leave
			mouseleave: function (event) {
				this.hover = false
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

    return `https://${window.location.host}/${tableName}_list.do?sysparm_query=${searchString}`;
}
