chrome.runtime.onInstalled.addListener(() => {
	console.log('Installed ServiceNow Palette');
})

document.onkeydown = function(e) {
	console.log(e);
  };