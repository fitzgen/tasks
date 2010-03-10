var couchdb = require("couchdb");
var bogart = require("bogart");
var file = require("file");
var reform = require("reform");

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

// Form for adding new tasks to our TODO list.
var newTaskForm = reform.Form({
    task: reform.TextField({
        label: "New Task:"
    }),
    button: reform.Button({
        label: "Add Task!"
    })
});

// Return all tasks that have not been completed yet.
function getPendingTasks() {
    return db.view("tasks", "pending").rows.map(
        function (row) {
            return row.value;
        }
    );
}

function saveNewTask(task) {
    return db.save({
        task: task
    });
}

function indexRouteHandler() {
    var context = {};

    // If the request is an HTTP POST we want the data, otherwise default it
    // to null.
    var postData = this.request.isPost() ?
        this.request.POST() :
        null;

    // Make a copy of our form and bind it with the postData.
    var form = context.form = newTaskForm.clone(postData);

    // Check if the form is bound to any data (i.e. it isn't an empty form)
    if (form.isBound) {
        // If it is bound, now we want to check if it is valid.
        if (form.isValid()) {
            saveNewTask(form.cleanedData.task);
            context.form = newTaskForm.clone();
        }
        // No else because reform will handle the error messages for us!
    }

    context.tasks = getPendingTasks();

    this.ejs("index", context);
}

exports.app = new bogart.App(function () {

    this.viewsPath = file.join(PROJECT_HOME, "views");

    this.GET("/", indexRouteHandler);
    this.POST("/", indexRouteHandler);

});
