import _ from "underscore-bd";
import vx from "backbone-front-bd";
import Bb from "backbone";
import App from "./app";
import utils from "./utils";

export default App.extend({
    executed: 0,
    execute() {
        this.executed = 1;
        this.triggerReady();
    },
    initialize(o) {
        this.online = true;
        this.initAuth();

        vx.debug.globalify("_", _);
        vx.debug.globalify("$", $);
        vx.debug.globalify("vx", vx);

        // listening false used to do not reload app if any related list is reloaded by some view or model
        // fetch is here instead of being on initialize because appview can add global dependencies
        if (!this.fetchRelatedLists({ listening: false })) {
            this.triggerReady();
        }
    },
    initAuth() {
        if (this.Auth) {
            var a = this.Auth;
            this.auth = new a();
            this.listenTo(this.auth, "logout", () => this.afterLogout());
            this.listenTo(this.auth, "logged", () => {
                vx.utils.when(
                    () => {
                        return (
                            this.getView() && this.appView.$el.is(":visible")
                        );
                    },
                    () => this.isLoggedEvents()
                );
            });
        }
    },
    afterLogoutLink: "/",
    afterLogout() {
        this.isLoggedEvents();
        vx.router.navigate(this.afterLogoutLink, {
            trigger: true,
        });
    },
    allDone() {
        return this.executed === 9;
    },
    // primeiro metodo executado apos o app.start do marionette
    onStart() {
        var AppView = this.options.AppView;
        this.appView = new AppView({ App: this });

        this.addStartLoading();
        vx.debug.globalify("app", this);
        // remove loading somente quando a appview estiver exibida
        vx.utils.when(
            () => {
                this.log("Z waiting appView.isTrullyVisible");
                return this.appView.isTrullyVisible;
            },
            () => {
                this.afterIsTrullyVisible();
            },
            50
        );

        this.appView.$el.hide();
        vx.utils.when(
            () => {
                this.log("B-0 waiting appview.template and appview.isready");
                return (
                    _.indexOf(
                        ["function", "string"],
                        typeof this.appView.template
                    ) !== -1 &&
                    (!this.appView.isReady || this.appView.isReady() === true)
                );
            },
            () => {
                this.log("B-1 showview set");
                // acontece antes do App.execute
                this.showView(this.appView);
                this.appViewAttached = true;
            },
            30
        );
    },
    afterIsTrullyVisible() {
        this.removeStartLoading();
        this.executed = 9;
    },
    addStartLoading() {
        this._loadId = vx.ux.loading.add("");
    },
    removeStartLoading() {
        vx.ux.loading.remove(this._loadId);
    },
    showContent(view) {
        this.log("F-0 showcontent called");
        vx.utils.when(
            () => {
                this.log("F-1 waiting view");
                return this.getView();
            },
            () => {
                this.log("F-2 showcontent executed");
                // this.isLoggedEvents();
                var viewObj = typeof view === "object" ? view : null;

                if (this.getView().getRegion("content")) {
                    this.getView()
                        .getRegion("content")
                        .currentView?.trigger("unload");
                    this.getView().getRegion("content").show(viewObj);

                    if (!this.appView.$el.is(":visible")) {
                        this.log("F-3 show appview");
                        this.appView.$el.show();
                    }
                }
            },
            30
        );
    },
    isLoggedEvents() { },
    /* sync */
    relatedLists: {},
    globalLists: {},
    isAllRelatedReady: vx.view.prototype.isAllRelatedReady,
    areAllListsReady: vx.view.prototype.areAllListsReady,
    isAnyListWrong: vx.view.prototype.isAnyListWrong,
    addRelatedList: vx.view.prototype.addRelatedList,
    storeRelatedList: vx.view.prototype.storeRelatedList,
    fetchAndStateList: vx.view.prototype.fetchAndStateList,
    // fetchAndStateRelatedList: vx.view.prototype.fetchAndStateRelatedList,
    // fetchAndStateGlobalList: vx.view.prototype.fetchAndStateGlobalList,
    // fetchRelatedLists: vx.view.prototype.fetchRelatedLists,
    // fetchGlobalLists: vx.view.prototype.fetchGlobalLists,
    fetchAllLists: vx.view.prototype.fetchAllLists,
    fetchRelatedLists(opts = {}) {
        if (!vx.app()) {
            return setTimeout(() => this.fetchRelatedLists(opts), 10);
        }
        return _.bind(vx.view.prototype.fetchRelatedLists, this)(opts);
    },
    fetchGlobalLists(opts = {}) {
        if (!vx.app()) {
            return setTimeout(() => this.fetchGlobalLists(opts), 10);
        }
        return _.bind(vx.view.prototype.fetchGlobalLists, this)(opts);
    },
    fetchAndStateRelatedList(name, opts = {}) {
        if (!vx.app()) {
            return setTimeout(
                () => this.fetchAndStateRelatedList(name, opts),
                10
            );
        }
        return _.bind(vx.view.prototype.fetchAndStateRelatedList, this)(
            name,
            opts
        );
    },
    fetchAndStateGlobalList(name, opts = {}) {
        if (!vx.app()) {
            return setTimeout(
                () => this.fetchAndStateGlobalList(name, opts),
                10
            );
        }
        return _.bind(vx.view.prototype.fetchAndStateGlobalList, this)(
            name,
            opts
        );
    },
    setGlobalList(name, oClass, o = {}) {
        var l = this.globalLists[name];
        // if (!l || (!o.id && l.id) || (o.id && l.getId() + "" !== o.id + "")) {

        if (
            !l ||
            (l instanceof Bb.Model &&
                (!o.id || (o.id && l.getId() + "" !== o.id + "")))
        ) {
            // always instantiate models without id
            l = new oClass(o);
        }

        this.globalLists[name] = l;
        return this.globalLists[name];
    },
    getGlobalList(name, oClass, o = {}) {
        return this.globalLists[name];
    },
    isReady() {
        return this.areAllListsReady();
    },
    triggerReady() {
        var isReady = this.isReady() && this.executed === 1;

        if (isReady === true) {
            this.executed = 2;
            this.log("C-1 app isready and was executed ! (appready triggered)");
            this.trigger("appready");
            this.log("C-2 router started");
            this.startRouter();
        }

        return isReady;
    },
});
