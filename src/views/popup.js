import _ from "underscore-bd";
import vx from "backbone-front-bd";

import mnx from "../define";
import sync from "./sync";
import actionBar from "./actionBar";

var structure = {
    showActionsOnApp() { },
    showBreadcrumbOnApp() { },
    isPopup: true,
    template: false,
    // globalify: false,
    el: function () {
        return this.setModal();
    },
    popupSize: "",
    dialogCss: "container",
    renderFn: "renderBody",
    regions: {
        header: ".modal-header",
        body: ".modal-body",
        footer: ".modal-footer",
    },
    actionsRegion: "footer",
    initialize(o) {
        this.showChildView("footer", new actionBar());

        this.addLoading("", "init");
        this[this.renderFn]();
        return this;
    },
    setModal() {
        if (!this.modal) {
            this.modal = vx
                .app()
                .ux.popup.info({
                    title: this.title || " ",
                    body: "<div></div>",
                })
                .removeClass("show")
                .addClass("d-none");

            var $dialog = $(".modal-dialog", this.modal)
                .addClass("popup-dialog")
                .removeClass("modal-dialog"),
                popupSize = _.result(this, "popupSize"),
                dialogCss = _.result(this, "dialogCss");

            popupSize && $dialog.css("max-width", popupSize);
            dialogCss && $dialog.addClass(dialogCss);

            $(".modal-footer", this.modal).html("");
        }

        return this.modal[0];
    },
    showInheritedTitle() {
        var $title = $("h1, h2", this.$el).eq(0),
            $header = this.getRegion("header").$el,
            $headerTitle = $(".title", $header);

        if (!$title.length) return false;

        if (!$headerTitle.length) {
            $headerTitle = $('<span class="title">');
            $header.prepend($headerTitle);
        }
        $headerTitle.html($title.html());
        $title.parents(".row:first").remove();
        return true;
    },
    renderBody() {
        $("*", this.getRegion("body").$el).remove();
        this.getRegion("body").$el.append(
            this._renderHtml(this.templateBody, this.serializeData())
        );

        this.applyBehaviors && this.applyBehaviors(this.getRegion("body").$el);

        this.afterRender && this.afterRender();
    },
    afterRender() {
        this.setActions();
        if (!this.showInheritedTitle()) {
            this.showBreadcrumb();
            this.showInheritedTitle();
        }
        this.customize();

        if (this.isReady()) this.afterReady();
    },
    afterReady() {
        setTimeout(() => {
            this.showPopup();
            this.removeLoading("init");
        }, 400);
    },
    showPopup() {
        this.modal.removeClass("d-none").addClass("show");
    },
    cancel(e) {
        this.goback();
    },
    goback(saved) {
        saved && this.trigger("saved");
        this.trigger("close");

        vx.app().ux.popup.close(this.modal);
    },
    actionBackIcon: () => "times",
    actionBackColor: () => "light",
    actionBackText: () => "Fechar",
    getActionBack() {
        return {
            ico: _.result(this, "actionBackIcon"),
            btnColor: _.result(this, "actionBackColor"),
            title: _.result(this, "actionBackText"),
            callback: (e) => this.cancel(e),
        };
    },
    getDefaultActions(place = 0) {
        var a = [],
            aBack = this.getActionBack();

        if (!place) {
            aBack && a.push(aBack);
        }

        return a;
    },
    showActions: sync.prototype.showActions,
    customize() { },
};

var compositeStructure = _.extend(
    {},
    _.clone(mnx.utils.viewActions),
    structure
);

var view = mnx.view.extend(compositeStructure);

export { structure, compositeStructure, view };
export default view;
