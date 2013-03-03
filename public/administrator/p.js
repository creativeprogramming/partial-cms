$(document).ready(function() {

	if (helper.url() === '/administrator/contents/') {
		refreshContents();

		$('#category').bind('change', function() {
			refreshContents();
		});

		$('button[name="new"]').bind('click', function() {
			window.location.href = '/administrator/contents/0/';
		});
	}

	if (typeof(onReady) !== 'undefined')
		onReady();

});

function refreshContents() {

	var id = helper.getValue('#category', true);
	
	busy.post('content', { category: id }, function(rows){
		
		var el = $('#grid');
		el.find('tr').remove();

		rows.forEach(function(row) {
			var data = '';
			row.Name = (row.Name || '').htmlEncode();
			row.Note = (row.Note || '').htmlEncode();

			if (id === -1) {
				var index = row.Name.lastIndexOf('.');
				var extension = row.Name.substring(index);				
				if (row.Dimension !== '')
					data = '![' + row.Name + '](/upload/' + row.Id + extension + '#' + row.Dimension + ')';
				else
					data = '[' + row.Name + '](/upload/' + row.Id + extension + ')';
			}

			el.append('<tr itemprop="{2}"{5}><td><div class="w500 limit">{0}</div></td><td class="silver"><div class="w200 limit">{3}</div></td><td class="silver">{1}</td><td><button{4}>remove</button></td></tr>'.format(row.Name, new Date(Date.parse(row.DateCreated)).format('dd.MM.yyyy / HH:mm'), row.Id, (id === -1 ? (row.Dimension ? row.Dimension + ' / ' : '') + (row.Size / 1024).floor(2) + ' kB' : row.Note) || '', row.IdStatus !== 2 ? ' name="remove"' : ' class="frozen"', id === -1 ? 'data-content="' + data + '"' : ''));
		});
	
		el.find('tr').bind('click', function() {
			var id = helper.getProp(this);
			window.location.href = '/administrator/contents/' + id + '/';
		});

		el.find('button').bind('click', function(e) {
			
			e.preventDefault();
			e.stopPropagation();
			
			if (this.name !== 'remove')
				return;

			var el = $(this).parent().parent();
			var id = parseInt(el.attr('itemprop'));
			el.remove();

			busy.post('delete', { isFile: helper.getValue('#category', true) === -1 }, function(data) {}, '/administrator/contents/{0}/?deleted=1'.format(id));
		});

	}, '/administrator/contents/', 'content#' + id);

	$(window).bind('resize', function() {

		var el = $('#grid-container');
		var win = $(window);
		var w = win.width();
		var h = win.height();
		el.css({ height: h - 150 });

	}).trigger('resize');

};

helper.onValidation = function(name) {
	var self = this;
	switch (name) {
		case 'Name':
		case 'Body':
			return onValid(self, self.value.length > 0);

		case 'Category':
			return onValid(self, self.selectedIndex > 0);
	}
};

function onValid(el, valid) {
    var o = $(el);
    if (el.nodeName !== 'SELECT' && el.type !== 'checkbox')
        o.toggleClass('input-error', !valid);

    if (el.name === 'Body')
    	return;

    o.parent().parent().toggleClass('red', !valid);
    return valid;
}

function textareaInsert(el,text) { var txtarea = $(el).get(0); var scrollPos = txtarea.scrollTop; var strPos = 0; var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? "ff" : (document.selection ? "ie" : false ) ); if (br == "ie") { txtarea.focus(); var range = document.selection.createRange(); range.moveStart ('character', -txtarea.value.length); strPos = range.text.length; } else if (br == "ff") strPos = txtarea.selectionStart; var front = (txtarea.value).substring(0,strPos); var back = (txtarea.value).substring(strPos,txtarea.value.length); txtarea.value=front+text+back; strPos = strPos + text.length; if (br == "ie") { txtarea.focus(); var range = document.selection.createRange(); range.moveStart ('character', -txtarea.value.length); range.moveStart ('character', strPos); range.moveEnd ('character', 0); range.select(); } else if (br == "ff") { txtarea.selectionStart = strPos; txtarea.selectionEnd = strPos; txtarea.focus(); } txtarea.scrollTop = scrollPos; }