import _ from "underscore-bd";
import vx from "backbone-front-bd";
import actionBar from "./actionBar";
import form from "./form";
import { structure as popupStructure } from "./popup";

var structure = {
    renderFn: "renderBody",
    initialize() {
        this.templateBody = this.template;
        this.template = false;

        this.validateOnSet = false;

        this.addLoading("", "init");
        this.modelInit();
        this.renderListener();

        this.showChildView("footer", new actionBar());
        this.setActions();

        return this;
    },
    goback(saved) {
        if (saved) {
            var fn = () => {
                saved && this.trigger("saved");
                this.trigger("close");
                vx.app().ux.popup.close(this.modal);
            };

            fn();
        } else {
            this.trigger("close");
            vx.app().ux.popup.close(this.modal);
        }
    },
    goto(u) {
        this.cancel();
        this.addLoading("", "goto");
        setTimeout(() => {
            this.removeLoading("goto");
            _.bind(form.prototype.goto, this)(u);
        }, 600);
    },
};

var compositeStructure = _.extend({}, popupStructure, structure);

var view = form.extend(compositeStructure);

export { structure, compositeStructure, view };
export default view;
