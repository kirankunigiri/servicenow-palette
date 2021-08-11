// -------------------------------------------------------------------------
// Global Variables
// -------------------------------------------------------------------------
var selection
var selectionIndex = -1
// var resultsData = {
// 	sections: [{name: 'Tables', results: []}]
// }
var filterState = {
	current: "Tables",
	TABLE: "Tables",
	FIELD: "Fields",
	OPERATOR: "Operators",
	TEXT: "Enter your search query",
}
var resultsData = getData(filterState.current, '')
console.log(resultsData);

function toggleSpotlightSearch() {
	$('#spotlight').toggle()
}
function clearSearch() {
	$('.input-wrapper').first().val('')
	$('.remover').each(function() {
		$(this).click()
	})
}
function getSearchText() {
	return $('.input-wrapper').first().val()
}
function getTableTag() {
	return $('.title').first().attr('id') // Returns table variable name
}
function getTags() {
	var tags = []
	$(".title").each(function (index) {
		tags.push({'name': $(this).attr('id'), 'display_name': $(this).text()})
	})
	return tags
}
function getFilterURL() {
	var table = getTableTag()
	var tags = getTags()
	var filters = []
	for (var i = 1; i < tags.length; i+= 3) {
		var filter = tags[i].name + tags[i+1].display_name + tags[i+2].display_name
		filters.push(filter)
	}
	return getFilterBlockSearch(table, filters)
}


// -------------------------------------------------------------------------
// Electron Shortcut Keys
// -------------------------------------------------------------------------
hotkeys.filter = function(event) { return true } // Allows filtering during input
hotkeys('ctrl+i', function (event, handler) {
	// Prevent the default refresh event under WINDOWS system
	event.preventDefault()
	toggleSpotlightSearch()
	document.getElementsByClassName('input-wrapper')[0].focus()
})


// -------------------------------------------------------------------------
// General Functions
// -------------------------------------------------------------------------
console.log('started');

// Resets arrow selection when new input is typed
function resetArrowSelection() {
	selectionIndex = -1
	$(".spotlight--results-item").each(function (index) {
		$(this).removeClass("spotlight--results-item_selected");
	});
}

// Used to get the active row selection data item, and section name, on click/tab/enter
function getActiveSelection() {
	var total = 0
	for (i in resultsData.sections) {
		total += resultsData.sections[i].results.length
		if (selectionIndex < total) {
			var rowIndex = selectionIndex - (total - resultsData.sections[i].results.length)
			var item = resultsData.sections[i].results[rowIndex].item
			item.section = resultsData.sections[i].name
			return item
		}
	}
}

function updateFilterState() {
	const tagCount = getTags().length
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
    console.log("🚀 | getTableTag()", getTableTag())
    console.log("🚀 | getSearchText()", getSearchText())
    console.log("🚀 | filterState.current", filterState.current)
	console.log(resultsData.sections);
}

function addTag() {
	selection = getActiveSelection()
	// Only allow tags for filters. TODO: Only add filter tags for DBs with the filter property. They will also contain an array of DBs that will be used, and whether this can be repeated infinitely
	if (selection.section != DB_TABLES.name) {
		return
	}
	updateFilterState()

	// Create tag values
	var tagDisplayName
	var tagID

	// If we're in the text state, just directly add that as a tag
	if (filterState.current == filterState.TEXT) {
		tagDisplayName = getSearchText()
		tagID = 'text'
	} else {
		// If we're not in a text state, then we will use the selection
		tagDisplayName = selection.display_name
		var tagID = selection.name
	}

	// Adding the table tag. We should also load the filters to get ready for filtering mode
	$('#spotlight--search').data('taginput').val([tagDisplayName])
	$('.title').last().attr('id', tagID);
	$('.input-wrapper').first().val('')
	
	updateResults()
	selectionIndex = -1
}

// Updates the UI with the newly selected row (hover or arrow keys)
function updateSelectedRow() {
	$('.spotlight--results-item').each(function () {
		$(this).removeClass("spotlight--results-item_selected");
	})
	$('.spotlight--results-item').eq(selectionIndex).addClass("spotlight--results-item_selected");
}



// -------------------------------------------------------------------------
// Document Ready
// -------------------------------------------------------------------------
onload2 = function () {
	console.log('Page Starting');

	var checkExist = setInterval(function() {
		if (document.querySelector('.input-wrapper') != null) {
		   console.log("Exists!");
		   document.querySelector('.input-wrapper').addEventListener('input', (event) => {
			   console.log(event);
			   resetArrowSelection()
			   updateResults()
		   })
		   clearInterval(checkExist);
		}
	 }, 100)

	// Vue - table of results and click events
	var resultsApp = new Vue({
		el: '#spotlight--results',
		data: resultsData,
		methods: {
			select: function (event) {
				elem = $(event.currentTarget)
				selectionIndex = elem.index('.spotlight--results-item')
				// targetId = event.currentTarget.textContent
				addTag()
			}
		}
	})


	// Get the input data and filter (currently doing it manually)
	$('.input-wrapper').on('input', function () {
		resetArrowSelection()

		// Send request to main for results
		updateResults()
	});

	// Allow for
	$('#spotlight').on('mouseenter', '.spotlight--results-item', function(){
		selectionIndex = $('.spotlight--results-item').index($(this))
		updateSelectedRow()
	});

	// Detect arrow keys to move the focused element
	$(document).keydown(function (e) {
		// Down key
		if (e.keyCode == 40 && selectionIndex < $('.spotlight--results-item').length - 1) {
			selectionIndex += 1
			updateSelectedRow()

			// Scroll down
			var newItem = $('.spotlight--results-item').eq(selectionIndex)
			var parent = $('#spotlight--results')
			var itemPos = newItem.offset().top - parent.offset().top
			var diff = itemPos + newItem.height() - parent.height()
			if (diff > 0) {
				parent.scrollTop(parent.scrollTop() + diff + 20);
			}
		}
		// Up Key
		if (e.keyCode == 38 && selectionIndex > -1) {
			selectionIndex -= 1
			updateSelectedRow()
			var parent = $('#spotlight--results')
			if (selectionIndex >= 0) {
				// Scroll up
				var newItem = $('.spotlight--results-item').eq(selectionIndex)
				var itemPos = newItem.offset().top - parent.offset().top
				if (itemPos < 0) {
					parent.scrollTop(parent.scrollTop() + itemPos - 7);
				}
			}
			// If at top, scroll all the way up. (without this, it will not scroll over the section title)
			if (selectionIndex == -1) {
				parent.scrollTop(0)
			}
		}
		// Tab key
		if (e.keyCode == 9) {
			e.preventDefault()
			// Automatically tab into first element if nothing is selected
			if (selectionIndex == -1) { 
				$('.spotlight--results-item').eq(0).click() 
				return
			}

			// Updates
			updateSelectedRow()
			addTag()

			// Bring focus back to the search key
			document.getElementsByClassName('input-wrapper')[0].focus()
		}
		// Backspace key
		if (e.keyCode == 8) {
			var pos = $('.input-wrapper').first().get(0).selectionStart
			if (pos == 0) {
				$('.remover').last().click()
			}
			updateResults()
		}
		// Escape key (exit spotlight)
		if (e.keyCode == 27) {
			toggleSpotlightSearch()
		}
		// Enter Key - change page
		if (e.keyCode == 13) {
			var url
			if ($('.tag').length > 1) {
				// FILTER SEARCH
				// There is more than one tag, so apply filters. It has to be divisible by 3 so the filters are proper
				console.log(($('.tag').length-1) % 3)
				if (($('.tag').length-1) % 3 == 0) {
					url = getFilterURL()
				} else if (($('.tag').length-1) % 3 == 2) {
					addTag()
					url = getFilterURL()
				} else {
					return
				}
			} else if (getSearchText().length > 0 && $('.tag').length == 1) {
				// GENERAL TEXT SEARCH
				// Someone has entered in text. Check if there is a tag, and only proceed if there is 1 tag
				var tableName = getTableTag()
				url = `https://desktop.service-now.com/${tableName}_list.do?sysparm_query=GOTO123TEXTQUERY321=${getSearchText()}`;
			} else {
				// LIST TABLE
				// Get whatever is currently selected
				url = `https://desktop.service-now.com/nav_to.do?uri=%2F${getActiveSelection().name}_list.do`
			}
			var tab = tabGroup.getActiveTab()
			tab.webview.loadURL(url)
			toggleSpotlightSearch()
			clearSearch()

		}
	});

};



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