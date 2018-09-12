sap.ui.define([
	"colgate/asm/planning/base/controller/BaseController",
	"colgate/asm/planning/base/model/formatter",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"colgate/asm/planning/base/util/AdvCopyUtils",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"colgate/asm/planning/base/util/TimeoutUtils",
	"colgate/asm/planning/base/util/DropdownUtils",
	"colgate/asm/planning/base/util/SpinnerUtils"
], function(BaseController, formatter, Controller, JSONModel, AdvCopyUtils, MessageToast, MessageBox, TimeoutUtils, DropdownUtils,
	SpinnerUtils) {
	"use strict";

	return BaseController.extend("colgate.asm.planning.base.controller.CopyActivity", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf colgate.asm.planning.base.view.CopyActivity
		 */
		formatter: formatter,

		onInit: function() {
			this.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/skipStop", true);
			SpinnerUtils.startDetailSpinner(this);
			this.getRouter().getRoute("copyActivity").attachPatternMatched(this._onCopyClicked, this);
			var oEventBus = sap.ui.getCore().getEventBus();

			oEventBus.subscribe("colgate.asm.planning.project", "Refresh", function(sChannelId, sEventId, oData) {
				var that = this;
				setTimeout(function() {
					that.onCancel();
				}, 200);
			}, this);
			// var oView = this.getView();
			// oView.addEventDelegate({
			// 	// not added the controller as delegate to avoid controller functions with similar names as the events
			// 	onBeforeShow: jQuery.proxy(function(evt) {
			// 		this.onBeforeShow(evt);
			// 	}, this)
			// });
		},

		// onBeforeShow: function() {
		// 	this.getModel("Copy").refresh(true);
		// 	this.getView().byId("Table").expandToLevel(2);
		// },

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf colgate.asm.planning.base.view.CopyActivity
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf colgate.asm.planning.base.view.CopyActivity
		 */
		onAfterRendering: function() {
			this.getModel("Copy").refresh(false);
			this.getView().byId("Table").expandToLevel(2);
		},

		onYearChange: function(oEvent) {
			var iYear = "";
			if (oEvent && oEvent.getSource && typeof oEvent.getSource === 'function') {
				iYear = oEvent.getSource().getSelectedKey();
			}
			if (!iYear || iYear === "") {
				if (oEvent && oEvent.Year) {
					iYear = oEvent.Year;
				}
			}
			if (iYear !== "") {
				var oData = this.getModel("Copy").getData().Table;
				if (oData.rows) {
					for (var i = 0; i < oData.rows.length; i++) {
						var startDt = oData.rows[i].StartDt;
						var endDt = oData.rows[i].EndDt;
						oData.rows[i].PlanningYear = iYear;
						oData.rows[i].StartDt = iYear + startDt.substring(4, startDt.length);
						oData.rows[i].EndDt = iYear + endDt.substring(4, endDt.length);
						if (oData.rows[i].rows) {
							for (var j = 0; j < oData.rows[i].rows.length; j++) {
								startDt = oData.rows[i].rows[j].StartDt;
								endDt = oData.rows[i].rows[j].EndDt;
								oData.rows[i].rows[j].PlanningYear = iYear;
								oData.rows[i].rows[j].StartDt = iYear + startDt.substring(4, startDt.length);
								oData.rows[i].rows[j].EndDt = iYear + endDt.substring(4, endDt.length);
								if (oData.rows[i].rows[j].rows) {
									for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
										startDt = oData.rows[i].rows[j].rows[k].StartDt;
										endDt = oData.rows[i].rows[j].rows[k].EndDt;
										oData.rows[i].rows[j].rows[k].PlanningYear = iYear;
										oData.rows[i].rows[j].rows[k].StartDt = iYear + startDt.substring(4, startDt.length);
										oData.rows[i].rows[j].rows[k].EndDt = iYear + endDt.substring(4, endDt.length);
									}
								}
							}
						}
					}
				}
			}
		},

		_onCopyClicked: function() {
			var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
			if (!this.getOwnerComponent().getModel("ASMConfig")) {
				// This means the application was restarted on this page.
				this.getRouter().navTo("activities", {
					objectId: "Activities"
				}, true);
			} else {
				this.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/skipStop", true);
				SpinnerUtils.startDetailSpinner(this);
				this._initializeModel();
				var that = this;
				setTimeout(function() {
					var oPromise = that._initializeTypeModels();
					var oP13n = that.getOwnerComponent().getModel("masterShared").getData().oP13n;
					var oData = that.getModel("Copy").getData();
					// Reformat Table Type
					var oTable = {};
					oTable[0] = JSON.parse(JSON.stringify(oTableSelect));
					that._buildChildren(oTable);
					oData.Table = oTable;
					//GDH this.setModel(oModel, "copy");

					var oP13nModel = new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oP13n)));
					that.setModel(oP13nModel, "P13n");
					// Start of Code Added for Page Title 7/11/2016 SDS
					var oData = that.getModel("Copy").getData().Table;
					var sTitle = "";
					if (oData.rows[0] != undefined) {
						var sName = oData.rows[0].Name;

						sTitle = that.getResourceBundle().getText("CP_Activity", [sName]);
						var oPage = that.byId("page");
						oPage.setTitle(sTitle);
						that.getModel("Copy").setProperty("/Header/TargetPlanningYear/Enabled", oData.rows[0].isRowEditable);
						that.getModel("Copy").setProperty("/Header/TargetPlanningYear/Value", oData.rows[0].PlanningYear);
					}
					that.getView().byId("cp_includeBudget").setSelected(false); //by default set selection false
					var oBar = that.byId("page-intHeader");
					oBar.addStyleClass("ModeEdit"); //change header color

					// END of Code Added for Page Title 7/11/2016 SDS
					//var oTableControl = that.getView().byId("Table");
					//oTableControl.expandToLevel(1); //expand Tree table by default

					//this._setVisibleRowCount(oData);

					var oPromiseH = that._getHubsList(oData.rows[0]);
					var oPromiseAll = Promise.all([oPromise, oPromiseH]);
					oPromiseAll.then(function(oHubData) {
						if (oData.rows) {
							var aSubListArray = [];
							for (var i = 0; i < oData.rows.length; i++) {
								that._initializeRowAT(oData.rows[i], {}, false);
								oData.rows[i].StartDt = oData.rows[i].StartDt.substring(0, 8) + "01" + oData.rows[i].StartDt.substring(10, oData.rows[i].StartDt
									.length);
								oData.rows[i].EndDt = oData.rows[i].EndDt.substring(0, 8) + "28" + oData.rows[i].EndDt.substring(10, oData.rows[i].EndDt.length);
								oData.rows[i].ActivityTypeDesc = "";
								//var oPromiseSL = that._getSubsList(oData.rows[i]);
								aSubListArray.push(oData.rows[i]);
								if (oData.rows[i].rows) {
									for (var j = 0; j < oData.rows[i].rows.length; j++) {
										oData.rows[i].rows[j].StartDt = oData.rows[i].rows[j].StartDt.substring(0, 8) + "01" +
											oData.rows[i].rows[j].StartDt.substring(10, oData.rows[i].rows[j].StartDt.length);
										oData.rows[i].rows[j].EndDt = oData.rows[i].rows[j].EndDt.substring(0, 8) + "28" +
											oData.rows[i].rows[j].EndDt.substring(10, oData.rows[i].rows[j].EndDt.length);
										oData.rows[i].rows[j].ActivityTypeDesc = "";
										//var oPromiseSL2 = that._getSubsList(oData.rows[i].rows[j]);
										aSubListArray.push(oData.rows[i].rows[j]);
										if (oData.rows[i].rows[j].rows) {
											for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
												oData.rows[i].rows[j].rows[k].StartDt = oData.rows[i].rows[j].rows[k].StartDt.substring(0, 8) + "01" +
													oData.rows[i].rows[j].rows[k].StartDt.substring(10, oData.rows[i].rows[j].rows[k].StartDt.length);
												oData.rows[i].rows[j].rows[k].EndDt = oData.rows[i].rows[j].rows[k].EndDt.substring(0, 8) + "28" +
													oData.rows[i].rows[j].rows[k].EndDt.substring(10, oData.rows[i].rows[j].rows[k].EndDt.length);
												oData.rows[i].rows[j].rows[k].ActivityTypeDesc = "";
												//var oPromiseSL2 = that._getSubsList(oData.rows[i].rows[j].rows[k]);
												aSubListArray.push(oData.rows[i].rows[j].rows[k]);
											}
										}
									}
								}
							}
							that._resolveSubsList(that, 0, aSubListArray);
						}
						var oEvent = {};
						oEvent.Year = that._initialYear;
						that.onYearChange(oEvent);
						that.getModel("Copy").refresh(false);
					});
				}, 200);
			}
		},
		_onSubsFetched: function() {
			this._setEnablement();
			this._setEnablementPH();
		},
		_onPHFetched: function(sChannelId, sEventId, oData) {
			this.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/skipStop", false);
			this.getModel("Copy").refresh(false);
			this.getModel("GeoFilter").refresh(false);
			// This should not be needed - but we seem to have a refreshing problem.
			var tableData = this.getModel("Copy").getProperty("/Table");
			this.getModel("Copy").setProperty("/Table", []);
			this.getModel("Copy").setProperty("/Table", tableData);
			SpinnerUtils.stopDetailSpinner(this);
		},
		_resolveSubsList: function(oContext, i, aSubListArray) {
			if (i < aSubListArray.length) {
				oContext._oSLPromise = (oContext._getSubsList(aSubListArray[i])).then(function(oData) {
					if (i + 1 === aSubListArray.length) {
						oContext._onSubsFetched();
					} else {
						oContext._resolveSubsList(oContext, i + 1, aSubListArray);
					}
				});
			}
		},
		_setEnablementPH: function() {
			var oData = this.getModel("Copy").getData().Table;
			if (oData.rows) {
				DropdownUtils.resetDelay();
				// The PH Rows need to be initialized in reverse order
				for (var i = 0; i < oData.rows.length; i++) {
					if (oData.rows[i].rows) {
						for (var j = 0; j < oData.rows[i].rows.length; j++) {
							if (oData.rows[i].rows[j].rows) {
								for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
									this._initializeRowPH(oData.rows[i].rows[j].rows[k], oData.rows[i].rows[j]);
								}
							}
							this._initializeRowPH(oData.rows[i].rows[j], oData.rows[i]);
						}
					}
					this._initializeRowPH(oData.rows[i], {});
				}
				sap.ui.getCore().getEventBus().subscribeOnce("colgate.asm.planning.dropdownutils", "PHFetchComplete", this._onPHFetched, this);
				DropdownUtils.executeDelayed();
			}
		},
		_setEnablement: function() {
			var oData = this.getModel("Copy").getData().Table;
			if (oData.rows) {
				for (var i = 0; i < oData.rows.length; i++) {
					if (oData.rows[i].isRowEditable) {
						if (oData.rows[i].HubKey === "") {
							oData.rows[i].isEnabled = false;
						} else {
							oData.rows[i].isEnabled = true;
						}
						oData.rows[i].HubEnabled = true;
					} else {
						oData.rows[i].isEnabled = false;
						oData.rows[i].HubEnabled = false;
					}
					if (oData.rows[i].rows) {
						for (var j = 0; j < oData.rows[i].rows.length; j++) {
							if (!oData.rows[i].rows[j].isRowEditable) {
								oData.rows[i].rows[j].HubEnabled = false;
								oData.rows[i].rows[j].isEnabled = false;
							} else {
								if (oData.rows[i].HubKey === "") {
									oData.rows[i].rows[j].HubEnabled = true;
								} else {
									oData.rows[i].rows[j].HubEnabled = false;
								}
								if (oData.rows[i].SubKey === "" && oData.rows[i].rows[j].HubKey !== "") {
									oData.rows[i].rows[j].isEnabled = true;
								} else {
									oData.rows[i].rows[j].isEnabled = false;
								}
							}
							if (oData.rows[i].rows[j].rows) {
								for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
									if (!oData.rows[i].rows[j].rows[k].isRowEditable) {
										oData.rows[i].rows[j].rows[k].HubEnabled = false;
										oData.rows[i].rows[j].rows[k].isEnabled = false;
									} else {
										if (oData.rows[i].rows[j].HubKey === "") {
											oData.rows[i].rows[j].rows[k].HubEnabled = true;
										} else {
											oData.rows[i].rows[j].rows[k].HubEnabled = false;
										}
										if (oData.rows[i].rows[j].SubKey === "" &&
											oData.rows[i].rows[j].rows[k].HubKey !== "") {
											oData.rows[i].rows[j].rows[k].isEnabled = true;
										} else {
											oData.rows[i].rows[j].rows[k].isEnabled = false;
										}
									}
								}
							}
						}
					}
				}
			}
			this.getModel("GeoFilter").refresh(false);
			this.getModel("Copy").refresh(false);
		},
		_getHubsList: function(oRecord) {
			var that = this;
			var oPromise = new Promise(function(resolve, reject) {
				var combinedKey = oRecord.DivisionKey;
				var oGeoModel = that.getModel("GeoFilter");
				var oGeoData = oGeoModel.getData();
				if (oGeoData.Hub !== undefined && oGeoData.Hub[combinedKey] !== undefined) {
					oGeoData.currentHubs = JSON.parse(JSON.stringify(oGeoData.Hub[combinedKey]));
					var oUserData = that.getOwnerComponent().getModel("UserData");
					if (oUserData) {
						var sHub = oUserData.getProperty("/HubKey");
						if (sHub && sHub !== "") {
							// Filter currentHubs
							var aHubs = oGeoData.currentHubs;
							var iCorrectKey = 0;
							for (var i = 0; i < aHubs.length; i++) {
								if (aHubs[i].HubKey === sHub) {
									iCorrectKey = i;
									i = aHubs.length;
								}
							}
							oGeoData.currentHubs = [];
							oGeoData.currentHubs.push(aHubs[iCorrectKey]);
						}
					}
					oGeoModel.refresh(false);
					resolve(oGeoData.currentHubs);
				} else {
					var sServiceUrl = that.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
					var bmodel = that.getModel("Hub");
					if (!bmodel) {
						//bmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); // Changed by Khrystyne 10/27
						bmodel = new sap.ui.model.odata.ODataModel(sServiceUrl);
						bmodel.setSizeLimit(50000);
						bmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
						that.setModel(bmodel, "Hub");
					}
					var sPath = "/VHHubs";
					var filters = [];

					var sDivisionKey = oRecord.DivisionKey; //oACData.Input.DivisionKey;
					if (!sDivisionKey) {
						sDivisionKey = "";
					}

					var sHubKey = oRecord.HubKey; //oACData.Input.HubKey;
					if (!sHubKey) {
						sHubKey = "";
					}

					filters.push(new sap.ui.model.Filter("GeoKey", sap.ui.model.FilterOperator.EQ, sHubKey));
					filters.push(new sap.ui.model.Filter("DivisionKey", sap.ui.model.FilterOperator.EQ, sDivisionKey));

					bmodel.read(sPath, {
						async: false, // Changed by Khrystyne 10/27
						filters: filters,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(that);
							that._setHubs(oData, oRecord);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Initial";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}
			});
			return oPromise;
		},
		_setVisibleRowCount: function(oData) {
			var iVisibleRowCount = 0;
			if (oData.rows) {
				for (var i = 0; i < oData.rows.length; i++) {
					iVisibleRowCount++;
					if (oData.rows[i].rows) {
						for (var j = 0; j < oData.rows[i].rows.length; j++) {
							iVisibleRowCount++;
							if (oData.rows[i].rows[j].rows) {
								for (var k = 0; k < oData.rows[i].rows[j].rows.length; k++) {
									iVisibleRowCount++;
								}
							}
						}
					}
				}
			}
			this.getView().byId("Table").setVisibleRowCount(iVisibleRowCount);
		},

		//End: code for making visible row count same as no of rows availble.  July 13th, 2016 SDS
		_getSubsList: function(oRecord) {
			var that = this;
			var oPromise = new Promise(function(resolve, reject) {
				var sSubKey = oRecord.SubKey;
				var sHubKey = oRecord.HubKey;
				var sDivisionKey = oRecord.DivisionKey;
				var filters = [];
				if (sHubKey !== "") {
					var combinedKey = sDivisionKey + "|" + sHubKey;
					var oGeoModel = that.getModel("GeoFilter");
					var oGeoData = oGeoModel.getData();
					if (oGeoData.Sub !== undefined && oGeoData.Sub[combinedKey] !== undefined) {
						oRecord.currentSubs = oGeoData.Sub[combinedKey];
						var oUserData = that.getOwnerComponent().getModel("UserData");
						if (oUserData) {
							var sSub = oUserData.getProperty("/SubKey");
							if (sSub && sSub !== "") {
								// Filter currentHubs
								var aSubs = oGeoData.currentSubs;
								var iCorrectKey = 0;
								for (var i = 0; i < aSubs.length; i++) {
									if (aSubs[i].SubKey === sSub) {
										iCorrectKey = i;
										i = aSubs.length;
									}
								}
								oGeoData.currentSubs = [];
								oGeoData.currentSubs.push(aSubs[iCorrectKey]);
							}
						}
						resolve(oGeoData.currentSubs);
					} else {
						var sServiceUrl = that.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
						var sbmodel = that.getModel("Sub");
						if (!sbmodel) {
							//sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl); // Changed by Khrystyne 10/27
							sbmodel = new sap.ui.model.odata.ODataModel(sServiceUrl);
							sbmodel.setSizeLimit(50000);
							sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							that.setModel(sbmodel, "Sub");
						}
						filters.push(new sap.ui.model.Filter("GeoKey", sap.ui.model.FilterOperator.EQ, sSubKey));
						filters.push(new sap.ui.model.Filter("HubKey", sap.ui.model.FilterOperator.EQ, sHubKey));
						filters.push(new sap.ui.model.Filter("DivisionKey", sap.ui.model.FilterOperator.EQ, sDivisionKey));
						var sPath = "/VHSubs";
						var that2 = that;
						sbmodel.read(sPath, {
							async: false, //Changed by Khrystyne 10/27
							filters: filters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(that2);
								that2._setSubs(oData, oRecord);
								resolve(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Subs";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
								that2._setSubs([]);
								reject(oError);
							}
						});
					}
				} else {
					resolve([]);
				}
			});
			return oPromise;
		},

		// psutram: Jan 2017, method added
		_setHubs: function(oDataIn, oRecord) {
			var oUserData = this.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sHub = oUserData.getProperty("/HubKey");
				if (sHub && sHub !== "") {
					// Filter currentHubs
					var aHubs = oDataIn.results;
					var iCorrectKey = 0;
					for (var i = 0; i < aHubs.length; i++) {
						if (aHubs[i].HubKey === sHub) {
							iCorrectKey = i;
							i = aHubs.length;
						}
					}
					oDataIn.results = [];
					oDataIn.results.push(aHubs[iCorrectKey]);
				}
			}
			var oModel = this.getModel("GeoFilter");
			var oData = oModel.getData();
			if (!oData.Hub) {
				oData.Hub = {};
			}
			var combinedKey = oRecord.DivisionKey;
			oData.Hub[combinedKey] = oDataIn.results;
			oData.currentHubs = JSON.parse(JSON.stringify(oDataIn.results));
			oModel.refresh(false);
		},

		_setSubs: function(oDataIn, oRecord) {
			var oUserData = this.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sSub = oUserData.getProperty("/SubKey");
				if (sSub && sSub !== "") {
					// Filter currentHubs
					var aSubs = oDataIn.results;
					var iCorrectKey = 0;
					for (var i = 0; i < aSubs.length; i++) {
						if (aSubs[i].SubKey === sSub) {
							iCorrectKey = i;
							i = aSubs.length;
						}
					}
					oDataIn.results = [];
					oDataIn.results.push(aSubs[iCorrectKey]);
				}
			}
			var oModel = this.getModel("GeoFilter");
			var oData = oModel.getData();
			if (!oData.Sub) {
				oData.Sub = {};
			}
			var combinedKey = oRecord.DivisionKey + "|" + oRecord.HubKey;

			oData.Sub[combinedKey] = oDataIn.results;
			oRecord.currentSubs = oDataIn.results;
			this.getModel("Copy").refresh(false);
		},
		//End:Fetch values from backend and bind to Subsidiary combobox.  July 13th, 2016 SDS
		onValueHelpRequest: function(evt) {

			if (!this.oMonthYearPickerDialog) {
				this.oMonthYearPickerDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.MonthYearPickerDialog", this);
				this.getView().addDependent(this.oMonthYearPickerDialog);

			}
			//GDH this._setPlanningYearInfo();
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oMonthYearPickerDialog);
			var sContext = evt.getSource().getBindingContext("Copy").getPath();
			var sPath = evt.getSource().getBinding("value").getPath();
			this._sMonthPickingContext = sContext;
			this._sMonthPickingSPath = sPath;
			this._sMonthPickingPath = sContext + "/" + sPath;
			var date = this.getModel("Copy").getProperty(sContext + "/" + sPath);
			var iNewMonth = parseInt(date.substring(5, 7)) - 1;
			this.getModel("Copy").setProperty("/MonthSelect", iNewMonth);
			this.getModel("Copy").refresh(false);

			this.oMonthYearPickerDialog.open();
		},
		checkMandatoryFields: function(oData) {
			var bError = false;
			var j = 0;
			if (oData && oData.rows[0]) {
				if (oData.rows[0].Name === "" || oData.rows[0].Name === null) {
					oData.rows[0].ValueState.Name = sap.ui.core.ValueState.Error;
					oData.rows[0].ValueStateText.Name = this.getResourceBundle().getText("C_Mandatory_Field");
					bError = true;
				}
				if (oData.rows[0].ActivityType === "" || oData.rows[0].ActivityType === null) {
					oData.rows[0].ValueState.ActivityType = sap.ui.core.ValueState.Error;
					oData.rows[0].ValueStateText.ActivityType = this.getResourceBundle().getText("C_Mandatory_Field");
					bError = true;
				}
				if (oData.rows[0].rows && oData.rows[0].rows[0] !== undefined) {
					do {
						if (oData.rows[0].rows[j].Name === "" || oData.rows[0].rows[j].Name === null) {
							oData.rows[0].rows[j].ValueState.Name = sap.ui.core.ValueState.Error;
							oData.rows[0].rows[j].ValueStateText.Name = this.getResourceBundle().getText("C_Mandatory_Field");
							bError = true;
						}
						if (oData.rows[0].rows[j].ActivityType === "" || oData.rows[0].rows[j].ActivityType === null) {
							oData.rows[0].rows[j].ValueState.ActivityType = sap.ui.core.ValueState.Error;
							oData.rows[0].rows[j].ValueStateText.ActivityType = this.getResourceBundle().getText("C_Mandatory_Field");
							bError = true;
						}
						var m = 0;
						if (oData.rows[0].rows[j].rows) {
							while (oData.rows[0].rows[j].rows[m] !== undefined) {
								if (oData.rows[0].rows[j].rows[m].Name === "" || oData.rows[0].rows[j].rows[m].Name === null) {
									oData.rows[0].rows[j].rows[m].ValueState.Name = sap.ui.core.ValueState.Error;
									oData.rows[0].rows[j].rows[m].ValueStateText.Name = this.getResourceBundle().getText("C_Mandatory_Field");
									bError = true;
								}
								if (oData.rows[0].rows[j].rows[m].ActivityType === "" || oData.rows[0].rows[j].rows[m].ActivityType === null) {
									oData.rows[0].rows[j].rows[m].ValueState.ActivityType = sap.ui.core.ValueState.Error;
									oData.rows[0].rows[j].rows[m].ValueStateText.ActivityType = this.getResourceBundle().getText("C_Mandatory_Field");
									bError = true;
								}
								if (oData.rows[0].rows[j].rows[m].HubKey === "" || oData.rows[0].rows[j].rows[m].HubKey === null) {
									oData.rows[0].rows[j].rows[m].ValueState.Hub = sap.ui.core.ValueState.Error;
									oData.rows[0].rows[j].rows[m].ValueStateText.Hub = this.getResourceBundle().getText("C_Mandatory_Field");
									bError = true;
								}
								if (oData.rows[0].rows[j].rows[m].SubKey === "" || oData.rows[0].rows[j].rows[m].SubKey === null) {
									oData.rows[0].rows[j].rows[m].ValueState.Sub = sap.ui.core.ValueState.Error;
									oData.rows[0].rows[j].rows[m].ValueStateText.Sub = this.getResourceBundle().getText("C_Mandatory_Field");
									bError = true;
								}
								m++;
							}
						}
						j++;
					} while (oData.rows[0].rows[j] !== undefined);
				}
			}
			return bError;
		},
		//Start code to check if all date fields having values July 12th,2017
		checkMandatoryDateFields: function(oData, startDt, endDt) {
			var iCount = 0;

			if (endDt === "" || startDt === "") {
				iCount = iCount + 1;
			}
			var j = 0;
			if (oData.rows[0].rows && oData.rows[0].rows[0] !== undefined) {
				do {
					if (oData.rows[0].rows[j].StartDt === "" || oData.rows[0].rows[j].StartDt === null) {
						iCount = iCount + 1;
					}
					if (oData.rows[0].rows[j].EndDt === "" || oData.rows[0].rows[j].EndDt === null) {
						iCount = iCount + 1;
					}
					var m = 0;
					if (oData.rows[0].rows[j].rows) {
						while (oData.rows[0].rows[j].rows[m] !== undefined) {
							if (oData.rows[0].rows[j].rows[m].StartDt === "" || oData.rows[0].rows[j].rows[m].StartDt === null) {
								iCount = iCount + 1;
							}
							if (oData.rows[0].rows[j].rows[m].EndDt === "" || oData.rows[0].rows[j].rows[m].EndDt === null) {
								iCount = iCount + 1;
							}
							m++;
						}
					}
					j++;
				} while (oData.rows[0].rows[j] !== undefined);
			}

			return iCount;
		},
		//End code to check if all date fields having values July 12th,2017 SDS

		onSave: function() {
			var oData = this.getModel("Copy").getData().Table;

			// var oRawActivities = this.getOwnerComponent().getModel("masterShared").getData().oRawActivities;
			/* Additional Code starts here*/

			var endDt = oData.rows[0].EndDt;
			var startDt = oData.rows[0].StartDt;

			var bError = this.checkMandatoryFields(oData);
			if (!bError) {
				var iCount = this.checkMandatoryDateFields(oData, startDt, endDt);
				var iCountSub = this._validateSubsidiary();
				var iCountDates = this._validateDates();
				var iYearSpan = this._calculateYrSpan();
				var refThis = this;
				if (iCount === 0) {
					if (iCountSub === 0) {
						if (iCountDates === 0) {
							if (iYearSpan > 0) {
								MessageBox.show("Planning span is more than one year", {
									icon: MessageBox.Icon.WARNING,
									title: "Warning",
									actions: [MessageBox.Action.YES, MessageBox.Action.NO],
									defaultAction: MessageBox.Action.NO,
									onClose: function(evt) {

										if (evt === "YES") {
											refThis.onSaveProcess();
										}
									}
								});

							} else {
								this.onSaveProcess();
							}

						} else {
							var sErrMsg = this.getResourceBundle().getText("C_ERR_DateRange");
							MessageToast.show(sErrMsg);
						}
					} else {
						var sErrMsg = this.getResourceBundle().getText("C_ERR_Sub");
						MessageToast.show(sErrMsg);
					}
				} else {
					var sErrMsg = "";
					sErrMsg = this.getResourceBundle().getText("C_ERR_EnterDate");
					MessageToast.show(sErrMsg);

				}
			} else {
				this.getModel("Copy").refresh(false);
				var sErrMsg = "";
				sErrMsg = this.getResourceBundle().getText("C_Mandatory");
				MessageToast.show(sErrMsg);
			}

		},

		onSaveProcess: function() {
			var oData = this.getModel("Copy").getData().Table;

			var oRawActivities = this.getOwnerComponent().getModel("masterShared").getData().oRawActivities;
			/* Additional Code starts here*/

			var endDt = oData.rows[0].EndDt;
			var startDt = oData.rows[0].StartDt;
			//reset time to zero
			endDt = endDt.split("T")[0] + "T00:00:00Z"; // GDH Added UTC addition to correct for using Java Dates later
			startDt = startDt.split("T")[0] + "T00:00:00Z";

			//GGA: 3/8/17 dates so far are only concerned with the month so set the start date
			//to the beginning of the month
			var startDateDate = new Date(startDt);
			var endDateDate = new Date(endDt);
			startDateDate.setUTCDate(1);

			//GGA: 3/8/17 dates so far are only concerned with the month so set the end date
			//to the last day of the month, asking for day 0 gives the last day of the 
			//previous month, month is +1 to move it forward a month
			// GDH - Change to 28th for consistency
			//endDateDate.setUTCDate(new Date(endDateDate.getUTCFullYear(), endDateDate.getUTCMonth() + 1, 0).getUTCDate());
			endDateDate.setUTCDate(28); // GDH For Date Consistency
			oData.rows[0].EndDt = endDateDate.toISOString();
			oData.rows[0].StartDt = startDateDate.toISOString();

			//get the start and end month, add one to make it 1 based instead of 0 based
			var startMonth = startDateDate.getUTCMonth() + 1;
			var endMonth = endDateDate.getUTCMonth() + 1;

			var index = oData.rows[0].__index;
			var oRawItem = oRawActivities[index];
			var aKeys = Object.keys(oRawItem);

			for (var i = 0; i < aKeys.length; i++) {
				if (oRawItem[aKeys[i]] !== oData.rows[0][aKeys[i]]) {
					oRawItem[aKeys[i]] = oData.rows[0][aKeys[i]];
				}
			}

			//GGA: 3/8/17 clear out plan totals if the month is not in the new copy's date range,
			//if the month is between the start and end leave the plan amount alone
			for (var month = 1; month <= 12; month++) {

				if (month < startMonth) {
					oRawItem["AmtB" + month] = "0.00000000";
				}

				if (month > endMonth) {
					oRawItem["AmtB" + month] = "0.00000000";
				}
			}
			oRawItem.MaxValueB = "0.00000000";

			var j = 0;
			if (oData.rows[0].rows) {
				if (oData.rows[0].rows[0] !== undefined) { // to update date and oRawActivities for activities
					do {
						endDt = oData.rows[0].rows[j].EndDt;
						endDt = endDt.split("T")[0] + "T00:00:00Z";
						startDt = oData.rows[0].rows[j].StartDt;
						startDt = startDt.split("T")[0] + "T00:00:00Z";

						startDateDate = new Date(startDt);
						endDateDate = new Date(endDt);
						//GGA: 3/8/17 dates so far are only concerned with the month so set the start date
						//to the beginning of the month
						startDateDate.setUTCDate(1);

						//GGA: 3/8/17 dates so far are only concerned with the month so set the end date
						//to the last day of the month, asking for day 0 gives the last day of the 
						//previous month, month is +1 to move it forward a month
						// GDH Changed for consistency - 28th is the end of the month for other portions of the application
						//endDateDate.setUTCDate(new Date(endDateDate.getUTCFullYear(), endDateDate.getUTCMonth() + 1, 0).getUTCDate());
						endDateDate.setUTCDate(28);

						oData.rows[0].rows[j].EndDt = endDateDate.toISOString();
						oData.rows[0].rows[j].StartDt = startDateDate.toISOString();

						//get the start and end month, add one to make it 1 based instead of 0 based
						startMonth = startDateDate.getUTCMonth() + 1;
						endMonth = endDateDate.getUTCMonth() + 1;

						index = oData.rows[0].rows[j].__index;
						oRawItem = oRawActivities[index];
						aKeys = Object.keys(oRawItem);
						for (i = 0; i < aKeys.length; i++) {
							if (oRawItem[aKeys[i]] !== oData.rows[0].rows[j][aKeys[i]]) {
								oRawItem[aKeys[i]] = oData.rows[0].rows[j][aKeys[i]];
							}
						}

						//GGA: 3/8/17 clear out plan totals if the month is not in the new copy's date range,
						//if the month is between the start and end leave the plan amount alone
						for (month = 1; month <= 12; month++) {

							if (month < startMonth) {
								oRawItem["AmtB" + month] = "0.00000000";
							}

							if (month > endMonth) {
								oRawItem["AmtB" + month] = "0.00000000";
							}
						}
						oRawItem.MaxValueB = "0.00000000";

						//Start Code for updating sub activity	July 12th,2017 SDS	
						var m = 0;
						if (oData.rows[0].rows[j].rows) {
							while (oData.rows[0].rows[j].rows[m] !== undefined) { // to update date and oRawActivities for subactivities
								endDt = oData.rows[0].rows[j].rows[m].EndDt;
								endDt = endDt.split("T")[0] + "T00:00:00Z";
								startDt = oData.rows[0].rows[j].rows[m].StartDt;
								startDt = startDt.split("T")[0] + "T00:00:00Z";

								startDateDate = new Date(startDt);
								endDateDate = new Date(endDt);

								//dates so far are only concerned with the month so set the start date
								//to the beginning of the month
								startDateDate.setUTCDate(1);

								//dates so far are only concerned with the month so set the end date
								//to the last day of the month, asking for day 0 gives the last day of the 
								//previous month, month is +1 to move it forward a month
								// GDH Changed for consistency - 28th is taken to be the end of the month
								//endDateDate.setUTCDate(new Date(endDateDate.getUTCFullYear(), endDateDate.getUTCMonth() + 1, 0).getUTCDate());
								endDateDate.setUTCDate(28);

								oData.rows[0].rows[j].rows[m].EndDt = endDateDate.toISOString();
								oData.rows[0].rows[j].rows[m].StartDt = startDateDate.toISOString();

								//get the start and end month, add one to make it 1 based instead of 0 based
								startMonth = startDateDate.getUTCMonth() + 1;
								endMonth = endDateDate.getUTCMonth() + 1;

								index = oData.rows[0].rows[j].rows[m].__index;
								oRawItem = oRawActivities[index];
								aKeys = Object.keys(oRawItem);
								for (i = 0; i < aKeys.length; i++) {
									if (oRawItem[aKeys[i]] !== oData.rows[0].rows[j].rows[m][aKeys[i]]) {
										oRawItem[aKeys[i]] = oData.rows[0].rows[j].rows[m][aKeys[i]];
									}
								}
								//GGA: 3/8/17 clear out plan totals if the month is not in the new copy's date range,
								//if the month is between the start and end leave the plan amount alone
								for (month = 1; month <= 12; month++) {

									if (month < startMonth) {
										oRawItem["AmtB" + month] = "0.00000000";
									}

									if (month > endMonth) {
										oRawItem["AmtB" + month] = "0.00000000";
									}
								}
								oRawItem.MaxValueB = "0.00000000";

								m++;
							}
						}
						//End Code for updating sub activity July 12th,2017 SDS	

						j++;
					} while (oData.rows[0].rows[j] !== undefined);
				}
			}

			/*Additional code ends here*/

			var bInclude = true; //sap.ui.getCore().byId("cp_include").getSelected();
			var bIncludeBudget = this.oView.byId("cp_includeBudget").getSelected();
			var sPrefix = ""; //sap.ui.getCore().byId("cp_prefix").getValue();
			/*if (!sPrefix || sPrefix === "") {
				sPrefix = "COPY";
			}
			sPrefix = sPrefix + " ";*/

			var oDataParsed = JSON.parse(JSON.stringify(oData.rows[0]));
			var newCpAct = null;

			if (!oDataParsed.isRowEditable) {

				var i = 0;
				if (oDataParsed.rows) {
					while (oDataParsed.rows[i] !== undefined) {
						if (oDataParsed.rows[i].isRowEditable === true) {

							var arrTemp = [];
							if (oDataParsed.rows[i].isSelected !== undefined && oDataParsed.rows[i].isSelected !== false) {
								var m = 0;
								var iTempCount = 0;
								var oCurrAct = oDataParsed.rows[i];
								if (oCurrAct.rows) {
									while (oCurrAct.rows[m] !== undefined) {

										if (oCurrAct.rows[m].isSelected !== undefined && oCurrAct.rows[m].isSelected !== false) {

											arrTemp[iTempCount] = oCurrAct.rows[m];
											iTempCount++;
										}

										delete oCurrAct.rows[m];
										m++;

									}
								}
								newCpAct = oCurrAct;
								var iLen = 0;
								while (arrTemp[iLen] !== undefined) {
									newCpAct.rows[iLen] = arrTemp[iLen];
									iLen++;
								}

							} else {
								newCpAct = oDataParsed.rows[i];
							}

						} else {
							var j = 0;
							if (oDataParsed.rows[i].rows) {
								while (oDataParsed.rows[i].rows[j] !== undefined) {
									if (oDataParsed.rows[i].rows[j].isRowEditable === true) {
										newCpAct = oDataParsed.rows[i].rows[j];
									}
									j++;
								}
							}

						}
						i++;
					}
					oDataParsed = newCpAct;
				}
			}
			AdvCopyUtils.copyItems(this, bInclude, bIncludeBudget, sPrefix, oDataParsed, JSON.parse(JSON.stringify(oRawActivities)));

		},
		onCancel: function() {
			if (this._currentAction === "saveAndAdd") {
				// This means we need to reload items
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Refresh", {});
				this._currentAction = "";
			}
			this.getRouter().navTo("activities", {
				objectId: "Activities"
			}, true);
		},

		_validateSubsidiary: function() {
			var oData = this.getModel("Copy").getData().Table;
			var sParentSub = oData.rows[0].SubKey;
			var iMissMatch = 0;
			if (sParentSub !== "") {
				var iActCount = 0;
				if (oData.rows[0].rows) {
					while (oData.rows[0].rows[iActCount] !== undefined && oData.rows[0].rows[iActCount].SubKey !== "") {
						if (sParentSub !== oData.rows[0].rows[iActCount].SubKey) {
							iMissMatch++;

							var iSubActCount = 0;
							if (oData.rows[0].rows[iActCount].rows) {
								while (oData.rows[0].rows[iActCount].rows[iSubActCount] !== undefined) {
									if (oData.rows[0].rows[iActCount].SubKey !== oData.rows[0].rows[iActCount].rows[iSubActCount].SubKey) {
										iMissMatch++;
									}
									iSubActCount++;
								}
							}
						}
						iActCount++;
					}
				}
			} else {
				var iActCount = 0;
				if (oData.rows[0].rows) {
					while (oData.rows[0].rows[iActCount] !== undefined && oData.rows[0].rows[iActCount].SubKey !== "") {
						var iSubActCount = 0;
						if (oData.rows[0].rows[iActCount].rows) {
							while (oData.rows[0].rows[iActCount].rows[iSubActCount] !== undefined) {
								if (oData.rows[0].rows[iActCount].SubKey !== oData.rows[0].rows[iActCount].rows[iSubActCount].SubKey) {
									iMissMatch++;
								}
								iSubActCount++;
							}
						}
						iActCount++;
					}
				}
			}
			return iMissMatch;
		},

		_validateDates: function() {
			var oData = this.getModel("Copy").getData().Table;
			var sParentStartdt = oData.rows[0].StartDt;
			var sParentEnddt = oData.rows[0].EndDt;
			var iMissMatch = 0;
			var iActCount = 0;
			if (oData.rows[0].rows) {
				while (oData.rows[0].rows[iActCount] !== undefined) {
					var bValidateActStartDt = this.validateDateDifference(oData.rows[0].rows[iActCount].StartDt, sParentStartdt, sParentEnddt);
					var bValidateActEndDt = this.validateDateDifference(oData.rows[0].rows[iActCount].EndDt, sParentStartdt, sParentEnddt);
					if (!bValidateActStartDt || !bValidateActEndDt) {
						iMissMatch++;
					}
					var iSubActCount = 0;
					if (oData.rows[0].rows[iActCount].rows) {
						while (oData.rows[0].rows[iActCount].rows[iSubActCount] !== undefined) {
							var bValidateSubActStartDt = this.validateDateDifference(oData.rows[0].rows[iActCount].rows[iSubActCount].StartDt, oData.rows[0]
								.rows[
									iActCount].StartDt,
								oData.rows[0].rows[iActCount].EndDt);
							var bValidateSubActEndDt = this.validateDateDifference(oData.rows[0].rows[iActCount].rows[iSubActCount].EndDt, oData.rows[0].rows[
									iActCount].StartDt,
								oData.rows[0].rows[iActCount].EndDt);

							if (!bValidateSubActStartDt || !bValidateSubActEndDt) {
								iMissMatch++;
							}
							iSubActCount++;
						}
					}
					iActCount++;
				}
			}
			return iMissMatch;
		},

		//psutram: Jan 2017 modified
		_calculateYrSpan: function() {
			var oData = this.getModel("Copy").getData().Table;
			var sParentStartdt = new Date(oData.rows[0].StartDt);
			var sParentEnddt = new Date(oData.rows[0].EndDt);

			//psutram: jan 2017 modified next two lines to check for getUTCFullYear rather than getFullyear
			// var iStartYr = sParentStartdt.getFullYear();
			// var iEndYr = sParentEnddt.getFullYear();
			var iStartYr = sParentStartdt.getUTCFullYear();
			var iEndYr = sParentEnddt.getUTCFullYear();
			return iEndYr - iStartYr;

		},

		validateDateDifference: function(sNewSelectedDt, sParentStartDt, sParentEndDt) {
			var t1 = new Date(sNewSelectedDt).getTime();
			var t2 = new Date(sParentStartDt).getTime();
			var t3 = new Date(sParentEndDt).getTime();

			var diffStartDate = parseInt((t1 - t2) / (24 * 3600 * 1000));
			var diffEndDate = parseInt((t3 - t1) / (24 * 3600 * 1000));
			if (diffStartDate < 0 || diffEndDate < 0) {
				return false;
			} else {
				return true;
			}

		},

		//GGA: 3/8/17 added oNewDate so the value is passed in instead of reading it from the input field, the input field (model)
		//is no longer changed in this method but by the caller when this onDateChange method returns true to the caller
		onDateChange: function(oNewDate, oRowData, indicator) {
			var sErrMsg;
			var oStartDate, oEndDate;

			//check if this new date is for the start or end date
			if (indicator === 1) {
				oStartDate = oNewDate;
				//read end date from row data
				oEndDate = new Date(oRowData.getBindingContext("Copy").getObject().EndDt);
			} else {
				oEndDate = oNewDate;
				//read start date from row data
				oStartDate = new Date(oRowData.getBindingContext("Copy").getObject().StartDt);
			}

			var tStart = oStartDate.getTime();
			var tEnd = oEndDate.getTime();

			var nDiffDate = tEnd - tStart;
			if (nDiffDate < 0) {
				sErrMsg = this.getResourceBundle().getText("C_ERR_DateDiff");
				MessageToast.show(sErrMsg);
				return false;
			} else {

				//get the path of the binding for this row to determine if this is an activity or a subactivity
				//this is used to determine the context of the parents row to make sure the dates fit
				var sPath = oRowData.getBindingContext("Copy").getPath();
				var aPathArr = sPath.split("/");

				var oParentStartDate, oParentEndDate;

				if (aPathArr.length > 2) {
					if (aPathArr.length > 3) {
						//the row is a sub activity

						var iBindingContext = aPathArr[2];
						oParentStartDate = new Date(this.getModel("Copy").getData().rows[0].rows[iBindingContext].StartDt);
						oParentEndDate = new Date(this.getModel("Copy").getData().rows[0].rows[iBindingContext].EndDt);
					} else {
						//the row is an activity

						oParentStartDate = new Date(this.getModel("Copy").getData().rows[0].StartDt);
						oParentEndDate = new Date(this.getModel("Copy").getData().rows[0].EndDt);
					}

					var tSelectedDate = oNewDate.getTime();
					var tParentStart = oParentStartDate.getTime();
					var tParentEnd = oParentEndDate.getTime();

					var diffStartDate = tSelectedDate - tParentStart;
					var diffEndDate = tParentEnd - tSelectedDate;
					if (diffStartDate < 0 || diffEndDate < 0) {
						sErrMsg = this.getResourceBundle().getText("C_ERR_DateRange");
						MessageToast.show(sErrMsg);
						return false;
					}
				}
			}
			return true;

		},
		//End code for Date Changes on Live Change July, 7th 2017 SDS

		onSubSelectionChange: function(evt) {
			var sSelectedKey = evt.getSource().getSelectedKey();
			var sPath = evt.getSource().getBindingContext("Copy").getPath();
			var sParentObj = evt.getSource().getBindingContext("Copy").getObject();
			var aPathArr = sPath.split("/");
			var sParentSub = "";
			if (aPathArr.length > 4) { // this part of condition will get executed on change of activity susidiary
				if (aPathArr.length < 7) {
					sParentSub = this.getModel("Copy").getData().Table.rows[0].SubKey;
				} else {
					var iCount = aPathArr[5];
					sParentSub = this.getModel("Copy").getData().Table.rows[0].rows[iCount].SubKey;
				}
				if (sSelectedKey !== sParentSub && sParentSub !== "") {
					var sErrMsg = this.getResourceBundle().getText("C_ERR_Sub");
					MessageToast.show(sErrMsg);
					evt.getSource().setSelectedKey(sParentSub);
				} else {
					var iSubAct = 0;
					if (sSelectedKey !== "") {
						if (sParentObj.rows) {
							while (sParentObj.rows[iSubAct] !== undefined) {
								sParentObj.rows[iSubAct].SubKey = sSelectedKey;
								iSubAct++;
							}
						}
					}
				}
			} else { // else part will get executed on change of Project Subsidiary
				var iActCount = 0;
				if (sSelectedKey !== "") {
					if (sParentObj.rows) {
						while (sParentObj.rows && sParentObj.rows[iActCount] !== undefined) {
							sParentObj.rows[iActCount].SubKey = sSelectedKey;
							var iSubActCount = 0;
							while (sParentObj.rows[iActCount].rows && sParentObj.rows[iActCount].rows[iSubActCount] !== undefined) {
								sParentObj.rows[iActCount].rows[iSubActCount].SubKey = sSelectedKey;
								iSubActCount++;
							}
							iActCount++;
						}
					}
				}
			}
			this._setEnablement();
		},

		onHubSelectionChange: function(evt) {
			var sSelectedKey = evt.getSource().getSelectedKey();
			var sPath = evt.getSource().getBindingContext("Copy").getPath();
			var oParentObj = evt.getSource().getBindingContext("Copy").getObject();
			var aPathArr = sPath.split("/");
			var sParentHub = "";
			if (aPathArr.length > 4) { // this part of condition will get executed on change of activity Hub
				if (aPathArr.length < 7) {
					sParentHub = this.getModel("Copy").getData().Table.rows[0].HubKey;
				} else {
					var iCount = aPathArr[5];
					sParentHub = this.getModel("Copy").getData().Table.rows[0].rows[iCount].HubKey;
				}
				if (sSelectedKey !== sParentHub && sParentHub !== "") {
					var sErrMsg = this.getResourceBundle().getText("C_ERR_Hub");
					MessageToast.show(sErrMsg);
					evt.getSource().setSelectedKey(sParentHub);
				} else {
					var iSubAct = 0;
					oParentObj.SubKey = "";
					this._getSubsList(oParentObj);
					if (sSelectedKey !== "") {
						while (oParentObj.rows && oParentObj.rows[iSubAct] !== undefined) {
							oParentObj.rows[iSubAct].HubKey = sSelectedKey;
							oParentObj.rows[iSubAct].SubKey = "";
							this._getSubsList(oParentObj.rows[iSubAct]);
							iSubAct++;
						}
					}
				}
			} else { // else part will get executed on change of Project Hub
				var iActCount = 0;
				oParentObj.SubKey = "";
				this._getSubsList(oParentObj);
				if (sSelectedKey !== "") {
					while (oParentObj.rows && oParentObj.rows[iActCount] !== undefined) {
						if (sSelectedKey !== oParentObj.rows[iActCount].HubKey) {
							oParentObj.rows[iActCount].HubKey = sSelectedKey;
							oParentObj.rows[iActCount].SubKey = "";
						}
						this._getSubsList(oParentObj.rows[iActCount]);
						var iSubActCount = 0;
						while (oParentObj.rows[iActCount].rows && oParentObj.rows[iActCount].rows[iSubActCount] !== undefined) {
							if (sSelectedKey !== oParentObj.rows[iActCount].rows[iSubActCount].HubKey) {
								oParentObj.rows[iActCount].rows[iSubActCount].HubKey = sSelectedKey;
								oParentObj.rows[iActCount].rows[iSubActCount].SubKey = oParentObj.rows[iActCount].SubKey;
							}
							this._getSubsList(oParentObj.rows[iActCount].rows[iSubActCount]);
							iSubActCount++;
						}
						iActCount++;
					}
				}
			}
			this._setEnablement();
		},

		//Call dialog when Start Month or End month Inputs value help
		onDateDialogConfirm: function(evt) {
			var sNewMonth = sap.ui.getCore().byId("idMonthPicker").getMonth();
			var sOrigDate = this.getModel("Copy").getProperty(this._sMonthPickingPath);
			var sField = this._sMonthPickingSPath;
			sNewMonth++;
			if (sNewMonth < 10) {
				sNewMonth = "0" + sNewMonth.toString();
			}
			var sNewDate = sOrigDate.substring(0, 5) + sNewMonth + sOrigDate.substring(7, sOrigDate.length);
			sNewDate = sNewDate.split("T")[0] + "T00:00:00Z";
			if (sField === "StartDt") {
				sNewDate = sNewDate.substring(0, 8) + "01" + sNewDate.substring(10, sNewDate.length);
			} else if (sField === "EndDt") {
				sNewDate = sNewDate.substring(0, 8) + "28" + sNewDate.substring(10, sNewDate.length);
			}
			var dNewDate = new Date(sNewDate);
			var sPath = this._sMonthPickingContext;
			var oParentObj = this.getModel("Copy").getProperty(sPath);
			var sCurrentSt = oParentObj.StartDt;
			var sCurrentEd = oParentObj.EndDt;
			var dCurrentSt = new Date(sCurrentSt);
			var dCurrentEd = new Date(sCurrentEd);
			var aPathArr = sPath.split("/");
			var sParentStDate = "";
			var sParentEdDate = "";
			if (aPathArr.length > 4) { // this part of condition will get executed on change of activity Hub
				if (aPathArr.length < 7) {
					sParentStDate = this.getModel("Copy").getData().Table.rows[0].StartDt;
					sParentEdDate = this.getModel("Copy").getData().Table.rows[0].EndDt;
				} else {
					var iCount = aPathArr[5];
					sParentStDate = this.getModel("Copy").getData().Table.rows[0].rows[iCount].StartDt;
					sParentEdDate = this.getModel("Copy").getData().Table.rows[0].rows[iCount].EndDt;
				}
				var dParentStDate = new Date(sParentStDate);
				var dParentEdDate = new Date(sParentEdDate);
				var bErrored = false;
				if (sField === "StartDt") {
					if (dNewDate >= dParentStDate && dNewDate <= dParentEdDate && dNewDate <= dCurrentEd) {
						this.getModel("Copy").setProperty(this._sMonthPickingPath, sNewDate);
					} else {
						bErrored = true;
						var sErrMsg = this.getResourceBundle().getText("C_ERR_StartDt");
						MessageToast.show(sErrMsg);
					}
				}
				if (sField === "EndDt") {
					if (dNewDate >= dParentStDate && dNewDate <= dParentEdDate && dNewDate >= dCurrentSt) {
						this.getModel("Copy").setProperty(this._sMonthPickingPath, sNewDate);
					} else {
						bErrored = true;
						var sErrMsg = this.getResourceBundle().getText("C_ERR_EndDt");
						MessageToast.show(sErrMsg);
					}
				}
				if (!bErrored) {
					var iSubAct = 0;
					while (oParentObj.rows && oParentObj.rows[iSubAct] !== undefined) {
						var sCStDate = oParentObj.rows[iSubAct].StartDt;
						var sCEdDate = oParentObj.rows[iSubAct].EndDt;
						var dCStDate = new Date(sCStDate);
						var dCEdDate = new Date(sCEdDate);
						if (sField === "StartDt") {
							if (dNewDate > dCStDate) {
								oParentObj.rows[iSubAct].StartDt = sNewDate;
							}
							if (dNewDate > dCEdDate) {
								oParentObj.rows[iSubAct].EndDt = sNewDate;
							}
						}
						if (sField === "EndDt") {
							if (dNewDate < dCStDate) {
								oParentObj.rows[iSubAct].StartDt = sNewDate;
							}
							if (dNewDate < dCEdDate) {
								oParentObj.rows[iSubAct].EndDt = sNewDate;
							}
						}
						iSubAct++;
					}
				}
			} else { // else part will get executed on change of Project Hub
				var iActCount = 0;
				this.getModel("Copy").setProperty(this._sMonthPickingPath, sNewDate);
				while (oParentObj.rows && oParentObj.rows[iActCount] !== undefined) {
					var sCStDate = oParentObj.rows[iActCount].StartDt;
					var sCEdDate = oParentObj.rows[iActCount].EndDt;
					var dCStDate = new Date(sCStDate);
					var dCEdDate = new Date(sCEdDate);
					if (sField === "StartDt") {
						if (dNewDate > dCStDate) {
							oParentObj.rows[iActCount].StartDt = sNewDate;
						}
						if (dNewDate > dCEdDate) {
							oParentObj.rows[iActCount].EndDt = sNewDate;
						}
					}
					if (sField === "EndDt") {
						if (dNewDate < dCStDate) {
							oParentObj.rows[iActCount].StartDt = sNewDate;
						}
						if (dNewDate < dCEdDate) {
							oParentObj.rows[iActCount].EndDt = sNewDate;
						}
					}
					var iSubActCount = 0;
					while (oParentObj.rows && oParentObj.rows[iActCount].rows[iSubActCount] !== undefined) {
						var sCStDate = oParentObj.rows[iActCount].rows[iSubActCount].StartDt;
						var sCEdDate = oParentObj.rows[iActCount].rows[iSubActCount].EndDt;
						var dCStDate = new Date(sCStDate);
						var dCEdDate = new Date(sCEdDate);
						if (sField === "StartDt") {
							if (dNewDate > dCStDate) {
								oParentObj.rows[iActCount].rows[iSubActCount].StartDt = sNewDate;
							}
							if (dNewDate > dCEdDate) {
								oParentObj.rows[iActCount].rows[iSubActCount].EndDt = sNewDate;
							}
						}
						if (sField === "EndDt") {
							if (dNewDate < dCStDate) {
								oParentObj.rows[iActCount].rows[iSubActCount].StartDt = sNewDate;
							}
							if (dNewDate < dCEdDate) {
								oParentObj.rows[iActCount].rows[iSubActCount].EndDt = sNewDate;
							}
						}
						iSubActCount++;
					}
					iActCount++;
				}
			}
			this.getModel("Copy").refresh(false);
			this.oMonthYearPickerDialog.close();
		},
		onDateDialogClose: function() {
			this.oMonthYearPickerDialog.close();
		},
		_initializeModel: function() {
			var oModel = this.getModel("Copy");
			var currentPlanningYear = this.getModel("GeoFilter").getProperty("/Input/PlanningYear");
			var aPlanningYears = [];
			if (!oModel) {
				var oConfig = JSON.parse(this.getOwnerComponent().getModel("ASMConfig").getData().Properties.PlanningYearConfig);
				//var aPlanningYears = this.getModel("GeoFilter").getProperty("/PlanningYear/Current");
				if (!aPlanningYears || aPlanningYears.length === 0) {
					aPlanningYears = [];
					for (var i = 0; i < oConfig.length; i++) {
						if (!oConfig[i].DisplayOnly) {
							var oPlanningYearRecord = {};
							oPlanningYearRecord.Key = oConfig[i].Year;
							oPlanningYearRecord.Text = oConfig[i].Year;
							oPlanningYearRecord.DisplayOnly = oConfig[i].DisplayOnly;
							aPlanningYears.push(oPlanningYearRecord);
						}
					}
				}
				var oViewModel1 = new sap.ui.model.json.JSONModel({
					"Table": [],
					"Header": {
						"TargetPlanningYear": {
							"Value": currentPlanningYear,
							"Current": aPlanningYears,
							"Enabled": true
						}
					},
					"MonthSelect": 0,
					"Dropdowns": {
						"Division": [],
						"Hub": [],
						"Sub": [],
						"Category": [],
						"Subcategory": [],
						"Brand": [],
						"Subbrand": [],
						"ProjectType": [],
						"ActivityType": [],
						"SubactivityType": []
					}
				});
				oViewModel1.setSizeLimit(50000);
				this.setModel(oViewModel1, "Copy");
			}
			aPlanningYears = this.getModel("Copy").getProperty("/Header/TargetPlanningYear/Current");
			var bInitialYearSet = false;
			this._initialYear = currentPlanningYear;
			for (var j = 0; j < aPlanningYears.length; j++) {
				if (aPlanningYears[j].Key === this._initialYear) {
					bInitialYearSet = true;
					j = aPlanningYears.length;
				}
			}
			if (!bInitialYearSet) {
				this._initialYear = aPlanningYears[0].Key;
			}
		},
		_buildChildren: function(oParent) {
			var i = 0;
			var done = false;
			if (oParent[0]) {
				oParent.rows = [];
				while (!done) {
					if (oParent[i]) {
						this._addFieldControl(oParent[i]);
						oParent.rows.push(oParent[i]);
						this._buildChildren(oParent[i]);
						delete oParent[i];
						i++;
					} else {
						done = true;
					}
				}
			}
		},
		_addFieldControl: function(oRecord) {
			oRecord.ValueState = {};
			oRecord.ValueStateText = {};
			oRecord.ValueState.Name = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Name = "";
			oRecord.ValueState.ActivityType = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.ActivityType = "";
			oRecord.ValueState.Hub = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Hub = "";
			oRecord.ValueState.Sub = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Sub = "";
			oRecord.ValueState.Category = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Category = "";
			oRecord.ValueState.Subcategory = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Subcategory = "";
			oRecord.ValueState.Brand = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Brand = "";
			oRecord.ValueState.Subbrand = sap.ui.core.ValueState.None;
			oRecord.ValueStateText.Subbrand = "";
		},
		_setATValues: function(sParentType, oRecord, bClearChildren) {
			var sChanged = oRecord.ItemType;
			var oDropdowns = this.getModel("Copy").getProperty("/Dropdowns");
			if (!oRecord.Enabled) {
				oRecord.Enabled = {};
			}
			if (!oRecord.Placeholders) {
				oRecord.Placeholders = {};
			}
			if (sChanged === "PT") {
				oRecord.Enabled.ActivityType = true;
				oRecord.CurrentActivityTypes = oDropdowns.ProjectType;
				this._setATChildrenValues(oRecord, bClearChildren);
			} else if (sChanged === "AT") {
				if (sParentType !== "") {
					oRecord.Enabled.ActivityType = true;
					if (oRecord.ActivityType !== "" && !oDropdowns.SubactivityType[oRecord.ActivityType]) {
						var that = this;
						that._getSubactivityTypes(oRecord.ActivityType); //Changed By Khrystyne 10/30
						// setTimeout(function() {
						// 	that._getSubactivityTypes(oRecord.ActivityType);
						// }, 200);
					}
				} else {
					oRecord.Enabled.ActivityType = true; //Would have been false
				}
				oRecord.CurrentActivityTypes = oDropdowns.ActivityType;
				this._setATChildrenValues(oRecord, bClearChildren);
			} else if (sChanged === "SA") {
				if (sParentType !== "") {
					oRecord.Enabled.ActivityType = true;
				} else {
					oRecord.Enabled.ActivityType = true; //Would have been false
				}
				oRecord.CurrentActivityTypes = oDropdowns.SubactivityType[sParentType];
				// Double check to make sure item is selected
				if (oRecord.ActivityType === "") {
					oRecord.ActivityType = oRecord.CurrentActivityTypes[0].Key;
				} else {
					var bFound = false;
					for (var i = 0; i < oRecord.CurrentActivityTypes.length; i++) {
						if (oRecord.ActivityType === oRecord.CurrentActivityTypes[i].Key) {
							bFound = true;
							i = oRecord.CurrentActivityTypes.length;
						}
					}
					if (!bFound) {
						oRecord.ActivityType = oRecord.CurrentActivityTypes[0].Key;
					}
				}
			}
			this.getModel("Copy").refresh(false);
		},
		_setPHValues: function(sChanged, oRecord, bChild, oParent) {
			var that = this;
			var oDropdowns = this.getModel("Copy").getProperty("/Dropdowns");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			if (!oRecord.Enabled) {
				oRecord.Enabled = {};
			}
			if (!oRecord.Placeholders) {
				oRecord.Placeholders = {};
			}
			oRecord.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e");
			if (sChanged === "CategoryKey") {
				if (bChild && oRecord.CategoryKey !== "") {
					oRecord.Enabled.Category = false;
				} else if (bChild && oRecord.CategoryKey === "") {
					oRecord.Enabled.Category = true;
				}
				// First clear the keys
				// PSW Start Correction Clear Dependent fields May 26th 2016 v3
				if (oRecord.SubcategoryKey) {
					oRecord.SubcategoryKey = "";
				}
				if (oRecord.BrandKey) {
					oRecord.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e");
					// Check to see if BrandKey should be removed
					if (oRecord.BrandKey !== "" && oRecord.CategoryKey !== "") {
						var aBrands = [];
						if (oRecord.CurrentBrands) {
							aBrands = oRecord.CurrentBrands;
						}
						for (var i = 0; i < aBrands.length; i++) {
							if (aBrands[i].Key === oRecord.BrandKey) {
								if (oRecord.CategoryKey !== aBrands[i].Category && aBrands[i].Category !== "") {
									oRecord.BrandKey = "";
									oRecord.SubbrandKey = "";
								}
								i = aBrands.length;
							}
						}
					}
				}
				DropdownUtils.getDelayedCategories(this, oRecord.CategoryKey, oRecord.BrandKey,
					this.getView().getModel("Copy"), "/Dropdowns/Category",
					oRecord, "CurrentCategories");
				DropdownUtils.getDelayedBrands(this, null, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey,
					this.getModel("Copy"), "/Dropdowns/Brand", oRecord, "CurrentBrands");
				var sSelected = oRecord.CategoryKey;
				if (!sSelected || sSelected === "") {
					oRecord.Enabled.Subcategory = false;
					//oRecord.Enabled.Brand = false;
					oRecord.Enabled.Subbrand = false;
					oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_pscategory_e");
					//oRecord.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand");
					oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand");
				} else {
					// May need to change the Brand List
					// Check if you already have these values stored
					DropdownUtils.getDelayedSubcategories(this, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey, this.getView()
						.getModel(
							"Copy"), "/Dropdowns/Subcategory", oRecord, "CurrentSubcategories");
					oRecord.Enabled.Subcategory = true;
					oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e");
					oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_sbe");
				}
				oRecord.Enabled.Subbrand = false;
			} else if (sChanged === "BrandKey" || sChanged === "SubcategoryKey") {
				if (sChanged === "SubcategoryKey") {
					if (bChild && oRecord.SubcategoryKey !== "") {
						oRecord.Enabled.Subcategory = false;
					} else if (bChild && oRecord.SubcategoryKey === "") {
						oRecord.Enabled.Subcategory = true;
					}
					DropdownUtils.getDelayedBrands(this, null, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey,
						this.getModel("Copy"), "/Dropdowns/Brand", oRecord, "CurrentBrands");
					while (this._phLoopBusy) {
						// This is added in just to wait for the data to be released.
					}
				} else if (sChanged === "BrandKey") {
					var aBrands = [];
					if (oRecord.CurrentBrands) {
						aBrands = oRecord.CurrentBrands;
					}
					var bFound = false;
					for (var i = 0; i < aBrands.length; i++) {
						if (oRecord.BrandKey === aBrands[i].Key) {
							bFound = true;
							if (oRecord.SubcategoryKey !== "" && oRecord.SubcategoryKey !== aBrands[i].PSubCategory) {
								oRecord.SubcategoryKey = "";
								DropdownUtils._clearParentPHField(this.getModel("Copy").getData().Table, "SubcategoryKey", oRecord);
								if (oRecord.CategoryKey !== "" && oRecord.CategoryKey !== aBrands[i].Category) {
									oRecord.CategoryKey = "";
									DropdownUtils._clearParentPHField(this.getModel("Copy").getData().Table, "CategoryKey", oRecord);
								}
							} else if (oRecord.CategoryKey !== "" && oRecord.CategoryKey !== aBrands[i].Category) {
								oRecord.CategoryKey = "";
								DropdownUtils._clearParentPHField(this._oContext.getModel("Copy").getData().Table, "CategoryKey", oRecord);
							}
							if (bChild) {
								if (oRecord.SubcategoryKey !== "") {
									if (oParent.SubcategoryKey !== "") {
										oRecord.Enabled.Subcategory = false;
										oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sparent");
									} else {
										oRecord.Enabled.Subcategory = true;
										oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e");
									}
								} else if (oRecord.CategoryKey === "") {
									oRecord.Enabled.Subcategory = false;
									oRecord.Enabled.Category = true;
									oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_pscategory");
								}
								if (oRecord.CategoryKey !== "" && oParent.CategoryKey === oRecord.CategoryKey) {
									oRecord.Enabled.Category = false;
									oRecord.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sparent");
								}
							}
							i = aBrands.length;
						}
					}
					if (!bFound && aBrands.length > 0) {
						// This means that brand selected is not on the current brand list
						// Thus the Category / Subcategory must be wrong.
						oRecord.CategoryKey = "";
						oRecord.SubcategoryKey = "";
						oRecord.SubbrandKey = "";
						DropdownUtils.getDelayedBrands(this, null, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey,
							this.getModel("Copy"), "/Dropdowns/Brand", oRecord, "CurrentBrands");
						if (bChild) {
							if (oRecord.SubcategoryKey !== "") {
								if (oParent.SubcategoryKey !== "") {
									oRecord.Enabled.Subcategory = false;
									oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sparent");
								} else {
									oRecord.Enabled.Subcategory = true;
									oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_pscategory_e");
								}
							} else if (oRecord.CategoryKey === "") {
								oRecord.Enabled.Subcategory = false;
								oRecord.Enabled.Category = true;
								oRecord.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_pscategory");
							}
							oRecord.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sparent");
						}
					}
				}
				if (bChild && oRecord.BrandKey !== "") {
					oRecord.Enabled.Brand = false;
				} else if (bChild && oRecord.BrandKey === "") {
					oRecord.Enabled.Brand = oRecord.isRowEditable;
					oRecord.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e");
				} else {
					oRecord.Enabled.Brand = oRecord.isRowEditable;
				}
				// First clear out old values
				if (oRecord.SubbrandKey) {
					oRecord.SubbrandKey = "";
				}
				if (oRecord.BrandKey !== "" || oRecord.SubcategoryKey !== "") {
					DropdownUtils.getDelayedSubbrands(this, null, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey, oRecord.SubbrandKey,
						this.getModel("Copy"), "/Dropdowns/Subbrand", oRecord, "CurrentSubbrands");
					// var combinedKey = oRecord.CategoryKey + ":" + oRecord.SubcategoryKey + ":" + oRecord.BrandKey;
					// if (oDropdowns.Subbrand && oDropdowns.Subbrand[combinedKey]) {
					// 	// You don't need to select - we already have the data
					// 	oRecord.CurrentSubbrands = oDropdowns.Subbrand[combinedKey];
					// } else {
					// 	var sbmodel = this.getModel("Subbrand");
					// 	if (!sbmodel) {
					// 		//sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false); //Changed by Khrystyne 10/27
					// 		sbmodel = new sap.ui.model.odata.ODataModel(sServiceUrl, false);
					// 		sbmodel.setSizeLimit(50000);
					// 		sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
					// 		this.setModel(sbmodel, "Subbrand");
					// 	}
					// 	var filters = [];
					// 	filters.push(new sap.ui.model.Filter({
					// 		path: "Key",
					// 		operator: sap.ui.model.FilterOperator.EQ,
					// 		value1: oRecord.SubbrandKey
					// 	}));
					// 	filters.push(new sap.ui.model.Filter({
					// 		path: "Category",
					// 		operator: sap.ui.model.FilterOperator.EQ,
					// 		value1: oRecord.CategoryKey
					// 	}));
					// 	filters.push(new sap.ui.model.Filter({
					// 		path: "PSubCategory",
					// 		operator: sap.ui.model.FilterOperator.EQ,
					// 		value1: oRecord.SubcategoryKey
					// 	}));
					// 	filters.push(new sap.ui.model.Filter({
					// 		path: "Brand",
					// 		operator: sap.ui.model.FilterOperator.EQ,
					// 		value1: oRecord.BrandKey
					// 	}));
					// 	var sPath = "/VHSubbrands";
					// 	SpinnerUtils.startDetailSpinner(this);
					// 	var that = this;
					// 	var oPromise = new Promise(function(resolve, reject) {
					// 		sbmodel.read(sPath, {
					// 			async: false,
					// 			filters: filters,
					// 			success: function(oData, oResponse) {
					// 				TimeoutUtils.onResetTimer(that);
					// 				that._setSubbrands(oData, oRecord);
					// 				resolve(oData);
					// 			},
					// 			error: function(oError) {
					// 				oError.ErrorOrigin = "Subbrands";
					// 				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					// 				reject(oError);
					// 			}
					// 		});
					// 	});
					// 	oPromise.then(function(oData) {
					// 		SpinnerUtils.stopDetailSpinner(that);
					// 	});
					// }
					if (oRecord.CategoryKey === "" && oRecord.SubcategoryKey === "" && oRecord.BrandKey === "") {
						oRecord.Enabled.Subbrand = false;
						oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand");
					} else if (oRecord.SubcategoryKey === "" && oRecord.BrandKey === "") {
						oRecord.Enabled.Subbrand = false;
						oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_sbe");
					} else if (oRecord.CategoryKey === "" && oRecord.SubcategoryKey === "") {
						oRecord.Enabled.Subbrand = false;
						oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_cse");
					} else if (oRecord.BrandKey === "") {
						oRecord.Enabled.Subbrand = false;
						oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_be");
					} else {
						oRecord.Enabled.Subbrand = true;
						oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e");
					}
				} else {
					oRecord.Enabled.Subbrand = false;
					oRecord.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e");
					oRecord.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_be");
				}
				DropdownUtils.getDelayedCategories(this, oRecord.CategoryKey, oRecord.BrandKey,
					this.getView().getModel("Copy"), "/Dropdowns/Category",
					oRecord, "CurrentCategories");
				if (oRecord.CategoryKey && oRecord.CategoryKey !== "") {
					DropdownUtils.getDelayedSubcategories(this, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey,
						this.getView().getModel("Copy"), "/Dropdowns/Subcategory",
						oRecord, "CurrentSubcategories");
				}
			} else {
				if (bChild && oRecord.SubbrandKey !== "") {
					oRecord.Enabled.Subbrand = false;
				} else if (bChild && oRecord.SubbrandKey === "" && oRecord.SubcategoryKey !== "") {
					oRecord.Enabled.Subbrand = true;
				}

				if (oRecord.SubbrandKey !== "") {
					if (oRecord.CurrentSubbrands) {
						var aSubbrands = oRecord.CurrentSubbrands;
						for (var i = 0; i < aSubbrands.length; i++) {
							if (aSubbrands[i].Key === oRecord.SubbrandKey) {
								if (oRecord.BrandKey !== aSubbrands[i].Brand) {
									oRecord.BrandKey = aSubbrands[i].Brand;
									//this.getModel("Copy").refresh(false);
								}
								if (!bChild) {
									this._setPHChildrenValuesSimple("BrandKey", oRecord);
								}
								i = aSubbrands.length;
							}
						}
					}
				}
			}
			if (!bChild) {
				this._setPHChildrenValues(sChanged, oRecord);
			}
			this.getModel("Copy").refresh(false);
		},
		// _setSubbrands: function(oDataIn, oRecord) {
		// 	var oDropdowns = this.getModel("Copy").getProperty("/Dropdowns");
		// 	oRecord.CurrentSubbrands = oDataIn.results;
		// 	var combinedKey = oRecord.CategoryKey + ":" + oRecord.SubcategoryKey + ":" + oRecord.BrandKey;
		// 	oDropdowns.Subbrand[combinedKey] = oDataIn.results;
		// 	this.getModel("Copy").refresh(false);
		// },
		onSelectionChange: function(oEvent) {
			this.getOwnerComponent().getModel("masterShared").setProperty("/oBusy/skipStop", true);
			SpinnerUtils.startDetailSpinner(this);
			var sChanged = oEvent.getSource().getId();
			var aParts = sChanged.split("--");
			var aParts2 = aParts[aParts.length - 1].split("-");
			sChanged = aParts2[0];
			var sPath = oEvent.getSource().getParent().getBindingContext("Copy").getPath();
			var oRecord = this.getModel("Copy").getProperty(sPath);
			DropdownUtils.resetDelay();
			this._setPHValues(sChanged, oRecord, false, null);
			DropdownUtils._resetEnabled(this.getModel("Copy").getData().Table, "Brand", "BrandKey");
			sap.ui.getCore().getEventBus().subscribeOnce("colgate.asm.planning.dropdownutils", "PHFetchComplete", this._onPHFetched, this);
			DropdownUtils.executeDelayed();
		},
		onActivityTypeChange: function(oEvent) {
			var sPath = oEvent.getSource().getParent().getBindingContext("Copy").getPath();
			var oRecord = this.getModel("Copy").getProperty(sPath);
			if (oRecord.ItemType === "AT") {
				this._setATValues("X", oRecord, true);
			}
		},
		_initializeRowPH: function(oRecord, oParent) {
			var hSubcategory = oRecord.SubcategoryKey;
			var hBrand = oRecord.BrandKey;
			var hSubbrand = oRecord.SubbrandKey;
			this._setPHValues("CategoryKey", oRecord, true, oParent);
			if (!oParent || oRecord.CategoryKey !== oParent.CategoryKey) {
				oRecord.Enabled.Category = true;
			}
			if (hSubcategory !== "") {
				oRecord.SubcategoryKey = hSubcategory;
				this._setPHValues("SubcategoryKey", oRecord, true, oParent);
				if (!oParent || oRecord.SubcategoryKey !== oParent.SubcategoryKey) {
					oRecord.Enabled.Subcategory = true;
				}
			}
			if (hBrand !== "") {
				oRecord.BrandKey = hBrand;
				this._setPHValues("BrandKey", oRecord, true, oParent);
				if (!oParent || oRecord.BrandKey !== oParent.BrandKey) {
					oRecord.Enabled.Brand = true;
				}
			}
			if (hSubbrand !== "") {
				oRecord.SubbrandKey = hSubbrand;
				this._setPHValues("SubbrandKey", oRecord, true, oParent);
				if (!oParent || oRecord.SubbrandKey !== oParent.SubbrandKey) {
					oRecord.Enabled.Subbrand = true;
				}
			} else {
				if (oRecord.BrandKey === "") {
					oRecord.Enabled.Subbrand = false;
				}
			}
			if (!oRecord.isRowEditable) {
				oRecord.Enabled.Category = false;
				oRecord.Enabled.Subcategory = false;
				oRecord.Enabled.Brand = false;
				oRecord.Enabled.Subbrand = false;
			}
			oRecord.CategoryDesc = "";
			oRecord.SubcategoryDesc = "";
			oRecord.BrandDesc = "";
			oRecord.SubbrandDesc = "";
			//this._getDropdownSet(oRecord);
		},
		_initializeRowAT: function(oRecord, oParent, bClearChildren) {
			this._setATValues(oParent.ActivityType, oRecord, bClearChildren);
		},
		_setPHChildrenValuesSimple: function(sChanged, oRecord) {
			var sKey = oRecord[sChanged];
			if (sKey !== "" && oRecord.rows) {
				for (var i = 0; i < oRecord.rows.length; i++) {
					var oNewRecord = oRecord.rows[i];
					oNewRecord[sChanged] = sKey;
					var sEnabledField = sChanged.replace("Key", "");
					oNewRecord.Enabled[sEnabledField] = false;
					this._setPHChildrenValues(sChanged, oNewRecord);
					this._getDropdownSet(oNewRecord);
				}
			} else if (oRecord.rows) {
				for (var i = 0; i < oRecord.rows.length; i++) {
					var oNewRecord = oRecord.rows[i];
					var sEnabledField = sChanged.replace("Key", "");
					oNewRecord.Enabled[sEnabledField] = true;
					this._getDropdownSet(oNewRecord);
				}
			}
			this.getModel("Copy").refresh(false);
		},
		_setPHChildrenValues: function(sChanged, oRecord) {
			var sKey = oRecord[sChanged];
			if (sKey !== "" && oRecord.rows) {
				for (var i = 0; i < oRecord.rows.length; i++) {
					var oNewRecord = oRecord.rows[i];
					oNewRecord[sChanged] = sKey;
					this._setPHValues(sChanged, oNewRecord, true, oRecord);
					this._setPHChildrenValues(sChanged, oNewRecord);
					this._getDropdownSet(oNewRecord);
				}
			} else if (oRecord.rows) {
				for (var i = 0; i < oRecord.rows.length; i++) {
					var oNewRecord = oRecord.rows[i];
					var sEnabledField = sChanged.replace("Key", "");
					oNewRecord.Enabled[sEnabledField] = true;
					this._getDropdownSet(oNewRecord);
				}
			}
			//this.getModel("Copy").refresh(false);
		},
		_setATChildrenValues: function(oRecord, bClearChildren) {
			var sKey = oRecord.ActivityType;
			if (sKey !== "" && oRecord.rows) {
				for (var i = 0; i < oRecord.rows.length; i++) {
					var oNewRecord = oRecord.rows[i];
					if (!oNewRecord.Enabled) {
						oNewRecord.Enabled = {};
					}
					if (!oNewRecord.Placeholders) {
						oNewRecord.Placeholders = {};
					}
					if (bClearChildren) {
						oNewRecord.ActivityType = "";
					}
					oNewRecord.Enabled.ActivityType = true;
					if (oRecord.ItemType === "AT") {
						oNewRecord.Placeholders.ActivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_AT");
					} else if (oRecord.ItemType === "SA") {
						oNewRecord.Placeholders.ActivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_SA");
					}
					this._setATValues(oRecord.ActivityType, oNewRecord, bClearChildren);
					this._setATChildrenValues(oNewRecord, bClearChildren);
				}
			} else if (oRecord.rows) {
				for (var i = 0; i < oRecord.rows.length; i++) {
					var oNewRecord = oRecord.rows[i];
					if (!oNewRecord.Enabled) {
						oNewRecord.Enabled = {};
					}
					if (!oNewRecord.Placeholders) {
						oNewRecord.Placeholders = {};
					}
					if (oRecord.ItemType === "AT") {
						oNewRecord.Placeholders.ActivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_AT_E");
					} else if (oRecord.ItemType === "SA") {
						oNewRecord.Placeholders.ActivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_SA_E");
					}
					oNewRecord.Enabled.ActivityType = true; //Would have been false
					this._setATChildrenValues(oNewRecord, true);
				}
			}
			//this.getModel("Copy").refresh(false);
		},
		_initializeTypeModels: function() {
			// Make initial OData calls that need further processing
			var that = this;
			var oModel = this.getModel("ActivityType");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			if (!oModel) {
				//oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false); //Changed by Khrystyne 10/27
				oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, false);
				oModel.setSizeLimit(50000);
				this.setModel(oModel, "ActivityType");
			}
			var oPromisePT = new Promise(function(resolve, reject) {
				var sPath = "/VHProjectTypes";
				setTimeout(function() {
					oModel.read(sPath, {
						async: false,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(that);
							that._setProjectTypes(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Initial";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
			var oPromiseAT = new Promise(function(resolve, reject) {
				var sPath = "/VHActivityTypes";
				setTimeout(function() {
					oModel.read(sPath, {
						async: false,
						success: function(oData, oResponse) {
							that._setActivityTypes(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Initial";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
			var oPromise = Promise.all([oPromisePT, oPromiseAT]);
			return oPromise;
		},
		_setProjectTypes: function(oDataIn) {
			var oDropdowns = this.getModel("Copy").getProperty("/Dropdowns");
			oDropdowns.ProjectType = oDataIn.results;
			this._resetATValues();
		},
		_setActivityTypes: function(oDataIn) {
			var oDropdowns = this.getModel("Copy").getProperty("/Dropdowns");
			oDropdowns.ActivityType = oDataIn.results;
			this._resetATValues();
		},
		_setSubactivityTypes: function(oDataIn, sSubactivityKey) {
			var oModel = this.getModel("Copy");
			var oDropdowns = oModel.getProperty("/Dropdowns");
			oDropdowns.SubactivityType[sSubactivityKey] = oDataIn.results;
			this._resetATValues();
		},
		_getSubactivityTypes: function(sActivityType) {
			// If the activity type is selected, then select the subactivity types.
			// Pick up the subactivity types
			var that = this;
			var oPromise = new Promise(function(resolve, reject) {
				var sPath = "/VHSubactivityTypes";
				var filters = [];
				filters.push(new sap.ui.model.Filter({
					path: "Key",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sActivityType
				}));
				that.getModel("ActivityType").read(sPath, { //Changed By Khrystyne 10/30
					async: false,
					filters: filters,
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(that);
						that._setSubactivityTypes(oData, sActivityType);
						resolve(oData);
					},
					error: function(oError) {
						oError.ErrorOrigin = "Initial";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
						reject(oError);
					}
				});
			});
			return oPromise;
		},
		_resetATValues: function() {
			var oData = this.getModel("Copy").getData().Table;
			if (oData.rows) {
				for (var i = 0; i < oData.rows.length; i++) {
					this._initializeRowAT(oData.rows[i], {}, false);
				}
			}
			this.getModel("Copy").refresh(false);
		},
		_getDropdownSet: function(oRecord) {
			DropdownUtils.getDelayedBrands(this, null, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey,
				this.getModel("Copy"), "/Dropdowns/Brand", oRecord, "CurrentBrands");
			DropdownUtils.getDelayedCategories(this, oRecord.CategoryKey, oRecord.BrandKey,
				this.getModel("Copy"), "/Dropdowns/Category",
				oRecord, "CurrentCategories");
			if (oRecord.CategoryKey && oRecord.CategoryKey !== "") {
				DropdownUtils.getDelayedSubcategories(this, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey,
					this.getModel("Copy"), "/Dropdowns/Subcategory",
					oRecord, "CurrentSubcategories");
			}
			if (oRecord.BrandKey && oRecord.BrandKey !== "") {
				DropdownUtils.getDelayedSubbrands(this, null, oRecord.CategoryKey, oRecord.SubcategoryKey, oRecord.BrandKey, oRecord.SubbrandKey,
					this.getModel("Copy"), "/Dropdowns/Subbrand", oRecord, "CurrentSubbrands");
			}
		}
	});
});