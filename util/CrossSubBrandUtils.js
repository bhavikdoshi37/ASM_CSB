sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/Dialog",
	"sap/m/MessageToast",
	"colgate/asm/planning/base/util/TimeoutUtils"
], function(Filter, FilterOperator, Button, Text, Dialog, MessageToast, TimeoutUtils) {
	"use strict";

	return {

	// 	onSelectCrossBrand: function(Model, oContext, oEvent) {
	// 		var oModel = oContext.getModel(Model);
	// 		var oInput = oModel.getData();

	// 		if (!oContext.oPersonalizationDialog) {
	// 			oContext.oPersonalizationDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.CrossSubBrand", oContext);
	// 			oContext.getView().addDependent(oContext.oPersonalizationDialog);
	// 		}
	// 		if (!oInput.CSBSubbrand.CSBCategoryKey) {
	// 			oContext._getdefaultCSBfilter(Model, oContext);
	// 		}
	// 		oContext.oPersonalizationDialog.open();
	// 	},

	// 	_onCSBFilterchange: function(Model, oContext, oEvent) {
	// 		var oModel = oContext.getModel(Model);
	// 		var oInput = oModel.getData();

	// 		var id = oEvent.getParameter("id");

	// 		if (id === "CSBCategoryKey") {
	// 			oInput.CSBSubbrand.CSBSubcategoryKey = "";
	// 			oInput.CSBSubcategory.Current = [];

	// 			oInput.CSBSubbrand.CSBBrandKey = "";
	// 			oInput.CSBBrand.Current = [];

	// 			oModel.refresh(false);

	// 			this._getCSBSubcategory();
	// 			this._getCSBBrand();
	// 		} else {
	// 			if (id === "CSBSubcategoryKey") {
	// 				oInput.CSBSubbrand.CSBBrandKey = "";
	// 				oInput.CSBBrand.Current = [];

	// 				oModel.refresh(false);

	// 				this._getCSBBrand();
	// 			}
	// 		}
	// 		this._getCSBSubbrand(oInput.CSBSubbrand.CSBCategoryKey, oInput.CSBSubbrand.CSBSubcategoryKey, oInput.CSBSubbrand.CSBBrandKey);
	// 	},

	// 	onSearchCSB: function(Model, oContext, oEvent) {
	// 		var sQuery = oEvent.getParameter("query");

	// 		oContext._oGlobalFilter = null;
	// 		if (sQuery) {
	// 			oContext._oGlobalFilter = new Filter([
	// 				new Filter("SubbrandDesc", FilterOperator.Contains, sQuery)
	// 			], false);
	// 		}

	// 		var binding = oEvent.oSource.getParent();
	// 		binding.getParent().getBinding().filter(oContext._oGlobalFilter, "Application");
	// 	},

	// 	_clearAllCSBSelection: function(Model, oContext, oEvent) {
	// 		var Table = oEvent.oSource.getParent().getParent();
	// 		Table.clearSelection();
	// 	},

	// 	_addCSBbrands: function(Model, oContext, oEvent) {

	// 		var oModel = oContext.getModel(Model),
	// 			CSBTable = oEvent.oSource.getParent().getParent(),
	// 			SelectedRowContext = CSBTable.getSelectedIndices(),
	// 			binding = CSBTable.getBinding();

	// 		if (SelectedRowContext.length) {
	// 			for (var i = 0; i < SelectedRowContext.length; i++) {
	// 				var rowIndices = "",
	// 					newdata = {};

	// 				rowIndices = SelectedRowContext[i];

	// 				var selctedrow = binding.oList[rowIndices];

	// 				newdata.SubbrandKey = selctedrow.SubbrandKey;
	// 				newdata.SubbrandDesc = selctedrow.SubbrandDesc;
	// 				newdata.LeadSubbrand = "";
	// 				newdata.UpdatedFlag = "I";

	// 				oModel.oData.CSBSubbrand.Change.push(newdata);
	// 				oModel.oData.CSBSubbrand.Selected.push(newdata);

	// 			}

	// 			var reverse = [].concat(CSBTable.getSelectedIndices()).reverse();

	// 			reverse.forEach(function(index) {
	// 				oModel.getData().CSBSubbrand.Current.splice(index, 1);
	// 			});

	// 			oModel.oData.CSBSubbrand.Count.Selected = "(" + oModel.oData.CSBSubbrand.Selected.length + ")";
	// 			oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";

	// 			oModel.refresh(false);
	// 			CSBTable.clearSelection();

	// 		} else {
	// 			var sMessage = oContext.getModel("i18n").getResourceBundle().getText("AC_CSBAddError");
	// 			MessageToast.show(sMessage);
	// 		}
	// 	},

	// 	_deleteCSBBrands: function(Model, oContext, oEvent) {
	// 		var oModel = oContext.getModel(Model),
	// 			oChange = oModel.getData().CSBSubbrand.Change,

	// 			CSBTable_Selected = oEvent.oSource.getParent().getParent(),
	// 			SelectedRowContext = CSBTable_Selected.getSelectedIndices(),
	// 			binding = CSBTable_Selected.getBinding();

	// 		if (SelectedRowContext.length) {
	// 			for (var i = 0; i < SelectedRowContext.length; i++) {
	// 				var newdata = {},
	// 					flag = "";
	// 				var rowIndices = SelectedRowContext[i];
	// 				var selctedrow = binding.oList[rowIndices];

	// 				for (var j = 0; j < oChange.length; j++) {
	// 					if (oChange[j].SubbrandKey === selctedrow.SubbrandKey && oChange[j].UpdatedFlag === "I") {
	// 						oModel.getData().CSBSubbrand.Change.splice(j, 1);

	// 						newdata.SubbrandKey = selctedrow.SubbrandKey;
	// 						newdata.SubbrandDesc = selctedrow.SubbrandDesc;
	// 						newdata.LeadSubbrand = "";
	// 						newdata.UpdatedFlag = "D";

	// 						oModel.oData.CSBSubbrand.Current.push(newdata);

	// 						flag = "X";
	// 						break;
	// 					}
	// 				}

	// 				if (flag !== "X") {
	// 					newdata.SubbrandKey = selctedrow.SubbrandKey;
	// 					newdata.SubbrandDesc = selctedrow.SubbrandDesc;
	// 					newdata.LeadSubbrand = "";
	// 					newdata.UpdatedFlag = "D";

	// 					oModel.oData.CSBSubbrand.Change.push(newdata);
	// 					oModel.oData.CSBSubbrand.Current.push(newdata);
	// 				}
	// 			}

	// 			var reverse = [].concat(CSBTable_Selected.getSelectedIndices()).reverse();

	// 			reverse.forEach(function(index) {
	// 				oModel.getData().CSBSubbrand.Selected.splice(index, 1);
	// 			});

	// 			oModel.oData.CSBSubbrand.Count.Selected = "(" + oModel.oData.CSBSubbrand.Selected.length + ")";
	// 			oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";

	// 			oModel.refresh(false);
	// 			CSBTable_Selected.clearSelection();

	// 		} else {
	// 			var sMessage = oContext.getModel("i18n").getResourceBundle().getText("AC_CSBDeleteError");
	// 			MessageToast.show(sMessage);
	// 		}
	// 	},

	// 	onCSBok: function(Model, oContext, oEvent) {
	// 		oEvent.getSource().close();
	// 		if (oContext.oPersonalizationDialog) {
	// 			oContext.oPersonalizationDialog.destroy();
	// 			oContext.oPersonalizationDialog = null;
	// 		}
	// 	},

	// 	onCSBcancel: function(Model, oContext, oEvent) {
	// 		var that = this;
	// 		var event = oEvent.getSource();

	// 		var dialog = new Dialog({
	// 			title: 'Confirm',
	// 			type: 'Message',
	// 			content: new Text({
	// 				text: 'Are you sure you want to discard all the changes?'
	// 			}),
	// 			beginButton: new Button({
	// 				text: 'Yes',
	// 				press: function() {
	// 					dialog.close();
	// 					that._discardallCSBChange();
	// 					event.close();
	// 					if (that.oPersonalizationDialog) {
	// 						that.oPersonalizationDialog.destroy();
	// 						that.oPersonalizationDialog = null;
	// 					}
	// 				}
	// 			}),
	// 			endButton: new Button({
	// 				text: 'Cancel',
	// 				press: function() {
	// 					dialog.close();
	// 				}
	// 			}),
	// 			afterClose: function() {
	// 				dialog.destroy();
	// 			}
	// 		});
	// 		dialog.open();
	// 	},






	// 	_getCSBSubbrand: function(CSBCategoryKey, CSBSubcategoryKey, CSBBrandKey) {

	// 		var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");

	// 		var sbmodel = this.oPersonalizationDialog.getModel("CSBBrands");
	// 		if (!sbmodel) {
	// 			sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
	// 			sbmodel.setSizeLimit(50000);
	// 			sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
	// 			this.oPersonalizationDialog.setModel(sbmodel, "CSBBrands");
	// 		}

	// 		var filters = [];
	// 		if (CSBCategoryKey) {
	// 			filters.push(new sap.ui.model.Filter("CategoryKey", sap.ui.model.FilterOperator.EQ, CSBCategoryKey));
	// 		}
	// 		if (CSBSubcategoryKey) {
	// 			filters.push(new sap.ui.model.Filter("PcategoryKey", sap.ui.model.FilterOperator.EQ, CSBSubcategoryKey));
	// 		}
	// 		if (CSBBrandKey) {
	// 			filters.push(new sap.ui.model.Filter("BrandKey", sap.ui.model.FilterOperator.EQ, CSBBrandKey));
	// 		}
	// 		var sPath = "/VHCrossSubBrand";
	// 		var that2 = this;

	// 		var oSBPromise = new Promise(function(resolve, reject) {
	// 			setTimeout(function() {
	// 				sbmodel.read(sPath, {
	// 					async: true,
	// 					filters: filters,
	// 					success: function(oData, oResponse) {
	// 						TimeoutUtils.onResetTimer(this);
	// 						that2._setCSBSubbrand(oData);
	// 						resolve(oData);
	// 					},
	// 					error: function(oError) {
	// 						oError.ErrorOrigin = "Subbrands";
	// 						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
	// 						reject(oError);
	// 					}
	// 				});
	// 			}, 200);
	// 		});
	// 	},

	// 	_setCSBSubbrand: function(oDataIn) {
	// 		this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner

	// 		var oModel = this.getModel(Model);
	// 		var oData = oModel.getData();
	// 		if (!oData.CSBSubbrand) {
	// 			oData.CSBSubbrand = {};
	// 		}
	// 		oData.CSBSubbrand.Current = [];
	// 		oData.CSBSubbrand.Current = oDataIn.results;
	// 		// oData.CSBSubbrand.Count.Current = "(" + oData.CSBSubbrand.Current.length + ")";
	// 		oModel.refresh(false);
	// 		this._setinitialCSBSubbrandvalues();

	// 		this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
	// 	},

	// 	_getCSBSubcategory: function() {
	// 		var oModel = this.getModel(Model);
	// 		var oInput = oModel.getData();
	// 		var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
	// 		var that = this;

	// 		var sbmodel = this.oPersonalizationDialog.getModel("CSBvhph");
	// 		if (!sbmodel) {
	// 			sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
	// 			sbmodel.setSizeLimit(50000);
	// 			sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
	// 			this.oPersonalizationDialog.setModel(sbmodel, "CSBvhph");
	// 		}

	// 		var filters = [];
	// 		if (oInput.CSBSubbrand.CSBCategoryKey) {
	// 			filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBCategoryKey));
	// 		}
	// 		var sPath = "/VHSubcategories";

	// 		var oSBPromise = new Promise(function(resolve, reject) {
	// 			setTimeout(function() {
	// 				sbmodel.read(sPath, {
	// 					async: true,
	// 					filters: filters,
	// 					success: function(oData) {
	// 						TimeoutUtils.onResetTimer(this);
	// 						that._setCSBSubcategory(oData);
	// 						resolve(oData);
	// 					},
	// 					error: function(oError) {
	// 						oError.ErrorOrigin = "Subbrands";
	// 						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
	// 						reject(oError);
	// 					}
	// 				});
	// 			}, 200);
	// 		});
	// 	},

	// 	_setCSBSubcategory: function(oDataIn) {
	// 		var oModel = this.getModel(Model);
	// 		var oData = oModel.getData();

	// 		if (!oData.CSBSubcategory) {
	// 			oData.CSBSubcategory = {};
	// 		}
	// 		oData.CSBSubcategory.Current = [];
	// 		oData.CSBSubcategory.Current = oDataIn.results;
	// 		oModel.refresh(false);
	// 	},

	// 	_getCSBBrand: function() {
	// 		var oModel = this.getModel(Model);
	// 		var oInput = oModel.getData();
	// 		var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
	// 		var that = this;

	// 		var sbmodel = this.oPersonalizationDialog.getModel("CSBvhph");
	// 		if (!sbmodel) {
	// 			sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
	// 			sbmodel.setSizeLimit(50000);
	// 			sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
	// 			this.oPersonalizationDialog.setModel(sbmodel, "CSBvhph");
	// 		}

	// 		var filters = [];
	// 		if (oInput.CSBSubbrand.CSBCategoryKey) {
	// 			filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBCategoryKey));
	// 		}
	// 		if (oInput.CSBSubbrand.CSBSubcategoryKey) {
	// 			filters.push(new sap.ui.model.Filter("PSubCategory", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBSubcategoryKey));
	// 		}
	// 		var sPath = "/VHBrands";

	// 		var oSBPromise = new Promise(function(resolve, reject) {
	// 			setTimeout(function() {
	// 				sbmodel.read(sPath, {
	// 					async: true,
	// 					filters: filters,
	// 					success: function(oData) {
	// 						TimeoutUtils.onResetTimer(this);
	// 						that._setCSBBrand(oData);
	// 						resolve(oData);
	// 					},
	// 					error: function(oError) {
	// 						oError.ErrorOrigin = "Subbrands";
	// 						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
	// 						reject(oError);
	// 					}
	// 				});
	// 			}, 200);
	// 		});
	// 	},

	// 	_setCSBBrand: function(oDataIn) {
	// 		var oModel = this.getModel(Model);
	// 		var oData = oModel.getData();

	// 		if (!oData.CSBBrand) {
	// 			oData.CSBBrand = {};
	// 		}
	// 		oData.CSBBrand.Current = [];
	// 		oData.CSBBrand.Current = oDataIn.results;
	// 		oModel.refresh(false);
	// 	},

	// 	_getExistingCSBSubbrand: function(AsmID) {
	// 		var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");

	// 		var sbmodel = this.getModel("CSBESubbrands");

	// 		if (!sbmodel) {
	// 			sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
	// 			sbmodel.setSizeLimit(50000);
	// 			sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
	// 			this.setModel(sbmodel, "CSBESubbrands");
	// 		}

	// 		var filters = [];
	// 		if (AsmID) {
	// 			filters.push(new sap.ui.model.Filter("AsmId", sap.ui.model.FilterOperator.EQ, AsmID));
	// 		}
	// 		var sPath = "/CrossSubBrandListSet";
	// 		var that = this;

	// 		var oSBPromise = new Promise(function(resolve, reject) {
	// 			setTimeout(function() {
	// 				sbmodel.read(sPath, {
	// 					async: true,
	// 					filters: filters,
	// 					success: function(oData, oResponse) {
	// 						TimeoutUtils.onResetTimer(this);
	// 						that._setExistingCSBSubbrand(oData);
	// 						resolve(oData);
	// 					},
	// 					error: function(oError) {
	// 						oError.ErrorOrigin = "GetSubbrands";
	// 						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
	// 						reject(oError);
	// 					}
	// 				});
	// 			}, 200);
	// 		});
	// 	},

	// 	_setExistingCSBSubbrand: function(oDataIn) {
	// 		var oModel = this.getModel(Model);
	// 		var oData = oModel.getData();
	// 		if (!oData.CSBSubbrand) {
	// 			oData.CSBSubbrand = {};
	// 		}
	// 		oData.CSBSubbrand.Selected = oDataIn.results;
	// 		oData.CSBSubbrand.Count.Selected = "(" + oData.CSBSubbrand.Selected.length + ")";
	// 		oModel.refresh(false);
	// 	},

	// 	_getdefaultCSBfilter: function(Model, oContext) {
	// 		var oModel = oContext.getModel(Model);
	// 		var oInput = oModel.getData();

	// 		oInput.CSBSubbrand.CSBCategoryKey = oInput.Input.CategoryKey;
	// 		oInput.CSBSubbrand.CSBSubcategoryKey = oInput.Input.SubcategoryKey;
	// 		oInput.CSBSubbrand.CSBBrandKey = oInput.Input.BrandKey;

	// 		this._getCSBCategory(Model, oContext);
	// 		oInput.CSBSubcategory.Current = oInput.Subcategory.Current;
	// 		oInput.CSBBrand.Current = oInput.Brand.Current;

	// 		this._getCSBSubbrand(Model, oContext, oInput.Input.CategoryKey, oInput.Input.SubcategoryKey, oInput.Input.BrandKey);

	// 		oModel.refresh(false);

	// 	},

	// 	_getCSBCategory: function(Model, oContext) {
	// 		var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
	// 		var that = this;

	// 		var sbmodel = oContext.oPersonalizationDialog.getModel("CSBvhph");
	// 		if (!sbmodel) {
	// 			sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
	// 			sbmodel.setSizeLimit(50000);
	// 			sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
	// 			oContext.oPersonalizationDialog.setModel(sbmodel, "CSBvhph");
	// 		}

	// 		var filters = [];
	// 		var sPath = "/VHCategories";

	// 		var oSBPromise = new Promise(function(resolve, reject) {
	// 			setTimeout(function() {
	// 				sbmodel.read(sPath, {
	// 					async: true,
	// 					filters: filters,
	// 					success: function(oData) {
	// 						TimeoutUtils.onResetTimer(this);
	// 						that._setCSBCategory(oData);
	// 						resolve(oData);
	// 					},
	// 					error: function(oError) {
	// 						oError.ErrorOrigin = "Subbrands";
	// 						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
	// 						reject(oError);
	// 					}
	// 				});
	// 			}, 200);
	// 		});
	// 	},

	// 	_setCSBCategory: function(oDataIn) {
	// 		var oModel = this.getModel(Model);
	// 		var oData = oModel.getData();
	// 		if (!oData.CSBCategory) {
	// 			oData.CSBCategory = {};
	// 		}
	// 		oData.CSBCategory.Current = [];
	// 		oData.CSBCategory.Current = oDataIn.results;
	// 		oModel.refresh(false);
	// 	},



	// 	_setinitialCSBSubbrandvalues: function() {
	// 		var oModel = this.getModel(Model);

	// 		var sData = oModel.getData().CSBSubbrand.Selected,
	// 			cData = oModel.getData().CSBSubbrand.Current;

	// 		for (var i = 0; i < sData.length; i++) {
	// 			for (var j = 0; j < cData.length; j++) {
	// 				if (sData[i].SubbrandKey === cData[j].SubbrandKey) {
	// 					oModel.getData().CSBSubbrand.Current.splice(j, 1);
	// 					oModel.refresh(false);
	// 					break;
	// 				}
	// 			}
	// 		}
	// 		oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";
	// 		oModel.refresh(false);
	// 	},

	// 	_discardallCSBChange: function() {
	// 		var oModel = this.getModel(Model);

	// 		var sData = oModel.getData().CSBSubbrand.Selected,
	// 			cData = oModel.getData().CSBSubbrand.Change;

	// 		for (var j = 0; j < cData.length; j++) {
	// 			for (var i = 0; i < sData.length; i++) {
	// 				if (sData[i].SubbrandKey === cData[j].SubbrandKey) {
	// 					oModel.getData().CSBSubbrand.Selected.splice(i, 1);
	// 					oModel.refresh(false);
	// 					break;
	// 				}
	// 			}
	// 		}

	// 		oModel.getData().CSBSubbrand.Change = [];
	// 		oModel.refresh(false);
	// 	}
	};
});