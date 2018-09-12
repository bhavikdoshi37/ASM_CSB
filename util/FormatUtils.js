sap.ui.define([
	'sap/m/MessageToast'
], function(MessageToast) {
	"use strict";
	return {
		stringifyNumbers: function(oItem) {
			var i = 0;
			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sAColumnName = "AmtA" + i;
				var sCColumnName = "AmtC" + i;
				var sCbColumnName = "AmtCb" + i;
				var sBoColumnName = "AmtBo" + i;
				oItem[sColumnName] = oItem[sColumnName].toString();
				oItem[sAColumnName] = oItem[sAColumnName].toString();
				oItem[sCColumnName] = oItem[sCColumnName].toString();
				oItem[sCbColumnName] = oItem[sCbColumnName].toString();
				oItem[sBoColumnName] = oItem[sCbColumnName].toString();
			} while (i < 12);
			oItem.AmtBTot = oItem.AmtBTot.toString();
			oItem.AmtATot = oItem.AmtATot.toString();
			oItem.AmtCTot = oItem.AmtCTot.toString();
			oItem.AmtCbTot = oItem.AmtCbTot.toString();
			oItem.AmtBoTot = oItem.AmtBoTot.toString();
			// Begin of Changes - Pin-See Wong - Nov 2016
			oItem.AmtLeTot = oItem.AmtLeTot.toString();
			// End of Changes - Pin-See Wong - Nov 2016
			// Begin of Changes - Khrystyne Williams - Feb 2017
			oItem.MaxValueB = oItem.MaxValueB.toString();
			// End of Changes - Khrystyne Williams - Feb 2017
		}
	};
});