sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast',
	'colgate/asm/planning/base/util/TimeoutUtils',
	'colgate/asm/planning/base/util/SpinnerUtils'
], function(Dialog, MessageToast, TimeoutUtils, SpinnerUtils) {
	"use strict";
	return {
		updateOverlay: function(oContext, sCurrency, aChanged) {
			var oPromise = null;
			SpinnerUtils.startDetailSpinner(oContext);
			var oModel = oContext.getModel();
			var that = this;
			var oItem = {};
			oItem.Currency = sCurrency;
			var oRecords = [];
			for (var i = 0; i < aChanged.length; i++) {
				var oRecord = {};
				oRecord.RecordPlanYear = aChanged[i].PlanningYear;
				oRecord.Id = aChanged[i].Id;
				oRecord.MaxValueC = aChanged[i].MaxValueC;
				oRecords.push(oRecord);
			}
			oItem.Records = JSON.stringify(oRecords);
			oPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					var sPath = "/OverlaySet(Currency='" + sCurrency + "')";
					oModel.update(sPath, oItem, {
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(that);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "UpdateProject";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
			return oPromise;
		},
		updatePlan: function(oContext, aChangedRows) {
			var aPromises = [];
			var oData = oContext.getModel("Project").getData();
			var aAsInputArray = oData.AsInputArray;
			var oModel = oContext.getModel();
			var aKeys = Object.keys(aAsInputArray[0]);
			for (var i = 0; i < aChangedRows.length; i++) {
				var oChangedActivity = {};
				var bUpdateFinance = aChangedRows[i]._UPDFIN;
				delete aChangedRows[i]._UPDFIN;
				var bUpdateItem = aChangedRows[i]._UPDITEM;
				delete aChangedRows[i]._UPDITEM;
				for (var j = 0; j < aKeys.length; j++) {
					if (aChangedRows[i][aKeys[j]]) {
						oChangedActivity[aKeys[j]] = aChangedRows[i][aKeys[j]].toString();
					}
				}
				oChangedActivity.StartDt = aChangedRows[i].StartDt.substring(0, 4) + "-" + aChangedRows[i].StartDt.substring(5, 7) + "-" +
					aChangedRows[i].StartDt.substring(
						8, 10) + "T00:00:00";
				oChangedActivity.EndDt = aChangedRows[i].EndDt.substring(0, 4) + "-" + aChangedRows[i].EndDt.substring(5, 7) + "-" +
					aChangedRows[
						i].EndDt.substring(8, 10) +
					"T00:00:00";
				oChangedActivity.CreatedTime = oChangedActivity.CreatedTime.replace("Z", "");
				oChangedActivity.ChangedTime = oChangedActivity.ChangedTime.replace("Z", "");
				var oConfig = {};
				if (bUpdateFinance) {
					oConfig.UPDFIN = "X";
					var sCurrency = oContext.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings/Currency");
					if (sCurrency && sCurrency !== "") {
						oChangedActivity.Currency = sCurrency;
					}
				}
				if (bUpdateItem) {
					oConfig.UPDITEM = "X";
				}
				oChangedActivity.Config = JSON.stringify(oConfig);
				oContext._clearUnused(oChangedActivity);
				var iRecordIndex = aChangedRows[i].__index;
				var sPath = aAsInputArray[iRecordIndex].__metadata.uri.substring(aAsInputArray[iRecordIndex].__metadata.uri.lastIndexOf("/"));
				delete oChangedActivity["__metadata"];
				var oUPPromise = this._updatePlan(oContext,oModel,sPath,oChangedActivity);
				aPromises.push(oUPPromise);
			}
			return Promise.all(aPromises);
		},
		_updatePlan: function(oContext, oModel, sPath, oChangedActivity) {
			var oPromise = new Promise(function(resolve, reject) {
				oModel.update(sPath, oChangedActivity, {
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(oContext);
						resolve(oData);
					},
					error: function(oError) {
						reject(oError);
					},
					changeSetId: oChangedActivity.Id
				});
			});
			return oPromise;
		}
	};
});