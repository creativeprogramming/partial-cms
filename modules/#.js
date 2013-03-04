var builders = require('partial.js/builders');
var utils = require('partial.js/utils');

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

exports.onLoaded = function(framework) {
	
	var cms = framework.module('cms');
	var db = framework.database('cms');

	db.schemaCreate('category', function(isCreated) {
		if (!isCreated)
			return;
		db.insert('category', { Id: 1, Name: 'Article', Key: 'article' });
		db.insert('category', { Id: 2, Name: 'Menu', Key: 'menu' });
		db.insert('category', { Id: 100, Name: 'Help', Key: 'help' });
	});

	cms.onRender = function(item) {
		if (item.category === 'menu')
			return;
		return item;
	};
};