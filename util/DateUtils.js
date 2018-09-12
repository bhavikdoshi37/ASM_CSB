sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/m/MessageToast"
], function(DateFormat, MessageToast) {
	"use strict";

	return {
		_getSystemOffset: function() {
			//var fSystemOffset = -14400000;
			// GDH This is really ignored by the back-end (all times are always ET)
			// This offset is turned off just so there is no confusion that the manipulated are actually being used
			var fSystemOffset = 0;
			return fSystemOffset;
		},
		getSystemAdjISODateNoZ_fromISODate: function(sISODate) {
			var oDate = new Date(sISODate);
			return this.getSystemAdjISODate_fromDate(oDate);
		},
		getSystemAdjISODate_fromCurrentDate: function() {
			var oDate = new Date();
			return this.getSystemAdjISODate_fromDate(oDate);
		},
		getSystemAdjISODate_fromDate: function(oDate) {
			var iTime = oDate.getTime() + this._getSystemOffset();
			var oRDate = new Date(iTime);
			var sDate = oRDate.toISOString();
			sDate = sDate.replace("Z", "");
			return sDate;
		},
		getISODateNoZ_fromISODate: function(sISODate){
			var oDate = new Date(sISODate);
			return this.getISODateNoZ(oDate);
		},
		getISODateNoZ: function(oDate){
			// GDH Created for Dates that shouldn't be changed.
		 	var sDate = oDate.toISOString();
			sDate = sDate.replace("Z", "");
			return sDate;	
		},
		formatDate: function(sValue) {
			if (sValue) {
				var sYear = sValue.substring(0, 4);
				var sMonth = sValue.substring(5, 7);
				var sDay = sValue.substring(8, 10);
				var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
					style: "medium"
				});
				sValue = oDateFormat.format(new Date(sYear, sMonth - 1, sDay));
				var aValues = sValue.split(" ");
				sValue = aValues[0] + " " + aValues[2];
			}
			return sValue;
		},
		formatTimestamp: function(sValue) {
			if (sValue && sValue !== "") {
				var sYear = sValue.substring(0, 4);
				var sMonth = sValue.substring(5, 7);
				var sDay = sValue.substring(8, 10);
				var sHour = sValue.substring(11, 13);
				var sMin = sValue.substring(14, 16);
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					style: "short"
				});
				sValue = oDateFormat.format(new Date(sYear, sMonth - 1, sDay, sHour, sMin));
			} else {
				sValue = "";
			}
			return sValue;
		}
	};
});