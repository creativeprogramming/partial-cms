var builders = require('partial.js/builders');
var utils = require('partial.js/utils');

exports.onLoaded = function(framework) {	
	var cms = framework.module('cms');
	
	cms.onRender = function(item) {
		if (item.category === 'menu')
			return;
		return item;
	};
};

exports.onExit = function(framework) {
	framework.database('database').close();
};

exports.onValidation = function(name, value) {
	switch (name) {
		case 'Email':
			return value.isEmail();
		case 'Name':
		case 'Body':
			return value.length > 0;
		case 'IdCategory':
			return value.parseInt() > 0;
	}
};

exports.onError = function(err, name, uri) {
	var self = this;
	console.log(err, name, uri);
	self.log(err, name, uri);
};