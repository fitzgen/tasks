var EJS = require("ejs").EJS;
var EjsView = require("ejs").EjsView;
var assert = require("test/assert");

exports.testRendersChoicesFromObjects = function() {
    var result;
    var template = new EJS({text:"<%= select_tag('hello_world', '', [ { text: 'hello', value: 'world' } ]) %>"});
    with(new EjsView()) {
        result = eval(template.out());
    }

    assert.isTrue(/<select .*><option value=['"]world['"]\s*>hello<\/option><\/select>/.test(result), result);
};

exports.testRendersChoicesFromStrings = function() {
    var result;
    var template = new EJS({ text: "<%= select_tag('hello_world', '', [ 'one', 'two' ]) %>" });
    with(new EjsView()) {
        result = eval(template.out());
    }

    var xml = new XML(result);
    assert.isEqual(2, xml.option.length(), "Should have two options");
    assert.isTrue("one" == xml.option[0]);
    assert.isTrue("one" == xml.option[0].@value);
};