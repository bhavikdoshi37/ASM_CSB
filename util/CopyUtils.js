sap.ui.define([
	"colgate/asm/planning/base/util/DateUtils",
	"sap/m/MessageToast",
	'colgate/asm/planning/base/util/TimeoutUtils'
], function(DateUtils, MessageToast, TimeoutUtils) {
	"use strict";

	return {
		copyItems: function(oContext, bInclude, bIncludeBudget, bIncludeCSB, sPrefix, oTableSelector, oRawItems) {
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
			if (oItems.ItemType === "PT") {
				//Project
				this._createItem(oItems);
			} else if (oItems.ItemType === 'AT') {
				var oCopyUtilModelData = oContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
				oCopyUtilModelData.oProject = oCopyUtilModelData.oRawItems[oItems.__parentIndex];
				oCopyUtilModelData.sMode = 'AT';
				this._createItem(oItems);
			} else if (oItems.ItemType === 'SA') {
				var oCopyUtilModelData = oContext.getOwnerComponent().getModel("CopyUtilStorage").getData();
				oCopyUtilModelData.bInclude = false;
				//INBHD02
				if (bIncludeCSB) {
					this._getExistingCSBSubbrand(oContext, oCopyUtilModel.oItems); //With Cross Sub-Brand
				} else {
					this._createItem(oItems); //Without Cross Sub-Brand
				}
				//INBHD02
			}
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
			oItem.StartDt = DateUtils.getISODateNoZ_fromISODate(oDataR.StartDt);
			oItem.EndDt = DateUtils.getISODateNoZ_fromISODate(oDataR.EndDt);
			oItem.CreatedTime = DateUtils.getSystemAdjISODate_fromCurrentDate();
			oItem.ChangedTime = DateUtils.getSystemAdjISODate_fromCurrentDate();
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
				oItem.CsbConfig = oData.CsbConfig; //INBHD02
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
					var oActivity = oCopyUtilData.oItems[iActivity];
					if (oActivity) {
						if (iSubactivity > -1) {
							if (oCopyUtilData.oItems[iActivity][iSubactivity]) {
								bFinished = false;
								oCopyUtilData.oCurrentIndex.Subactivity++;
								oCopyUtilData.oCurrentItem = oCopyUtilData.oItems[iActivity][iSubactivity];
								this._createItem(oCopyUtilData.oItems[iActivity][iSubactivity]);
							} else {
								oCopyUtilData.oCurrentIndex.Activity++;
								oCopyUtilData.oCurrentIndex.Subactivity = -1;
								oCopyUtilData.oCurrentIndex.Subactivity++;
								oActivity = oCopyUtilData.oItems[oCopyUtilData.oCurrentIndex.Activity];
								if (oActivity) {
									bFinished = false;
									oCopyUtilData.oCurrentItem = oActivity;
									this._createItem(oActivity);
								}
							}
						} else {
							bFinished = false;
							oCopyUtilData.oCurrentIndex.Subactivity++;
							oCopyUtilData.oCurrentItem = oCopyUtilData.oItems[iActivity];
							this._createItem(oActivity);
						}
					} else {
						// Everything is finished.
					}
				} else if (oCopyUtilData.sMode === "AT") {
					// Need to do another loop (if any)
					var iActivity = oCopyUtilData.oCurrentIndex.Activity;
					var iSubactivity = oCopyUtilData.oCurrentIndex.Subactivity;
					if (iSubactivity > -1) {
						if (oCopyUtilData.oItems[iSubactivity]) {
							bFinished = false;
							oCopyUtilData.oCurrentIndex.Subactivity++;
							oCopyUtilData.oCurrentItem = oCopyUtilData.oItems[iSubactivity];
							this._createItem(oCopyUtilData.oItems[iSubactivity]);
						} else {
							oCopyUtilData.oCurrentIndex.Activity++;
							oCopyUtilData.oCurrentIndex.Subactivity = -1;
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

			oChangedActivity.StartDt = DateUtils.getISODateNoZ(oData.StartDt);
			oChangedActivity.EndDt = DateUtils.getISODateNoZ(oData.EndDt);
			oChangedActivity.CreatedTime = DateUtils.getSystemAdjISODate_fromDate(oChangedActivity.CreatedTime);
			oChangedActivity.ChangedTime = DateUtils.getSystemAdjISODate_fromCurrentDate();

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
			oData.Currency = oDataRaw.Currency; // GDH Was Missing
			oData.MaxValueB = oDataRaw.MaxValueB;
		},

		_getExternalId: function(oItem) {
			var oModel = this._oDataModel;
			var filters = [];
			filters.push(new sap.ui.model.Filter("Nrrangenr", sap.ui.model.FilterOperator.EQ, '01'));
			var sPath = "/Ids";
			this._callingContext.getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			var that = this._callingContext;
			var oThis = this;
			oModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(oThis);
					that.getOwnerComponent().getModel("CopyUtilStorage").getData().sExternalId = oData.results[0].Number;
					oThis._createItem(oItem);
				},
				error: function(oError) {
					oError.ErrorOrigin = "ExternalId";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
		},

		_getExistingCSBSubbrand: function(oContext, Item) {
			var that = this;
			var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var sbmodel = oContext.getModel("CSBESubbrands");

			if (!sbmodel) {
				sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				sbmodel.setSizeLimit(50000);
				sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				oContext.setModel(sbmodel, "CSBESubbrands");
			}

			var filters = [];
			if (Item.Id) {
				filters.push(new sap.ui.model.Filter("AsmId", sap.ui.model.FilterOperator.EQ, Item.Id));
			}
			var sPath = "/CrossSubBrandListSet";

			var oSBPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(this);
							var CSBData = [],
								newdata;

							for (var i = 0; i < oData.results.length; i++) {
								newdata = {};
								newdata.K = oData.results[i].SubbrandKey;
								newdata.L = oData.results[i].LeadSubbrand;
								newdata.U = "I";
								CSBData.push(newdata);
							}

							if (Item.BrandKey) {
								newdata = {};
								newdata.K = Item.BrandKey;
								newdata.L = "X";
								newdata.U = "I";
								CSBData.push(newdata);
							}

							Item.CsbConfig = JSON.stringify(CSBData); //bhavik
							resolve(oData);
							that._createItem(Item);
						},
						error: function(oError) {
							oError.ErrorOrigin = "CopyUtilsGetSubbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
		}
	};
});