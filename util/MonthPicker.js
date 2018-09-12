sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast',
	'colgate/asm/planning/base/util/ValidationUtils'
], function(Dialog, MessageToast, ValidationUtils) {
	"use strict";
	return {
		_getMonthPicker: function(oEvent, oContext) {
			var that = oContext;
			var that2 = this;
			var oDate = oEvent.getSource();
			var sType = oDate.getBindingInfo("value").binding.getPath();
			var sPath = oDate.getParent().getBindingContext("Project").getPath();
			var sTitle = "";
			if (sType === "StartDt") {
				sTitle = oContext.getModel("i18n").getResourceBundle().getText("SCU_T_StartDt");
			} else {
				sTitle = oContext.getModel("i18n").getResourceBundle().getText("SCU_T_EndDt");	
			}
			var sCurrentDate = that.getModel("Project").getProperty(sPath + "/" + sType);
			// psutram: feb 2017 : if sCurrentDate is error then no value exists: commented the next line and replaced with if block
			// var iMonth = parseInt(sCurrentDate.substring(5,7)) - 1;
			var iMonth ;
			if (sCurrentDate === "Error")
			{
				iMonth = 0;
			}
			else
			{
				iMonth = parseInt(sCurrentDate.substring(5,7)) - 1;
			}
			// end of changes

			var dialog = new Dialog("vh_date", {
				title: sTitle,
				type: 'Message',
				content: [
					new sap.m.VBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Center,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.ui.unified.calendar.MonthPicker("vh_monthPicker", {
								month: iMonth,
								select: function() {
									var iMonthNew = parseInt(sap.ui.getCore().byId("vh_monthPicker").getMonth()) + 1; //Values 0-11
									var sPad = "0";
									var sMonth = (sPad+String(iMonthNew)).slice(-2);
									var oASMConfigData = that.getOwnerComponent().getModel("ASMConfig").getData();
									var sYear = oASMConfigData.Properties.PlanningYear;
									var sDate = sYear + "-" + sMonth + "-";
									if (sType === "StartDt") {
										sDate = sDate + "01T00:00:00Z";
									} else {
										sDate = sDate + "28T00:00:00Z";
									}
									that.getModel("Project").setProperty(sPath + "/" + sType, sDate);
									that.__setRowEditable(true, that.getModel("Project").getProperty(sPath + "/"));
									that.onValidate(null);
									that.getModel("Project").refresh(false);
									dialog.close();
								}
							})
						]
					})
				],
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.setModel(oContext.getModel("StatusChangeUtils"), "StatusChangeUtils");
			dialog.open();
		}
	};
});