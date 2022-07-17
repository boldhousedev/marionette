import _ from "underscore-bd";
import front from "front-bd";

var obj = {
    model: {},
    collection: {},
    view: {},
    app: {},
    model_prototype: {},
    collection_prototype: {},
    view_prototype: {},
    app_prototype: {},
};

obj.view.Mark = function (name, replace = false) {
    this.prototype.className = name;
    return front.locator.addListItem("view", name, this, replace);
};

obj.app.Mark = function (name, replace = false) {
    return front.locator.addListItem("app", name, this, replace);
};

obj.app_prototype.Mark = function (name) {
    return front.locator.addItem("iApp", this);
};

export default obj;
