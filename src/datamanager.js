// -------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------
const MAX_RESULTS_PER_SECTION = 8
const FUSE_THRESHOLD = 0.3
const OPTIONS = {
	includeScore: false,
	// ignoreLocation: true,
	// keys: ['name', 'display_name'],
	keys: [{
				name: 'name',
				weight: 0.2
			},
			{
				name: 'display_name',
				weight: 0.8
			}
		],
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
// Load Data
function() {
	// console.log(`Loading: ${this.name} Data`)
	var fuseDB = this.fuse
	if (fuseDB._docs.length > 0) {
		return
	}

	// Table API Request
	const instanceUrl = `https://${window.location.host}/api/now/table/sys_db_object?sysparm_fields=name,label`
	return new Promise(function (resolve, reject) {
		fetch(instanceUrl)
			.then(response => response.json())
			.then(data => {
				var res = data.result.map(item => {
					item.name = item.name
					item.display_name = item.label
					delete item.label
					return item
				})
				fuseDB.setCollection(res)
				resolve(res)
			})
			.catch((error) => {
				console.error('Error:', error);
			  });
	})

},
// Select Action
function(item) {
	// console.log(`Selected row of type: ${this.name}`)
})



// DB Fields
function getFieldList(table) {
	// Table Field API Request
	const instanceUrl = `https://${window.location.host}/api/now/table/sys_dictionary?sysparm_fields=sys_name,element&name=${table}`
	return new Promise(function (resolve, reject) {
		fetch(instanceUrl)
			.then(response => response.json())
			.then(data => {
				var res = data.result.map(item => {
					item.name = item.element
					delete item.element
					item.display_name = item.sys_name
					delete item.sys_name
					if (item.display_name == '') {
						item.display_name = item.name.replaceAll('_', ' ')
						item.display_name = item.display_name.replace(/\b\w/g, function(l){ return l.toUpperCase() })
					}
					return item
				})
				res = res.filter(item => item.display_name != '' && item.name != '');
				resolve(res)
			})
	})
}

function findSuperClass(table) {
	// Table Field API Request
	const instanceUrl = `https://${window.location.host}/api/now/table/sys_db_object?sysparm_fields=name,super_class&name=${table}`
	return new Promise(function (resolve, reject) {
		fetch(instanceUrl)
			.then(response => response.json())
			.then(data => {
				if (data.result[0].super_class == '') {
					resolve(null)
				}
				var superClassUrl = data.result[0].super_class.link + '?sysparm_fields=name'
				fetch(superClassUrl)
				.then(response => response.json())
				.then(data => {
					resolve(data.result.name)
				})
			})
	})
}

function updateFieldList(table, fieldList, callback) {
	getFieldList(table).then(result => {
		// console.log('got field list for ' + table);
		fieldList = fieldList.concat(result)
		findSuperClass(table).then(superclass => {
			if (!superclass) {
				callback(fieldList)
			} else {
				updateFieldList(superclass, fieldList, callback)
			}
		})
	})
}

var DB_FIELDS = new SearchDB('Fields', function() {
	// console.log(`Loading: ${this.name} Data`)
	var table = tagsData.tags[0].name
	if (this.cachedTable && this.cachedTable == table) {
		return
	}
	this.cachedTable = table
	console.log('SWITCHED TO FIELD MODE FOR ' + tagsData.tags[0].name)
	var fuseDB = this.fuse

	return new Promise(function (resolve, reject) {
		// Loop through superclasses
		updateFieldList(table, [], function (fieldList) {
			fuseDB.setCollection(fieldList)
			resolve()
		})
	})
})

// DB Operators
var DB_OPERATORS = new SearchDB('Operators', function() {
	// console.log(`Loading: ${this.name} Data`)
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
	// console.log(`Loading: ${this.name} Data`)
	this.fuse.setCollection([
		{display_name: 'Catalog Task', name: 'sc_task'},
		{display_name: 'Mid Script Includes', name: 'script_include_mid'}
	])
})

// DB Modules
var DB_MODULES = new SearchDB('Modules', function() {
	// console.log(`Loading: ${this.name} Data`)

	setTimeout(function(){
		var moduleElems = document.getElementsByClassName('sn-widget-list-item sn-widget-list-item_hidden-action module-node')
	}, 500)

	var moduleElems = document.getElementsByClassName('sn-widget-list-item sn-widget-list-item_hidden-action module-node')
	var moduleList = []
	for (var module of moduleElems) {
		var moduleLink = module.href
		var moduleName = module.text
		moduleList.push({display_name: moduleName, name: moduleLink})
	}

	this.fuse.setCollection(moduleList)
})

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
	{name: 'sc_task', display_name: 'Catalog Task'},
	{name: 'script_includes', display_name: 'Script Includes'},	{name: 'bg_script', display_name: 'Background Script'},
	{name: 'sc_task', display_name: 'Catalog Task'},
	{name: 'script_includes', display_name: 'Script Includes'},
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
	
	// console.log('STATE: ' + JSON.stringify(state))
	switch (state) {
		case filterState.TABLE:
			fuseRenderList = [DB_TABLES] //[DB_TABLES, DB_MODULES]
			break;
		case filterState.FIELD:
			fuseRenderList = [DB_FIELDS]
			break;
		case filterState.OPERATOR:
			fuseRenderList = [DB_OPERATORS]
			break;
		case filterState.TEXT:
			break;
		default:
			break;
	}

	var promises = fuseRenderList.map(fuse => fuse.loadData())
	Promise.all(promises).then((res) => {
		for (let fuse of fuseRenderList) {
			sections.push({name: fuse.name, results: fuse.search(searchText).slice(0, MAX_RESULTS_PER_SECTION)})
		}
	})
	// for (let fuse of fuseRenderList) {
	// 	var res = fuse.loadData()
	// 	sections.push({name: fuse.name, results: fuse.search(searchText)})
	// }

	return { sections }
}


