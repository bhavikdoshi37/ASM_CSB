sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast',
	'colgate/asm/planning/base/util/ValidationUtils',
	"colgate/asm/planning/base/util/PersonalizationUtils",
	"colgate/asm/planning/base/util/TimeoutUtils"
], function(Dialog, MessageToast, ValidationUtils, PersonalizationUtils, TimeoutUtils) {
	"use strict";
	return {
		getCurrency: function(oContext) {
			this._getCurrencies(oContext);
		},
		_getCurrencyDialog: function(oContext) {
			var that = oContext;
			var that2 = this;
			var dialog = new Dialog("scu_currency", {
				title: oContext.getModel("i18n").getResourceBundle().getText("SCU_T_Currency"),
				type: 'Message',
				content: [
					new sap.m.VBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Start,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.m.Text({
								text: oContext.getModel("i18n").getResourceBundle().getText("SCU_B_Currency")
							}),
							new sap.m.ComboBox("scu_cb_currency", {
								items: {
									path: "CurrencyUtils>/Currency/Current",
									template: new sap.ui.core.ListItem({
										key: "{CurrencyUtils>Key}",
										text: "{CurrencyUtils>Description}"
									})
								},
								placeholder: "{CurrencyUtils>/Placeholders/Currency}",
								selectedKey: "{CurrencyUtils>/Input/Currency}"
							})
						]
					})
				],
				beginButton: new sap.m.Button({
					text: oContext.getModel("i18n").getResourceBundle().getText("SCU_update"),
					press: function() {
						var sCurrency = sap.ui.getCore().byId("scu_cb_currency").getSelectedKey();
						if (!sCurrency || sCurrency === "") {
							var sMessage = this.getModel("i18n").getResourceBundle().getText("SCU_E_NoCurrency");
							MessageToast.show(sMessage);
						} else {
							//Changes added for currency from edit / Eric Atempa / 2-1-17
							var sMode = that.getModel("masterShared").getData().oInternalEvents.currentMode;
							if (sMode === "Edit" || sMode === "Status") {
								// Cancel Edit or Status Mode
								sap.m.MessageBox.show(
									oContext.getModel("i18n").getResourceBundle().getText("B_T_confirmCancel_Body"), {
										icon: sap.m.MessageBox.Icon.QUESTION,
										title: oContext.getModel("i18n").getResourceBundle().getText("B_T_confirmSwitch"),
										actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
										onClose: function(oAction) {
											if (oAction === sap.m.MessageBox.Action.YES) {
												var oData = {};
												oData.Currency = sCurrency;
												that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "changedCurrency";
												that.getOwnerComponent().getModel("P13n_Configuration").setProperty("/CurrencySettings/Currency",sCurrency);
												PersonalizationUtils.p13nSave(that, oData, "CurrencySettings");
												if(sMode === "Status"){
													sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.button.pressed", "CancelStatus", {});//onSCancel
												}
												sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.reinitialize", "CurrencyChange", oData);
											}
										}
									}
								);
							} else {
							var oData = {};
							oData.Currency = sCurrency;
							// Eric Atempa / 02-01 / Added new last action
							that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "changedCurrency";
							that.getOwnerComponent().getModel("P13n_Configuration").setProperty("/CurrencySettings/Currency",sCurrency);
							PersonalizationUtils.p13nSave(that, oData, "CurrencySettings");
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Refresh", {});
							}
						}
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: oContext.getModel("i18n").getResourceBundle().getText("CP_cancel"),
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.setModel(oContext.getModel("CurrencyUtils"), "CurrencyUtils");
			dialog.open();
		},
		_getCurrencies: function(oContext) {
			// Get the Retailers
			var oCModel = oContext.getModel("Currency");
			if (!oCModel) {
				var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
				oCModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oCModel.setSizeLimit(50000);
				oCModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				oContext.setModel(oCModel, "Currency");
			}
			var sPath = "/VHCurrencies";
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			var that = this;
			oCModel.read(sPath, {
				async: true,
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					that._setCurrencies(oData, oContext);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Currency";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
		},
		_setCurrencies: function(oDataIn, oContext) {
			var oModel = oContext.getModel("CurrencyUtils");
			if (!oModel) {
				oModel = this._createCurrencyUtils(oContext);
			}
			var oData = oModel.getData();
			if (!oData.Currency) {
				oData.Currency = {};
			}
			oData.Currency.Current = oDataIn.results;
			if (oData.Currency.Current.length === 0) {
				oData.Placeholders.Currency = oContext.getOwnerComponent().getModel("i18n").getProperty("AC_P_currency_n");
			} else {
				oData.Placeholders.Currency = oContext.getOwnerComponent().getModel("i18n").getProperty("AC_P_currency_e");
			}
			oModel.refresh(false);
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
			this._getCurrencyDialog(oContext);
		},
		_createCurrencyUtils: function(oContext) {
			// Set up the initial selections
			var oData = {};
			oData.Input = {};
			oData.Input.Currency = oContext.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings/Currency");
			oData.Placeholders = {};
			oData.Currency = {};
			var oModel = new sap.ui.model.json.JSONModel(oData);
			oModel.setSizeLimit(50000);
			oContext.setModel(oModel, "CurrencyUtils");
			return oModel;
		}
	};
});