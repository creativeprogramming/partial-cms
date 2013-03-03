exports.install = function() {
    var self = this;
    self.route('/', viewContent);
    self.route('/{a}/', viewContent);
    self.route('/{a}/{b}/', viewContent);
    self.route('/{a}/{b}/{c}/', viewContent);
    self.route('/{a}/{b}/{c}/{d}/', viewContent);
    self.route('/{a}/{b}/{c}/{d}/{e}/', viewContent);
    self.route('/usage/', viewUsage);
    self.route('#403', error403);
    self.route('#404', error404);
    self.route('#431', error431);
    self.route('#500', error500);
};

function error403() {
    var self = this;
    self.statusCode = 403;
    self.view('#403 - Forbidden');
}

function error404() {
    var self = this;
    self.statusCode = 404;
    self.plain('#404 - Page not found');
}

function error431() {
    var self = this;
    self.statusCode = 431;
    self.plain('#431 - Request header fields too large');
}

function error500() {
    var self = this;
    self.statusCode = 500;
    self.plain('#500 - Internal server error');
}

function viewContent(a, b, c, d, e) {
    
    var self = this;
    var cms = self.module('cms');
    
    cms.content(self.url, [], [], function(model) {
        self.view('cms', model);
    });
}

function viewUsage() {
    var self = this;
    self.plain(self.app.usage(true));
}