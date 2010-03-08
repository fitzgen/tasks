var couchdb = require("couchdb");
var bogart = require("bogart");
var file = require("file");

var PROJECT_HOME = file.absolute(file.join(file.cwd(), ".."));

exports.app = new bogart.App(function () {

    this.viewsPath = file.join(PROJECT_HOME, "views");

    this.GET("/:name", function () {
        this.ejs("hello", {
            name: this.params.name
        });
    });
});
