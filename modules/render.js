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

		if (this.name === 'referencie')
			return name + '#' + url;

		return '<a href="{0}">{1}</a>'.format(url, name);
	};

	md.onLines = function(type, value) {
		if (type === 'javascript')
			return '<script type="text/javascript">' + value.join('\n') + '</script>';

		if (type === 'html')
			return value;

		if (type !== '>')
			return value.join('<br />');

		var builder = [];
		
		var index = value[1].indexOf('#');
		var name = value[1].substring(0, index);
		var url = value[1].substring(index + 1);

		return '<a href="{0}" class="app"><img src="{2}" width="65" height="65" alt="{1}" border="0" /><strong>{1}</strong><span>{3}</span></a>'.format(url, name, value[0], value[2]);
	};

	md.onLine = function(type, value) {

		if (this.name === 'referencie')
			return '';

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

		return '<ul class="why">' + builder + '</ul>';
	};

	item.body = md.parse(item.body, item.key);
	return item;
};