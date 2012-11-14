/**
 * Simple class to display a feedback message to the user
 */
var Feedback = function(message, duration, options) {
    var self = this;
    
    this.message = message;
    this.duration = duration;
    this.options = {
        // feedback div will be appended to this node
        parent: 'content',
        // additional classname for styling purposes
        classname: false
    };
    
    // merge options
    for(o in options) {
        this.options[o] = options[o];
    }
    
    // create div
    this.div = document.createElement('div');
    this.div.classList.add('feedback');
    if(this.options.classname) 
        this.div.classList.add(this.options.classname);
    
    // add to view
    var container = document.getElementById(this.options.parent);
    container.appendChild(this.div);
    
    this.set_message = function(m) {
        self.message = m;
    };
    
    this.set_duration = function(d) {
        self.duration = d;
    };
};

Feedback.prototype.show = function(is_manual) {
    this.div.innerHTML = '<p>' + this.message + '</p>';
    this.div.classList.add('show');
    
    if(!is_manual) {
        var self = this;
        setTimeout(function() {
            self.hide();
        }, this.duration);
    }
};

Feedback.prototype.hide = function() {
    this.div.classList.remove('show');
};