sap.ui.define([
	'sap/m/MessageToast'
], function(MessageToast) {
	"use strict";
	return {
		onCheckField: function(oContext, oModel, sPath) {
		  var sEntry = oModel.getProperty(sPath);
          if (sEntry.indexOf("%") !== -1) {
          	sEntry = sEntry.replace(/%/g,"");
          	var sMessage = oContext.getModel("i18n").getResourceBundle().getText("FCU_Percentage");
          	MessageToast.show(sMessage);
          }
          oModel.setProperty(sPath,sEntry);
          oModel.refresh(false);
		}
	};
});