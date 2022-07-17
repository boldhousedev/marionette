import _ from "underscore-bd";
import vx from "backbone-front-bd";
import mnx from "../define";

import template from "marionette-bd/src/templates/list.ejs";

export default mnx.view.extend({
    template: template,
    events: {
        "click .item": "selectRow",
        "click .orderby": "orderby",
    },
    initialRenderOnState: "ready",
    renderOnState: "ready",
    render: mnx.view.prototype.renderSync,
    globalify: false,
    preinitialize(opts) {
        "ev" in opts &&
            (this.events = _.extend(_.clone(this.__proto__.events), opts.ev));
    },
    onRender() { },
    selectRow(e) {
        var cssClass = this.options.selectedCssClass || "bg-primary text-light";
        var selected = $(e.currentTarget).is(".selected");
        $("tr", this.$el).removeClass(cssClass + " selected");
        if (!selected) {
            $(e.currentTarget).addClass(cssClass + " selected");
        }
    },
    getSelectedRow(attr = "id") {
        var selected = $("tr.selected", this.$el);
        if (selected.length > 0)
            return attr ? selected.attr("data-" + attr) : selected;
        return false;
    },
    orderby(e) {
        e && vx.events.stopAll(e);

        var $el = $(e.currentTarget),
            $th = $el.parents("th:first");

        this.trigger("orderby", $th.attr("data-name"));
    },
    isAvailable(col) {
        return (col && !("available" in col)) || col.available;
    },
    isDisplayed(col) {
        return (
            col && this.isAvailable(col) && (!("display" in col) || col.display)
        );
    },
    setDisplay(show) {
        if (!_.isArray(show) || !show.length) return;
        _.each(this.options.cols, (col, x) => {
            this.options.cols[x].display = _.indexOf(show, col.name) >= 0;
        });
    },
    availableCols() {
        return _.filter(this.options.cols, (col) => {
            return this.isAvailable(col);
        });
    },
});
