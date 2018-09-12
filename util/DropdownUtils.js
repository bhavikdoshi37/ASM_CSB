sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast',
	'colgate/asm/planning/base/util/TimeoutUtils',
	'colgate/asm/planning/base/util/SpinnerUtils'
], function(Dialog, MessageToast, TimeoutUtils, SpinnerUtils) {
	"use strict";
	return {
		getDelayedSubcategories: function(oContext, sCategory, sSubcategory, sBrand, oModel, sSubcategories, oRecord, sCurrent) {
			var oRec = {};
			oRec.oContext = oContext;
			oRec.sCategory = sCategory;
			oRec.sSubcategory = sSubcategory;
			oRec.sBrand = sBrand;
			oRec.oModel = oModel;
			oRec.sSubcategories = sSubcategories;
			oRec.oRecord = oRecord;
			oRec.sCurrent = sCurrent;
			this._delaySubcategory.push(oRec);
		},
		getSubcategories: function(oContext, sCategory, sSubcategory, sBrand, oModel, sSubcategories, oRecord, sCurrent) {
			var oPromise = null;
			if (!sCategory) {
				sCategory = "";
			}
			if (!sSubcategory) {
				sSubcategory = "";
			}
			if (!sBrand) {
				sBrand = "";
			}
			this._oContext = oContext;
			var oBData = oModel.getProperty(sSubcategories);
			var sCombinedKey = sCategory + ":" + sSubcategory + ":" + sBrand;
			if (oBData[sCombinedKey]) {
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						if (!oRecord) {
							oModel.setProperty(sCurrent, oBData[sCombinedKey]);
						} else {
							oRecord[sCurrent] = oBData[sCombinedKey];
						}
						oModel.refresh(false);
						resolve(oBData[sCombinedKey]);
					}, 200);
				});
			} else {
				SpinnerUtils.startDetailSpinner(oContext);
				var that = this;
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var oBModel = oContext.getOwnerComponent().getModel("LPHValues");
						var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
						if (!oBModel) {
							//oBModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); //Changed by Khrystyne 10/30
							oBModel = new sap.ui.model.odata.ODataModel(sServiceUrl);
							oBModel.setSizeLimit(50000);
							oBModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							oContext.getOwnerComponent().setModel(oBModel, "LPHValues");
						}
						var filters = [];
						filters.push(new sap.ui.model.Filter("Brand", sap.ui.model.FilterOperator.EQ, sBrand));
						filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, sCategory));
						filters.push(new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.EQ, sSubcategory));
						var sPath = "/VHSubcategories";
						SpinnerUtils.startDetailSpinner(oContext);
						oBModel.read(sPath, {
							async: false,
							filters: filters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(oContext);
								that._setSubcategories(oContext, oData, sCombinedKey, oBData, oModel, sSubcategories, oRecord, sCurrent);
								resolve(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Subcategory";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
								reject(oError);
							}
						});
					}, 200);
				});
			}
			return oPromise;
		},
		_setSubcategories: function(oContext, oDataIn, sCombinedKey, oBData, oModel, sCategories, oRecord, sCurrent) {
			var oUserData = oContext.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sSubcategory = oUserData.getProperty("/SubcategoryKey");
				if (sSubcategory && sSubcategory !== "") {
					// Filter currentHubs
					var aSubcategories = oDataIn.results;
					var iCorrectKey = 0;
					for (var i = 0; i < aSubcategories.length; i++) {
						if (aSubcategories[i].Key === sSubcategory) {
							iCorrectKey = i;
							i = aSubcategories.length;
						}
					}
					oDataIn.results = [];
					oDataIn.results.push(aSubcategories[iCorrectKey]);
				}
			}
			if (!oRecord) {
				oModel.setProperty(sCurrent, oDataIn.results);
			} else {
				oRecord[sCurrent] = oDataIn.results;
			}
			oBData[sCombinedKey] = oDataIn.results;
			oModel.refresh(false);
			SpinnerUtils.stopSpinner(oContext);
		},
		getDelayedCategories: function(oContext, sCategory, sBrand, oModel, sCategories, oRecord, sCurrent) {
			var oRec = {};
			oRec.oContext = oContext;
			oRec.sCategory = sCategory;
			oRec.sBrand = sBrand;
			oRec.oModel = oModel;
			oRec.sCategories = sCategories;
			oRec.oRecord = oRecord;
			oRec.sCurrent = sCurrent;
			this._delayCategory.push(oRec);
		},
		getCategories: function(oContext, sCategory, sBrand, oModel, sCategories, oRecord, sCurrent) {
			var oPromise = null;
			if (!sCategory) {
				sCategory = "";
			}
			if (!sBrand) {
				sBrand = "";
			}
			this._oContext = oContext;
			var oBData = oModel.getProperty(sCategories);
			var sCombinedKey = ":" + sBrand;
			if (oBData[sCombinedKey]) {
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						if (!oRecord) {
							oModel.setProperty(sCurrent, oBData[sCombinedKey]);
						} else {
							oRecord[sCurrent] = oBData[sCombinedKey];
						}
						oModel.refresh(false);
						resolve(oBData[sCombinedKey]);
					}, 200);
				});
			} else {
				SpinnerUtils.startDetailSpinner(oContext);
				var that = this;
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						var oBModel = oContext.getOwnerComponent().getModel("LPHValues");
						var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
						if (!oBModel) {
							//oBModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); //Changed by Khrystyne 10/30
							oBModel = new sap.ui.model.odata.ODataModel(sServiceUrl);
							oBModel.setSizeLimit(50000);
							oBModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							oContext.getOwnerComponent().setModel(oBModel, "LPHValues");
						}
						var filters = [];
						filters.push(new sap.ui.model.Filter("Brand", sap.ui.model.FilterOperator.EQ, sBrand));
						filters.push(new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.EQ, sCategory));
						var sPath = "/VHCategories";
						SpinnerUtils.startDetailSpinner(oContext);
						oBModel.read(sPath, {
							async: false,
							filters: filters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(oContext);
								that._setCategories(oContext, oData, sCombinedKey, oBData, oModel, sCategories, oRecord, sCurrent);
								resolve(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Category";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
								reject(oError);
							}
						});
					}, 200);
				});
			}
			return oPromise;
		},
		_setCategories: function(oContext, oDataIn, sCombinedKey, oBData, oModel, sCategories, oRecord, sCurrent) {
			var oUserData = oContext.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sCategory = oUserData.getProperty("/CategoryKey");
				if (sCategory && sCategory !== "") {
					// Filter currentHubs
					var aCategories = oDataIn.results;
					var iCorrectKey = 0;
					for (var i = 0; i < aCategories.length; i++) {
						if (aCategories[i].Key === sCategory) {
							iCorrectKey = i;
							i = aCategories.length;
						}
					}
					oDataIn.results = [];
					oDataIn.results.push(aCategories[iCorrectKey]);
				}
			}
			if (!oRecord) {
				oModel.setProperty(sCurrent, oDataIn.results);
			} else {
				oRecord[sCurrent] = oDataIn.results;
			}
			oBData[sCombinedKey] = oDataIn.results;
			oModel.refresh(false);
			SpinnerUtils.stopSpinner(oContext);
		},
		getDelayedBrands: function(oContext, oBrand, sCategory, sSubcategory, sBrand, oModel, sBrands, oRecord, sCurrent) {
			var oRec = {};
			oRec.oContext = oContext;
			oRec.oBrand = oBrand;
			oRec.sCategory = sCategory;
			oRec.sSubcategory = sSubcategory;
			oRec.sBrand = sBrand;
			oRec.oModel = oModel;
			oRec.sBrands = sBrands;
			oRec.oRecord = oRecord;
			oRec.sCurrent = sCurrent;
			this._delayBrand.push(oRec);
		},
		getBrands: function(oContext, oBrand, sCategory, sSubcategory, sBrand, oModel, sBrands, oRecord, sCurrent) {
			var oPromise = null;
			if (!sCategory) {
				sCategory = "";
			}
			if (!sSubcategory) {
				sSubcategory = "";
			}
			if (!sBrand) {
				sBrand = "";
			}
			this._oContext = oContext;
			this._oModel = oModel;
			var oBData = oModel.getProperty(sBrands);
			var sCombinedKey = sCategory + ":" + sSubcategory;
			var that = this;
			if (oBData[sCombinedKey]) {
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						if (!oRecord) {
							oModel.setProperty(sCurrent, oBData[sCombinedKey]);
							oModel.refresh(false);
						} else {
							oRecord[sCurrent] = oBData[sCombinedKey];
						}
						that._checkBrand(oBrand, oModel, oRecord, sCurrent);
						resolve(oBData[sCombinedKey]);
					}, 200);
				});
			} else {
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						SpinnerUtils.startDetailSpinner(oContext);
						var oBModel = oContext.getOwnerComponent().getModel("Brand");
						var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
						if (!oBModel) {
							//oBModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); //Changed by 10/30
							oBModel = new sap.ui.model.odata.ODataModel(sServiceUrl);
							oBModel.setSizeLimit(50000);
							oBModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							oContext.getOwnerComponent().setModel(oBModel, "Brand");
						}
						var filters = [];
						filters.push(new sap.ui.model.Filter("PSubCategory", sap.ui.model.FilterOperator.EQ, sSubcategory));
						filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, sCategory));
						filters.push(new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.EQ, sBrand));
						var sPath = "/VHBrands";
						SpinnerUtils.startDetailSpinner(oContext); // Start Spinner
						oBModel.read(sPath, {
							async: false,
							filters: filters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(oContext);
								that._setBrands(oContext, oBrand, oData, sCombinedKey, oBData, oModel, sBrands, oRecord, sCurrent);
								resolve(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Brand";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
								reject(oError);
							}
						});
					}, 200);
				});
			}
			return oPromise;
		},
		_setBrands: function(oContext, oBrand, oDataIn, sCombinedKey, oBData, oModel, sBrands, oRecord, sCurrent) {
			var oUserData = oContext.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sBrand = oUserData.getProperty("/BrandKey");
				if (sBrand && sBrand !== "") {
					// Filter currentHubs
					var aBrands = oDataIn.results;
					var iCorrectKey = 0;
					for (var i = 0; i < aBrands.length; i++) {
						if (aBrands[i].Key === sBrand) {
							iCorrectKey = i;
							i = aBrands.length;
						}
					}
					oDataIn.results = [];
					oDataIn.results.push(aBrands[iCorrectKey]);
				}
			}
			oBData[sCombinedKey] = oDataIn.results;
			if (!oRecord) {
				oModel.setProperty(sCurrent, oDataIn.results);
			} else {
				oRecord[sCurrent] = oDataIn.results;
			}
			if (this._oModel.getData().Table) {
				this._checkBrand(oBrand, oModel, oRecord, sCurrent);
			}
			oModel.refresh(false);
			SpinnerUtils.stopSpinner(oContext);
		},
		_checkBrand: function(oBrand, oModel, oRecord, sCurrent) {
			// This will clear a bad brand choice
			var sBrand = "";
			if (oBrand) {
				sBrand = oBrand.getSelectedKey();
			} else {
				if (oRecord) {
					sBrand = oRecord.BrandKey;
				}
			}
			if (sBrand && sBrand !== "") {
				var aBrands = [];
				if (!oRecord) {
					if (oModel.getProperty(sCurrent)) {
						aBrands = oModel.getProperty(sCurrent);
					}
				} else {
					if (oRecord[sCurrent]) {
						aBrands = oRecord[sCurrent];
					}
				}
				var bFound = false;
				for (var i = 0; i < aBrands.length; i++) {
					if (aBrands[i].Key === sBrand) {
						// This should be okay - brand does not need to be cleared
						i = aBrands.length;
						bFound = true;
					}
				}
				if (!bFound) {
					if (oBrand) {
						oBrand.setSelectedKey("");
					} else {
						oRecord.BrandKey = "";
					}
					this._clearParentPHField(this._oModel.getData().Table, "BrandKey", oRecord);
				}
			}
		},
		_clearParentPHField: function(oData, sClearField, oRecord) {
			if (oData.rows) {
				// The PH Rows need to be initialized in reverse order
				for (var i = 0; i < oData.rows.length; i++) {
					if (oData.rows[i].rows) {
						for (var j = 0; j < oData.rows[i].rows.length; j++) {
							if (oData.rows[i].rows[j] === oRecord) {
								// Remove the value from the parent
								oData.rows[i][sClearField] = "";
							}
							if (oData.rows[i].rows[j].rows) {
								for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
									if (oData.rows[i].rows[j].rows[k] === oRecord) {
										// Remove the value from the parents
										oData.rows[i][sClearField] = "";
										oData.rows[i].rows[j][sClearField] = "";
									}
								}
							}
						}
					}
				}
			}
		},
		_resetEnabled: function(oData, sEnabled, sField) {
			if (oData.rows) {
				// The PH Rows need to be initialized in reverse order
				for (var i = 0; i < oData.rows.length; i++) {
					if (oData.rows[i].rows) {
						oData.rows[i].Enabled[sEnabled] = oData.rows[i].isRowEditable;
						for (var j = 0; j < oData.rows[i].rows.length; j++) {
							if (oData.rows[i].rows[j][sField] !== "" && oData.rows[i].rows[j][sField] === oData.rows[i][sField]) {
								oData.rows[i].rows[j].Enabled[sEnabled] = false;
							} else {
								oData.rows[i].rows[j].Enabled[sEnabled] = oData.rows[i].rows[j].isRowEditable;
							}
							if (oData.rows[i].rows[j].rows) {
								for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
									if (oData.rows[i].rows[j].rows[k][sField] !== "" && oData.rows[i].rows[j].rows[k][sField] === oData.rows[i].rows[j][sField]) {
										oData.rows[i].rows[j].rows[k].Enabled[sEnabled] = false;
									} else {
										oData.rows[i].rows[j].rows[k].Enabled[sEnabled] = oData.rows[i].rows[j].rows[k].isRowEditable;
									}
								}
							}
						}
					}
				}
			}
		},
		getDelayedSubbrands: function(oContext, oSubbrand, sCategory, sSubcategory, sBrand, sSubbrand, oModel, sSubbrands, oRecord, sCurrent) {
			var oRec = {};
			oRec.oContext = oContext;
			oRec.oSubbrand = oSubbrand;
			oRec.sCategory = sCategory;
			oRec.sSubcategory = sSubcategory;
			oRec.sBrand = sBrand;
			oRec.oModel = oModel;
			oRec.sSubbrands = sSubbrands;
			oRec.oRecord = oRecord;
			oRec.sCurrent = sCurrent;
			this._delaySubbrand.push(oRec);
		},
		getSubbrands: function(oContext, oSubbrand, sCategory, sSubcategory, sBrand, sSubbrand, oModel, sSubbrands, oRecord, sCurrent) {
			var oPromise = null;
			if (!sCategory) {
				sCategory = "";
			}
			if (!sSubcategory) {
				sSubcategory = "";
			}
			if (!sBrand) {
				sBrand = "";
			}
			if (!sSubbrand) {
				sSubbrand = "";
			}
			this._oContext = oContext;
			this._oModel = oModel;
			var oBData = oModel.getProperty(sSubbrands);
			var sCombinedKey = sCategory + ":" + sSubcategory + ":" + sBrand;
			var that = this;
			if (oBData[sCombinedKey]) {
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						if (!oRecord) {
							oModel.setProperty(sCurrent, oBData[sCombinedKey]);
							oModel.refresh(false);
						} else {
							oRecord[sCurrent] = oBData[sCombinedKey];
						}
						//that._checkBrand(oBrand, oModel, oRecord, sCurrent);
						resolve(oBData[sCombinedKey]);
					}, 200);
				});
			} else {
				oPromise = new Promise(function(resolve, reject) {
					setTimeout(function() {
						SpinnerUtils.startDetailSpinner(oContext);
						var oBModel = oContext.getOwnerComponent().getModel("Brand");
						var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
						if (!oBModel) {
							//oBModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); //Changed by 10/30
							oBModel = new sap.ui.model.odata.ODataModel(sServiceUrl);
							oBModel.setSizeLimit(50000);
							oBModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							oContext.getOwnerComponent().setModel(oBModel, "Brand");
						}
						var filters = [];
						filters.push(new sap.ui.model.Filter("PSubCategory", sap.ui.model.FilterOperator.EQ, sSubcategory));
						filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, sCategory));
						filters.push(new sap.ui.model.Filter({
							path: "Brand",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sBrand
						}));
						filters.push(new sap.ui.model.Filter("Key", sap.ui.model.FilterOperator.EQ, sSubbrand));
						var sPath = "/VHSubbrands";
						SpinnerUtils.startDetailSpinner(oContext); // Start Spinner
						oBModel.read(sPath, {
							async: false,
							filters: filters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(oContext);
								that._setSubbrands(oContext, oSubbrand, oData, sCombinedKey, oBData, oModel, sSubbrands, oRecord, sCurrent);
								resolve(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Subbrand";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
								reject(oError);
							}
						});
					}, 200);
				});
			}
			return oPromise;
		},
		_setSubbrands: function(oContext, oBrand, oDataIn, sCombinedKey, oBData, oModel, sBrands, oRecord, sCurrent) {
			oBData[sCombinedKey] = oDataIn.results;
			if (!oRecord) {
				oModel.setProperty(sCurrent, oDataIn.results);
			} else {
				oRecord[sCurrent] = oDataIn.results;
			}
			// if (this._oModel.getData().Table) {
			// 	this._checkBrand(oBrand, oModel, oRecord, sCurrent);
			// }
			oModel.refresh(false);
			SpinnerUtils.stopSpinner(oContext);
		},
		resetDelay: function() {
			sap.ui.getCore().getEventBus().subscribe("colgate.asm.planning.dropdownutils", "ResolveComplete", this._checkAllFinished, this);
			this._delayCategory = [];
			this._delaySubcategory = [];
			this._delayBrand = [];
			this._delaySubbrand = [];
			this._waitingCategory = true;
			this._waitingSubcategory = true;
			this._waitingBrand = true;
			this._waitingSubbrand = true;
		},
		executeDelayed: function() {
			if (this._delayCategory.length === 0) {
				this._waitingCategory = false;
			} else {
				this._resolveCategory(0);
			}
			if (this._delaySubcategory.length === 0) {
				this._waitingSubcategory = false;
			} else {
				this._resolveSubcategory(0);
			}
			if (this._delayBrand.length === 0) {
				this._waitingBrand = false;
			} else {
				this._resolveBrand(0);
			}
			if (this._delaySubbrand.length === 0) {
				this._waitingSubbrand = false;
			} else {
				this._resolveSubbrand(0);
			}
			var oRData = {};
			oRData.sComplete = "None";
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.dropdownutils", "ResolveComplete", oRData);
		},
		_checkAllFinished: function(sChannelId, sEventId, oData) {
			switch (oData.sComplete) {
				case "Category":
					this._waitingCategory = false;
					break;
				case "Subcategory":
					this._waitingSubcategory = false;
					break;
				case "Brand":
					this._waitingBrand = false;
					break;
				case "Subbrand":
					this._waitingSubbrand = false;
					break;
				default:
					break;
			}
			if (!this._waitingCategory && !this._waitingSubcategory && !this._waitingBrand && !this._waitingSubbrand) {
				sap.ui.getCore().getEventBus().unsubscribe("colgate.asm.planning.dropdownutils", "ResolveComplete", this._checkAllFinished, this);
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.dropdownutils", "PHFetchComplete", {});
			}
		},
		_resolveCategory: function(i) {
			var that = this;
			if (i < that._delayCategory.length) {
				var oRecord = that._delayCategory[i];
				(that.getCategories(oRecord.oContext, oRecord.sCategory, oRecord.sBrand, oRecord.oModel, oRecord.sCategories, oRecord.oRecord,
					oRecord.sCurrent).then(function(oData) {
					if (i + 1 === that._delayCategory.length) {
						var oRData = {};
						oRData.sComplete = "Category";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.dropdownutils", "ResolveComplete", oRData);
					} else {
						that._resolveCategory(i + 1);
					}
				}));
			}
		},
		_resolveSubcategory: function(i) {
			var that = this;
			if (i < that._delaySubcategory.length) {
				var oRecord = that._delaySubcategory[i];
				(that.getSubcategories(oRecord.oContext, oRecord.sCategory, oRecord.sSubcategory, oRecord.sBrand, oRecord.oModel, oRecord.sSubcategories,
					oRecord.oRecord,
					oRecord.sCurrent).then(function(oData) {
					if (i + 1 === that._delaySubcategory.length) {
						var oRData = {};
						oRData.sComplete = "Subcategory";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.dropdownutils", "ResolveComplete", oRData);
					} else {
						that._resolveSubcategory(i + 1);
					}
				}));
			}
		},
		_resolveBrand: function(i) {
			var that = this;
			if (i < that._delayBrand.length) {
				var oRecord = that._delayBrand[i];
				(that.getBrands(oRecord.oContext, oRecord.oBrand, oRecord.sCategory, oRecord.sSubcategory, oRecord.sBrand, oRecord.oModel,
					oRecord.sBrands,
					oRecord.oRecord,
					oRecord.sCurrent).then(function(oData) {
					if (i + 1 === that._delayBrand.length) {
						var oRData = {};
						oRData.sComplete = "Brand";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.dropdownutils", "ResolveComplete", oRData);
					} else {
						that._resolveBrand(i + 1);
					}
				}));
			}
		},
		_resolveSubbrand: function(i) {
			var that = this;
			if (i < that._delaySubbrand.length) {
				var oRecord = that._delaySubbrand[i];
				(that.getSubbrands(oRecord.oContext, oRecord.oSubbrand, oRecord.sCategory, oRecord.sSubcategory, oRecord.sBrand, oRecord.sSubbrand,
					oRecord.oModel,
					oRecord.sSubbrands,
					oRecord.oRecord,
					oRecord.sCurrent).then(function(oData) {
					if (i + 1 === that._delaySubbrand.length) {
						var oRData = {};
						oRData.sComplete = "Subbrand";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.dropdownutils", "ResolveComplete", oRData);
					} else {
						that._resolveSubbrand(i + 1);
					}
				}));
			}
		}
	};
});