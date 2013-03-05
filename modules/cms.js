var builders = require('partial.js/builders');
var utils = require('partial.js/utils');
var path = require('path');
var fs = require('fs');
var mail = require('partial.js/mail');
var app = null;
var users = {};
var cookieName = 'administrator101';
var mainmenu = [];
var errors = ['403 forbidden'];
var database = [];

exports.install = function(framework) {
	
	app = framework;

	builders.schema('status', {
		Id: 'integer',
		Name: 'text(50)'
	}, 'Id', true);

	builders.schema('category', {
		Id: 'integer',
		Key: 'text(50)',
		Name: 'text(50)',
		Count: 'integer'
	}, 'Id', true);

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
		Note: 'text(200)',
		Priority: 'integer',
		DateCreated: 'datetime'
	});

	builders.schema('file', {
		Id: 'integer',
		Name: 'text(130)',
		Size: 'integer',
		ContentType: 'text(50)',
		Dimension: 'text(12)',
		Data: 'blob',
		DateCreated: 'datetime'
	});	

	// load users
	app.config['administrator-users'].split(',').forEach(function(user) {
		var data = user.split(';');
		var name = data.shift();
		users[name] = data;
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

    app.routeFile('files', function(req) {
        return req.url.indexOf('/upload/') !== -1;
    }, serveFiles);

	var db = app.database('cms');
	var resource = {
		'mail': '<!DOCTYPE html><html><head><title>Administrator</title><meta charset="utf-8" /><meta name="format-detection" content="telephone=no"/><meta name="viewport" content="width=1100, user-scalable=yes" /><meta name="author" content="Web Site Design s.r.o." /></head><body style="padding:15px;font:normal 12px Arial;color:gray;background-color:white;"><br /><div style="width:700px;margin:0 auto;"><div style="font-size:14px;font-weight:bold;color:silver">Manager 1.01</div><div style="font-size:11px;color:silver;margin-bottom:10px">{now}</div><div style="line-height:15px;font-size:11px;background-color:white;padding:15px;background-color:#F0F0F0;-moz-border-radius:5px;-wekbit-border-radius:5px;border-radius:5px;border:1px solid #E0E0E0"><div style="font-weight:bold;color:black">Authorization:</div><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{url}</div></div></div></body></html>'
	};
	
	app.helpers.cms = function(category, key) {

		var item = (this.repository.cms[category] || []).find(function(o) {
			return o.key === key;
		});

		if (item === null)
			return { body: '', name: '', description: '', keywords: '' };
		
		return item;
	};

	app.createResource('cms', resource);

	db.createSchema('status', function(b) {
		db.createSchema('content', function(b) {
			
			if (!b)
				return;

			db.insert('status', { Id: 1, Name: 'Active' });
			db.insert('status', { Id: 2, Name: 'Frozen' });
			db.insert('status', { Id: 3, Name: 'Disabled' });
			db.createSchema('file');
		});	
	});

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

exports.onRender = function(item) {
	return item;
};

exports.insert = function(content, callback) {
	content.DateCreated = new Date();
	var db = app.database('cms');
	db.insert('content', content, function(err, row) {
		exports.refresh(true, function() {
			callback(row);
		});
	});
};

exports.update = function(content, callback) {
	var db = app.database('cms');
	db.update('content', content, function(err, row) {
		exports.refresh(false, function() {
			callback(row);
		});
	}, ['DateCreated']);
};

exports.delete = function(content, callback) {
	var db = app.database('cms');

	db.findPK('content', content.Id, function(err, content) {

		if (content.IdStatus !== 2 && content.IdStatus !== 3) {
			db.delete('content', content, function(err, isDeleted) {
				exports.refresh(true, function() {
					callback(isDeleted);
				});
			});
			return;
		}

		callback(false);
	});
};

exports.refresh = function(sumarize, callback) {
	var db = app.database('cms');

	app.cache.removeAll('cms.');
	database = [];
	
	if (sumarize) {
		db.execute('UPDATE category SET Count=(SELECT COUNT(*) FROM content WHERE content.IdCategory=category.Id)', callback);
		return;
	}

	callback();
};

exports.content = function(controller, keys, callback, duration) {

	var path = typeof(controller) === 'string' ? controller : controller.url;
	var cacheKey = 'cms.' + path;

	if (typeof(duration) !== 'undefined' && typeof(controller) === 'object') {
		var model = controller.cache.read(cacheKey);
		if (model !== null) {
			controller.repository.cms = model;
			return callback(model);
		}
	}

	if (typeof(keys) === 'function') {
		callback = keys;
		keys = null;
	}

	if (keys === null)
		keys = [];

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

			if (keys.indexOf(content.Key) !== -1) {
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

		if (typeof(controller) === 'object') {
			controller.repository.cms = model;

			if (typeof(duration) !== 'undefined')
				controller.cache.write(cacheKey, model, new Date().add('minute', duration));
		}

		callback(model);
	};

	refresh(next);
};

function refresh(next) {

	if (database.length === 0) {
		database = [];
		app.database('cms').reader('SELECT a.Id, b.Key As Category, a.Name, a.Key, a.Link, a.Priority, a.Body, a.Keywords, a.Description FROM content a LEFT JOIN category b ON b.Id=a.IdCategory', null, function(err, rows) {
			database = rows;
			next();
		});
		return;
	}
	next();
}


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

	mail.send(self.config['administrator-mail-smtp'], self.config['administrator-mail-sender'], obj.id, null, 'Administrator: ' + self.config.name, self.resource('cms', 'mail').params(params), self.config.name);
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
	db.all('category', function(err, rows) {
		rows = rows.remove(function(o) {
			return self.session.roles.indexOf(o.Key) !== -1;
		});
		self.view('/administrator/index', rows);
	});
};

function jsonContents() {
	var self = this;
	var db = self.database('cms');
	var query = new builders.QueryBuilder();

	if (self.post.category > 0 || self.post.category === -1)
		query.addValue('IdCategory', '=', self.post.category, true);

	if (self.post.category > -2) {
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
		db.all('category', function(err, rows) {

			rows = rows.remove(function(o) {
				return self.session.roles.indexOf(o.Key) !== -1;
			});

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
	id = id.parseInt();

	if (self.get.deleted === '1') {

		if (self.post.isFile === 'true') {
	
			db.execute('DELETE FROM file WHERE Id=' + id, function(err, data) {
				self.json({ r: data.changes > 0 });
			});

			return;
		}

		exports.delete({ Id: id }, function(isDeleted) {
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
			
			model = utils.extend(model, row);

			if (row.IdStatus === 3) {
				self.skip();
				return;
			}

			if (row.IdStatus === 2) {
				model.IdCategory = row.IdCategory;
				model.Priority = row.Priority;
				model.Key = row.Key;
				model.Link = row.Link;
				model.IdStatus = 2;
			}

			self.next();
		});
	});

	self.wait(function() {

		var cb = function(err, data) {
			self.next();
		};
		
		if (id === 0)
			exports.insert(model, cb);
		else
			exports.update(model, cb);

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

// Serve files from database
function serveFiles(req, res) {
    
    // this === framework
    var self = this;

    var id = utils.parseInt(req.uri.pathname.match(/\d+/).toString());
    if (id === 0)
        return self.return404(req, res);

    var key = req.url.replace(/\/+/g, '-').substring(1);

    var index = key.indexOf('?');
    if (index > 0)
    	key = key.substring(0, index);

    var fileName = self.path(self.config.directoryTemp, key);

    // framework.static contains all cached static file
    var file = self.static[fileName];
    if (file === null)
        return self.response404(req, res);

    if (file)
        return self.responseFile(req, res, file);

    // cache file to disk
    var db = self.database('cms');

    db.get('SELECT Data FROM file WHERE id=' + id, function(err, data) {

        if (err || data === null) {
            self.static[fileName] = null;
            return self.response404(req, res);
        }

        // save file to temporary directory
        self.static[fileName] = fileName;         
        fs.writeFileSync(fileName, data.Data);

        // return file
        serveFiles.call(self, req, res);
    });
}
