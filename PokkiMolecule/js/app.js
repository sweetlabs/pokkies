/**
 * A simple app to browse latest Smashing Magazine feed and save to Instapaper
 * Showcases 
 * - OAuth/xAuth
 * - Google JSAPI
 * - HTML5 Drag & Drop
 * - Crossdomain Ajax requests
 * - Background polling
 * - LocalStorage
 */
var App = (function() {
    
    var self        = this;
    var api         = new Instapaper();
    var feed_cache  = new LocalStore(LSKEY.FEED_CACHE, {defaultVal: []});
    var feed_unseen = new LocalStore(LSKEY.FEED_UNSEEN, {defaultVal: []});
    var unloaded    = new LocalStore(LSKEY.UNLOADED);
    var splash_ran  = unloaded.get() ? true : false;
    var saveWindowStateTimer = 0;
    var wrapper, 
        drop_target, 
        feed_list,
        content;
    
    /**
     * Load rss feed for specified url
     */
    var loadFeed = function(url) {
        var feed = new google.feeds.Feed(url);
        feed.setNumEntries(30);
        feed.includeHistoricalEntries();
        feed.load(function(result) {
            if (!result.error) {
                // save the results to localStorage for caching
                feed_cache.set(result.feed.entries);
                // create the HTML and display it
                generateFeedDom(result.feed.entries);
            }
        });
    };
    
    /**
     * Creates the HTML needed to render the list of feed items
     */
    var generateFeedDom = function(items) {
        var container = document.getElementById('feed');
        container.innerHTML = '';
        
        var unseen = feed_unseen.get();
        
        for (var i = 0; i < items.length; i++) {
            var entry = items[i];
            
            var item = document.createElement('div');
            item.classList.add('item');
            item.classList.add('ui');
            item.classList.add('ui-more_info');
            
            // if in unseen list, add new indicator
            if(entry.unread) {
                item.classList.add('new');
            }
            
            item.draggable = true;
            item.style.webkitUserDrag = 'element';
            item.href = entry.link;
                            
            var title = document.createElement('span');
            title.classList.add('title');
            title.innerHTML = entry.title;
            item.appendChild(title);
            
            var d = new Date(entry.publishedDate);
            var date = document.createElement('span');
            date.classList.add('date');
            date.innerHTML = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear();
            item.appendChild(date);
                                
            var snippet = document.createElement('span');
            snippet.classList.add('snippet');
            snippet.innerHTML = entry.contentSnippet;
            item.appendChild(snippet);
            
            container.appendChild(item);
        }
    };
    
    /**
     * Listens to the clicks inside of the #wrapper div and delegates events accordingly
     * doing this saves you from having to reattach events to dom nodes that change
     * or are brought in dynamically
     */
    var delegateEvent = function(e) {
        var target = e.target;  
        var parent = target.parentElement;
        
        // check to see if <a> click was for a link
        if(target.nodeName.toLowerCase() === 'a' || parent.nodeName.toLocaleLowerCase() === 'a') {
            e.preventDefault();
            
            var el = target.nodeName.toLowerCase() === 'a' ? target : parent;
            
            // click is a normal external url
            if(!el.classList.contains('ui')) {
                var url = el.href;
            
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser(url);
                
                return false;
            }
        }
        
        if(target.classList.contains('ui') || parent.classList.contains('ui')) {  
            e.preventDefault();
            
            var el = target.classList.contains('ui') ? target : parent;
            // link is ui related
            if(el.classList.contains('ui-more_info')) {
                // follow link in default browser
                var url = el.href;
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser(url);
            }
            else if(el.classList.contains('ui-link')) {
                // follow link in default browser
                var url = el.href;
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser(url);
            }
            else if(el.classList.contains('ui-login')) {
                api.handle_login();
            }
            else if(el.classList.contains('ui-login_close')) {
                api._hide_login(false, true);
            }
            
            return false;  
        }
    };
    
    /**
     * Callback for add bookmark ajax request
     */
    var add_bookmark_callback = function(data) {
        drop_target.classList.add('saved');
        setTimeout(function() {
            drop_target.classList.remove('saved');
        }, 410);
    };
    
    /**
     * Listener for when the window is shown
     */
    var onShown = function() {
        var splash = document.getElementById('splash');
        var atom = document.getElementById('atom');
            
        // animate splash on first run
        if(!splash_ran) {
            splash.classList.add('animate');
            atom.classList.add('animate');
            wrapper.classList.remove('show');
            
            // allows the css animation to run for some time before removing the animation class
            setTimeout(function() {
                splash.classList.remove('animate');
                atom.classList.remove('animate');
                wrapper.classList.add('show');
                
                // stagger content animation
                var li = wrapper.getElementsByClassName('item');
                                
                for(var i = 0; i < li.length; i++) {
                    li[i].style['-webkit-animation-duration'] = (100 * i + 200) + 'ms, 250ms';
                    li[i].style['-webkit-animation-delay'] = '0ms,'+ (100 * i + 200) + 'ms';
                }
            }, 2200);
            
            splash_ran = true;
        }
        else if(unloaded.get()) {
            splash.classList.remove('animate');
            atom.classList.remove('animate');
            wrapper.classList.add('show');
                
            // stagger content animation
            var li = wrapper.getElementsByClassName('item');
                            
            for(var i = 0; i < li.length; i++) {
                li[i].style['-webkit-animation-duration'] = (100 * i + 200) + 'ms, 250ms';
                li[i].style['-webkit-animation-delay'] = '0ms,'+ (100 * i + 200) + 'ms';
            }
        }
        unloaded.remove();
    };
    
    /**
     * Listener for when the page is unloaded via a relaunch/reload
     */
    var onUnload = function() {
        unloaded.set(true);
        pokki.saveWindowState('main');  // save the position of the current window
    };
    
    /**
     * Listener for when the app is resized
     */
    var onResize = function(e) {
        clearTimeout(saveWindowStateTimer);
        
        var width = window.innerWidth;
        var height = window.innerHeight;
        
        content.style.width = width + 'px';
        content.style.height = (height - 26) + 'px'; // minus height of header
        
        saveWindowStateTimer = setTimeout(function() {
            pokki.saveWindowState('main');  // save the position of the current window
        }, 20); // throttle calls to save
    };
    

    /**
     * Initialize whatever needs to be initialized
     */
    var init = function() {
        ///////////////////////////////////////////
        // Initialize classes, objects, event delegation, etc.
        setTimeout(function() {
            pokki.loadWindowState('main', {
                width: 500,
                height: 385
            }); // restore window position
            
            window.addEventListener('resize', onResize);
        }, 1);
    
        wrapper     = document.getElementById('wrapper');
        drop_target = document.getElementById('target');
        feed_list   = document.getElementById('feed');
        content     = document.getElementById('content');
       
        // initialize feed, either from cache or from fresh load
        if(feed_cache.get().length == 0) {
            if(_FEED_API_LOADED) {
                loadFeed(RSS_FEED);
            }
        }
        else {
            // fill it with cached results
            generateFeedDom(feed_cache.get());
        }
        
        // initialize event delegation for <a> clicks
        wrapper.addEventListener('click', delegateEvent);     
           
        
        ///////////////////////////////////////////
        // Initialize draggable & droppable events
        feed_list.addEventListener('dragstart', function(e) {
            var target = e.target;
            target.classList.add('dragging');
            drop_target.classList.add('dragging');
            
            var data = {
                url: target.href,
                title: '',
                description: ''
            }
            
            var span = target.getElementsByTagName('span');
            for(var i = 0; i < span.length; i++) {
                if(span[i].classList.contains('title')) {
                    data.title = span[i].innerHTML.trim();
                }
                else if(span[i].classList.contains('snippet')) {
                    data.description = span[i].innerHTML.trim().replace(/&nbsp;/g,'');
                }
            }
            
            e.dataTransfer.dropEffect = 'copyLink';
            e.dataTransfer.effectAllowed = 'copyLink';
            e.dataTransfer.setData('text/plain', JSON.stringify(data));
        }, false);
        
        feed_list.addEventListener('dragend', function(e) {
            e.target.classList.remove('dragging');
            drop_target.classList.remove('dragging');
            drop_target.classList.remove('over');
        }, false);
        
        drop_target.addEventListener('drop', function(e) {
            e.preventDefault();
            var data = JSON.parse(e.dataTransfer.getData('text/plain'));
            // ping instapaper
            api.add_bookmark(data, add_bookmark_callback);
        });
        
        drop_target.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('over');
        }, false);
        
        drop_target.addEventListener('dragenter', function(e) {
            this.classList.add('over');
        }, false);
        
        drop_target.addEventListener('dragleave', function(e) {
            this.classList.remove('over');
        }, false);
        
        
        ///////////////////////////////////////////
        // Enable optional pokki features
        pokki.allowResize(true, true, { // allows resizing vertically
            minHeight: 385,
            minWidth: 500
        }); 
        
        
        ///////////////////////////////////////////
        // Add optional pokki platform event listeners
        pokki.addEventListener('shown', onShown);
        pokki.addEventListener('unload', onUnload);
    };
    
    
    /**
     * Publically accessible methods
     */
    return {
        init: init,
        
        reload_feed: function() {
            generateFeedDom(feed_cache.get());
        },
        
        logout: function() {
            api.logout();
        }
    };
})(); 
