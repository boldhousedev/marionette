import vx from "backbone-front-bd";
import _ from "underscore-bd";

export default {
    events: {
        "click .show-info-msg": "showInfoMsg",
        "click .show-info-html": "showInfoHtml",
        "click .show-info-popover": "showInfoPopover",
        "click .show-popover-msg": "showPopoverMsg",
        "change :checkbox:not([disabled])": "changeCheckboxIcon",
    },
    showInfoPopover(e, stopAll = true) {
        stopAll && e && vx.events.stopAll(e);
        var $el = $(e.currentTarget),
            msg = $el.attr("data-info-msg");

        var popoverHtml = `<span class="info-popover-${$el.attr("id")}">
        ${msg}
    </span>`;

        $el.popover({
            toggle: "popover",
            container: "form#" + this.cid,
            placement: "bottom",
            html: true,
            content: popoverHtml,
            trigger: "focus",
        }).popover("show");

        $('[class*="info-popover-' + $el.attr("id") + '"]', this.$el)
            .parents(".popover:first")
            .addClass("info");

        return;
    },
    showInfoHtml(e, stopAll = true) {
        stopAll && e && vx.events.stopAll(e);
        var $el = $(e.currentTarget),
            $container = $($el.attr("data-info-container"), $el).length
                ? $($el.attr("data-info-container"), $el)
                : $($el.attr("data-info-container"), this.$el),
            $modal = vx.app().ux.popup.info({
                title: $el.attr("data-info-title") || "Informação",
            });

        $(".modal-body", $modal).append($container.clone().show());
        return $modal;
    },
    showInfoMsg(e, stopAll = true) {
        stopAll && e && vx.events.stopAll(e);
        var $el = $(e.currentTarget),
            $modal = vx.app().ux.popup.info({
                title: $el.attr("data-info-title") || "Informação",
                msg: $el.attr("data-info-msg"),
            });

        return $modal;
    },
    showPopoverMsg(e, stopAll = true) {
        stopAll && e && vx.events.stopAll(e);
        const $el = $(e.currentTarget);
        const id = _.uniqueId("popover-");
        $el.attr("data-toggle", "popover")
            .attr("data-container", "form#" + this.cid)
            .attr("data-placement", "bottom")
            .attr("data-html", true)
            .attr(
                "data-content",
                '<span class="popover-text ' +
                id +
                '">' +
                $el.attr("data-popover-text") +
                "</span>"
            )
            .attr("data-trigger", "manual")
            .popover("show");
        var $pop = $(".popover-text." + id)
            .parents(".popover:first")
            .attr("id", id);

        $el.attr("data-popover-timeout") !== "0" &&
            setTimeout(() => {
                $pop.popover("hide");
            }, $el.attr("data-popover-timeout") || 1500);

        return $el;
    },
    /*
    <div class="row">
        <div class="form-group col-12">
            <div class="text-4">
                <label class="d-inline"><i class="far fa-square"></i> <input type="checkbox" name="pagamento[aceite]" value="1" value0="0" style="visibility: hidden; width: 1px;"> Eu estou de acordo com os <a href="/public/termos/Termos_de_Uso_ABPix_v2.pdf" target="_blank" class="text-color-secondary" style="text-decoration: underline;">termos</a></label>
            </div>
        </div>
    </div>
*/
    changeCheckboxIcon(e) {
        var $el = $(e.currentTarget),
            $label = $el.parents("label:first"),
            $i = $("i.fa,i.far", $label),
            icons = ["far fa-square", "fa fa-check-square"],
            isChecked = $el.prop("checked"),
            addClass = icons[Number(isChecked)],
            removeClass = icons[Number(!isChecked)];

        if (!$i.length) {
            return;
        }
        $i.removeClass(removeClass).addClass(addClass);
    },
};
