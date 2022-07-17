import _ from "underscore-bd";
import vx from "backbone-front-bd";
import Masks from "front-bd/src/masks/igorescobar";
import mnx from "../define";
import autoUtilEvents from "./autoUtilEvents";
import listeners from "./listeners";

var structure = {
    initialRenderOnState: "ready",
    renderOnState: "ready",
    renderFn: "render",
    render: mnx.view.prototype.renderSync,
    breadcrumbActionsCssClass: "col-12 col-lg text-start mt-3 mt-lg-0",
    masks: Masks,
    onRender() {
        this.removeWrapper();

        if (!this.isReady() === true) return;
        this.applyBehaviors(this.$el);
        this.afterRender && this.afterRender();
        this._firstRender = false;
    },
    removeWrapper() {
        _.bind(mnx.utils.removeWrapper, this)();
    },
    applyBehaviors($el) {
        vx.utils.when(
            () => $.fn.tooltip,
            () => $('[data-toggle="tooltip"]', $el).tooltip()
        );
        this.masks.apply($el);
    },
    globalify() {
        vx.debug.globalify("currentView", this);
        vx.debug.globalify("currentModel", this.model);
    },
    initialize() {
        _.result(this, "globalify");
        this.events = _.extend(
            _.clone(autoUtilEvents.events),
            _.result(this, "events")
        );
        this.validateOnSet = false;

        // event added to render after loading auth access
        "addAuthAccessRelated" in this && this.addAuthAccessRelated();
        this.renderListener();

        return this;
    },
    syncError(model, xhr) {
        this.removeSubmitLoading();
        this.showSyncError(model, xhr);
    },
    getSyncErrorMsg(model, xhr) {
        var json = {};
        if (xhr.responseJSON) {
            json = xhr.responseJSON;
        } else {
            try {
                json = JSON.parse(xhr.responseText);
            } catch (e) { }
        }

        var msg = "Falha interna ao tentar salvar o registro";
        if (json && (json["errorMessage"] || json["message"])) {
            msg = json["errorMessage"] || json["message"];
        } else if ("authorization" in json && json.authorization)
            msg = "Acesso negado";

        return msg;
    },
    showSyncError(model, xhr) {
        vx.app().ux.toast.add({
            msg: this.getSyncErrorMsg(model, xhr),
            color: "danger text-dark font-weight-bold",
        });
    },
    afterRender() {
        this.customize();
    },
    getTarget(e) {
        return e.currentTarget || e.target;
    },
    customize() { },
};

var compositeStructure = _.extend(
    {},
    _.clone(autoUtilEvents),
    _.clone(listeners),
    structure
);

var view = mnx.view.extend(compositeStructure);

export { structure, compositeStructure, view };
export default view;
