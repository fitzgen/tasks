/*--------------------------------------------------------------------------
 *  EJS - Embedded JavaScript, version 0.1.0
 *  Copyright (c) 2007 Edward Benson
 *  http://www.edwardbenson.com/projects/ejs
 *  ------------------------------------------------------------------------
 *
 *  EJS is freely distributable under the terms of an MIT-style license.
 *
 *  EJS is a client-side preprocessing engine written in and for JavaScript.
 *  If you have used PHP, ASP, JSP, or ERB then you get the idea: code embedded
 *  in <% // Code here %> tags will be executed, and code embedded in <%= .. %>
 *  tags will be evaluated and appended to the output.
 *
 *  This is essentially a direct JavaScript port of Masatoshi Seki's erb.rb
 *  from the Ruby Core, though it contains a subset of ERB's functionality.
 *
 *  Requirements:
 *      prototype.js
 *
 *  Usage:
 *      // source should be either a string or a DOM node whose innerHTML
 *      // contains EJB source.
 *  	var source = "<% var ejb="EJB"; %><h1>Hello, <%= ejb %>!</h1>";
 *      var compiler = new EjsCompiler(source);
 *	    compiler.compile();
 *	    var output = eval(compiler.out);
 *      alert(output); // -> "<h1>Hello, EJB!</h1>"
 *
 *  For a demo:      see demo.html
 *  For the license: see license.txt
 *
 *--------------------------------------------------------------------------*/

function escapeHTML(str) {
   return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* Make a split function like Ruby's: "abc".split(/b/) -> ['a', 'b', 'c'] */
String.prototype.rsplit = function(regex) {
    var item = this;
    var result = regex.exec(item);
    var retArr = new Array();
    while (result != null)
    {
        var first_idx = result.index;
        var last_idx = regex.lastIndex;
        if ((first_idx) != 0)
        {
            var first_bit = item.substring(0,first_idx);
            retArr.push(item.substring(0,first_idx));
            item = item.slice(first_idx);
        }
        retArr.push(result[0]);
        item = item.slice(result[0].length);
        result = regex.exec(item);
    }
    if (! item == '')
    {
        retArr.push(item);
    }
    return retArr;
};

/* Chop is nice to have too */
String.prototype.chop = function() {
    return this.substr(0, this.length - 1);
};

/* Adaptation from the Scanner of erb.rb  */
var EjsScanner = function(source, left, right) {
    this.left_delimiter = left + '%';	//<%
    this.right_delimiter = '%' + right;	//>
    this.double_left = left + '%%';
    this.double_right = '%%' + right;
    this.left_equal = left + '%=';
    this.left_comment = left + '%#';
    if(left=='[')
        this.SplitRegexp = /(\[%%)|(%%\])|(\[%=)|(\[%#)|(\[%)|(%\]\n)|(%\])|(\n)/;
    else
        this.SplitRegexp = new RegExp('(' + this.double_left + ')|(%%' + this.double_right + ')|(' + this.left_equal + ')|(' + this.left_comment + ')|(' + this.left_delimiter + ')|(' + this.right_delimiter + '\n)|(' + this.right_delimiter + ')|(\n)');

    this.source = source;
    this.stag = null;
    this.lines = 0;
};

var EjsView = function(data) {
    this.data = data;
};

EjsView.prototype.partial = function(options, data) {
    if (typeof options == "String")
        options = { file: options };
    if (!data) data = this.data;
    return new EJS(options).render(data);
};

EjsScanner.to_text = function(input) {
    if (input == null || input === undefined)
        return '';
    if (input instanceof Date)
        return input.toDateString();
    if (input.toString)
        return input.toString();
    return '';
};

EjsScanner.prototype = {

    /* For each line, scan! */
    scan: function(block) {
        var regex = this.SplitRegexp;
        if (! this.source == '')
        {
            var source_split = this.source.rsplit(/\n/);
            for(var i=0; i<source_split.length; i++) {
                var item = source_split[i];
                this.scanline(item, regex, block);
            }
        }
    },

    /* For each token, block! */
    scanline: function(line, regex, block) {
        this.lines++;
        var line_split = line.rsplit(regex);
        for(var i=0; i<line_split.length; i++) {
            var token = line_split[i];
            if (token != null) {
                try{
                    block(token, this);
                }catch(e){
                    throw {type: 'EjsScanner', line: this.lines};
                }
            }
        }
    }
};

/* Adaptation from the Buffer of erb.rb  */
var EjsBuffer = function(pre_cmd, post_cmd) {
    this.line = new Array();
    this.script = "";
    this.pre_cmd = pre_cmd;
    this.post_cmd = post_cmd;

    for (var i = 0; i < this.pre_cmd.length; i++)
    {
        this.push(pre_cmd[i]);
    }
};
EjsBuffer.prototype = {

    push: function(cmd) {
        this.line.push(cmd);
    },

    cr: function() {
        this.script = this.script + this.line.join('; ');
        this.line = new Array();
        this.script = this.script + "\n";
    },

    close: function() {
        var line;
        if (this.line.length > 0)
        {
            for (var i = 0; i < this.post_cmd.length; i++)
            {
                this.push(pre_cmd[i]);
            }
            this.script = this.script + this.line.join('; ');
            line = null;
        }
    }

};

/* Adaptation from the Compiler of erb.rb  */
var EjsCompiler = function(source, left) {
    this.pre_cmd = ['var ___ejsO = "";'];
    this.post_cmd = new Array();
    this.source = ' ';
    if (source != null)
    {
        if (typeof source == 'string')
        {
            source = source.replace(/\r\n/g, "\n");
            source = source.replace(/\r/g, "\n");
            this.source = source;
        }
        else if (source.innerHTML)
        {
            this.source = source.innerHTML;
        }
        if (typeof this.source != 'string')
        {
            this.source = "";
        }
    }
    left = left || '<';
    var right = '>';
    switch (left) {
        case '[':
            right = ']';
            break;
        case '<':
            break;
        default:
            throw left + ' is not a supported deliminator';
            break;
    }

    var EjsScanner = require("ejs").EjsScanner;
    this.scanner = new EjsScanner(this.source, left, right);
    this.out = '';
};

EjsCompiler.prototype = {
    compile: function(options) {
        options = options || {};
        this.out = '';
        var put_cmd = "___ejsO += ";
        var insert_cmd = put_cmd;
        var buff = new EjsBuffer(this.pre_cmd, this.post_cmd);
        var content = '';
        var clean = function(content)
        {
            content = content.replace(/\\/g, '\\\\');
            content = content.replace(/\n/g, '\\n');
            content = content.replace(/"/g, '\\"');
            return content;
        };
        this.scanner.scan(function(token, scanner) {
            if (scanner.stag == null)
            {
                //alert(token+'|'+(token == "\n"))
                switch (token) {
                    case '\n':
                        content = content + "\n";
                        buff.push(put_cmd + '"' + clean(content) + '";');
                        buff.cr();
                        content = '';
                        break;
                    case scanner.left_delimiter:
                    case scanner.left_equal:
                    case scanner.left_comment:
                        scanner.stag = token;
                        if (content.length > 0)
                        {
                            // Chould be content.dump in Ruby

                            buff.push(put_cmd + '"' + clean(content) + '"');
                        }
                        content = '';
                        break;
                    case scanner.double_left:
                        content = content + scanner.left_delimiter;
                        break;
                    default:
                        content = content + token;
                        break;
                }
            }
            else {
                switch (token) {
                    case scanner.right_delimiter:
                        switch (scanner.stag) {
                            case scanner.left_delimiter:
                                if (content[content.length - 1] == '\n')
                                {
                                    content = content.chop();
                                    buff.push(content);
                                    buff.cr();
                                }
                                else {
                                    buff.push(content);
                                }
                                break;
                            case scanner.left_equal:
                                buff.push(insert_cmd + "(require('ejs').EjsScanner.to_text(" + content + "))");
                                break;
                        }
                        scanner.stag = null;
                        content = '';
                        break;
                    case scanner.double_right:
                        content = content + scanner.right_delimiter;
                        break;
                    default:
                        content = content + token;
                        break;
                }
            }
        });
        if (content.length > 0)
        {
            // Chould be content.dump in Ruby
            buff.push(put_cmd + '"' + clean(content) + '"');
        }
        buff.close();
        this.out = buff.script + ";";
        var to_be_evaled = 'this.process = function(_CONTEXT,_VIEW) { try { with(_VIEW) { with (_CONTEXT) {' + this.out + " return ___ejsO;}}}catch(e){e.lineNumber=null;throw e;}};";

        try {
            eval(to_be_evaled);
        } catch(e) {
            if (typeof JSLINT != 'undefined') {
                JSLINT(this.out);
                for (var i = 0; i < JSLINT.errors.length; i++) {
                    var error = JSLINT.errors[i];
                    if (error.reason != "Unnecessary semicolon.") {
                        error.line++;
                        var e = new Error();
                        e.lineNumber = error.line;
                        e.message = error.reason;
                        if (options.url)
                            e.fileName = options.url;
                        throw e;
                    }
                }
            } else {
                throw e;
            }
        }
    }
};


//type, cache, folder
var EJS = function(options) {
    this.set_options(options);

    if (options.url) {
        var template = EJS.get(options.url, this.cache);
        if (template) return template;
        if (template == EJS.INVALID_PATH) return null;
        this.text = EJS.request(options.url);
        if (this.text == null) {
            //EJS.update(options.url, this.INVALID_PATH);
            throw 'There is no template at ' + options.url;
        }
        this.name = options.url;
    }
    else if (options.file) {
        var fs = require('file');
        this.text = fs.read(options.file, "+r");
        if (this.text == null) {
            throw "There is no template at " + options.file;
        }
        this.name = options.file;
    }
    else if (options.element)
    {
        if (typeof options.element == 'string') {
            var name = options.element;
            options.element = document.getElementById(options.element);
            if (options.element == null) throw name + 'does not exist!';
        }
        if (options.element.value) {
            this.text = options.element.value;
        } else {
            this.text = options.element.innerHTML;
        }
        this.name = options.element.id;
        this.type = '[';
    }

    var template = new EjsCompiler(this.text, this.type);
    template.compile(options);

    EJS.update(this.name, this);
    this.template = template;
};
EJS.config = function(options) {
    EJS.cache = options.cache != null ? options.cache : EJS.cache;
    EJS.type = options.type != null ? options.type : EJS.type;
    var templates_directory = {}; //nice and private container

    EJS.get = function(path, cache) {
        if (cache == false) return null;
        if (templates_directory[path]) return templates_directory[path];
        return null;
    };

    EJS.update = function(path, template) {
        if (path == null) return;
        templates_directory[path] = template;
    };

    EJS.INVALID_PATH = -1;


};
EJS.config({cache: true, type: '<' });

EJS.prototype = {
    render : function(object) {
        var v = new EjsView(object);
        return this.template.process.call(v, object, v);
    },
    out : function() {
        return this.template.out;
    },
    set_options : function(options) {
        this.type = options.type != null ? options.type : EJS.type;
        this.cache = options.cache != null ? options.cache : EJS.cache;
        this.text = options.text != null ? options.text : null;
        this.name = options.name != null ? options.name : null;
    },
    // called without options, returns a function that takes the object
    // called with options being a string, uses that as a url
    // called with options as an object
    update : function(element, options) {
        if (typeof element == 'string') {
            element = document.getElementById(element);
        }
        if (options == null) {
            _template = this;
            return function(object) {
                EJS.prototype.update.call(_template, element, object);
            };
        }
        if (typeof options == 'string') {
            params = {};
            params.url = options;
            _template = this;
            params.onComplete = function(request) {
                var object = eval(request.responseText);
                EJS.prototype.update.call(_template, element, object);
            };
            EJS.ajax_request(params);
        } else
        {
            element.innerHTML = this.render(options);
        }
    }
};

EJS.newRequest = function() {
    var factories = [function() {
        return new ActiveXObject("Msxml2.XMLHTTP");
    },function() {
        return new XMLHttpRequest();
    },function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
    }];
    for (var i = 0; i < factories.length; i++) {
        try {
            var request = factories[i]();
            if (request != null)  return request;
        }
        catch(e) {
            continue;
        }
    }
};

EJS.request = function(path) {
    var request = new EJS.newRequest();
    request.open("GET", path, false);

    try {
        request.send(null);
    }
    catch(e) {
        return null;
    }

    if (request.status == 404 || request.status == 2 || (request.status == 0 && request.responseText == '')) return null;

    return request.responseText;
};
EJS.ajax_request = function(params) {
    params.method = ( params.method ? params.method : 'GET');

    var request = new EJS.newRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {
                params.onComplete(request);
            } else
            {
                params.onComplete(request);
            }
        }
    };
    request.open(params.method, params.url);
    request.send(null);
};
//}

EjsView.prototype.date_tag = function(name, value, html_options) {
    if (! (value instanceof Date))
        value = new Date();

    var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var years = [], months = [], days = [];
    var year = value.getFullYear();
    var month = value.getMonth();
    var day = value.getDate();
    for (var y = year - 15; y < year + 15; y++)
    {
        years.push({value: y, text: y});
    }
    for (var m = 0; m < 12; m++)
    {
        months.push({value: (m), text: month_names[m]});
    }
    for (var d = 0; d < 31; d++)
    {
        days.push({value: (d + 1), text: (d + 1)});
    }
    var year_select = this.select_tag(name + '[year]', year, years, {id: name + '[year]'});
    var month_select = this.select_tag(name + '[month]', month, months, {id: name + '[month]'});
    var day_select = this.select_tag(name + '[day]', day, days, {id: name + '[day]'});

    return year_select + month_select + day_select;
};

EjsView.prototype.form_tag = function(action, html_options) {
    html_options = html_options || {};

    if (html_options.action != undefined) {
        throw new Error("Action must be specified as the first parameter to 'form_tag'.  Do not include it in 'html_options'");
    }

    html_options.action = action;
    if (html_options.multipart) {
        html_options.method = 'post';
        html_options.enctype = 'multipart/form-data';
    }

    return this.start_tag_for('form', html_options);
};

EjsView.prototype.form_tag_end = function() {
    return this.tag_end('form');
};

EjsView.prototype.hidden_field_tag = function(name, value, html_options) {
    return this.input_field_tag(name, value, 'hidden', html_options);
};

EjsView.prototype.input_field_tag = function(name, value, inputType, html_options) {

    html_options = html_options || {};
    html_options.id = html_options.id || name;
    html_options.type = inputType || 'text';
    html_options.name = name;
    html_options.value = value || '';
    html_options.value = escapeHTML(typeof value == "string" ? value : value.toString());

    return this.single_tag_for('input', html_options);
};

EjsView.prototype.is_current_page = function(url) {
    if (window == undefined)
        return false;
    return (window.location.href == url || window.location.pathname == url);
};

EjsView.prototype.link_to = function(name, url, html_options) {
    if (!name) var name = 'null';
    if (!html_options) var html_options = {};

    if (html_options.confirm) {
        html_options.onclick =
        " var ret_confirm = confirm(\"" + html_options.confirm + "\"); if(!ret_confirm){ return false;} ";
        html_options.confirm = null;
    }
    html_options.href = url;
    return this.start_tag_for('a', html_options) + name + this.tag_end('a');
};

EjsView.prototype.submit_link_to = function(name, url, html_options) {
    if (!name) var name = 'null';
    if (!html_options) var html_options = {};
    html_options.onclick = html_options.onclick || '';

    if (html_options.confirm) {
        html_options.onclick =
        " var ret_confirm = confirm(\"" + html_options.confirm + "\"); if(!ret_confirm){ return false;} ";
        html_options.confirm = null;
    }

    html_options.value = name;
    html_options.type = 'submit';
    html_options.onclick = html_options.onclick +
                           (url ? this.url_for(url) : '') + 'return false;';
    //html_options.href='#'+(options ? Routes.url_for(options) : '')
    return this.start_tag_for('input', html_options);
};

EjsView.prototype.link_to_if = function(condition, name, url, html_options, post, block) {
    return this.link_to_unless((condition == false), name, url, html_options, post, block);
};

EjsView.prototype.link_to_unless = function(condition, name, url, html_options, block) {
    html_options = html_options || {};
    if (condition) {
        if (block && typeof block == 'function') {
            return block(name, url, html_options, block);
        } else {
            return name;
        }
    } else
        return this.link_to(name, url, html_options);
};

EjsView.prototype.link_to_unless_current = function(name, url, html_options, block) {
    html_options = html_options || {};
    return this.link_to_unless(this.is_current_page(url), name, url, html_options, block);
};


EjsView.prototype.password_field_tag = function(name, value, html_options) {
    return this.input_field_tag(name, value, 'password', html_options);
};

EjsView.prototype.select_tag = function(name, value, choices, html_options) {
    html_options = html_options || {};
    html_options.id = html_options.id || name;
    html_options.value = value;
    html_options.name = name;

    var txt = '';
    txt += this.start_tag_for('select', html_options);

    for (var i = 0; i < choices.length; i++)
    {
        var choice = choices[i];
        var text, optionValue;

        if (choice.text == undefined) {
            text = choice;
            optionValue = choice;
        } else {
            text = choice.text;
            optionValue = choice.value;
        }

        var optionOptions = {value: optionValue};
        if (optionValue == value) {
            optionOptions.selected = 'selected';
        }

        txt += this.start_tag_for('option', optionOptions) + text + this.tag_end('option');
    }
    txt += this.tag_end('select');
    return txt;
};

EjsView.prototype.single_tag_for = function(tag, html_options) {
    return this.tag(tag, html_options, '/>');
};

EjsView.prototype.start_tag_for = function(tag, html_options) {
    return this.tag(tag, html_options);
};

EjsView.prototype.submit_tag = function(name, html_options) {
    html_options = html_options || {};
    //html_options.name  = html_options.id  || 'commit';
    html_options.type = html_options.type || 'submit';
    html_options.value = name || 'Submit';
    return this.single_tag_for('input', html_options);
};

EjsView.prototype.tag = function(tag, html_options, end) {
    if (!end) end = '>';
    var txt = ' ';
    for (var attr in html_options) {
        var value = '';
        if (html_options[attr] != null)
            value = html_options[attr].toString();

        if (attr == "Class") // special case because "class" is a reserved word in IE
            attr = "class";

        if (value.indexOf("'") != -1)
            txt += attr + '=\"' + value + '\" ';
        else
            txt += attr + "='" + value + "' ";
    }
    return '<' + tag + txt + end;
};

EjsView.prototype.tag_end = function(tag) {
    return '</' + tag + '>';
};

EjsView.prototype.text_area_tag = function(name, value, html_options) {
    html_options = html_options || {};
    html_options.id = html_options.id || name;
    html_options.name = html_options.name || name;
    value = value || '';
    if (html_options.size) {
        html_options.cols = html_options.size.split('x')[0];
        html_options.rows = html_options.size.split('x')[1];
        delete html_options.size;
    }

    html_options.cols = html_options.cols || 50;
    html_options.rows = html_options.rows || 4;

    return  this.start_tag_for('textarea', html_options) + escapeHTML(typeof value == "string" ? value : value.toString()) + this.tag_end('textarea');
};
EjsView.prototype.text_tag = EjsView.prototype.text_area_tag;

EjsView.prototype.text_field_tag = function(name, value, html_options) {
    return this.input_field_tag(name, value, 'text', html_options);
};

EjsView.prototype.url_for = function(url) {
    return 'window.location="' + url + '";';
};
EjsView.prototype.img_tag = function(image_location, alt, options) {
    options = options || {};
    options.src = image_location;
    options.alt = alt;
    return EjsView.prototype.single_tag_for('img', options);
};


//noinspection JSUndeclaredVariable
exports.EJS = EJS;
exports.EjsScanner = EjsScanner;
exports.EjsCompiler = EjsCompiler;
exports.EjsView = EjsView;