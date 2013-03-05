var builders = require('partial.js/builders');
var markdown = require('partial.js/markdown');
var utils = require('partial.js/utils');

function render(item) {

	/*
		## item declaration

		@Id {Number} :: content ID
		@Category {String} :: category key
		@Name {String} :: content name
		@Key {String} :: content key
		@Link {String} :: content link
		@Priority {Number} :: content priority
		@Body {String} :: content body
		@Keywords {String} :: content keywords		
		@Description {String} :: content description

		note: prepare property content to render engine

		return item;
	*/

	var md = markdown.init();

	md.onLines = function(type, value) {

		if (type === 'javascript')
			return '<script type="text/javascript">' + value.join('\n') + '</script>';

		if (type === 'html')
			return value;

		return value.join('<br />');
	};

	return item;
};

exports.onLoaded = function(framework) {
	
	var db = framework.database('cms');

	db.createSchema('category', function(isCreated) {

		if (!isCreated)
			return;

		db.insert('category', { Id: 1, Name: 'Article', Key: 'article' });
		db.insert('category', { Id: 2, Name: 'Menu', Key: 'menu' });
	});

	// set render delegate
	framework.module('cms').onRender = render;
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