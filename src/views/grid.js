import vx from "backbone-front-bd";
import _ from "underscore-bd";

import mnx from "../define";

import autoUtilEvents from "./autoUtilEvents";
import template from "marionette-bd/src/templates/grid.jst";
import legendTemplate from "marionette-bd/src/templates/legend.jst";
import exportTemplate from "marionette-bd/src/templates/grid_export.jst";
import FilterView from "./filter";
import listView from "./list";
import PaginationView from "./pagination";
import authUnit from "./authUnit";

var structure = {
    initializeSetEvents() {
        this.events = _.extend(_.clone(autoUtilEvents.events), this.events);
    },
    norecord: "Você ainda não cadastrou nada aqui",
    noResults: "Nenhum registro encontrado",
    initializePrepareOptions() {
        this.options.get = () => this.options;
        this.options.sort = this.collection.setSort(this.options.sort);
        this.options.norecord = this.norecord;
        this.options.noResults = this.noResults;
        this.options.getCols = (r) => this.getCols(r);
        this.options.getCols2 = (r) => this.getCols2(r);

        this.options.results = () => this.collection.listResults();
        !("filters" in this.options) && (this.options.filters = {});

        !("pagination" in this.options) && (this.options.pagination = {});
        _.map(this.options.pagination, (v, x) => {
            this.collection.pagination[x] = v;
        });

        this.options.pagination.collection = this.options.filters.collection =
            this.collection;
        // this.collection.cols = this.options.cols;
        this.collection.filterOnServer = 'filterOnServer' in this.options ? this.options.filterOnServer : -1;
        this.collection.limitOnServer = this.options.limitOnServer || 0;
        this.collection.getCols = (r) => this.getCols(r);
    },
    getCols() {
        return this.options.cols;
    },
    getCols2() {
        return this.options.cols;
    },
    initializeInstantiateFilter() {
        var view = new FilterView(this.options.filters);
        view.parent = this;
        this.showChildView("filter", view);

        this.collection.filter = this.getRegion("filter").currentView.model;

        return view;
    },
    initializeInstantiateList() {
        var view = new listView(this.options);
        if (this.options.listTemplate)
            view.template = this.options.listTemplate;
        view.parent = this;
        this.showChildView("list", view);

        return view;
    },
    initializeInstantiateLegend() {
        if (!("legend" in this.options)) return;

        var view = new (mnx.view.extend({
            template: this.options.legend.template || legendTemplate,
        }))(this.options.legend);

        "legend" in this.options && this.showChildView("legend", view);

        return view;
    },
    initializeInstantiatePagination() {
        var view = new PaginationView(this.options.pagination);
        this.showChildView("pagination", view);

        return view;
    },
    initializeGetCollectionListeners() {
        var fnCollectionReady = () => {
            this.getRegion("filter").currentView &&
                this.getRegion("filter").currentView.render();
            this.getRegion("list").currentView &&
                this.getRegion("list").currentView.render();
            this.getRegion("pagination").currentView &&
                this.getRegion("pagination").currentView.render();

            this.removeSubmitLoading();
            this.afterRender && this.afterRender();
        },
            fnCollectionError = (c, xhr, o) => {
                vx.showAjaxError(xhr);
                fnCollectionReady();
            };

        return { fnCollectionReady, fnCollectionError };
    },
    initializeCollectionListeners() {
        var { fnCollectionReady, fnCollectionError } =
            this.initializeGetCollectionListeners();
        this.listenTo(this.collection, "ready", fnCollectionReady);
        this.listenTo(this.collection, "error", fnCollectionError);
    },
    initializeSearchListener() {
        // ao pesquisar, executa gofirst que por sua vez demanda o re-render
        this.listenTo(this.getRegion("filter").currentView, "search", () => {
            if (this.collection.filterOnServer >= 1) {
                this.addSubmitLoading("Pesquisando");
                this.getRegion("pagination").currentView &&
                    this.getRegion("pagination").currentView.gofirst(true);
                return this.collection.fetch({ reset: true });
            }

            this.getRegion("pagination").currentView &&
                this.getRegion("pagination").currentView.gofirst();

            this.afterRender && this.afterRender();
        });
    },
    initializePaginationListener() {
        this.listenTo(
            this.getRegion("pagination").currentView,
            "gopage",
            () => {
                this.getRegion("list").currentView &&
                    this.getRegion("list").currentView.render();
                this.getRegion("pagination").currentView &&
                    this.getRegion("pagination").currentView.render();

                this.afterRender && this.afterRender();
            }
        );
    },
    initializeSortListener() {
        if (this.options.sort !== false) {
            this.listenTo(
                this.getRegion("list").currentView,
                "orderby",
                (col) => {
                    this.collection.changeSort(col);

                    this.getRegion("pagination").currentView &&
                        this.getRegion("pagination").currentView.render();
                    this.getRegion("list").currentView &&
                        this.getRegion("list").currentView.render();

                    this.afterRender && this.afterRender();
                }
            );
        }
    },
    initializeListeners() {
        this.initializeCollectionListeners();
        this.initializeSearchListener();
        this.initializePaginationListener();
        this.initializeSortListener();
    },
    initializeFetchAndStart() {
        var { fnCollectionReady, fnCollectionError } =
            this.initializeGetCollectionListeners();
        this.fetchRelatedLists();
        if (this.collection.isReady() !== true) {
            return this.collection.fetch({ reset: true });
        }
        fnCollectionReady();
    },
    removeConfirmTitle: "Confirmação de Exclusão",
    removeConfirmMessage: "Você confirma a exclusão do registro #{{id}}?",
    removeLoadingMessage: "Excluindo registro",
    removedInfoMessage: () => "Registro #{{id}} removido",
    removeInstructionMessage: () => "Selecione um item para excluir",
    editInstructionMessage: "Selecione um item para alterar",
    removedInfoCssClass: "danger text-color-light",
    removeInstructionCssClass: "warning text-color-dark",
    editInstructionCssClass: "warning text-color-dark",
    removeErrorCssClass: "danger font-weight-bold text-light",
    remove(e) {
        e && vx.events.stopAll(e);
        var selectedRow = this.getSelectedRowAttr(e, "cid");
        if (!selectedRow) {
            return this.showRemoveInstruction();
        }
        var selectedModel = this.collection.find(
            (model) => model.cid == selectedRow
        );
        var id = selectedModel.id;

        vx.app().ux.popup.confirm({
            title: _.template(_.result(this, "removeConfirmTitle"))({
                id,
                model: selectedModel,
                m: selectedModel,
            }),
            msg: _.template(_.result(this, "removeConfirmMessage"))({
                id,
                model: selectedModel,
                m: selectedModel,
            }),
            confirm: "Confirmar",
            dataCancel: "Cancelar",
            callback: (status) => {
                if (status) {
                    this.addLoading(
                        _.template(_.result(this, "removeLoadingMessage"))({
                            id,
                            model: selectedModel,
                            m: selectedModel,
                        }),
                        "remove"
                    );
                    this.listenToOnce(
                        [
                            selectedModel,
                            "sync",
                            () => {
                                this.removeLoading("remove");
                                this.collection.fetch({ reset: true });
                                vx.app().ux.toast.add({
                                    msg: _.template(
                                        _.result(this, "removedInfoMessage")
                                    )({
                                        id,
                                        model: selectedModel,
                                        m: selectedModel,
                                    }),
                                    color: this.removedInfoCssClass,
                                });
                            },
                        ],
                        [
                            selectedModel,
                            "error",
                            (model, jqXHR, textStatus, errorThrown) => {
                                this.removeLoading("remove");
                                vx.app().ux.showInfo({
                                    msg: jqXHR.responseJSON.message,
                                    color: this.removeErrorCssClass,
                                });
                            },
                        ]
                    );
                    selectedModel.destroy();
                }
            },
        });
    },
    edit(e) {
        e && vx.events.stopAll(e);
        var selectedRow = this.getSelectedRowAttr(e, "cid");
        if (!selectedRow) {
            return this.showEditInstruction();
        }

        var selectedModel = this.collection.find(
            (model) => model.cid == selectedRow
        ),
            route = $(e.currentTarget)
                .attr("data-route")
                .replace(/\/pk$/, "/" + selectedModel.id);

        vx.router.navigate(route, { trigger: true });
    },
    getSelectedRowAttr(e, attr = "id") {
        var $el = $(this.getTarget(e)),
            $r = $el.parents("tr.item:first"),
            cid;

        if (!$r.length) {
            cid = this.getRegion("list").currentView.getSelectedRow(attr);
        } else {
            cid = $r.attr("data-" + attr);
        }

        return cid;
    },
    showRemoveInstruction() {
        vx.app().ux.toast.add({
            msg: _.result(this, "removeInstructionMessage"),
            color: this.removeInstructionCssClass,
        });
    },
    showEditInstruction() {
        vx.app().ux.toast.add({
            msg: _.result(this, "editInstructionMessage"),
            color: this.editInstructionCssClass,
        });
    },
    createUrl: "/{{view.moduleDir || ''}}{{view.modulePath}}/s/form",
    updateUrl: "/{{view.moduleDir || ''}}{{view.modulePath}}/s/form/pk",
    actionSearchText: () => "Pesquisar",
    getActionSearch() {
        var cols = this.collection.filter.displayedCols();
        if (cols && cols.length > 0)
            return {
                ico: "search",
                title: _.result(this, "actionSearchText"),
                callback: (e) =>
                    $(".filter", this.$el).toggleClass("search-on"),
            };
    },
    actionNewText: () => "Cadastrar",
    getActionNew() {
        return {
            ico: "plus",
            title: _.result(this, "actionNewText"),
            navigate: _.result(this, "createUrl"),
            auth: "{{view.modulePath}}/create",
        };
    },
    actionEditText: () => "Alterar",
    getActionEdit() {
        return {
            ico: "pencil-alt",
            title: _.result(this, "actionEditText"),
            route: _.result(this, "updateUrl"),
            callback: (e) => this.edit(e),
            auth: "{{view.modulePath}}/update",
        };
    },
    actionDeleteText: () => "Excluir",
    getActionDelete() {
        return {
            ico: "times",
            title: _.result(this, "actionDeleteText"),
            callback: (e) => this.remove(e),
            auth: "{{view.modulePath}}/remove",
        };
    },
    getDefaultActions() {
        var a = [],
            aSearch = this.getActionSearch(),
            aNew = this.getActionNew(),
            aEdit = this.getActionEdit(),
            aDelete = this.getActionDelete();

        aSearch && a.push(aSearch);
        aNew && a.push(aNew);
        aEdit && a.push(aEdit);
        aDelete && a.push(aDelete);

        return a;
    },
    resetCollection(collection) {
        this.collection = new this.collection.constructor();
        this.initialize();
    },
    exportCSV() {
        var data = this.collection.exportResults(),
            html = this.exportTemplate({
                options: {
                    data,
                    cols: this.getCols(data),
                },
                _,
                App: vx.app(),
            });

        vx.utils.openBlob([html], "text/csv", "export.csv");
    },
    getTarget(e) {
        return e.currentTarget || e.target;
    },
    customize() { },
};

var view = mnx.view.extend(
    _.extend(
        _.clone(mnx.utils.viewActions),
        _.clone(mnx.utils.viewLoading),
        _.clone(autoUtilEvents),
        structure,
        {
            template: template,
            exportTemplate,
            regions: {
                filter: ".filter",
                list: ".list",
                pagination: ".pagination",
                legend: ".legend",
            },
            events: {
                "click .export-csv": "exportCSV",
            },
            onRender() {
                this.removeWrapper();
            },
            removeWrapper() {
                _.bind(mnx.utils.removeWrapper, this)();
            },
            afterRender() {
                this.setActions();
                this.showBreadcrumb();
                this.customize();
            },
            globalify() {
                vx.debug.globalify("currentView", this);
                vx.debug.globalify("currentCollection", this.collection);
            },
            initialize() {
                this.initializeSetEvents();
                this.setGrid();
                _.result(this, "globalify");
                this.initializePrepareOptions();

                var filterView = this.initializeInstantiateFilter();
                var listView = this.initializeInstantiateList();
                var legendView = this.initializeInstantiateLegend();
                var paginationView = this.initializeInstantiatePagination();

                this.initializeListeners();

                "addAuthAccessRelated" in this && this.addAuthAccessRelated();
                this.initializeFetchAndStart();
            },
        }
    )
);

export { structure, view };
export default view;
