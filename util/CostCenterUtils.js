sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast'
], function(Dialog, MessageToast) {
	"use strict";
	return {
		onChange: function(oEvent) {
			var oSearchField = oEvent.getSource();
			var value = oEvent.getParameter("value");
			var filters = [];
			if (value) {
				filters = [new sap.ui.model.Filter([
					new sap.ui.model.Filter("Description", function(sText) {
						return (sText || "").toUpperCase().indexOf(value.toUpperCase()) > -1;
					})
				], false)];
			}
			oSearchField.getBinding("items").filter(filters);
		},
		onClose: function(oEvent) {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},
		onConfirm: function(oEvent) {
			var sPath = oEvent.getParameter("selectedItems")[0].getBindingInfo("title").binding.getContext().getPath();
			this._oComboBox.setSelectedKey(this._oDialog.getModel().getProperty(sPath).Key);
			oEvent.getSource().getBinding("items").filter([]);
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},
		onShow: function(oEvent, oModel, oTextModel, oComboBox) {
				if (this._oDialog) { 
					this._oDialog.destroy();
				}
				this._oDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.CostCenterSelection", this);
				this._oDialog.setModel(oModel);
				this._oDialog.setModel(oTextModel, "Text");
				this._oComboBox = oComboBox;
				// clear the old search filter
				this._oDialog.getBinding("items").filter([]);
				this._oDialog.open();
			}
			// handleCostcenter: function(oModel) {
			// 	var oData = oModel.getData();
			// 	if (oData.Input.BrandKey && oData.Input.BrandKey !== "") {
			// 		// Set the Cost Center
			// 		var aBrands = oData.Brand.Current;
			// 		for (var i = 0; i < aBrands.length; i++) {
			// 			if (aBrands[i].Key === oData.Input.BrandKey) {
			// 				var oAdditionalData = JSON.parse(aBrands[i].AdditionalData);
			// 				if (oAdditionalData.costcenter) {
			// 					oData.Display.Costcenter = oAdditionalData.costcenter;
			// 				}
			// 			}
			// 		}
			// 		oData.Visible.Costcenter = true;
			// 	} else {
			// 		oData.Display.Costcenter = "";
			// 		oData.Visible.Costcenter = false;
			// 	}
			// 	oModel.refresh(false);
			// }
	};
});