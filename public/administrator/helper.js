
var setup = {};

// shim layer with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) { window.setTimeout(callback, 1000 / 60); };
})();

/*
    @type {String}
    @value {Number}
    return {Date}
*/
Date.prototype.add = function (type, value) {
    var self = this;
    switch (type) {
        case 's':
        case 'ss':
        case 'second':
        case 'seconds':
            self.setSeconds(self.getSeconds() + value);
            return self;
        case 'm':
        case 'mm':
        case 'minute':
        case 'minutes':
            self.setMinutes(self.getMinutes() + value);
            return self;
        case 'h':
        case 'hh':
        case 'hour':
        case 'hours':
            self.setHours(self.getHours() + value);
            return self;
        case 'd':
        case 'dd':
        case 'day':
        case 'days':
            self.setDate(self.getDate() + value);
            return self;
        case 'M':
        case 'MM':
        case 'month':
        case 'months':
            self.setMonth(self.getMonth() + value);
            return self;
        case 'y':
        case 'yyyy':
        case 'year':
        case 'years':
            self.setFullYear(self.getFullYear() + value);
            return self;
    }
    return self;
};

/*
    Format date to string
    @format {String}
    return {String}
*/
Date.prototype.format = function (format) {
    var self = this;

    var h = self.getHours();
    var m = self.getMinutes().toString();
    var s = self.getSeconds().toString();
    var M = (self.getMonth() + 1).toString();
    var yyyy = self.getFullYear().toString();
    var d = self.getDate().toString();

    var a = 'AM';
    var H = h.toString();


    if (h >= 12) {
        h -= 12;
        a = 'PM';
    }

    if (h === 0)
        h = 12;

    h = h.toString();

    var hh = h.padLeft(2);
    var HH = H.padLeft(2);
    var mm = m.padLeft(2);
    var ss = s.padLeft(2);
    var MM = M.padLeft(2);
    var dd = d.padLeft(2);
    var yy = yyyy.substring(2);

    return format.replace(/yyyy/g, yyyy).replace(/yy/g, yy).replace(/MM/g, MM).replace(/M/g, M).replace(/dd/g, dd).replace(/d/g, d).replace(/HH/g, HH).replace(/H/g, H).replace(/hh/g, hh).replace(/h/g, h).replace(/mm/g, mm).replace(/m/g, m).replace(/ss/g, ss).replace(/s/g, ss).replace(/a/g, a);
};

String.prototype.trim = function () {
    return this.replace(/^[\s]+|[\s]+$/g, '');
};

/*
    Contain string a array values?
    @arr {String array}
    @mustAll {Boolean} :: optional (default false), String must contains all items in String array
    return {Boolean}
*/
String.prototype.contains = function (arr, mustAll) {

    var str = this.toString();

    for (var i = 0; i < arr.length; i++) {
        var exists = str.indexOf(arr[i]) !== -1;

        if (mustAll) {
            if (!exists)
                return false;
        } else if (exists)
            return true;
    }

    return mustAll ? true : false;
};

/*
    @arguments {Object array}
    return {String}
*/
String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

String.prototype.htmlEncode = function () {
    return this.replace(/\>/g, '&gt;').replace(/\</g, '&lt;').replace(/\"/g, '&quot');
};

String.prototype.htmlDecode = function () {
    return this.replace(/&gt;/g, '>').replace(/\&lt;/g, '<').replace(/\&quot;/g, '"');
};

/*
    Simple templating :: Hellow {name}, your score: {score}, your price: {price | ### ###.##}, date: {date | dd.MM.yyyy}
    @obj {Object}
    return {String}
*/
String.prototype.params = function (obj) {
    var formatted = this.toString();

    if (typeof (obj) === 'undefined' || obj === null)
        return formatted;

    var reg = /\{[^}\n]*\}/g;

    formatted.match(reg).forEach(function (prop) {

        var isEncode = false;
        var name = prop.substring(1, prop.length - 1).trim();

        var format = '';
        var index = name.indexOf('|');

        if (index !== -1) {
            format = name.substring(index + 1, name.length).trim();
            name = name.substring(0, index).trim();
        }

        if (prop.substring(0, 2) === '{!') {
            name = name.substring(1);
        } else
            isEncode = true;

        var val;

        if (name.indexOf('.') !== -1) {
            var arr = name.split('.');

            if (arr.length === 2)
                val = obj[arr[0]][arr[1]];
            else if (arr.length === 3)
                val = obj[arr[0]][arr[1]][arr[3]];
            else if (arr.length === 4)
                val = obj[arr[0]][arr[1]][arr[3]][arr[4]];
            else if (arr.length === 5)
                val = obj[arr[0]][arr[1]][arr[3]][arr[4]][arr[5]];
        } else {
            val = name.length === 0 ? obj : obj[name];
        }

        if (typeof (val) === 'function')
            val = val(index);

        if (typeof (val) === 'undefined')
            return;

        if (format.length > 0) {

            var type = typeof (val);
            if (type === 'string') {
                var max = parseInt(format);
                if (!isNaN(max))
                    val = val.maxLength(max + 3, '...');

            } else if (type === 'number' || util.isDate(val))
                val = val.format(format);
        }

        val = val.toString().dollar();
        formatted = formatted.replace(prop, isEncode ? exports.htmlEncode(val) : val);
    });

    return formatted;
};

/*
    Set max length of string
    @max {Number}
    @chars {String} :: optional, default ...
    return {String}
*/
String.prototype.maxLength = function (max, chars) {
    var str = this.toString();
    return str.length > max ? str.substring(0, max - chars.length) + (typeof (c) === 'undefined' ? '...' : chars) : str;
};

String.prototype.isJSON = function () {
    var a = this[0];
    var b = this[this.length - 1];
    return (a === '"' && b === '"') || (a === '[' && b === ']') || (a === '{' && b === '}');
};

String.prototype.isURL = function () {
    var str = this.toString();
    if (str.length <= 7)
        return false;
    return new RegExp('^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?').test(str);
};

String.prototype.isEmail = function () {
    var str = this.toString();
    if (str.length <= 4)
        return false;
    return RegExp('^[a-zA-Z0-9-_.]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$').test(str);
};

/*
    @def {Number} :: optional, default 0
    return {Number}
*/
String.prototype.parseInt = function (def) {
    var num = 0;
    var str = this.toString();

    if (str.substring(0, 1) === '0')
        num = parseInt(str.replace(/\s/g, '').substring(1));
    else
        num = parseInt(str.replace(/\s/g, ''));

    if (isNaN(num))
        return def || 0;

    return num;
};

/*
    @def {Number} :: optional, default 0
    return {Number}
*/
String.prototype.parseFloat = function (def) {
    var num = 0;
    var str = this.toString();

    if (str.substring(0, 1) === '0')
        num = parseFloat(str.replace(/\s/g, '').substring(1).replace(',', '.'));
    else
        num = parseFloat(str.replace(/\s/g, '').replace(',', '.'));

    if (isNaN(num))
        return def || 0;

    return num;
};

/*
    @max {Number}
    @c {String} :: optional
    return {String}
*/
String.prototype.padLeft = function (max, c) {
    var self = this.toString();
    return Array(Math.max(0, max - self.length + 1)).join(c || '0') + self;
};

/*
    @max {Number}
    @c {String} :: optional
    return {String}
*/
String.prototype.padRight = function (max, c) {
    var self = this.toString();
    return self + Array(Math.max(0, max - self.length + 1)).join(c || '0');
};

/*
    @decimals {Number}
    return {Number}
*/
Number.prototype.floor = function (decimals) {
    return Math.floor(this * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/*
    @decimals {Number}
    return {Number}
*/
Number.prototype.round = function (decimals) {
    return Math.round(this * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/*
    Format number :: 10000 = 10 000
    @format {Number or String} :: number is decimal and string is specified format, example: ## ###.##
    return {String}
*/
Number.prototype.format = function (format) {

    var index = 0;
    var num = this.toString();
    var beg = 0;
    var end = 0;
    var output = '';

    if (typeof (format) === 'string') {

        var d = false;

        for (var i = 0; i < format.length; i++) {
            var c = format[i];
            if (c === '#') {
                if (d)
                    end++;
                else
                    beg++;
            }

            if (c === '.')
                d = true;
        }

        var strBeg = num;
        var strEnd = '';

        index = num.indexOf('.');

        if (index !== -1) {
            strBeg = num.substring(0, index);
            strEnd = num.substring(index + 1);
        }

        if (strBeg.length > beg) {
            var max = strBeg.length - beg;
            var tmp = '';
            for (var i = 0; i < max; i++)
                tmp += '#';

            format = tmp + format;
        }

        if (strBeg.length < beg)
            strBeg = strBeg.padLeft(beg, ' ');

        if (strEnd.length < end)
            strEnd = strEnd.padRight(end, '0');

        if (strEnd.length > end)
            strEnd = strEnd.substring(0, end);

        d = false;
        index = 0;

        var skip = true;

        for (var i = 0; i < format.length; i++) {

            var c = format[i];

            if (c !== '#') {

                if (skip)
                    continue;

                if (c === '.') {
                    d = true;
                    index = 0;
                }

                output += c;
                continue;
            }

            var value = d ? strEnd[index] : strBeg[index];

            if (skip)
                skip = [',', ' '].indexOf(value) !== -1;

            if (!skip)
                output += value;

            index++;
        }

        return output;
    }

    output = '### ### ###';
    var beg = num.indexOf('.');
    var max = format || 0;

    if (max === 0 && num != -1)
        max = num.length - (beg + 1);

    if (max > 0) {
        output += '.';
        for (var i = 0; i < max; i++)
            output += '#';
    }

    return this.format(output);
};

/*
    @count {Number}
*/
Array.prototype.take = function (count) {
    var arr = [];
    var self = this;
    for (var i = 0; i < self.length; i++) {
        arr.push(self[i]);
        if (arr.length >= count)
            return arr;
    }
    return arr;
};

/*
    @count {Number}
*/
Array.prototype.skip = function (count) {
    var arr = [];
    var self = this;
    for (var i = 0; i < self.length; i++) {
        if (i >= count)
            arr.push(self[i]);
    }
    return arr;
};

/*
    @cb {Function} :: return true if is finded
*/
Array.prototype.find = function (cb) {
    var self = this;
    for (var i = 0; i < self.length; i++) {
        if (cb(self[i], i))
            return self[i];
    }
    return null;
};

/*
    @cb {Function} :: return true if is removed
*/
Array.prototype.remove = function (cb) {
    var self = this;
    var arr = [];
    for (var i = 0; i < self.length; i++) {
        if (!cb(self[i], i))
            arr.push(self[i]);
    }
    return arr;
};

/*
    @cb {Function}
*/
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (cb) {
        var arr = this;
        for (var i = 0; i < arr.length; i++)
            cb(arr[i], i);
        return arr;
    };
}

/*
    @cb {Function} :: return index
*/
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value) {
        var arr = this;
        for (var i = 0; i < arr.length; i++) {
            if (value === arr[i])
                return i;
        }
        return -1;
    };
}

function Helper() {
    this.version = 101;
    this.onValidation = $.noop;
    this.params = null;
    this.events = [];
};

Helper.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Helper.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

Helper.prototype.path = function (s, d) {
    if (typeof (d) === 'undefined')
        d = '/';
    var p = s.substring(s.length - 1, s.length);
    if (p !== d)
        s += d;
    return s;
};

Helper.prototype.url = function (b) {
    var u = window.location.pathname;
    if (typeof (b) === 'undefined')
        b = true;
    return b ? this.path(u) : u;
};

Helper.prototype.urlFragment = function (max) {
    var arr = helper.url().split('/');
    var builder = [];
    arr.forEach(function (o, index) {
        if (index > max)
            return;
        builder.push(o);
    });
    return helper.path(builder.join('/'));
};

Helper.prototype.eTe = function (el, data) {

    if (data === null)
        return false;

    var isError = data instanceof Array;

    this.emit('error', isError, data);

    el = $(el);
    if (isError) {
        el.find('> div').remove();
        data.forEach(function (d) {
            el.append('<div>' + (d.error || d.V) + '</div>');
        });
        el.show();
    } else
        el.hide();

    return isError;
};

Helper.prototype.get = function (n) {
    var self = this;

    if (self.params === null) {
        var params = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        self.params = [];
        for (var i = 0; i < params.length; i++) {
            var param = params[i].split('=');
            if (param.length !== 2)
                continue;
            self.params.push({ name: param[0], value: param[1] });
        }
    }

    var p = self.params.find(function (o) {
        return o.name == n;
    });

    if (p === null)
        return '';

    return p.value || '';
};

Helper.prototype.isEmail = function (a) {
    return a.toString().isEmail();
};

Helper.prototype.OtJ = function (o) {
    return encodeURIComponent($.isPlainObject(o) ? $.toJSON(o) : o);
};

Helper.prototype.JtO = function (d) {
    if (typeof (d) === 'object')
        return d;
    if (d == null || d.length < 2) return null;
    try {
        return $.evalJSON(d);
    } catch (e) {
        return null;
    }
};

Helper.prototype.isChecked = function (o) {
    return $(o).get(0).checked;
};

Helper.prototype.isDisabled = function (o) {
    return $(o).get(0).disabled;
};

Helper.prototype.disabled = function (o, bool) {
    return $(o).prop({ disabled: bool });
};

Helper.prototype.checked = function (o, bool) {
    return $(o).prop({ checked: bool });
};

Helper.prototype.scroll = function (y, s) {
    $('html,body').animate({ scrollTop: y }, s || 300);
};

Helper.prototype.dateDiff = function (dB, dE) {
    return Math.round((dE - dB) / (1000 * 60 * 60 * 24));
};

Helper.prototype.dateDays = function (y, m) {
    return (32 - new Date(y, m, 32).getDate());
};

Helper.prototype.dateWeek = function (d) {
    var j = new Date(d.getFullYear(), 0, 1);
    var d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.ceil((((d - j) / 86400000) + j.getDay() + 1) / 7) - 1;
};

Helper.prototype.getValue = function (o, isNumber) {
    var obj = $(o).get(0);

    if (typeof (obj) === 'undefined')
        return null;

    var m = obj.nodeName.toLowerCase();
    var v = null;
    if (m === 'select-one' || m === 'select') {
        if (obj.length == 0)
            return null;

        v = obj[obj.selectedIndex];
        v = isNumber ? v.value.parseInt() : v.value;
    }
    else
        v = isNumber ? obj.value.parseInt() : obj.value;

    return v;
};

Helper.prototype.getIndex = function (o) {
    return $(o).get(0).selectedIndex;
};

Helper.prototype.setIndex = function (o, i) {
    if (typeof (o) === 'undefined' || i === null)
        return false;

    var el = $(o);
    var obj = el.get(0);

    if (typeof (obj) === 'undefined')
        return el;

    var m = obj.nodeName.toLowerCase();
    if (m === 'select-one' || m === 'select')
        obj.selectedIndex = i;

    return el;
};

Helper.prototype.setProp = function (o, v) {
    var el = $(o);
    if (el.length == 0)
        return el;

    return $(o).attr('itemprop', v);
};

Helper.prototype.getProp = function (o, isNumber) {
    var el = $(o);
    if (el.length == 0)
        return null;

    var v = el.attr('itemprop');
    if (isNumber)
        return v.parseInt();

    return v;
};

Helper.prototype.setValue = function (o, v) {
    var el = $(o);

    if (v === null)
        return el;

    var obj = el.get(0);
    if (obj === null || typeof (obj) === 'undefined')
        return null;

    var m = obj.nodeName.toLowerCase();
    if (m === 'select-one' || m === 'select') {
        var l = obj.length;
        for (var i = 0; i < l; i++) {
            if (obj[i].value == v) {
                obj[i].selected = true;
                return $(o);
            }
        }
    } else {
        var type = obj.type.toString().toLowerCase();
        if (type === 'checkbox' || type === 'radio')
            obj.checked = v;
        else
            obj.value = v;
    }
    return el;
};

Helper.prototype.setValues = function (f, h) {
    f = $(f).get(0);

    if (f !== null) {
        if (f.nodeName.toLowerCase() === 'form') {
            for (var i = 0; i < f.length; i++) {
                var el = f[i];
                h.call(el, el, i);
            }
        } else {
            var index = 0;
            $(f).find('input,select,textarea').each(function () {
                h.call(this, this, index++);
            });
        }
    }
};

Helper.prototype.optionClear = function (o) {
    $(o).get(0).length = 0;
    return o;
};

Helper.prototype.optionCreate = function (el, text, value, callback) {
    var option = document.createElement('OPTION');
    option.text = text;
    option.value = value;
    callback && callback.call(option, option);
    $(el).get(0).options.add(option);
    return el;
};

Helper.prototype.validation = function (form, prop) {

    var self = this;
    var el = $(form);
    var items = el.get(0);
    var arr = [];

    if (typeof (prop) === 'undefined') {
        prop = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.getAttribute('required') === 'required')
                prop.push(item.name);
        }
    }

    for (var i = 0; i < items.length; i++) {
        var item = items[i];

        if (prop.indexOf(item.name) === -1)
            continue;

        var r = self.onValidation.call(item, item.name, item.value);
        if (typeof (r) === 'undefined' || r)
            continue;

        arr.push(item);
    }

    self.emit('validation', form, arr, prop);
    return arr.length === 0;
};

Helper.prototype.cookie = {
    read: function (name) {
        var arr = document.cookie.split(';');
        for (var i = 0; i < arr.length; i++) {
            var c = arr[i];
            if (c.charAt(0) === ' ')
                c = c.substring(1);
            var v = c.split('=');
            if (v.length > 1) {
                if (v[0] == name)
                    return v[1];
            }
        }
        return '';
    },

    write: function (name, value, expire) {
        var expires = '';
        var cookie = '';
        if (typeof (expire) === 'number') {
            var date = new Date();
            date.setTime(date.getTime() + (expire * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        } else if (expire instanceof Date) {
            expires = '; expires=' + expire.toGMTString();
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    },

    remove: function (name) {
        this.write(name, '', -1);
    }
};

Helper.prototype.confirm = function (b, message) {
    if (b) {
        if (window.onbeforeunload != null)
            return;
        window.onbeforeunload = function (e) {
            e = e || window.event;

            if (e)
                e.returnValue = message;

            return message;
        };
    } else {
        window.onbeforeunload = null;
    }
};

Helper.prototype.opacity = function (v, h) {
    var el = $('#opacity');
    var self = this;

    if (el.length == 0) {
        $(document.body).append('<div id="opacity"></div>');
        el = $('#opacity');
    }
    if (v) {
        el.show();
        self.emit('opacity', true);
    }
    else {
        el.hide();
        self.emit('opacity', false);
    }

    h && h(el, v);
    return el;
};

Helper.prototype.share = {
    facebook: function (url, title) {
        url = url || window.location.href;
        title = title || document.title;
        window.location.href = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(url) + '&t=' + encodeURIComponent(title);
    },
    twitter: function (url, title) {
        url = url || window.location.href;
        title = title || document.title;
        window.location.href = 'http://twitter.com/share?url=' + encodeURIComponent(url) + '&via=' + encodeURIComponent(title);
    },
    google: function (url) {
        url = url || window.location.href;
        window.location.href = 'https://plus.google.com/share?url=' + encodeURIComponent(url);
    }
};

Helper.prototype.pluralize = function (i, a, b, c) {
    if (i == 1)
        return b;
    else if (i > 1 && i < 5)
        return c;
    return a;
};

Helper.prototype.init = {
    facebook: function (lang, appId) {
        lang = lang || 'sk_SK';
        appId = appId || '346088855483095';
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = '//connect.facebook.net/' + lang + '/all.js#xfbml=1&appId=' + appId;
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    },
    google: function () {
        (function () {
            var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
            po.src = 'https://apis.google.com/js/plusone.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
        })();
    },
    twitter: function () {
        (function () {
            var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
            po.src = 'http://platform.twitter.com/widgets.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
        })();
    }
};

(function () {
    this.helper = new Helper();
})();

$.fn.hidden = function (h) {
    return $(this).toggleClass("hidden", h);
};

(function ($) {
    $.toJSON = function (o) {
        if (typeof (JSON) == 'object' && JSON.stringify) return JSON.stringify(o);
        var type = typeof (o);
        if (o === null) return "null";
        if (type == "undefined") return undefined;
        if (type == "number" || type == "boolean") return o + "";
        if (type == "string") return $.quoteString(o);
        if (type == 'object') {
            if (typeof o.toJSON == "function") return $.toJSON(o.toJSON());
            if (o.constructor === Date) {
                var month = o.getUTCMonth() + 1;
                if (month < 10) month = '0' + month;
                var day = o.getUTCDate();
                if (day < 10) day = '0' + day;
                var year = o.getUTCFullYear();
                var hours = o.getUTCHours();
                if (hours < 10) hours = '0' + hours;
                var minutes = o.getUTCMinutes();
                if (minutes < 10) minutes = '0' + minutes;
                var seconds = o.getUTCSeconds();
                if (seconds < 10) seconds = '0' + seconds;
                var milli = o.getUTCMilliseconds();
                if (milli < 100) milli = '0' + milli;
                if (milli < 10) milli = '0' + milli;
                return '"' + year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.' + milli + 'Z"';
            }
            if (o.constructor === Array) {

                var l = o.length;

                var ret = [];
                for (var i = 0; i < l; i++)

                    ret.push($.toJSON(o[i]) || "null");
                return "[" + ret.join(",") + "]";

            }

            var pairs = [];
            for (var k in o) {

                var name;
                var type = typeof k;
                if (type == "number")

                    name = '"' + k + '"';
                else if (type == "string")

                    name = $.quoteString(k);
                else continue;
                if (typeof o[k] == "function")

                    continue;
                var val = $.toJSON(o[k]);
                pairs.push(name + ":" + val);

            }

            return "{" + pairs.join(", ") + "}";

        }

    };
    $.evalJSON = function (src) {

        if (typeof (JSON) == 'object' && JSON.parse)

            return JSON.parse(src);
        return eval("(" + src + ")");

    };
    $.secureEvalJSON = function (src) {

        if (typeof (JSON) == 'object' && JSON.parse)

            return JSON.parse(src);
        var filtered = src;
        filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
        filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        if (/^[\],:{}\s]*$/.test(filtered))

            return eval("(" + src + ")");
        else throw new SyntaxError("Error parsing JSON, source is not valid.");

    };
    $.quoteString = function (string) {

        if (string.match(_escapeable)) {

            return '"' + string.replace(_escapeable, function (a) {
                var c = _meta[a];
                if (typeof c === 'string') return c;
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16)
                    .toString(16) + (c % 16)
                    .toString(16);
            }) + '"';

        }

        return '"' + string + '"';

    };
    var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;
    var _meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
    };

})(jQuery);



/*
*  Easing Plugin (http://gsgd.co.uk/sandbox/jquery/easing/)
*  Copyright 2001 Robert Penner
*
*/

jQuery.easing['jswing'] = jQuery.easing['swing'];
jQuery.extend(jQuery.easing,
{
    def: 'easeOutQuad',
    swing: function (x, t, b, c, d) {
        return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
    },
    easeInQuad: function (x, t, b, c, d) {
        return c * (t /= d) * t + b;
    },
    easeOutQuad: function (x, t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    },
    easeInCubic: function (x, t, b, c, d) {
        return c * (t /= d) * t * t + b;
    },
    easeOutCubic: function (x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOutCubic: function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    },
    easeInQuart: function (x, t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
    },
    easeOutQuart: function (x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOutQuart: function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    },
    easeInQuint: function (x, t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    },
    easeOutQuint: function (x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOutQuint: function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    },
    easeInSine: function (x, t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function (x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function (x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function (x, t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOutExpo: function (x, t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },
    easeInOutExpo: function (x, t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    },
    easeInCirc: function (x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOutCirc: function (x, t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOutCirc: function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    },
    easeInElastic: function (x, t, b, c, d) {
        var s = 1.70158; var p = 0; var a = c;
        if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
        if (a < Math.abs(c)) { a = c; var s = p / 4; }
        else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    easeOutElastic: function (x, t, b, c, d) {
        var s = 1.70158; var p = 0; var a = c;
        if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
        if (a < Math.abs(c)) { a = c; var s = p / 4; }
        else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    },
    easeInOutElastic: function (x, t, b, c, d) {
        var s = 1.70158; var p = 0; var a = c;
        if (t == 0) return b; if ((t /= d / 2) == 2) return b + c; if (!p) p = d * (.3 * 1.5);
        if (a < Math.abs(c)) { a = c; var s = p / 4; }
        else var s = p / (2 * Math.PI) * Math.asin(c / a);
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
    },
    easeInBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOutBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOutBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
    },
    easeInBounce: function (x, t, b, c, d) {
        return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b;
    },
    easeOutBounce: function (x, t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
            return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
        } else if (t < (2.5 / 2.75)) {
            return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
        } else {
            return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
        }
    },
    easeInOutBounce: function (x, t, b, c, d) {
        if (t < d / 2) return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
        return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    }
});

function Busy() {
    this.waiting = {};
    this.cache = {};
    this.events = [];
};

Busy.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Busy.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

Busy.prototype.stop = function (name) {

    var self = this;

    if (!name) {
        this.cache = {};
        self.emit('loading', false, name);
        return self;
    }

    delete self.cache[name];
    self.emit('loading', false, name);

    return self;
};

Busy.prototype.post = function (name, data, callback, url, key) {
    var self = this;

    if (self.waiting[name])
        return false;

    if (key) {
        var read = self.cache[key];
        if (read) {
            callback(read);
            return self;
        }
    }

    self.emit('loading', true, name);
    self.waiting[name] = true;

    url = url || helper.url(false);
    $.post(url, data, function (d) {

        delete self.waiting[name];
        self.emit('loading', false, name);

        var json = helper.JtO(d);

        if (key)
            self.cache[key] = json;

        callback(json);
    });

    return self;
};

Busy.prototype.get = function (name, data, callback, url, key) {
    var self = this;

    if (self.waiting[name])
        return false;

    if (key) {
        var read = self.cache[key];
        if (read) {
            callback(read);
            return self;
        }
    }

    self.emit('loading', true, name);
    self.waiting[name] = true;

    url = url || helper.url(false);
    $.get(url, data, function (d) {

        delete self.waiting[name];
        self.emit('loading', false, name);

        var json = helper.JtO(d);

        if (key)
            self.cache[key] = json;

        callback(json);
    });
};

(function () {
    this.busy = new Busy();
})();

function Windows() {
    this.windows = [];
    this.events = [];
};

Windows.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Windows.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

Windows.prototype.refresh = function () {
    var self = this;
    self.windows = $('.window');
    self.resize();

    var handler = function () {
        windows.hide();
    };

    var button = $('.window-close');
    button.unbind("click", handler);
    button.bind("click", handler);
    return self;
};

Windows.prototype.resize = function () {
    var self = this;
    var el = $(window);
    var w = el.width();
    var h = el.height();

    self.windows.each(function () {
        var el = $(this);
        el.css({ left: (w / 2) - (el.innerWidth() / 2), top: ((h / 2) - (el.innerHeight() / 2)) });
    });

    self.emit('resize', w, h, el);
    return self;
};

Windows.prototype.hide = function (param, handler) {
    var self = this;

    if (self.windows.length === 0)
        return self;

    self.windows.hide();
    self.emit('visible', null, false);
    return self;
};

Windows.prototype.show = function (el) {
    el = $(el);
    var self = this;

    if (self.windows.length === 0)
        return self;

    self.windows.hide();
    self.emit('visible', el, true);
    el.show();
    return self;
};

Windows.prototype.toggle = function (el) {
    el = $(el);
    var self = this;
    console.log(self);

    if (self.windows.length === 0)
        return self;

    var isVisible = el.is(':visible');
    if (isVisible) {
        el.hide();
        self.emit('visible', el, false);
    }
    else {
        self.emit('visible', el, true);
        el.show();
    }
    return self;
};

(function () {
    this.windows = new Windows();
})();


function Gallery(options) {
    this.options = $.extend({ index: 0, autoIndex: true }, options);
    this.el = [];
    this.interval = 0;
    this.events = [];
};

Gallery.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Gallery.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

Gallery.prototype.refresh = function (el, callback) {
    var self = this;

    var a = $(el).find('a');

    self.options.count = a.length;
    self.options.index = 0;
    self.el = a.toArray();

    var click = function (e) {
        e.preventDefault();
        self.move(parseInt($(this).attr('data-gallery-index')));
    };

    a.unbind('click', click);
    a.bind('click', click);
    a.attr('data-gallery-index', function (index) {
        return index;
    });

    callback && callback.call(self, a);
    return self;
};

Gallery.prototype.move = function (index) {
    var self = this;
    if (index >= 0 && index < self.el.length) {
        self.options.index = index;
        self.load();
    }
    return self;
};

Gallery.prototype.load = function () {
    var self = this;
    var el = $(self.el[self.options.index]);

    var img = new Image();

    self.interval = setTimeout(function () {
        self.emit('loading', true);
    }, 500);

    img.onload = function () {

        if (self.interval != null)
            clearTimeout(self.interval);

        self.emit('loading', false);
        self.emit('load', { el: el, url: el.attr('href'), index: obj.options.index, width: img.width, height: img.height });
    };

    img.src = el.attr('href');
    return self;
};

Gallery.prototype.next = function () {
    var self = this;
    var index = self.options.index + 1;

    if (index >= self.el.length) {
        if (!self.options.autoIndex)
            return self;
        index = 0;
    }

    self.options.index = index;
    self.load();
    return self;
};

Gallery.prototype.prev = function () {
    var self = this;
    var index = self.options.index - 1;

    if (index < 0) {
        if (!self.options.autoIndex)
            return self;

        index = self.el.length - 1;
    }

    if (index == -1)
        index = 0;

    self.options.index = index;
    self.load();
    return self;
};

function Slider(o, options) {
    this.el = $(o);
    this.elSlide = this.el.find('button');
    this.options = $.extend({ step: 1, max: 100, value: 0, width: 0, widthSlide: 0, offsetLeft: 0, isBusy: false, isDrag: false, isSlide: false, left: 0 }, options);
    this.events = [];

    var self = this;
    self.options.left = self.el.offset().left;

    if (self.options.width == 0) {
        self.options.width = self.el.width();
        if (self.options.width == 0)
            self.options.width = self.el.innerWidth();
    }

    if (self.options.widthSlide == 0) {
        self.options.widthSlide = self.elSlide.width();
        if (self.options.widthSlide == 0)
            self.options.widthSlide = self.elSlide.innerWidth();
    }


    if (self.options.value > 0) {
        self.options.isBusy = true;
        setTimeout(function () { obj.value(obj.options.value); }, 1000);
    }

    self.el.bind('mousemove mousedown mouseup mouseleave touchstart touchend touchmove', function (e) {

        if (self.options.isBusy)
            return;

        var x = e.type.indexOf('touch') > -1 ? e.originalEvent.touches[0].pageX || e.originalEvent.changedTouches[0].pageX : e.pageX;

        e.stopPropagation();
        e.preventDefault();

        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                self.options.isDrag = true;
                self.emit('move', true);
                self.onMove(x);
                return false;
            case 'mouseup':
            case 'touchend':
                self.options.isDrag = false;
                self.onMove(x);
                self.on('move', false);
                return false;
            case 'mousemove':
            case 'touchmove':
                self.options.isDrag && self.onMove(x);
                return false;
            case 'mouseleave':
            case 'touchcancel':
                self.options.isDrag = false;
                self.options.isSlide = false;
                self.on('move', false);
                return false;
        }
    });

    self.elSlide.bind('mousedown mouseup touchstart touchend', function (e) {
        if (self.options.isBusy)
            return;
        self.options.isSlide = e.type === 'mousedown' || e.type === 'touchstart';
        self.on('move', self.options.isSlide);
    });
};

Slider.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Slider.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

Slider.prototype.value = function (value) {

    var self = this;

    if (typeof (value) === 'undefined')
        return self.options.value;

    self.options.value = value;

    var p = (v / self.options.max) * 100;
    var x = (self.options.width / 100) * p;

    self.emit('move', x, true);
};

Slider.prototype.onMove = function (x, manual) {

    var self = this;
    var options = self.options;
    var p = 0;

    if (!manual)
        x -= options.left;

    var r = Math.floor(options.widthSlide / 2);

    if (x > options.width - r) {
        x = options.width - 10;
        p = options.width;
        options.isDrag = false;
        options.isSlide = false;
        self.emit('move', false);
    } else if (x < 0) {
        x = 10;
        p = 0;
        options.isDrag = false;
        options.isSlide = false;
        self.emit('move', false);
    } else
        p = x;

    p = Math.round((p / options.width) * 100);
    var max = (options.max / options.step);
    var step = Math.round((max / 100) * p);

    p = (step / max) * 100;

    x = (options.width / 100) * p;

    if (x > options.width - 10)
        x = options.width - 10;
    else if (x < 10)
        x = 10;

    options.value = step * options.step;

    if (manual) {
        options.isBusy = true;
        self.elSlide.animate({ marginLeft: (x - r) + options.offsetLeft }, 500, function () {
            options.isBusy = false;
        });
    }
    else
        self.elSlide.css({ marginLeft: (x - r) + options.offsetLeft });

    self.emit('selected', options.value);
};


function Upload() {
    this.events = [];
    this.isBusy = false;
};

Upload.prototype.submit = function (url, files, data) {

    var self = this;

    if (self.isBusy)
        return false;

    var fd = new FormData();

    for (var i = 0; i < files.length; i++)
        fd.append('file' + (i + 1), files[i]);

    if (typeof (data) !== 'undefined' && data !== null) {
        for (var key in data)
            fd.append(key, data[key]);
    }

    var xhr = new XMLHttpRequest();

    xhr.addEventListener('load', function () {
        self.isBusy = false;
        self.emit('complete', this.responseText);
    }, false);

    xhr.upload.addEventListener('progress', function (evt) {
        var percentage = 0;

        if (evt.lengthComputable)
            percentage = Math.round(evt.loaded * 100 / evt.total);

        self.emit('progress', percentage, evt.transferSpeed, evt.timeRemaining);
    }, false);

    xhr.addEventListener('error', function (e) {
        self.isBusy = false;
        self.emit('error', e);
    }, false);

    xhr.addEventListener("abort", function () {
        self.isBusy = false;
        self.on('cancel');
    }, false);

    self.isBusy = true;
    self.emit('begin');

    xhr.open('POST', url);
    xhr.send(fd);

    return true;
};

Upload.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Upload.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

function TouchPaging(element, options) {

    this.events = [];
    this.options = $.extend({ minDifferenceX: 100, maxDifferenceY: 50 }, options);

    var begX = 0;
    var begY = 0;
    var self = this;
    var el = $(element);

    el.bind('touchstart touchmove', function (e) {
        var t = e.originalEvent.touches[0];
        var x = t.pageX;
        var y = t.pageY;

        if (e.type === 'touchstart') {
            begX = x;
            begY = y;
            return;
        }

        if (e.type !== 'touchmove')
            return;

        var r = false;

        if (Math.abs(begX - x) > self.options.minDifferenceX && Math.abs(begY - y) < self.options.maxDifferenceY)
            r = self.emit(begX < x ? 'prev' : 'next', begX, x);

        if (r)
            el.unbind('touchstart touchmove');
    });
};

TouchPaging.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

TouchPaging.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};

function Scroller(element, direction, mouseDisabled) {

    this.events = [];
    this.options = { begX: 0, endX: 0, begY: 0, endY: 0, begTime: 0 };
    var el = $(element);

    var self = this;

    el.bind((!mouseDisabled ? 'mousedown mouseup ' : '') + 'touchstart touchmove', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var x = 0;
        var y = 0;

        if (e.type.indexOf('touch') === -1) {
            x = e.pageX;
            y = e.pageY;
        } else {
            var touch = e.originalEvent.touches[0];
            x = touch.pageX;
            y = touch.pageY;
        }

        if (e.type === 'mousedown' || e.type === 'touchstart') {
            self.options.begTime = new Date().getTime();
            self.options.begX = x;
            self.options.begY = y;
            self.emit('start', x, y, el);
            return;
        }

        self.options.endX = x;
        self.options.endY = y;

        var interval = new Date().getTime() - self.options.begTime;
        if (interval > 500)
            interval = 500;

        var obj = {};

        var position = direction === 'scrollLeft' ? self.options.begX - self.options.endX : self.options.begY - self.options.endY;
        obj[direction] = '+=' + position + 'px';

        el.stop().animate(obj, interval * 2, function () {
            self.emit('scroll', position, el);
        });
    });
};

Scroller.prototype.on = function (name, fn) {
    var self = this;
    self.events.push({ name: name, fn: fn });
    return self;
};

Scroller.prototype.emit = function () {
    var self = this;
    var name = arguments[0];

    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
        if (i > 0)
            arr.push(arguments[i]);
    };

    self.events.forEach(function (o) {
        if (o.name === name)
            o.fn.apply(this, arr);
    });

    return self;
};
