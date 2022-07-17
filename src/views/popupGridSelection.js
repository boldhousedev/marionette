import _ from "underscore-bd";
import vx from "backbone-front-bd";

import popup from "./popupGrid";

export default popup.extend({
    selectionInstructionMessage: "Selecione um item",
    selectionInstructionCssClass: "warning text-color-dark",
    showSelectionInstruction() {
        vx.app().ux.toast.add({
            msg: _.result(this, "selectionInstructionMessage"),
            color: this.selectionInstructionCssClass,
        });
    },
    actionSaveIcon: () => "check-circle",
    actionSaveText: () => "Continuar",
    getActionSave() {
        return {
            ico: _.result(this, "actionSaveIcon"),
            btnColor: "primary",
            btnCss: "text-light",
            title: _.result(this, "actionSaveText"),
            callback: (e) => this.save(e),
            auth: "{{moduleName}}/form",
        };
    },
    getDefaultActions(place = 0) {
        var a = [],
            aSave = this.getActionSave(),
            aBack = this.getActionBack();

        if (!place) {
            aSave && a.push(aSave);
            aBack && a.push(aBack);
        }

        return a;
    },
    save(e) {
        e && vx.events.stopAll(e);
        var selectedRowId = this.getSelectedRowAttr(e, "id");
        if (!selectedRowId) {
            return this.showSelectionInstruction();
        }

        this.trigger("selected", { id: selectedRowId });
        this.cancel(e);
    },
});
