exports.testSelectTag = require("./ejs/select_tag_tests");

if (require.main == module.id) {
    require('test/runner').run(exports);
}

