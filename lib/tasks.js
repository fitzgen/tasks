var couchdb = require("couchdb");
var bogart = require("bogart");
var file = require("file");

var PROJECT_HOME = file.absolute(file.join(file.cwd(), ".."));

// Get the connection to the database, or create it if it doesn't exist yet.
var db = (function () {
    var server = couchdb.connect("http://localhost:5984/");
    if (!server)
        throw new Error("Couldn't connect to server.");

    if (!server.hasDb("tasks"))
        if (!server.createDb("tasks"))
            throw new Error("Could not create database.");

    return server.database("tasks");
}());

// Make sure that our design document is properly stored in the DB.
db.save({
    _id: "_design/tasks",
    language: "javascript",
    views: {
        pending: {
            map: (
                function (doc) {
                    if (!doc.isCompleted)
                        emit(doc._id, doc);
                }
            ).toString()
        }
    }
});

// Return all tasks that have not been completed yet.
function getPendingTasks() {
    return db.view("tasks", "pending").rows.map(
        function (row) {
            return row.value;
        }
    );
}

exports.app = new bogart.App(function () {

    this.viewsPath = file.join(file.cwd(), "..");

    this.GET("/", function () {
        var context = {};
        context.tasks = getPendingTasks();
        this.ejs("index", context);
    });

});
