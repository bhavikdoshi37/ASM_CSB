sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast'
], function(Dialog, MessageToast) {
	"use strict";
	return {
		stopSpinnerAfterPromise: function(oContext, oPromise) {
			var that = this;
			oPromise.then(function(oData) {
				if (!oContext.getOwnerComponent().getModel("masterShared").getProperty("/oBusy/skipStop")) {
					oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", false);
					oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
					oContext.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", false);
					oContext.getOwnerComponent().getModel("masterShared").refresh(false);
				}
			}).catch(function(oError) {
				if (!oContext.getOwnerComponent().getModel("masterShared").getProperty("/oBusy/skipStop")) {
					oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", false);
					oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
					oContext.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", false);
					oContext.getOwnerComponent().getModel("masterShared").refresh(false);
				}
			});
		},
		startSpinner: function(oContext) {
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").refresh(false);
		},
		stopSpinner: function(oContext) {
			if (!oContext.getOwnerComponent().getModel("masterShared").getProperty("/oBusy/skipStop")) {
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", false);
				oContext.getOwnerComponent().getModel("masterShared").refresh(false);
			}
		},
		startDetailSpinner: function(oContext) {
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").refresh(false);
		},
		stopDetailSpinner: function(oContext) {
			if (!oContext.getOwnerComponent().getModel("masterShared").getProperty("/oBusy/skipStop")) {
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", false);
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
				oContext.getOwnerComponent().getModel("masterShared").refresh(false);
			}
		},
		startHeaderSpinner: function(oContext) {
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").refresh(false);
		},
		stopHeaderSpinner: function(oContext) {
			if (!oContext.getOwnerComponent().getModel("masterShared").getProperty("/oBusy/skipStop")) {
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/busy", false);
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", false);
				oContext.getOwnerComponent().getModel("masterShared").refresh(false);
			}
		}
	};
});