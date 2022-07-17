import _ from "underscore-bd";
import vx from "backbone-front-bd";
import mnx from "../define";
import form from "./form";

import template from "marionette-bd/src/templates/filter.jst";
var model = vx.models.filter;

export default form.extend({
    template: template,
    renderWithErrorMsg: false,
    globalify: false,
    beforeSave() { },
    showBreadcrumb() { },
    setActions() { },
    events: {
        "click button.restart": "restart",
        "click button.clear": "clear",
        "click button.config": "config",
        "submit form": "save",
        submit: "save",
    },
    initialize(o) {
        this.model = new model({});
        this.setCols(o.cols);

        this.events = _.extend(_.clone(form.prototype.events), this.events);
        _.bind(form.prototype.initialize, this)();
    },
    setCols(o) {
        this.model.setCols(o);
    },
    onRender() {
        this.removeWrapper();

        if (!this.isReady() === true) return;
        // this.applyBehaviors(this.$el);
        $('[data-toggle="tooltip"]', this.$el).tooltip();
        $("[data-mask]", this.$el).each((x, el) => {
            $(el).attr("data-mask") in this.masks
                ? this.masks[$(el).attr("data-mask")]($(el))
                : $(el).mask($(el).attr("data-mask"));
        });
        this.showFilters();
        this.setFiltersSizeClass();
        this.afterRender && this.afterRender();
    },
    showRequired() { },
    showFilters() {
        if (this.options.show) {
            this.$el.parent().addClass("search-on");
        }
    },
    setFiltersSizeClass() {
        this.$el
            .parent()
            .addClass(
                "filter-lines-" +
                Math.ceil(this.model.displayedCols().length / 3)
            );
    },
    save(e) {
        e && vx.events.stopAll(e);
        if (!this.saveValidation()) {
            return false;
        }

        this.beforeSave && this.beforeSave(e);
        this.trigger("search");
        return true;
    },
    clear(e) {
        e && vx.events.stopAll(e);
        this.model.attributes = {};
        this.render().save();
    },
    restart(e) {
        e && vx.events.stopAll(e);
        this.model.attributes = _.clone(this.model.defaults);
        this.render().save();
    },
    config(e) {
        e && vx.events.stopAll(e);
        var listView = this.parent.getRegion("list").currentView,
            isDisplayed = (col) => listView.isDisplayed(col),
            cols = listView.availableCols(),
            body = `<select class="form-select form-control" id="modal-confirm-message" multiple="multiple" size="${cols.length}" style="overflow: auto;">{o}</select>`,
            options = [];

        _.each(cols, (col) =>
            options.push(
                `<option value="${col.name}" ${isDisplayed(col) ? 'selected="selected"' : ""
                }>${col.title}</option>`
            )
        );
        body = body.replace("{o}", options.join(""));

        vx.ux.popup.confirmMessage({
            title: "Marque quais colunas devem ser exibidas",
            body,
            confirm: "Salvar",
            dataCancel: "Cancelar",
            confirmClass: "btn-primary text-color-light",
            cancelClass: "btn-danger text-color-light",
            confirmValidation: "Preenchimento obrigatório",
            callback: (val, status, config) => {
                if (!status) return;
                listView.setDisplay(val);
                listView.render();
            },
        });
    },
});
