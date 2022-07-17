import _ from "underscore-bd";
import mnx from "../define";

import template from "marionette-bd/src/templates/pagination.jst";

export default mnx.view.extend({
    template: template,
    renderWithErrorMsg: false,
    globalify: false,
    events: {
        "click button.first": "gofirst",
        "click button.prev": "goprev",
        "click button.next": "gonext",
        "click button.last": "golast",
        "change select.goto": "goto",
    },
    initialize() { },
    onRender() {
        this.removeWrapper();
    },
    removeWrapper() {
        _.bind(mnx.utils.removeWrapper, this)();
    },
    goto(e) {
        this.options.collection.pagination.page = parseInt(
            $("option:selected", e.currentTarget).val(),
            10
        );
        this.trigger("gopage");
    },
    gofirst(silent = false) {
        this.options.collection.pagination.page = 1;
        silent !== true && this.trigger("gopage");
    },
    goprev() {
        this.options.collection.pagination.page -= 1;
        this.trigger("gopage");
    },
    gonext() {
        this.options.collection.pagination.page += 1;
        this.trigger("gopage");
    },
    golast() {
        this.options.collection.pagination.page = _.last(
            this.options.collection.pagination.pagesData.list
        );
        this.trigger("gopage");
    },
});
