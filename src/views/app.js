import _ from "underscore-bd";
import vx from "backbone-front-bd";
import sync from "./sync";

export default sync.extend({
    el: ".body",
    wrapperRemoved: true, // for sync view to work as appview
    removeWrapper() { }, // for sync view to work as appview
    isTrullyVisible: false, // used to run events after app is visible on screen
    regions: {
        content: ".content",
    },
    initialize(o) { },
    // dealing with external old plugins
    loadOldAssets(old_assets, callback) {
        var assets = [];
        var old_assets_html =
            typeof old_assets === "function"
                ? old_assets()
                : old_assets || "",
            $container;
        //

        if (typeof old_assets !== "undefined" && old_assets) {
            $container = $("<div>").append(old_assets_html);

            $("script", $container).each((x, el) => {
                var $el = $(el);
                var $script = $("<script>");
                $script.attr("data-loaded", "0");
                $("body").append($script); // You should also append the script to the DOM before attaching the onload event:
                $script[0].onload = function () {
                    $(this).attr("data-loaded", "1");
                };
                $script[0].src = $el.attr("src"); // You should set the src attribute after the onload event
                assets.push($script);
            });

            $("link", $container).each((x, el) => {
                var $el = $(el);
                var $this = $("<link>");
                $this.attr("data-loaded", "0");
                $("body").append($this); // You should also append the link to the DOM before attaching the onload event:
                $this[0].onload = function () {
                    $(this).attr("data-loaded", "1");
                };
                $this[0].type = $el.attr("type");
                $this[0].rel = $el.attr("rel");
                $this[0].href = $el.attr("href"); // You should set the href attribute after the onload event
                assets.push($this);
            });
        }

        this.oldAssetsAreLoaded(assets, callback);
    },
    oldAssetsAreLoaded(assets, callback) {
        this.oldAssetsLoaded = false;
        this.assetInterval = setInterval(
            _.partial(
                (assets, callback) => {
                    if (this.checkOldAssetsStatus(assets)) {
                        clearInterval(this.assetInterval);
                        this.oldAssetsLoaded = true;
                        typeof callback === "function" && callback();
                    }
                },
                assets,
                callback
            ),
            200
        );
    },
    checkOldAssetsStatus(assets) {
        if (_.size(assets)) {
            for (let asset of assets) {
                let $asset = $(asset);
                if (!$asset.is("script") && !$asset.is("link")) continue;

                if ($asset.is("script")) {
                    if ($asset.attr("data-loaded") != "1") return false;
                } else if ($asset.is("link")) {
                    if (
                        typeof asset === "object" &&
                        "sheet" in asset &&
                        !this.isCSSLinkLoaded(asset)
                    )
                        return false;
                }
            }
        }

        return true;
    },
    afterLoadOldAssets(callback) {
        vx.utils.when(
            () => "oldAssetsLoaded" in this && this.oldAssetsLoaded,
            () => {
                callback();
            }
        );
    },
    isCSSLinkLoaded(link) {
        return Boolean(link.sheet);
    },
    startAfterAttached() {
        vx.utils.when(
            () => {
                vx.app().log(
                    "A-1 waiting appViewAttached. - " +
                    !!vx.app().appViewAttached
                );
                return vx.app().appViewAttached;
            },
            () => this.start(),
            10
        );
    },
    loadOldAssetsAtStart: true,
    start() {
        vx.app().log("C-0 appview start called and app.execute triggered");
        this.listenTo(vx.app(), "appready", () => {
            this.afterAppReadyRender();
        });

        vx.app().execute();
        this.loadOldAssetsAtStart && this.startToLoadOldAssets();
    },
    startToLoadOldAssets() {
        if (!this.options.old_assets) {
            vx.app().log("D-0 skipping old assets");
            return this.setReady();
        }
        vx.app().log("D-0 loading old assets");
        return this.loadOldAssets(this.options.old_assets, () =>
            this.setReady()
        );
    },
    afterAppReadyRender() {
        // testing loadoldassets on start()
        !this.loadOldAssetsAtStart && this.startToLoadOldAssets();
    },
    amIVisible() {
        return this.$el.is(":visible") && $("*:last", this.$el).is(":visible");
    },
    afterVisible() {
        this.isTrullyVisible = true;
        this.afterReady();
    },
    setReady() {
        vx.app().log("D-1 loaded old assets");
        vx.utils.when(
            () => this.amIVisible(),
            () => this.afterVisible(),
            30
        );
    },
    afterReady() { },
    setActions(actions, view) { },
    afterNavigate() {
        // remove all toasts after navigating to another page
        setTimeout(
            () => vx.app().ux.toast && vx.app().ux.toast.removeAll(),
            1500
        );
        this.trigger("navigate");
    },
});
