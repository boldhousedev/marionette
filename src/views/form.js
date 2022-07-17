import _ from "underscore-bd";
import vx from "backbone-front-bd";
import mnx from "../define";
import sync from "./sync";

var structure = {
    regions: {
        infos: ".infos",
    },
    infos: {
        info: [],
        warning: [],
        danger: [],
    },
    renderListener: sync.prototype.renderListenerUnique,
    gobackUrl: "../lista",
    goNextUrl: "",
    savedInfo: "Registro #{{model.get('id')}} salvo com sucesso",
    _saveEvents: false,
    toastDefaults: { positionY: "top" },
    events: {
        "change input": "setValue",
        "change select": "setValue",
        "change textarea": "setValue",
        "change .as-field": "setValue",
        "change :file[data-to]": "sendFileContentTo",
        "click .view-file": "viewFile",
        "click .clear-field-data[data-field]": "clearFieldData",
        "submit form": "save",
        "click .cancel": "cancel",
        submit: "save",
        "click .auto-for:not([for])": "setLabelFocus",
        "focus input,select,textarea": "setFocusBehavior",
        "blur input,select,textarea": "setBlurBehavior",
    },
    initialize() {
        this.modelInit();
        this.events = _.extend(
            _.clone(sync.prototype.events),
            _.result(this, "events")
        );
        _.bind(sync.prototype.initialize, this)();
    },
    modelInit() {
        if (!this.model && this.Model) {
            var Model = this.Model,
                o = {};
            o[Model.prototype.idAttribute] =
                "id" in this.options ? this.options.id : null;

            this.model = new Model(o);

            return true;
        }
        return false;
    },
    applyBehaviors($el) {
        this.showRequired($el);
        sync.prototype.applyBehaviors.apply(this, arguments);
    },
    getElValue($el) {
        return $el.is("select")
            ? this.getSelectVal($el)
            : $el.is("input:checkbox") || $el.is("input:radio")
                ? this.getCheckboxValues($el)
                : $el.is(".as-field")
                    ? $el.attr("data-field-value")
                    : $el.is(":file")
                        ? vx.utils.file.getData($el)
                        : $el.val();
    },
    getSelectVal($el) {
        var $options = $("option:selected", $el),
            val = [];

        $options.each((x, el) =>
            val.push($(el).attr("data-value") || $(el).val())
        );

        return val.join(",");
    },
    getCheckboxVal($el) {
        var v = $el.is(":checked")
            ? $el.val()
            : typeof $el.attr("value0") !== "undefined"
                ? $el.attr("value0")
                : "";

        return v;
    },
    getCheckboxValues($el) {
        var v = this.getCheckboxVal($el),
            val = [v];

        if ($el.is(":checkbox")) {
            val = [];
            var $checkboxes = $(
                `[name="${$el.attr("name")}"]:checked`,
                this.$el
            );
            $checkboxes.each((x, el) => val.push(this.getCheckboxVal($(el))));
            val = _.chain(val)
                .uniq()
                .filter((v) => !!v)
                .value();
        }

        return val.join(",");
    },
    clearFieldData(e) {
        e && vx.events.stopAll(e);

        var el = this.getTarget(e),
            $el = $(el),
            fieldNames = $el.attr("data-field").split(","),
            dataVal = $el.attr("data-val"),
            v = !dataVal
                ? null
                : dataVal === "{}"
                    ? {}
                    : dataVal == "0"
                        ? 0
                        : "";

        for (var fieldName of fieldNames) {
            var o = {};
            o[fieldName] = v;

            this.model.set(o, { validate: false });
            this.successDisplay(fieldName);
        }
    },
    setValue(e) {
        var el = this.getTarget(e),
            $el = $(el),
            field = this.getFieldName($el),
            value;

        // masks with translation A generate an event on the first blur
        if (
            e.isTrigger &&
            !$el.attr("data-first-event-called") &&
            /A/.test($el.attr("data-mask-format"))
        ) {
            $el.attr("data-first-event-called", "1");
            return;
        }

        if (!field) return;
        value = this.getElValue($el);
        this.setFieldValue(field, value);
    },
    setFieldValue(field, value) {
        var data = {};
        data[field] = value;
        var set = this.model.set(data, {
            validate: !/^__/.test(field) ? true : false,
        });

        this.showRequired(this.$el);
        if (!set) {
            this.model.errorsMap[field] = true;
            this.showErrors(this.model.validationError, this.model);
            return false;
        } else {
            this.removeError(field);
            this.successDisplay(field);
        }
    },
    successDisplay(fieldName) {
        var fieldMethodName = this.methodifyFieldName(fieldName),
            successMethod = "successDisplay_" + fieldMethodName;

        _.result2(this, successMethod, null, [fieldName], this);
    },
    sendFileContentTo(e) {
        var el = this.getTarget(e),
            $el = $(el);

        vx.utils.file.getDataURL(
            $el,
            _.partial(($el, s, v) => {
                if (s) {
                    this.setFieldValue($el.attr("data-to"), v);
                }
            }, $el)
        );
    },
    viewFilePopupSize: "",
    viewFileDialogCss: "container",
    viewFileBodyCss: "text-center",
    viewFileSize: "65vh",
    viewFileTitle: () => "Visualizar",
    viewFileClose: () => "Fechar",
    viewFile(e) {
        e && vx.events.stopAll(e);

        var $el = $(this.getTarget(e)),
            fieldName = $el.attr("data-field"),
            src = this.model.get(fieldName),
            type = /^http[s]?\:/.test(src)
                ? "url"
                : src.match(/data\:(.+);/)[1],
            isUrl = type === "url",
            viewFileSize = _.result(this, "viewFileSize"),
            templates = {
                default: `<embed src="{{src}}" class="w-100" style="height: ${viewFileSize};" {{attrs}}>`,
                url: `<iframe id="viewFileIframe" src="{{src}}" class="w-100" style="height: ${viewFileSize};" {{attrs}}>`,
                img: `<img src="{{src}}" style="max-width: 100%; max-height: ${viewFileSize};" {{attrs}}>`,
            },
            html = templates.default,
            attrs = {},
            tpl;

        switch (true) {
            case type == "application/pdf":
                attrs["pluginspage"] =
                    "http://www.adobe.com/products/acrobat/readstep2.html";
                break;
            case /^image\//.test(type):
                html = templates.img;
                break;
            case isUrl:
                html = templates.url;
                break;
        }

        tpl = _.template(html);

        this.$viewFileModal = vx.ux.popup.info({
            title: _.result(this, "viewFileTitle"),
            body: tpl({ src, attrs }),
            ok: _.result(this, "viewFileClose"),
        });

        if (isUrl) {
            this.addLoading("", "viewFileIframe");
            $("#viewFileIframe", this.$viewFileModal).on("load", () => {
                this.removeLoading("viewFileIframe");
            });
        }

        var $dialog = $(".modal-dialog", this.$viewFileModal)
            .addClass("popup-dialog")
            .removeClass("modal-dialog"),
            $body = $(".modal-body", this.$viewFileModal),
            popupSize = _.result(this, "viewFilePopupSize"),
            dialogCss = _.result(this, "viewFileDialogCss"),
            bodyCss = _.result(this, "viewFileBodyCss");

        popupSize && $dialog.css("max-width", popupSize);
        dialogCss && $dialog.addClass(dialogCss);
        bodyCss && $body.addClass(bodyCss);

        return this.$viewFileModal;
    },
    showRequired($form) {
        if (!this.model || !this.model.getMandatoryValidations) return;
        var v = this.model.getMandatoryValidations(this.model.attributes);

        // if(_.size(v) > 0) {
        var reqFields =
            _.size(v) > 0
                ? _.map(_.keys(v), (i) => this.methodifyFieldName(i))
                : [];
        this.getFields($form).each((x, el) => {
            var $el = $(el),
                $p = $el.parents(".form-field:first,.form-group:first").eq(0),
                $label = $("label:first", $p),
                name = this.getFieldName($el),
                reqNameTest = [
                    this.methodifyFieldName(name),
                    this.methodifyFieldName(name.replace(/\[\d+\]/g, "[]")),
                ];

            $el.val() && this.setLabelFilled($el);
            if (_.intersection(reqFields, reqNameTest).length > 0) {
                $label.addClass("required");
                $el.attr("is-field-required", "1");
            } else {
                $label.removeClass("required");
                $el.attr("is-field-required", "0");
            }
        });
        // }
    },
    getFieldName($field) {
        return $field.is(".as-field")
            ? $field.attr("data-field-name")
            : $field.attr("name");
    },
    methodifyFieldName(fieldName) {
        return fieldName.replace(/\[|\]/g, "_").replace(/_+/g, "_") + "x";
    },
    showErrors(errors) {
        if (!errors) return false;

        var fieldErrorLength = {};

        for (let error of errors) {
            var fieldName = error[0];
            // index of list
            if (error[2]) {
                fieldName = fieldName.replace(/\[\]/, "[" + error[2] + "]");
            }
            !(fieldName in fieldErrorLength) &&
                (fieldErrorLength[fieldName] = 0);
            fieldErrorLength[fieldName]++;
            if (fieldErrorLength[fieldName] > 1) continue;

            var fieldErrorName = this.methodifyFieldName(fieldName);
            var $field = this.getFieldByName(fieldName),
                $errorPlacement = this.errorPlacement(fieldName);

            if ($errorPlacement.length) {
                if (this.isThereAnExistingSameError(fieldErrorName, error)) {
                    continue;
                }

                this.clearError(fieldName, error);
                this.showFieldError(fieldName, error);
            } else {
                this.addFormError(fieldName, error);
            }
        }

        this.scrollToError();
        this.validateOnSet = true;
        return false;
    },
    scrollToError() {
        this.scrollTo($(".field-error:first"));
    },
    getFields($form) {
        return $(
            "input[name], select[name], textarea[name], .as-field[data-field-name]",
            $form || this.$el
        );
    },
    getFieldByName(fieldName) {
        var $f = $(
            '.as-field[data-field-name="' + fieldName + '"]:last',
            this.$el
        );

        if (!$f.length) {
            $f = $('[name="' + fieldName + '"]:last', this.$el);
        }

        return $f;
    },
    addFormError(fieldName, error) {
        vx.app().ux.toast.add(
            _.defaults(
                {
                    msg: error[1] + " (" + fieldName + ")",
                    color: "danger text-dark font-weight-bold",
                },
                this.toastDefaults
            )
        );
    },
    showFieldError(fieldName, error) {
        var fieldErrorName = this.methodifyFieldName(fieldName),
            $field = this.getFieldByName(fieldName),
            $fieldContainer = this.fieldContainer($field),
            $errorPlacement = this.errorPlacement(fieldName),
            popoverHtml = `<span class="form-error-${fieldErrorName}" data-error="${Base64.encode(
                error[1]
            )}">
                    ${error[1]}
                </span>`;

        $fieldContainer.length > 0
            ? $fieldContainer.addClass("field-error")
            : $errorPlacement.addClass("field-error");

        $errorPlacement
            .popover({
                toggle: "popover",
                container: "form#" + this.cid,
                placement: "bottom",
                html: true,
                content: popoverHtml,
                trigger: "manual",
            })
            .popover("show");

        $('[class*="form-error-' + fieldErrorName + '"]', this.$el)
            .parents(".popover:first")
            .addClass("danger");
    },
    errorPlacement(fieldName) {
        var $field = this.getFieldByName(fieldName),
            $errorPlacement = $(
                `.error-placement[data-field="${fieldName}"]`,
                this.$el
            );
        return $errorPlacement.length ? $errorPlacement : $field;
    },
    fieldContainer($field) {
        return $field.parents("div.field-root:first").length
            ? $field.parents("div.field-root:first")
            : $field.parents("div:first");
    },
    removeError(field) {
        if (this.model.errorsMap && this.model.errorsMap[field])
            delete this.model.errorsMap[field];

        this.clearError(field);
    },
    getExistingError(fieldErrorName) {
        var $error = $(
            '[class*="form-error-' + fieldErrorName + '"]',
            this.$el
        );
        return $error.length > 0 ? $error : null;
    },
    isThereAnExistingError(fieldErrorName, error) {
        return !!this.getExistingError(fieldErrorName);
    },
    isThereAnExistingSameError(fieldErrorName, error) {
        var $error = this.getExistingError(fieldErrorName);
        return (
            $error &&
            $error.is('[data-error="' + Base64.encode(error[1]) + '"]')
        );
    },
    clearError(fieldName) {
        // var fieldErrorName = this.methodifyFieldName(fieldName);
        var $field = this.getFieldByName(fieldName),
            $errorPlacement = this.errorPlacement(fieldName);

        if ($errorPlacement.length > 0) {
            $errorPlacement.popover("dispose");
            $errorPlacement.removeClass("field-error");
        }
        if ($field.length > 0) {
            var $fieldContainer = this.fieldContainer($field);
            $fieldContainer.removeClass("field-error");
        }
    },
    clearErrors() {
        this.getFields().each((x, el) => {
            var $el = $(el),
                name = this.getFieldName($el);
            this.clearError(name);
        });
    },
    //    showInfos() {
    //        this.showChildView('infos', new formInfosView({infos: this.infos}));
    //    },
    setLabelFocus(e) {
        var el = e.currentTarget,
            $el = $(el),
            $container = $el.parents(".field-root:first"),
            $field;
        if (!$container) {
            return;
        }
        $field = $(":input:first", $container);

        if ($field) {
            !$field.is(":file") ? $field.focus() : $field.click();
        }
    },
    setLabelsFilled($form) {
        $(
            "input[name], select[name], textarea[name], .as-field[data-field-name]",
            $form
        ).each((x, el) => {
            var $el = $(el);
            $el.val() && this.setLabelFilled($el);
        });
    },
    eSetLabelFilled(e) {
        var el = e.currentTarget,
            $el = $(el);
        if (this.getElValue($el)) {
            this.setLabelFilled($el);
        }
    },
    setLabelFilled($el) {
        var $container = $el.parents(".field-root:first"),
            $label;
        if (!$container) {
            return;
        }
        $label = $("label:first", $container);

        $label && $label.addClass("label-filled");
    },
    setFocusBehavior(e) {
        var el = e.currentTarget,
            $el = $(el),
            $container = $el.parents(".field-root:first"),
            $label;
        if (!$container) {
            return;
        }
        $label = $("label:first", $container);

        $container.addClass("focused");
        $label && $label.addClass("label-focused");
    },
    setBlurBehavior(e) {
        var el = e.currentTarget,
            $el = $(el),
            $container = $el.parents(".field-root:first"),
            $label;
        if (!$container) {
            return;
        }
        $label = $("label:first", $container);

        $container.removeClass("focused");
        $label && $label.removeClass("label-focused");
    },
    beforeSave() {
        this.addSubmitLoading();
    },
    saveValidation() {
        var validate = this.model.validate(this.model.attributes, {
            validateAll: true,
        });
        if (_.size(this.model.errorsMap) > 0 || validate) {
            this.showErrors(validate, this.model);
            return false;
        }
        return true;
    },
    save(e) {
        e && vx.events.stopAll(e);
        if (!this.saveValidation()) {
            return false;
        }

        this.beforeSave && this.beforeSave(e);
        //        vx.debug.log('save called');

        this.listenToOnce(
            [this.model, "sync", () => this.afterSave()],
            [this.model, "error", (model, xhr) => this.syncError(model, xhr)]
        );

        this.model.save();
        this.trigger("saved");
        return true;
    },
    afterSave() {
        this.removeSubmitLoading();
        //        vx.debug.log('is prod ? '+ISPROD);
        this.goback(true);
    },
    cancel(e) {
        this.goback();
    },
    goback(saved) {
        if (saved) {
            return this.goNext();
        }

        var urlTpl =
            saved && this.goNextUrl
                ? _.result(this, "goNextUrl")
                : _.result(this, "gobackUrl") || "";

        if (urlTpl && urlTpl !== -1) {
            return this.goto(urlTpl);
        } else if (urlTpl !== -1) return Backbone.history.history.back();
    },
    showSavedInfo() {
        this.savedInfo &&
            vx.app().ux.toast.add(
                _.defaults(
                    {
                        msg: _.template(_.result(this, "savedInfo"))({
                            model: this.model,
                            m: this.model,
                        }),
                        color: "info text-dark",
                    },
                    this.toastDefaults
                )
            );
    },
    goNext() {
        this.showSavedInfo();

        var urlTpl = this.goNextUrl
            ? _.result(this, "goNextUrl")
            : _.result(this, "gobackUrl") || "";
        if (urlTpl && urlTpl !== -1) {
            return this.goto(urlTpl);
        } else if (urlTpl !== -1) return Backbone.history.history.back();
    },
    goto(urlTpl) {
        var actionData = this.getActionData(),
            url = _.template(urlTpl)(actionData),
            querystring = actionData.querystring;

        if (/\?/.test(url)) querystring = querystring.replace("?", "&");
        url += this.keepUrlQuerystring ? querystring : "";

        url = this.formatRelativeUrl(url);
        return vx.router.navigate(url, { trigger: true });
    },
    formatRelativeUrl(url) {
        if (/\.\.\//.test(url)) {
            var baseUrl = window.location.pathname
                .replace(/\/s\/.*/, "/s")
                .split("/");
            baseUrl.push(url.replace("../", ""));
            url = baseUrl.join("/");
        }

        return url;
    },
    actionSaveText: () => "Salvar",
    getActionSave() {
        return {
            ico: "save",
            type: "submit",
            btnColor: "primary",
            btnCss: "text-light w-100 w-lg-25",
            title: _.result(this, "actionSaveText"),
            callback: (e) => this.save(e),
            auth: "{{view.moduleName}}/{{typeof id !== 'undefined' && id ? 'update' : 'create'}}",
        };
    },
    actionBackText: () => "Voltar",
    getActionBack() {
        return {
            ico: "arrow-left",
            btnCss: "w-100 w-lg-25 mt-2 mt-lg-0",
            title: _.result(this, "actionBackText"),
            callback: (e) => this.cancel(e),
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
    /* popups */
    openPopup(e, opts, form, collection, closeFn) {
        var $el = $(e.currentTarget);
        this.popup = new form(opts || {}); // {el: $('.modal-body',modal)[0]}
        this.listenTo(this.popup, "saved", () =>
            collection.fetch({ reset: true })
        );
        this.listenTo(this.popup, "close", closeFn);
    },
    closePopup() {
        this.popup = null;
    },
    editPopup(e, $el, form, collection, closeFn) {
        var id = $("option:selected", $el).val();
        if (!id) {
            return vx.app().ux.popup.info({
                title: "Problema encontrado",
                body: "Selecione o item que deseja alterar",
            });
        }
        var selectedModel = collection.find((model) => model.id == id);

        //        vx.debug.log(id);

        //        return this.opensetor(e, {model: selectedModel});
        return this.openPopup(e, { id: id }, form, collection, closeFn);
    },
    updatePopupSelect($el, collection, attr) {
        $("option", $el).remove();
        $("<option>-</option>").appendTo($el);
        collection.each((model) => {
            var opt = $("<option></option>")
                .val(model.get("id"))
                .html(model.getTitle())
                .appendTo($el);
        });
        this.model.get(attr) &&
            $('option[value="' + this.model.get(attr) + '"]', $el).prop(
                "selected",
                true
            );
    },
    rmvPopupItem($el, collection) {
        var id = $("option:selected", $el).val();
        if (!id) {
            return vx.app().ux.popup.info({
                title: "Problema encontrado",
                body: "Selecione o item que deseja excluir",
            });
        }

        var selectedModel = collection.find((model) => model.id == id);

        vx.app().ux.popup.confirm({
            title: "Confirmação de Exclusão",
            msg:
                'Você confirma a exclusão do item "' +
                selectedModel.getTitle() +
                '" ?',
            confirm: "Confirmar",
            dataCancel: "Cancelar",
            callback: (status) => {
                if (status) {
                    this.listenToOnce(selectedModel, "sync", () =>
                        collection.fetch({ reset: true })
                    );
                    selectedModel.destroy();
                }
            },
        });
    },
    clear() {
        $("input, textarea", this.$el).val("");
        $("select option", this.$el).prop("selected", false);
    },
};

var view = sync.extend(structure);

export { structure, view };
export default view;
