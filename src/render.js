import _ from "underscore-bd";
import vx from "backbone-front-bd";
import Mn from "backbone.marionette";
import ejs from "ejs";
import utils from "./utils";

var obj = {
    model: {},
    collection: {},
    view: {},
    app: {},
    model_prototype: {},
    collection_prototype: {},
    view_prototype: {},
    app_prototype: {},
    fn: null,
};

obj.view_prototype._render = Mn.View.prototype.render;

obj.view_prototype.waitToRender = false;
obj.view_prototype.renderWithError = true;
obj.view_prototype.renderStatus = false;
obj.view_prototype.renderLoading = false;
obj.view_prototype.renderTimer = null;
obj.view_prototype._firstRender = true;

obj.view_prototype.isReady = utils.isReady;
obj.view_prototype.isWrong = utils.isWrong;
obj.view_prototype.areReadyModelAndCollection =
    utils.areReadyModelAndCollection;
obj.view_prototype.areWrongModelOrCollection = utils.areWrongModelOrCollection;

obj.view_prototype.afterReady = function () { };
obj.view_prototype.afterRendered = function () { };
obj.view_prototype.renderSync = function () {
    this.addLoading && !this.renderLoading && this.addLoading("", "renderSync");
    var isReadyFn = _.bind(this.isReady ? this.isReady : utils.isReady, this),
        isWrong = this.isWrong(),
        isReady = (this.renderWithError && isWrong !== false) || isReadyFn();

    vx.App().log(
        "renderSync",
        this.className || this,
        isWrong,
        isWrong !== false,
        isReady
    );

    clearTimeout(this.renderTimer);
    this.renderTimer = null;
    this.renderLoading = true;
    if (isReady === true) {
        this.afterReady();
        this.removeLoading && this.removeLoading("renderSync", 0);
        this.renderLoading = false;
        this.renderStatus = true;
        // _.bind(obj.view_prototype._render, this)();
        this._render();
        this.afterRendered();
    } else if (this.renderTimer === null) {
        this.renderTimer = setTimeout(() => {
            vx.debug.log(`interval insure ${isReady[0]} -${isReady[1] || "-"}`);
            this.render();
        }, 500);
    }
    return this;
};

obj.view_prototype.renderWithErrorTitle = "Informação";
obj.view_prototype.renderWithErrorMsg =
    "Houve um problema ao consultar os dados. Tente novamente.";
obj.view_prototype.showRenderWithErrorMsg = function () {
    if (!this.renderWithErrorMsg) return;

    var title = this.renderWithErrorTitle,
        msg = this.renderWithErrorMsg;

    vx.App().ux.popup.info({ title: title, msg: msg });
};

obj.view_prototype.serializeData = function () {
    return {
        App: vx.app,
        vx,
        _,
        view: this,
        model: this.model,
        collection: this.collection,
        relatedLists: this.relatedLists || {},
        data: _.result(this, "data") || {},
        options: this.options,
        cid: this.cid,
        renderPartial: (viewName, opts) => this.renderPartial(viewName, opts),
    };
};

const ejsConfig = { strict: false };
obj.renderer = function (template, data) {
    if (this.ejs && !_.isFunction(template)) {
        var config = _.defaults(
            this.ejsConfig || {},
            vx.app().ejsConfig || ejsConfig
        );
        return ejs.render(template, data, config);
    }
    var compiled = _.isFunction(template) ? template : _.template(template);
    return compiled(data);
};

obj.view_prototype.templates = {};
obj.view_prototype.ejs = true;
obj.view_prototype.renderPartial = function (viewName, opts = {}) {
    const renderer = _.bind(obj.renderer, this);
    return renderer(
        this.templates[viewName],
        _.extend(this.serializeData(), opts)
    );
};

export default obj;
