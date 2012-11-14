// Add listener for when the window is first loaded
// Perform window page initiation and configuration
function load() {
	console.log('[DOM Event] Window page is loaded.');
	//GOOGLE ANALYTICS: Enter your settings here
    ga_pokki._setAccount('UA-22567862-1');
    ga_pokki._setDomain('googleanalytics.pokki.com');
	
	// Initialize app
	App.init();
}
window.addEventListener('DOMContentLoaded', load, false);