import _ from "underscore-bd";
import vx from "backbone-front-bd";
import Masks from "front-bd/src/masks/igorescobar";
import mnx from "../define";
import autoUtilEvents from "./autoUtilEvents";
import nuSync from "./nuSync";

var structure = {
    afterRender() {
        this.setActions();
        this.showBreadcrumb();
        this.customize();
    },
};

var compositeStructure = _.extend(
    {},
    _.clone(mnx.utils.viewActions),
    structure
);

var view = nuSync.extend(compositeStructure);

export { structure, compositeStructure, view };
export default view;
