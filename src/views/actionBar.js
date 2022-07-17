import _ from "underscore-bd";
import mnx from "../define";

import template from "../templates/actionBar.jst";

export default mnx.view.extend({
    ejs: false,
    template: template,
    setActions(actions, o = {}) {
        this.options.actions = actions;
        this.options.global = o;

        this.undelegateEvents();
        this.events = {};
        for (let x in this.options.actions) {
            var action = this.options.actions[x];
            if (!action) {
                delete this.options.actions[x];
                continue;
            }

            if ("callback" in action) {
                this.events["click .action-" + x] = action.callback;
            }

            !action.addClass && (action.addClass = "");
            o.addClass && (action.addClass += " " + o.addClass);
        }
        this.render();
        this.delegateEvents();
        return this;
    },
});
