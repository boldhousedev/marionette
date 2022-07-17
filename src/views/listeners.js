import Bb from "backbone";
import vx from "backbone-front-bd";
import _ from "underscore-bd";

export default {
    autoFetch: true,
    fetchMethod: "fetch",
    renderListener() {
        var o = this.model || this.collection;
        o && (o.errorsMap = {});

        this.on("ready", () => this[this.renderFn]());

        if (!this.fetchRelatedLists() && this.isReady() === true) {
            this[this.renderFn]();
        }

        if (o) {
            // look at the final lines of initialize. there's the ensurement
            // if (this.areReadyModelAndCollection() === true)
            //     this[this.renderFn]();
            this.addRenderListener(o);

            if (
                this.options.id ||
                (o instanceof Bb.Collection && !o.isReady())
            ) {
                _.result(this, "autoFetch") && o[this.fetchMethod]();
            }

            o.listenTo(o, "removeError", (field) => this.removeError(field));
        }
    },
    addRenderListener(o) {
        if (o) {
            this.listenTo(o, this.renderOnState, () => {
                this[this.renderFn]();
            });
            this.listenTo(o, "error", (o, xhr, opts) => {
                this.renderCancel(o, xhr, opts);
            });
            // this.listenTo(
            //     [o, this.renderOnState, () => this[this.renderFn]()],
            //     [o, "error", (o, xhr, opts) => this.renderCancel(o, xhr, opts)]
            // );
        }
    },
    renderListenerUnique() {
        var o = this.model || this.collection;
        o && (o.errorsMap = {});

        this.on("ready", () => this[this.renderFn]());

        if (!this.fetchRelatedLists() && this.isReady() === true) {
            this[this.renderFn]();
        } else if (o) {
            // look at the final lines of initialize. there's the ensurement
            // if (this.areReadyModelAndCollection() === true)
            //     this[this.renderFn]();
            this.addRenderListenerUnique(o);

            if (this.options.id || o instanceof Bb.Collection) {
                _.result(this, "autoFetch") && o[this.fetchMethod]();
            }

            o.listenTo(o, "removeError", (field) => this.removeError(field));
        }
    },
    addRenderListenerUnique(o) {
        if (o) {
            // this.listenToOnce(o, this.renderOnState, () => {
            //     this[this.renderFn]();
            // });
            // this.listenTo(o, "error", (o, xhr, opts) => {
            //     this.renderCancel(o, xhr, opts);
            // });
            this.listenToOnce(
                [o, this.renderOnState, () => this[this.renderFn]()],
                [o, "error", (o, xhr, opts) => this.renderCancel(o, xhr, opts)]
            );
        }
    },
    renderCancel(o, xhr, opts) {
        clearTimeout(this.renderTimer);
        this.renderLoading = false;
        vx.showAjaxError(xhr);
        // this.syncError(o, xhr, opts);
        this.removeLoading && this.removeLoading("renderSync", 0);
    },
};
