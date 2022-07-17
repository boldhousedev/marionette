import _ from "underscore-bd";
import vx from "backbone-front-bd";
import Bb from "backbone";
import Mn from "backbone.marionette";
import utils from "./utils";
import seo from "./seo";

export default Mn.Application.extend(
    _.extend(
        {
            logs: true,
            homeLink: "/",
            router: vx.router,
            navigationData: {},
            navigate(u, o = {}) {
                o = _.defaults(o, { trigger: true });
                u.indexOf("/") !== 0 && (u = "/" + u);
                var navigationData = {
                    page_title: u.split("/")[1] || "index",
                    page_path: u,
                };

                if (
                    this.navigationData.page_path !== navigationData.page_path
                ) {
                    this.navigationData = navigationData;
                    this.gtag("event", "page_view", this.navigationData);
                }
                vx.router.navigate(u, o);
            },
            getNavigationData(u) {
                if (!this.navigationData.page_path || u) {
                    !u && (u = window.location.pathname);
                    u.indexOf("/") !== 0 && (u = "/" + u);
                    var navigationData = {
                        page_title: u.split("/")[1] || "index",
                        page_path: u,
                    };

                    return navigationData;
                }
                return this.navigationData;
            },
            startRouter() {
                if (Bb.history && !this.historyStarted) {
                    this.historyStarted = true;
                    this.globalEvents();
                    Bb.history.start({ pushState: true, root: "/" }); // removes # from url
                }
            },
            isMobile() {
                return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(
                    navigator.userAgent
                );
            },
            newWebpackBuildDetect(newVersionFn) {
                var script = _.filter(
                    // $('script:not([src$="min.js"])').toArray(),
                    document.getElementsByTagName("script"),
                    (el) => /\/runtime\.([0-9a-zA-Z]+)\.js$/.test(el.src)
                );

                _.each(script, (el) => {
                    var src = el.src + "?_=" + new Date().getTime();
                    $.ajax({ url: src, dataType: "text" }) // datatype will avoid script to be executed
                        .done(function (d, s, r) {
                            if (
                                r
                                    .getResponseHeader("content-type")
                                    .toLowerCase()
                                    .indexOf("application/javascript") === -1
                            ) {
                                return newVersionFn();
                            }
                        })
                        .fail(() => {
                            newVersionFn();
                        });
                });
            },
            globalEvents() {
                this.globalEventClickLink();
                this.globalEventClickAnchor();
            },
            globalEventClickLink() {
                $(document).on(
                    "click",
                    'a[href^="/"]:not([target]),button[href^="/"]:not([target])',
                    (e) => {
                        e && vx.events.preventDefault(e);
                        if (!this.online) return;
                        var el = e.currentTarget;
                        this.navigate(el.attributes.href.value, {
                            trigger: true,
                        });
                    }
                );
            },
            globalEventClickAnchor() {
                $(document).on(
                    "click",
                    'a[href^="#"]:not([data-toggle]),button[href][href^="#"]:not([data-toggle])',
                    (e) => {
                        if (!this.online) return;
                        var $el = $(e.currentTarget);
                        if ($el.attr("href") === "#") return;

                        e && vx.events.preventDefault(e);
                        var $scroll = $($el.attr("href")),
                            offsetTop = $scroll.offset()["top"],
                            headerHeight = this.headerHeight();

                        $("body, html").animate(
                            {
                                scrollTop: offsetTop - headerHeight,
                            },
                            parseInt($el.attr("data-scroll-speed") || 1000, 10)
                        );
                    }
                );
            },
            headerHeight() {
                return $("header").height();
            },
        },
        _.clone(utils.log),
        _.clone(utils.viewLoading),
        _.clone(utils.viewScroll),
        _.clone(seo)
    )
);
