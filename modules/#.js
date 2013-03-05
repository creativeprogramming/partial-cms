var builders = require('partial.js/builders');
var utils = require('partial.js/utils');

exports.onLoaded = function(framework) {
	
	var db = framework.database('cms');

	db.createSchema('category', function(isCreated) {

		if (!isCreated)
			return;

		db.insert('category', { Id: 1, Name: 'Article', Key: 'article' });
		db.insert('category', { Id: 2, Name: 'Menu', Key: 'menu' });
	});

	// set render delegate
	framework.module('cms').onRender = framework.module('render').render;
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

exports.onExit = function(framework) {
	framework.database('database').close();
};