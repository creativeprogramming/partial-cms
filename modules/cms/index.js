var builders = require('partial.js/builders');
var utils = require('partial.js/utils');
var path = require('path');
var mail = require('partial.js/mail');
var app = null;
var users = {};
var cookieName = 'administrator101';
var mainmenu = [];
var errors = ['403 forbidden'];
var database = [];

exports.install = function(framework) {
	
	app = framework;

	app.config['administrator-users'].split(',').forEach(function(user) {
		var data = user.split(';');
		users[data[0]] = data[1] || '';
	});
	
	app.route('/administrator/', viewIndex);
	app.route('/administrator/authorization/', authorizationHash);
	app.route('/administrator/authorization/', authorization, ['xhr', 'post']);
	app.route('/administrator/logoff/', logoff);
	app.route('/administrator/upload/', uploadFile, ['upload'], 1000000);
	app.route('/administrator/contents/', viewContents);
	app.route('/administrator/contents/', jsonContents, ['xhr', 'post']);
	app.route('/administrator/contents/{id}/', viewContentsForm);
	app.route('/administrator/contents/{id}/', jsonContentsForm, ['xhr']);

	var resource = {
		'mail': '<!DOCTYPE html><html><head><title>Administrator</title><meta charset="utf-8" /><meta name="format-detection" content="telephone=no"/><meta name="viewport" content="width=1100, user-scalable=yes" /><meta name="author" content="Web Site Design s.r.o." /></head><body style="padding:15px;font:normal 12px Arial;color:gray;background-color:white;"><br /><div style="width:700px;margin:0 auto;"><div style="font-size:14px;font-weight:bold;color:silver">Manager 1.01</div><div style="font-size:11px;color:silver;margin-bottom:10px">{now}</div><div style="line-height:15px;font-size:11px;background-color:white;padding:15px;background-color:#F0F0F0;-moz-border-radius:5px;-wekbit-border-radius:5px;border-radius:5px;border:1px solid #E0E0E0"><div style="font-weight:bold;color:black">Authorization:</div><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{url}</div></div></div></body></html>'
	};
	
	app.createResource('cms', resource);

	app.on('controller', function(controller, name) {

		if (controller.url === '/administrator/authorization/' || controller.url === '/administrator/logoff/' || controller.url === '/administrator/')
			return;

		if (controller.url.length < 14 || controller.url.substring(0, 15) !== '/administrator/')
			return;

		var cookie = controller.req.cookie(cookieName);		
		if (cookie === null || cookie.length === 0) {
			controller.cancel();
			controller.redirect('/administrator/');
			return;
		}

		var administrator = controller.app.decode(cookie, 'administrator', true);

		if (typeof(administrator) !== 'object') {
			controller.cancel();
			
			if (controller.isXHR)
				controller.json({ error: errors[0] });
			else
				controller.redirect('/administrator/');

			return;
		}

		var roles = users[administrator.id];

		if (typeof(roles) === 'undefined') {
			controller.cancel();
			
			if (controller.isXHR)
				controller.json({ error: errors[0] });
			else
				controller.redirect('/administrator/');

			return;
		}

		if (administrator.ip !== controller.req.ip || administrator.expire < new Date().getTime()) {
			controller.cancel();

			if (controller.isXHR)
				controller.json({ error: errors[0] });
			else
				controller.redirect('/administrator/');

			return;
		}


		var menu = '';
		mainmenu.forEach(function(o) {

			if (o.roles.length > 0) {
				var next = true;
				for (var i = 0; i < o.roles.length; i++) {
					if (roles.indexOf(o[i]) === -1) {
						next = false;
						continue;
					}
				}
				if (!next)
					return;
			}

			menu += o.html;
		});

		controller.repository.mainmenu = menu;

		controller.req.session = controller.session = administrator;
		controller.layout('/administrator/_layout');
	});

	builders.schema('status', {
		Id: 'integer',
		Name: 'text(50)'
	}, 'Id', true);

	builders.schema('category', {
		Id: 'integer',
		Key: 'text(50)',
		Name: 'text(50)',
		Count: 'integer'
	});

	builders.schema('content', {
		Id: 'integer',
		IdStatus: 'integer',
		IdCategory: 'integer',
		Key: 'text(50)',
		Name: 'text(80)',
		Link: 'text(150)',
		Description: 'text(300)',
		Body: 'text',
		Keywords: 'text(80)',
		Custom: 'text',
		Note: 'text(200)',
		Priority: 'integer',
		DateCreated: 'datetime'
	});

	builders.schema('file', {
		Id: 'integer',
		Name: 'text(80)',
		Size: 'integer',
		ContentType: 'text(50)',
		Dimension: 'text(12)',
		Data: 'blob',
		DateCreated: 'datetime'
	});

	var db = app.database('cms');
	
	db.schemaCreate('status', function(b) {
		db.schemaCreate('category', function(b) {
			
			if (!b)
				return;

			db.schemaCreate('content', function(b) {
				
				if (!b)
					return;

				db.insert('category', { Name: 'Menu', Key: 'menu', Count: 0 });
				db.insert('category', { Name: 'Article', Key: 'article', Count: 0 });
				db.insert('status', { Id: 1, Name: 'Active' });
				db.insert('status', { Id: 2, Name: 'Frozen' });
				db.insert('status', { Id: 3, Name: 'Offline' });

				db.schemaCreate('file');
			});
		});	
	});
};

exports.menu = function(name, url, icon, id, roles) {
	mainmenu.push({ html: '<li><a href="{0}" id="{3}"><span class="icon icon-{1}"></span>{2}</a></li>'.format(url, icon, name, 'menu_' + (id || mainmenu.length)), roles: roles || [] });
};

exports.onRequest = function(cookieValue) {
	var self = this;
	var cookie = cookieValue || self.req.cookie(cookieName) || '';

	self.req.session = self.session = null;

	if (cookie === '')
		return;

	var administrator = self.app.decode(cookie, 'administrator', true);

	if (typeof(administrator) !== 'object')
		return;

	var roles = users[administrator.id];

	if (typeof(roles) === 'undefined')
		return;

	if (administrator.ip !== self.req.ip || administrator.expire < new Date().getTime())
		return;

	administrator.roles = roles;

	var menu = '';
	mainmenu.forEach(function(o) {

		if (o.roles.length > 0) {
			var next = true;
			for (var i = 0; i < o.roles.length; i++) {
				if (roles.indexOf(o[i]) === -1) {
					next = false;
					continue;
				}
			}
			if (!next)
				return;
		}

		menu += o.html;
	});

	self.repository.mainmenu = menu;
	self.req.session = self.session = administrator;
};

function viewLogin(self) {
	self.layout('');
	self.view('/administrator/login');
};

function viewIndex() {
	var self = this;

	if (self.session === null)
		return viewLogin(self);

	//self.layout('/administrator/_layout');
	self.redirect('/administrator/contents/');
}

function authorization() {
	
	var self = this;

	if (!(self.post.Email || '').isEmail())
		return self.json({ r: false });

	var user = users[self.post.Email];

	if (typeof(user) === 'undefined')
		return self.json({ r: false });

	var obj = {
		ip: self.req.ip,
		id: self.post.Email,
		expire: new Date().add('day', 1).getTime()
	};

	var hash = self.app.encode(obj, 'administrator');
	var params = { url: self.req.hostname('/administrator/authorization/?hash=' + hash),
			       now: new Date().format('dd.MM.yyyy HH:mm:ss') };

	mail.send(self.config['administrator-mail-smtp'], self.config['administrator-mail-sender'], obj.id, null, 'Administrator', self.resource('cms', 'mail').params(params));
	return self.json({ r: true });
};

function authorizationHash() {

	var self = this;
	var hash = self.get.hash;
	var administrator = self.app.decode(hash, 'administrator', true);

	if (typeof(administrator) === 'object') {
		if (administrator.ip === self.req.ip || administrator.expire > new Date().getTime()) {
			self.res.cookie(cookieName, hash, new Date().add('day', 1));
			exports.onRequest.call(self, hash);
		}
	}

	self.redirect('/administrator/');
};

function logoff() {
	var self = this;
	self.res.cookie(cookieName, '', new Date().add('day', -1));
	self.redirect('/administrator/');
};

function viewContents() {
	var self = this;
	var db = self.database('cms');
	db.all('category', builders.asc('Name'), function(err, rows) {
		self.view('/administrator/index', rows);
	});
};

function jsonContents() {
	var self = this;
	var db = self.database('cms');
	var query = new builders.QueryBuilder();

	if (self.post.category > 0)
		query.addValue('IdCategory', '=', self.post.category, true);

	if (self.post.category > -1) {
		db.reader('SELECT Id, IdStatus, Name, Note, DateCreated FROM content' + query.toString(true) + ' ORDER BY DateCreated DESC', function(err, rows) {
			self.json(rows);
		});
		return;
	}

	db.reader('SELECT Id, Name, Size, Dimension, DateCreated FROM file ORDER BY DateCreated DESC', function(err, rows) {
		self.json(rows);
	});
};

function viewContentsForm(id) {
	var self = this;
	var db = self.database('cms');
	
	var model = {		
		IdStatus: 0,
		IdCategory: 0,
		Priority: 0,
		Name: '',
		Description: '',
		Link: '',
		Body: '',
		Custom: '',
		Note: ''
	};

	id = id.parseInt();

	self.wait(function() {
		db.all('category', builders.asc('Name'), function(err, rows) {

			self.repository.category = rows;

			if (id === 0)
				self.skip();
			else
				self.next();

		});
	});

	self.wait(function() {
		db.findPK('content', id, function(err, row) {
			if (row === null)
				self.view404();
			else {
				model = row;
				self.view('/administrator/form', model);
			}
		});
	});

	self.viewAsync('/administrator/form', model);
};

function jsonContentsForm(id) {
	var self = this;

	var db = self.database('cms');
	var cms = self.module('cms');

	id = id.parseInt();

	if (self.get.deleted === '1') {

		if (self.post.isFile === 'true') {
	
			db.execute('DELETE FROM file WHERE Id=' + id, function(err, data) {
				self.json({ r: data.changes > 0 });
			});

			return;
		}

		cms.contentDelete({ Id: id }, function(isDeleted) {
			self.json({ r: isDeleted });
		});

		return;
	}

	var error = self.validation(self.post, ['Name', 'Body'], 'form-', 'cms');
	if (error.hasError())
		return self.json(error);

	var model = utils.extend({ Id: id, IdStatus: 1 }, self.post);

	self.wait(function() {

		if (id === 0) {
			self.next();
			return;
		}

		db.findPK('content', id, function(err, row) {
			model = utils.extend(row, model);

			if (row.IdStatus === 2) {
				model.IdCategory = row.IdCategory;
				model.Priority = row.Priority;
				model.Key = row.Key;
				model.Link = row.Link;
			}

			self.next();
		});
	});

	self.wait(function() {

		var cb = function(err, data) {
			self.next();
		};
		
		if (id === 0)
			cms.contentInsert(model, cb);
		else
			cms.contentUpdate(model, cb);

	});

	self.jsonAsync({ r: true });
}

function uploadFile() {

	var self = this;
	var output = [];
	var db = self.database('cms');

	self.files.forEach(function(file) {

		var fn = function(file) {
			self.wait(function() {

				var model = { Name: file.fileName,
							  Size: file.fileSize,
							  DateCreated: new Date(),
							  ContentType: file.contentType,
							  Dimension: ''
							};

				// read binary data to memory
				model.Data = file.readSync();				
				var extension = path.extname(file.fileName);

				if (file.isImage()) {

					file.picture().identify(function(err, data) {
						var cb = function(err, row) {

							if (err)
								return self.next();

							output.push('![' + path.basename(file.fileName, extension) + '](/upload/' + row.Id + extension + (data !== null ? '#' + data.width + 'x' + data.height : '') + ')');
							self.next();
						};

						if (data !== null) {
							model.Dimension = data.width + 'x' + data.height;
							db.insert('file', model, cb);
							return;
						}

						db.insert('file', model, cb);
					});

					return;
				}

				var cb = function(err, row) {

					if (err)
						return self.next();

					output.push('[' + path.basename(file.fileName, extension) + ']: /upload/' + row.Id + path.extname(file.fileName));
					self.next();
				};

				db.insert('file', model, cb);
			});
		}

		fn(file);
	});

	self.complete(function() {
		self.json(output);
	});
}

exports.onRender = function(item) {
	return item;
};

exports.contentInsert = function(content, callback) {
	content.DateCreated = new Date();
	var db = app.database('cms');
	db.insert('content', content, function(err, row) {
		exports.contentRefresh(true, function() {
			callback(row);
		});
	});
};

exports.contentUpdate = function(content, callback) {
	var db = app.database('cms');
	db.update('content', content, function(err, row) {
		exports.contentRefresh(false, function() {
			callback(row);
		});
	}, ['DateCreated']);
};

exports.contentDelete = function(content, callback) {
	var db = app.database('cms');	
	db.delete('content', content, function(err, isDeleted) {
		exports.contentRefresh(true, function() {
			callback(isDeleted);
		});
	});
};

exports.contentRefresh = function(sumarize, callback) {
	var db = app.database('cms');

	database = [];
	
	if (sumarize) {
		db.execute('UPDATE category SET Count=(SELECT COUNT(*) FROM content WHERE content.IdCategory=category.Id)', callback);
		return;
	}

	callback();
};

exports.content = function(path, keys, names, callback) {

	if (typeof(keys) === 'function') {
		callback = keys;
		keys = null;
		names = null;
	}

	if (typeof(names) === 'function') {
		callback = names;
		names = null;
	}

	if (keys === null)
		keys = [];

	if (names === null)
		names = [];

	var render = function(item) {
		return exports.onRender({ name: item.Name, body: item.Body, description: item.Description, keywords: item.Keywords, key: item.Key, category: item.Category });
	};

	var next = function() {
		var model = {}
		database.forEach(function(content) {

			var key = content.Category;
			var add = false;

			var item = model[key];

			if (typeof(item) === 'undefined') {
				model[key] = [];
				item = model[key];
			}

			if (keys.indexOf(content.Key) !== -1 || names.indexOf(content.Name) !== -1) {
				var r = render(content);
				r && item.push(r);
				return;
			}

			var index = content.Link.indexOf('*');
			if (index === -1) {
				
				if (path === content.Link) {
					var r = render(content);
					r && item.push(r);
				}
				
				return;
			}

			if (content.Link === '*') {
				var r = render(content);
				r && item.push(r);
				return;
			}

			var link = content.Link.substring(0, index);
			if (path.indexOf(link) === -1)
				return;

			var r = render(content);
			r && item.push(r);
		});

		// sorting
		Object.keys(model).forEach(function(o) {
			model[o].sort(function(a,b) {
				if (a.Priority > b.Priority)
					return -1;
				if (a.Priority < b.Priority)
					return 1;
				return 0;
			});
		});

		callback(model);
	};

	refresh(next);
};

function refresh(next) {
	if (database.length === 0) {
		database = [];
		app.database('cms').reader('SELECT a.Id, b.Key As Category, a.Name, a.Key, a.Link, a.Priority, a.Body, a.Keywords, a.Description FROM content a LEFT JOIN category b ON b.Id=a.IdCategory WHERE a.IdStatus<3', null, function(err, rows) {
			database = rows;
			next();
		});
		return;
	}
	next();
}