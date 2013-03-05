var markdown = require('partial.js/markdown');
var utils = require('partial.js/utils');

exports.render = function(item) {

	/*
		## item declaration

		@id {Number} :: content ID
		@category {String} :: category key
		@name {String} :: content name
		@key {String} :: content key
		@link {String} :: content link
		@priority {Number} :: content priority
		@body {String} :: content body
		@keywords {String} :: content keywords		
		@description {String} :: content description

		note: prepare property content to render engine

		return item;
	*/

	var md = markdown.init();

	md.onImage = function(alt, url, width, height) {
		return url;
	};

	md.onLink = function(name, url) {
		return '<a href="{0}">{1}</a>'.format(url, name);
	};

	md.onLines = function(type, value) {
		return value.join('<br />');
	};

	md.onLine = function(type, value) {

		switch (type) {
			case '\n':
				return '<br />';
			case '#':
				return '<h1>{0}</h1>'.format(value);
			case '##':
				return '<h2>{0}</h2>'.format(value);
			case '###':
				return '<h3>{0}</h3>'.format(value);
		}

		if (type === '\n')
			return '<br />';

		return value + '<br />';
	};

	md.onUL = function(ul) {
		var builder = '';

		ul.forEach(function(o) {
			builder += '<li>' + o.value + '</li>';
		});

		return '<ul>' + builder + '</ul>';
	};

	item.body = md.parse(item.body, item.key);
	return item;
};