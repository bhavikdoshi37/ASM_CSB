sap.ui.define([], function() {
	"use strict";

	return sap.m.P13nPanel.extend("colgate.asm.planning.base.util.CustomPersonalizationPanel", {
		constructor: function(sId, mSettings) {
			sap.m.P13nPanel.apply(this, arguments);
		},
		metadata: {
			library: "sap.m",
			aggregations: {

				/**
				 * Control embedded into CustomPanel
				 */
				content: {
					type: "sap.m.FlexBox",
					multiple: false,
					singularName: "content"
				}
			}
		},
		renderer: function(oRm, oControl) {
			if (!oControl.getVisible()) {
				return;
			}
			oRm.renderControl(oControl.getContent());
		}
	});
});