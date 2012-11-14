var background = (function() {
    
    var self = this;
    var feed_cache  = new LocalStore(LSKEY.FEED_CACHE, {defaultVal: []});
    var feed_unseen  = new LocalStore(LSKEY.FEED_UNSEEN, {defaultVal: []});
    
    ///////////////////////////////////////////
    // Setup auth
    var api_url =  'https://www.instapaper.com/api/1/';
    var callback_url = 'http://www.pokki.com/';
    var oauth_options = {
        prefix: LSKEY.OAUTH_PREFIX
    };
    
    function get_consumer_key() {
        return pokki.getScrambled('consumer_key');
    }
    
    function get_consumer_secret() {
        return pokki.getScrambled('consumer_secret');
    }
    
    var auth = new xAuthManager(get_consumer_key(), get_consumer_secret(), api_url, callback_url, oauth_options);
    
    /**
     * Polling function
     */
    function poll_feed() {
        loadFeed(RSS_FEED);
    }
    
    /**
     * Load rss feed for specified url
     */
    function loadFeed(url) {
        var feed = new google.feeds.Feed(url);
        feed.setNumEntries(30);
        feed.includeHistoricalEntries();
        feed.load(function(result) {
            if (!result.error) {
                // check for new items in the feed
                // TODO
            
                // save the results to localStorage for caching
                feed_cache.set(result.feed.entries);
                if(pokki.isAppRunning()) {
                    pokki.rpc('App.reload_feed();');
                }
            }
        });
    }
    
    /**
     * Render context menu
     */
    var updateContextMenu = function() {
        if(auth.is_logged_in()) {
            pokki.resetContextMenu();
            pokki.addContextMenuItem('Go to Instapaper', 'insta');
            pokki.addContextMenuItem('Log out', 'logout');
        }
        else {
            pokki.resetContextMenu();
            pokki.addContextMenuItem('Go to Instapaper', 'insta');
        }    
    };
    updateContextMenu();
    
    
    /**
     * Listener for context menu
     */
    var onContextMenu = function(key) {
        switch(key) {
            case 'insta':
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser('http://www.instapaper.com/u');
                break;
            case 'logout':
                logout();
                if(pokki.isAppRunning()) {
                    pokki.rpc('App.logout();');
                }
                break;
        }
    };
    
    var logout = function() {
        auth.logout();
        updateContextMenu();
    };
    
    
    ///////////////////////////////////////////
    // Add optional pokki platform event listeners
    pokki.addEventListener('context_menu', onContextMenu);
    
    
    /**
     * Publically accessible methods
     */
    return {
        // feed polling
        start_poll: function() {
            poll_feed(); // initial call
            setInterval(poll_feed, 1000 * 60 * 60 * 12) // every 12 hours
        },
    
        logout: logout,
        
        loggedin: updateContextMenu
    };
})();

