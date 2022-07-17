import _ from "underscore-bd";
import vx from "backbone-front-bd";
import { structure, view } from "./grid";

import popup from "./popup";

export default popup.extend(
    _.extend({}, structure, {
        ejs: false,
        globalify: false,
        templateBody: view.prototype.template,
        getDefaultActions: popup.prototype.getDefaultActions,
        regions: _.defaults(
            {
                header: ".modal-header",
                body: ".modal-body",
                footer: ".modal-footer",
            },
            view.prototype.regions
        ),
        initialize() {
            _.bind(popup.prototype.initialize, this)();
            _.bind(view.prototype.initialize, this)();
        },
    })
);
