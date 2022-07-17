import _ from "underscore-bd";
import bbxf from "backbone-front-bd";

import uxLoading from "front-bd/src/ux/loading";
import Masks from "front-bd/src/masks/igorescobar";

var obj = {
    Masks,
};

obj.removeWrapper = function () {
    if ("wrapperRemoved" in this) return this; // this is very important addition made by my oldself. do not use removewrapper2 unless you are 120% sure of it
    // Get rid of that pesky wrapping-div.
    // Assumes 1 child element present in template.
    this.$el = this.$el.children();
    // Unwrap the element to prevent infinitely
    // nesting elements during re-render.
    this.$el.unwrap();
    this.setElement(this.$el);
    this.wrapperRemoved = true;
};

obj.removeWrapper2 = function () {
    // Get rid of that pesky wrapping-div.
    // Assumes 1 child element present in template.
    this.$el = this.$el.children();
    // Unwrap the element to prevent infinitely
    // nesting elements during re-render.
    this.$el.unwrap();
    this.setElement(this.$el);
    this.wrapperRemoved = true;
};

obj.areReadyModelAndCollection = function () {
    var s = true;
    if (this.model && this.model.isReady() !== true) {
        if (this.model.infoRelatedReady) s = [-31, this.model.infoRelatedReady];
        s = -3;
    }
    if (this.collection && this.collection.isReady() !== true) {
        if (this.collection.infoRelatedReady)
            s = [-41, this.collection.infoRelatedReady];
        if (this.collection.infoModelsReady)
            s = [-42, this.collection.infoModelsReady];
        s = -4;
    }

    return s;
};

obj.isReady = function () {
    var s = true,
        modelAndCollectionReady = this.areReadyModelAndCollection();

    if (_.result(this, "waitToRender")) s = -1;
    else if (!typeof this.template === "function") s = -2;
    else if (modelAndCollectionReady !== true) s = modelAndCollectionReady;
    else if ("isAllRelatedReady" in this && this.isAllRelatedReady() !== true) {
        if (this.infoRelatedReady) s = [-51, this.infoRelatedReady];
        s = -5;
    }
    typeof s === "number" && (s = [s]);

    return s;

    // if (!this.waitToRender &&
    //         typeof this.template === 'function' &&
    //         (!this.model || this.model.isReady()===true) &&
    //         (!this.collection || this.collection.isReady()===true) &&
    //         (!('isAllRelatedReady' in this) || this.isAllRelatedReady())) {
    //     return true;
    // }
    // return false;
};

obj.areWrongModelOrCollection = function () {
    var s = false;
    if (this.model && this.model.isWrong() !== false) {
        if (this.model.infoRelatedReady) s = [-31, this.model.infoRelatedReady];
        s = -3;
    }
    if (this.collection && this.collection.isWrong() !== false) {
        if (this.collection.infoRelatedReady)
            s = [-41, this.collection.infoRelatedReady];
        if (this.collection.infoModelsReady)
            s = [-42, this.collection.infoModelsReady];
        s = -4;
    }
    return s;
};

obj.isWrong = function () {
    var s = false,
        areWrongModelOrCollection = this.areWrongModelOrCollection();

    if (areWrongModelOrCollection !== false) s = areWrongModelOrCollection;
    else if ("isAnyListWrong" in this && this.isAnyListWrong() !== false) {
        if (this.infoRelatedWrong) s = [-51, this.infoRelatedWrong];
        s = -5;
    }
    typeof s === "number" && (s = [s]);

    return s;
};

// actions
obj.viewActions = {
    getDefaultActions() {
        return [];
    },
    getCustomActions() {
        return [];
    },
    getActions(place = 0) {
        return _.union(
            this.getDefaultActions(place),
            this.getCustomActions(place)
        );
    },
    setActions() {
        var actions = this.formatActions(),
            l = [];

        for (let action of actions) {
            l.push(action);
        }

        this.showActions(l);
    },
    getActionData() {
        return {
            App: bbxf.app(),
            context: this,
            model: this.model,
            collection: this.collection,
            m: this.model,
            c: this.collection,
            self: this,
            view: this,
            querystring: window.location.search,
            moduleName: this.moduleName || null,
        };
    },
    formatActions(actions) {
        if (!("moduleName" in this) && !this.isPopup) return []; // view loaded not by routing

        var alias = this.alias;
        !actions && (actions = this.getActions());

        var actionData = this.getActionData();

        for (let x in actions)
            if (actions[x]) {
                let querystring = actionData.querystring.replace("?", "");
                if ("navigate" in actions[x]) {
                    actions[x]["navigate"] = _.template(actions[x]["navigate"])(
                        actionData
                    );
                    let navigateQuerystring =
                        (/\?/.test(actions[x]["navigate"]) ? "&" : "?") +
                        querystring;

                    actions[x]["navigate"] += this.keepUrlQuerystring
                        ? navigateQuerystring
                        : "";
                }
                if ("route" in actions[x]) {
                    actions[x]["route"] = _.template(actions[x]["route"])(
                        actionData
                    );
                    let routeQuerystring =
                        (/\?/.test(actions[x]["route"]) ? "&" : "?") +
                        querystring;

                    actions[x]["route"] += this.keepUrlQuerystring
                        ? routeQuerystring
                        : "";
                }
                "auth" in actions[x] &&
                    (actions[x]["auth"] = _.template(actions[x]["auth"])(
                        actionData
                    ));
            }

        return actions;
    },
    formatNavigateUrl(tpl) {
        var actionData = this;
        return _.template(tpl)(actionData);
    },
    actionsOptions: {
        addSpanForTitle: true,
        addClass: "text-2",
    },
    getActionsOptions(actions) {
        return _.extend(this.actionsOptions || {}, { context: this });
    },
    actionsRegion: "actions",
    showActions(actions = null) {
        var actionsRegion = this.actionsRegion;
        if (actionsRegion in this.regions) {
            return this.showActionsInside(actions);
        }
        if (this !== bbxf.app().getView())
            return this.showActionsOnApp(actions);
    },
    showActionsOnApp(actions = null) {
        typeof bbxf.app().getView() === "object" &&
            "showActions" in bbxf.app().getView() &&
            bbxf
                .app()
                .getView()
                .showActions(actions, this.getActionsOptions(actions));
    },
    showActionsInside(actions = null) {
        var actionsRegion = this.actionsRegion;
        const ActionBar = bbxf.mnx.views.actionBar;
        const actionBar = new ActionBar();
        this.showChildView(
            actionsRegion,
            actionBar.setActions(actions, this.getActionsOptions(actions))
        );
        this.customizeActionsInside(actions);
        $(".actions", this.$el).removeClass("d-none");
    },
    renderInlineActions(actions) {
        const ActionBar = bbxf.mnx.views.actionBar;
        const actionBar = new ActionBar().setActions(
            actions,
            this.getActionsOptions(actions)
        );

        return actionBar;
    },
    showActionsInline(actions, actionsCol) {
        var o = this.getActionsOptions(actions);
        !actionsCol && (actionsCol = o.actionsCol);

        var $table = $("table", this.$el),
            $actions = $('tr td[data-name="' + actionsCol + '"]', $table);

        if (!$actions.length) return;

        var preparedActions = _.map(actions, (action) => {
            action.navigate && (action._navigate = action.navigate);
            action.route && (action._route = action.route);
            return action;
        });

        $actions.each((x, el) => {
            var $actionCol = $(el),
                selectedId = this.getSelectedRowAttr({ target: el }, "id"),
                model = this.collection.find((model) => model.id == selectedId),
                filteredActions = _.filter(
                    preparedActions,
                    (action) => !action.rule || action.rule(model)
                );

            var formattedActions = _.map(filteredActions, (action) => {
                action._navigate &&
                    (action.navigate = this.formatAction2nd(
                        action._navigate,
                        selectedId,
                        model
                    ));
                action._route &&
                    (action.route = this.formatAction2nd(
                        action._route,
                        selectedId,
                        model
                    ));

                return action;
            }),
                actionBar;

            actionBar = this.renderInlineActions(formattedActions);
            $actionCol.html("").append(actionBar.$el);
        });
    },
    /*
     * Each grid action is rendered twice. 1st is global render (containing the collection), 2nd is inline render (containing refering model)
       To use the second render each { and } shoud be placed as [ and ] instead
     */
    formatAction2nd(url, selectedId, model) {
        if (url) {
            // legacy code
            url = url.replace("/pk", "/" + selectedId);

            // templating 2nd level
            url = url
                .replace(/\[\[/g, "{{")
                .replace(/\]\]/g, "}}")
                .replace(/\[\%/g, "{%")
                .replace(/\%\]/g, "%}");
            url = _.template(url)({
                model,
                m: model,
            });
        }

        return url;
    },
    customizeActionsInside(actions = null) { },
    breadcrumbText: "",
    breadcrumbTag: "h2",
    breadcrumbCssClass: "col-12 col-md-auto text-start",
    breadcrumbContainerCssClass: "text-1 text-md-3",
    breadcrumbActionsCssClass: "col-12 col-lg text-end mt-3 mt-lg-0",
    getBreadcrumbText() {
        return _.result(this, "breadcrumbText") || "";
    },
    getBreadcrumbTag() {
        return this.breadcrumbTag || "div";
    },
    getBreadcrumbCssClass() {
        return this.breadcrumbCssClass || "";
    },
    getBreadcrumbContainerCssClass() {
        return this.breadcrumbContainerCssClass || "";
    },
    getBreadcrumbActionsCssClass() {
        return this.breadcrumbActionsCssClass || "";
    },
    showBreadcrumb(text) {
        !text && (text = this.getBreadcrumbText());
        if (this.getBreadcrumbContainer()) {
            return this.showBreadcrumbInside(text);
        }

        if (this !== bbxf.app().getView())
            return this.showBreadcrumbOnApp(text);
    },
    getBreadcrumbContainer() {
        return $(".breadcrumb-container", this.$el).length
            ? $(".breadcrumb-container", this.$el)
            : null;
    },
    showBreadcrumbOnApp(text = "") {
        typeof bbxf.app().getView() === "object" &&
            "showBreadcrumb" in bbxf.app().getView() &&
            bbxf.app().getView().showBreadcrumb(text);
    },
    showBreadcrumbInside(text = "") {
        var $breadcrumb = this.getBreadcrumbContainer();
        $(".breadcrumb-text", $breadcrumb).remove();
        $(
            `<${this.getBreadcrumbTag()} class="${this.getBreadcrumbCssClass()}">`
        )
            .addClass("breadcrumb-text")
            .html(text)
            .prependTo($breadcrumb);
        this.customizeBreadcrumbInside(text);
        $breadcrumb.removeClass("d-none");
    },
    customizeBreadcrumbInside(text = "") { },
};

// loading

obj.viewLoading = Object.freeze({
    _loadingIds: {},
    _loadingExecution: {},
    _isSubmitting: false,
    _loadingText: " ",
    isSubmitting() {
        return !!this._isSubmitting;
    },
    isLoadingExecuting(uniqId) {
        return !!this._loadingExecution[uniqId];
    },
    addLoading(text, uniqId) {
        if (this.isLoadingExecuting(uniqId) === false) {
            this._loadingIds[uniqId] = uxLoading.add(text || this._loadingText);
            this._loadingExecution[uniqId] = true;
        }
    },
    removeLoading(uniqId, timeout = 0) {
        if (this.isLoadingExecuting(uniqId) === true) {
            setTimeout(() => {
                uxLoading.remove(this._loadingIds[uniqId]);
                this._loadingExecution[uniqId] = false;
            }, timeout);
        }
    },
    addSubmitLoading(text) {
        this.addLoading(text, "submit");
        // if(this.isSubmitting()===false) {
        //     this._loadIdSubmitting = uxLoading.add(text || this._loadingText);
        //     this._isSubmitting = true;
        // }
    },
    removeSubmitLoading() {
        this.removeLoading("submit", 400);
        // if(this.isSubmitting()===true) {
        //     uxLoading.remove(this._loadIdSubmitting);
        //     this._isSubmitting = false;
        // }
    },
});

obj.viewScroll = Object.freeze({
    getHeaderHeight() {
        return $("header").height();
    },
    getScrollTopOffset($el) {
        !$el && ($el = this.$el);
        return $el.offset()["top"];
    },
    getScrollTopPos($el) {
        return this.getScrollTopOffset($el) - this.getHeaderHeight();
    },
    scrollTopDelay: 500,
    scrollTopEffect: "swing",
    afterScrollTop() { },
    scrollTop() {
        this.scrollTo(this.$el);
    },
    scrollTo($el) {
        var body = $("html, body");
        body.stop().animate(
            { scrollTop: this.getScrollTopPos($el) },
            this.scrollTopDelay,
            this.scrollTopEffect,
            _.bind(this.afterScrollTop, this)
        );
    },
});

obj.log = {
    log() {
        var args = Array.from(arguments);
        !!this.logs && bbxf.debug.log.apply(bbxf.debug, args);
    },
};

export default obj;
