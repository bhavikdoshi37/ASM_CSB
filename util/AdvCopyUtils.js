sap.ui.define([
	"colgate/asm/planning/base/util/DateUtils",
	"sap/m/MessageToast",
	"colgate/asm/planning/base/util/CopyUtils",
	'colgate/asm/planning/base/util/TimeoutUtils'
], function(DateUtils, MessageToast, CopyUtils, TimeoutUtils) {
	"use strict";

	return {
		copyItems: function(oContext, bInclude, bIncludeBudget, sPrefix, oTableSelector, oRawItems) {
			var oItems = JSON.parse(JSON.stringify(oTableSelector));
			var oCopyUtilModel = {};
			this._callingContext = oContext;
			oCopyUtilModel.bInclude = bInclude;
			oCopyUtilModel.bIncludeBudget = bIncludeBudget;
			oCopyUtilModel.sPrefix = sPrefix;
			oCopyUtilModel.oItems = oItems;
			oCopyUtilModel.oRawItems = oRawItems;
			oCopyUtilModel.sExternalId = "";
			oCopyUtilModel.oItemRaw = oItems;
			oCopyUtilModel.oCurrentItem = oItems;
			oCopyUtilModel.oCurrentIndex = {
				Project: 0,
				Activity: 0,
				Subactivity: -1,
				oTotalItems: 0
			};
			oCopyUtilModel.sMode = "PT";
			oCopyUtilModel.oProject = {};
			oCopyUtilModel.oActivity = {};
			oCopyUtilModel.oSubactivity = {};
			var oModel = new sap.ui.model.json.JSONModel(oCopyUtilModel);
			oModel.setSizeLimit(50000);
			oContext.getOwnerComponent().setModel(oModel, "CopyUtilStorage");
			var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oBaseModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); 
			oBaseModel.setSizeLimit(50000);
			this._oDataModel = oBaseModel;
			if (oItems.ItemType === "PT") {} else if (oItems.ItemType === 'AT') {
				var oCopyUtilModelData = oContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
				oCopyUtilModelData.oProject = oCopyUtilModelData.oRawItems[oItems.__parentIndex];
				oCopyUtilModelData.sMode = 'AT';
			} else if (oItems.ItemType === 'SA') {
				var oCopyUtilModelData = oContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
				oCopyUtilModelData.bInclude = false;
			}
			//GDH Start 20170328 this._getExternalId(oItems);
			this._createItem(oItems);
			//GDH End 20170328
		},
		_createItem: function(oData) {
			var oCopyUtilData = this._callingContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
			var oDataR = JSON.parse(JSON.stringify(oCopyUtilData.oRawItems[oData.__index]));
			var aKeys = Object.keys(oDataR);
			var oItem = {};
			for (var i = 0; i < aKeys.length; i++) {
				oItem[aKeys[i]] = oDataR[aKeys[i]];
			}
			delete oItem.__metadata;
			oItem.Guid = "";
			oItem.Name = oCopyUtilData.sPrefix + oItem.Name;
			oItem.Name = oItem.Name.substring(0, 40);
			oItem.Id = oCopyUtilData.sExternalId;
			//GDH oItem.StartDt = DateUtils.getSystemAdjISODateNoZ_fromISODate(oDataR.StartDt);
			//GDH oItem.EndDt = DateUtils.getSystemAdjISODateNoZ_fromISODate(oDataR.EndDt);
			oItem.StartDt = DateUtils.getISODateNoZ_fromISODate(oDataR.StartDt);
			oItem.EndDt = DateUtils.getISODateNoZ_fromISODate(oDataR.EndDt);
			// oItem.StartDt = oDataR.StartDt.substring(0, 4) + "-" + oDataR.StartDt.substring(5, 7) + "-" + oDataR.StartDt.substring(
			// 	8, 10) + "T12:00:00";
			// oItem.EndDt = oDataR.EndDt.substring(0, 4) + "-" + oDataR.EndDt.substring(5, 7) + "-" + oDataR.EndDt.substring(8, 10) +
			// 	"T12:00:00";
			//oItem.StartDt = oItem.StartDt.replace("Z", "");
			//oItem.EndDt = oItem.EndDt.replace("Z", "");
			oItem.CreatedTime = DateUtils.getSystemAdjISODate_fromCurrentDate();
			oItem.ChangedTime = DateUtils.getSystemAdjISODate_fromCurrentDate();
			// var oDate = new Date();
			// var iMonth = parseInt(oDate.getMonth()) + 1;
			// oItem.CreatedTime = oDate.getFullYear() + "-" + iMonth + "-" + oDate.getDate() + "T00:00:00";
			// oItem.ChangedTime = oDate.getFullYear() + "-" + iMonth + "-" + oDate.getDate() + "T00:00:00";
			oItem.CreatedBy = "";
			oItem.ChangedBy = "";
			oItem.Config = "";
			oItem.CHasChildren = "";
			// Remove fields that were added in extra.
			if (oItem.ItemType === "PT") {
				oItem.ProjectGuid = "";
				delete oItem.SubactivityType;
				delete oItem.ProjectType;
			} else if (oItem.ItemType === "SA") {
				delete oItem.SubactivityType;
				delete oItem.ProjectType;
				if (oCopyUtilData.oActivity.ProjectGuid) {
					oItem.ProjectGuid = oCopyUtilData.oActivity.ProjectGuid;
					oItem.ActivityGuid = oCopyUtilData.oActivity.ActivityGuid;
				} else {
					oItem.ProjectGuid = oCopyUtilData.oRawItems[oData.__parentIndex].ProjectGuid;
					oItem.ActivityGuid = oCopyUtilData.oRawItems[oData.__parentIndex].ActivityGuid;
				}
				oItem.CategoryBucket = oCopyUtilData.oRawItems[oData.__parentIndex].CategoryBucket;
			} else if (oItem.ItemType === "AT") {
				delete oItem.SubactivityType;
				delete oItem.ProjectType;
				if (oCopyUtilData.oProject.ProjectGuid) {
					oItem.ProjectGuid = oCopyUtilData.oProject.ProjectGuid;
				} else {
					oItem.ProjectGuid = oCopyUtilData.oRawItems[oData.__parentIndex].ProjectGuid;
				}
				oItem.ActivityGuid = "";
				oItem.CategoryBucket = oCopyUtilData.oRawItems[oData.__parentIndex].CategoryBucket;
			}
			oItem.Status = "";
			delete oItem.Type;
			delete oItem.TypeDescription;
			delete oItem.Parent;
			oItem.HubDesc = "";
			oItem.SubDesc = "";
			oItem.CategoryDesc = "";
			oItem.SubcategoryDesc = "";
			oItem.BrandDesc = "";
			oItem.SubbrandDesc = "";
			var oModel = this._oDataModel;
			this._callingContext.getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			var that = this._callingContext;
			var oThis = this;
			oModel.create("/Items", oItem, {
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(oThis);
					// Add a Success toast and navigate back to the Project view and refresh the data.
					var oCopyUtilData = that.getOwnerComponent().getModel("CopyUtilStorage").getData();
					if (!oData.Name || oData.Name === "") {
						oData.ErrorOrigin = "CreateProject";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oData);
					} else {
						oCopyUtilData.oCurrentIndex.oTotalItems++;
						var sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_created", [oData.Name]);
						if (oData.ItemType === "PT") {
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_pCreated", [oData.Name]);
							oCopyUtilData.oProject = oData;
							oCopyUtilData.oCurrentIndex.oActivity = 0;
						} else if (oData.ItemType === "AT") {
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_aCreated", [oData.Name]);
							oCopyUtilData.oCurrentIndex.oActivity++;
							oCopyUtilData.oCurrentIndex.oSubactivity = 0;
							oCopyUtilData.oActivity = oData;
						} else if (oData.ItemType === "SA") {
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_saCreated", [oData.Name]);
							oCopyUtilData.oCurrentIndex.oSubactivity++;
							oCopyUtilData.oSubactivity = oData;
						}
						MessageToast.show(sMessage);
						if (oCopyUtilData.bIncludeBudget && oData.ItemType === "SA") {
							oThis._saveBudget(oData, oCopyUtilData.oCurrentItem);
						} else {
							oThis._nextLoop();
						}
					}
				},
				error: function(oError) {
					oError.ErrorOrigin = "CreateProject";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				},
				changeSetId: oItem.Id
			});
		},
		_nextLoop: function() {
			var oCopyUtilData = this._callingContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
			var bFinished = true;
			if (oCopyUtilData.bInclude) {
				if (oCopyUtilData.sMode === "PT") {
					// Need to do another loop (if any)
					var iActivity = oCopyUtilData.oCurrentIndex.Activity;
					var iSubactivity = oCopyUtilData.oCurrentIndex.Subactivity;
					var oActivity = oCopyUtilData.oItems.rows[iActivity];
					if (oActivity) {
						if (iSubactivity > -1) {
							if (oCopyUtilData.oItems.rows[iActivity].rows && oCopyUtilData.oItems.rows[iActivity].rows[iSubactivity]) {
								bFinished = false;
								oCopyUtilData.oCurrentIndex.Subactivity++;
								oCopyUtilData.oCurrentItem = oCopyUtilData.oItems.rows[iActivity].rows[iSubactivity];
								this._createItem(oCopyUtilData.oItems.rows[iActivity].rows[iSubactivity]);
							} else {
								oCopyUtilData.oCurrentIndex.Activity++;
								oCopyUtilData.oCurrentIndex.Subactivity = -1;
								oCopyUtilData.oCurrentIndex.Subactivity++;
								oActivity = oCopyUtilData.oItems.rows[oCopyUtilData.oCurrentIndex.Activity];
								if (oActivity) {
									bFinished = false;
									oCopyUtilData.oCurrentItem = oActivity;
									this._createItem(oActivity);
								}
							}
						} else {
							bFinished = false;
							oCopyUtilData.oCurrentIndex.Subactivity++;
							oCopyUtilData.oCurrentItem = oCopyUtilData.oItems.rows[iActivity];
							// GDH Start 20170328
							this._createItem(oActivity);
							// GDH End 20170328 this._getExternalId(oActivity);
						}
					} else {
						// Everything is finished.
					}
				} else if (oCopyUtilData.sMode === "AT") {
					// Need to do another loop (if any)
					var iActivity = oCopyUtilData.oCurrentIndex.Activity;
					var iSubactivity = oCopyUtilData.oCurrentIndex.Subactivity;
					if (iSubactivity > -1) {
						if (oCopyUtilData.oItems.rows) {
							if (oCopyUtilData.oItems.rows[iSubactivity]) {
								bFinished = false;
								oCopyUtilData.oCurrentIndex.Subactivity++;
								oCopyUtilData.oCurrentItem = oCopyUtilData.oItems.rows[iSubactivity];
								if (!oCopyUtilData.oItems.rows[iSubactivity].isCheckVisible ||
									(oCopyUtilData.oItems.rows[iSubactivity].isCheckVisible && oCopyUtilData.oItems.rows[iSubactivity].isSelected)) {
									this._createItem(oCopyUtilData.oItems.rows[iSubactivity]);
								} else {
									oCopyUtilData.oCurrentIndex.oTotalItems++;
									oCopyUtilData.oCurrentIndex.oSubactivity++;
									//oCopyUtilData.oSubactivity = oData;
									this._nextLoop();
								}
							} else {
								oCopyUtilData.oCurrentIndex.Activity++;
								oCopyUtilData.oCurrentIndex.Subactivity = -1;
							}
						}
					} else {
						bFinished = false;
						oCopyUtilData.oCurrentIndex.Subactivity++;
						this._nextLoop();
					}
				}
			}
			if (bFinished) {
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Refresh", {});
			}
		},
		_saveBudget: function(oData, oDataRaw) {
			var oModel = this._oDataModel;
			var aKeys = Object.keys(oData);
			var oChangedActivity = {};
			for (var j = 0; j < aKeys.length; j++) {
				oChangedActivity[aKeys[j]] = oData[aKeys[j]];
			}
			//oChangedActivity.StartDt = DateUtils.getSystemAdjISODate_fromDate(oData.StartDt);
			//oChangedActivity.EndDt = DateUtils.getSystemAdjISODate_fromDate(oData.EndDt);
			oChangedActivity.StartDt = DateUtils.getISODateNoZ(oData.StartDt);
			oChangedActivity.EndDt = DateUtils.getISODateNoZ(oData.EndDt);
			oChangedActivity.CreatedTime = DateUtils.getSystemAdjISODate_fromDate(oChangedActivity.CreatedTime);
			oChangedActivity.ChangedTime = DateUtils.getSystemAdjISODate_fromCurrentDate();
			// var iMonth = parseInt(oData.StartDt.getMonth()) + 1;
			// oChangedActivity.StartDt = oData.StartDt.getFullYear() + "-" + iMonth + "-" +
			// 	oData.StartDt.getDate() + "T00:00:00";
			// iMonth = parseInt(oData.EndDt.getMonth()) + 1;
			// oChangedActivity.EndDt = oData.EndDt.getFullYear() + "-" + iMonth + "-" +
			// 	oData.EndDt.getDate() +
			// 	"T00:00:00";
			// iMonth = parseInt(oData.CreatedTime.getMonth()) + 1;
			// oChangedActivity.CreatedTime = oChangedActivity.CreatedTime.getFullYear() + "-" + iMonth + "-" +
			// 	oChangedActivity.CreatedTime.getDate() +
			// 	"T00:00:00";
			// var oDate = new Date();
			// iMonth = parseInt(oDate.getMonth()) + 1;
			// oChangedActivity.ChangedTime = oDate.getFullYear() + "-" + iMonth + "-" + oDate.getDate() + "T00:00:00";
			var oConfig = {};
			oConfig.UPDFIN = "X";
			oConfig.UPDITEM = "X";
			oChangedActivity.Config = JSON.stringify(oConfig);
			this._clearUnused(oChangedActivity);
			var oCopyUtilData = this._callingContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
			var oDataR = JSON.parse(JSON.stringify(oCopyUtilData.oRawItems[oDataRaw.__index]));
			this._addBudgetValues(oChangedActivity, oDataR);
			var sPath = oData.__metadata.uri.substring(oData.__metadata.uri.lastIndexOf("/"));
			var that = this;
			oModel.update(sPath, oChangedActivity, {
				success: function(oData, oResponse) {
					// Budget Saved
					TimeoutUtils.onResetTimer(that);
					that._nextLoop();
				},
				error: function(oError) {
					oError.ErrorOrigin = "SaveBudget";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
				},
				changeSetId: oChangedActivity.Id + "B"
			});
		},
		_clearUnused: function(oRaw) {
			oRaw.AmtBTot = "0";
			oRaw.AmtATot = "0";
			oRaw.AmtCTot = "0";
			oRaw.AmtCbTot = "0";
			oRaw.AmtLeTot = "0";
		},
		_addBudgetValues: function(oData, oDataRaw) {
			var i = 0;
			do {
				i++;
				var sColumnName = "AmtB" + i;
				oData[sColumnName] = oDataRaw[sColumnName];
			} while (i < 12);
			oData.Currency = oDataRaw.Currency;
			oData.MaxValueB = oDataRaw.MaxValueB;
		}
	};
});