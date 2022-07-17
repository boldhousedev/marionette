export default {
    loadGAnalytics(analytics_id, ads_id) {
        // console.log('load analytics called');
        // console.log('production detected');
        if (!analytics_id) return;

        // console.log("analytics id : ", analytics_id);
        // console.log("ads id : ", ads_id);
        // <!-- Global site tag (gtag.js) - Google Analytics -->
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
            window.dataLayer.push(arguments);
        };
        this.gtag("js", new Date());

        this.gtag("config", analytics_id);
        ads_id && this.gtag("config", ads_id);
        $(
            '<script async src="https://www.googletagmanager.com/gtag/js?id=' +
                analytics_id +
                '"></script>'
        ).appendTo("head");
    },
    loadTagManager(id) {
        // console.log('load analytics called');
        // console.log('production detected');
        if (!id) return;

        // console.log("tagmanager id : ", i);
        (function (w, d, s, l, i) {
            // <!-- Google Tag Manager -->
            w[l] = w[l] || [];
            w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
            var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != "dataLayer" ? "&l=" + l : "";

            j.async = true;
            j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
            f.parentNode.insertBefore(j, f);

            $("<noscript></noscript>")
                .append(
                    '<iframe src="https://www.googletagmanager.com/ns.html?id=' +
                        i +
                        '" height="0" width="0" style="display:none;visibility:hidden"></iframe>'
                )
                .prependTo("body");
        })(window, document, "script", "dataLayer", id);
    },
    loadPixel(pixel_id) {
        if (!pixel_id) return;

        // console.log("pixel id : ", pixel_id);

        !(function (f, b, e, v, n, t, s) {
            if (f.fbq) return;
            n = f.fbq = function () {
                n.callMethod
                    ? n.callMethod.apply(n, arguments)
                    : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = "2.0";
            n.queue = [];
            t = b.createElement(e);
            t.async = !0;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
        })(
            window,
            document,
            "script",
            "https://connect.facebook.net/en_US/fbevents.js"
        );
        this.fbq("init", pixel_id);
        this.fbq("track", "PageView");

        $("<noscript></noscript>")
            .append(
                '<img height="1" width="1" src="https://www.facebook.com/tr?id=' +
                    pixel_id +
                    '&ev=PageView&noscript=1"/>'
            )
            .prependTo("body");
    },
    fbq(a, b, c) {
        // if (vx.environment() >= vx.constants.env.staging) return;
        // eslint-disable-next-line no-undef
        if (typeof fbq === "function") {
            // eslint-disable-next-line no-undef
            c ? fbq(a, b, c) : fbq(a, b);
        }
    },
    gtag(a, b, c) {
        // if (vx.environment() >= vx.constants.env.staging) return;
        // eslint-disable-next-line no-undef
        if (typeof gtag === "function") {
            // eslint-disable-next-line no-undef
            c ? gtag(a, b, c) : gtag(a, b);
        }
    },
};
