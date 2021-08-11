// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------
const MAX_RESULTS = 8
const FUSE_THRESHOLD = 0.4
const OPTIONS = {
	includeScore: false,
	keys: ['name', 'display_name'],
	threshold: FUSE_THRESHOLD
}

// -------------------------------------------------------------------------
// Fuse Instance Setup
// -------------------------------------------------------------------------

class SearchDB {

	// SearchDB keeps track of the name and a function that loads data into the DB
	constructor(name, loadData, performAction) {
		this.fuse = new Fuse([], OPTIONS)
		this.name = name
		this.loadData = loadData
		this.performAction = performAction
	}

	// Searches the DB for text. Fixes a fuse edge case to return all results if query is empty
	search(text) {
		// If the search text is empty, get all fuse docs and remap them with the item variable to replicate the fuse search results structure
		if (text == '') {
			return this.fuse._docs.map(function(x) {
				return {item: x}
			}) 
		}
		return this.fuse.search(text)
	}
}


// DB Tables
var DB_TABLES = new SearchDB('Tables', 
// Load Action
function() {
	console.log(`Loading: ${this.name} Data`)
	this.fuse.setCollection(TABLE_DATA)
},
// Select Action
function(item) {
	console.log(`Selected row of type: ${this.name}`)
})

// DB Fields
var DB_FIELDS = new SearchDB('Fields', function() {
	console.log(`Loading: ${this.name} Data`)
})

// DB Operators
var DB_OPERATORS = new SearchDB('Operators', function() {
	console.log(`Loading: ${this.name} Data`)
	this.fuse.setCollection([
		{display_name: '=', name: 'equals'},
		{display_name: '<', name: 'less Than'},
		{display_name: '>', name: 'greater Than'},
		{display_name: '<=', name: 'less than or equal to'},
		{display_name: '>=', name: 'greater than or equal to'}
	])
})

// DB Recents
var DB_RECENTS = new SearchDB('Recents', function() {
	console.log(`Loading: ${this.name} Data`)
	this.fuse.setCollection([
		{display_name: 'Catalog Task', name: 'sc_task'},
		{display_name: 'Mid Script Includes', name: 'script_include_mid'}
	])
})

var FUSE_MODULES = new Fuse([], OPTIONS)
// Get list of all module names
// document.getElementsByClassName('sn-widget-list-item sn-widget-list-item_hidden-action module-node')[21].href

var FUSE_COMMANDS = new Fuse([], OPTIONS)
// var FUSE_INSTANCES_HOME = [FUSE_TABLES,FUSE_RECENTS, FUSE_MODULES, FUSE_COMMANDS]

// For reference - getData should return data in this format
// var UI_DATA = {
// 	sections: [
// 		{name: 'Tables', results: [
// 			{name: 'sc_task', display_name: 'Catalog Task'},
// 			{name: 'script_includes', display_name: 'Script Includes'},
// 			{name: 'script_include_mid', display_name: 'Mid Script Includes'}
// 		]},
// 		{name: 'Recents', results: [
// 			{name: 'recents_1', display_name: 'Catalog Task'},
// 			{name: 'bg_script', display_name: 'Background Script'}
// 		]},
// 		{name: 'Commands', results: [
// 			{display_name: 'Clear Table'},
// 			{display_name: 'Duplicate Table'}
// 		]}
// 	]
// }

var TABLE_DATA = [
	{name: 'sc_task', display_name: 'Catalog Task'},
	{name: 'script_includes', display_name: 'Script Includes'},
	{name: 'script_include_mid', display_name: 'Mid Script Includes'},
	{name: 'recents_1', display_name: 'Catalog Task'},
	{name: 'bg_script', display_name: 'Background Script'},
	{name: 'sc_task', display_name: 'Catalog Task'},
	{name: 'script_includes', display_name: 'Script Includes'},
	{name: 'script_include_mid', display_name: 'Mid Script Includes'},
	{name: 'recents_1', display_name: 'Catalog Task'},
	{name: 'bg_script', display_name: 'Background Script'}
]



// -------------------------------------------------------------------------
// Data Methods
// -------------------------------------------------------------------------
function getData(state, searchText, firstTag) {
	var fuseRenderList = []
	var sections = []
	
	console.log('STATE: ' + JSON.stringify(state))
	switch (state) {
		case filterState.TABLE:
			fuseRenderList = [DB_TABLES, DB_RECENTS, DB_OPERATORS]
			break;
		case filterState.FIELD:
			fuseRenderList = [DB_FIELDS]
			// ipcRenderer.send('searchFields', getTableTag(), searchText)
			break;
		case filterState.OPERATOR:
			fuseRenderList = [DB_OPERATORS]
			break;
		case filterState.TEXT:
			break;
		default:
			break;
	}

	for (let fuse of fuseRenderList) {
		fuse.loadData()
		sections.push({name: fuse.name, results: fuse.search(searchText)})
	}

	return { sections }
}


