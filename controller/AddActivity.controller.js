/*global location */
sap.ui.define([
	"colgate/asm/planning/base/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"colgate/asm/planning/base/model/formatter",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/m/MessageToast",
	"colgate/asm/planning/base/util/VendorUtils",
	"colgate/asm/planning/base/util/RetailerUtils",
	'colgate/asm/planning/base/util/TimeoutUtils',
	'colgate/asm/planning/base/util/DropdownUtils',
	'colgate/asm/planning/base/util/FieldCheckUtils',
	'colgate/asm/planning/base/util/CustomCurrencyType',
	'colgate/asm/planning/base/util/CustomCurrencyTypeFull',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/Dialog",
	"colgate/asm/planning/base/util/CrossSubBrandUtils"
], function(BaseController, JSONModel, formatter, MessagePopover, MessagePopoverItem, MessageToast, VendorUtils, RetailerUtils,
	TimeoutUtils, DropdownUtils, FieldCheckUtils, CustomCurrencyType, CustomCurrencyTypeFull, Filter, FilterOperator, Button, Text, Dialog,
	CrossSubBrandUtils) {
	"use strict";

	return BaseController.extend("colgate.asm.planning.base.controller.AddActivity", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			// var oViewModel = new JSONModel({
			// 	busy: false,
			// 	delay: 0
			// });

			this._newAdd = true;

			this.getRouter().getRoute("addActivity").attachPatternMatched(this._onObjectMatched, this);

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oBaseModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
			oBaseModel.setSizeLimit(50000);
			this.setModel(oBaseModel);

			//GDH - Receive events when screen is shown 
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("colgate.asm.planning.detail", "Errors", function(sChannelId, sEventId, oData) {
				this._handleODataErrors(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.initialize", "AddActivity", function(sChannelId, sEventId, oData) {
				this._handleInitialize(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.master.event", "ConfigurationLoaded", function(sChannelId, sEventId, oData) {
				this._setASMConfig();
			}, this);

			// Set up the initial selections
			var oData = {};
			oData.Placeholders = {
				Brand: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand"),
				Subbrand: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand"),
				Hub: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub"),
				Sub: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub"),
				Priority: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_priority"),
				Function: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_function"),
				Channel: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_channel"),
				Demographics: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_e")
			};
			oData.Input = {};
			oData.Display = {};
			oData.Retailer = {};
			oData.Agency = {};
			oData.MaestroBrief = {};
			oData.ProjectType = {};
			oData.ActivityType = {};
			oData.Priority = {};
			oData.SubactivityType = {};
			oData.Demographics = {};
			oData.MaxValueC = {};
			oData.Costcenter = {};
			oData.Visible = {
				Parent: true,
				LevelType: true,
				Name: true,
				ProjectType: true,
				ActivityType: true,
				SubactivityType: true,
				Priority: true,
				Function: true,
				Channel: true,
				LongText: true,
				Division: true,
				Hub: true,
				Sub: true,
				Category: true,
				Subcategory: true,
				Brand: true,
				Subbrand: true,
				Retailer: true,
				Agency: true,
				GlAccount: true,
				Demographics: true,
				MaxValueC: false,
				MaestroBrief: true,
				Costcenter: true,
				PO: true,
				Save2: true,
				Save3: false,
				// Begin of Changes - Khrystyne Williams - Feb 2017
				Cancel: false,
				// End of Changes - Khrystyne Williams - Feb 2017
				//INBHD02
				CrossSubBrand: false,
				CrossSubBrandList: false
					//INBHD02
			};
			oData.Enabled = {
				Parent: true,
				LevelType: true,
				Name: true,
				ProjectType: true,
				ActivityType: true,
				SubactivityType: true,
				Priority: true,
				Function: true,
				Channel: true,
				LongText: true,
				Division: true,
				Hub: true,
				Sub: true,
				Category: true,
				Subcategory: false,
				Brand: false,
				Subbrand: false,
				Retailer: false,
				Agency: false,
				GlAccount: true,
				Demographics: true,
				MaestroBrief: false,
				Costcenter: true,
				PO: true
			};
			oData.Labels = {
				Parent: "Override Parent Label",
				Save2: "Override Save2",
				Save3: "Override Save3",
				// Begin of Addition - Khrystyne Williams - July 14, 2016
				// Begin Changes - Khrystyne Williams - Feb 2017
				Title1: "",
				Title2: "",
				Title3: ""
					// Title1: "Create New Project",
					// Title2: "Create New Activity",
					// Title3: "Create New Sub-Activity"
					// End Changes - Khrystyne Williams - Feb 2017
					// End of Addition - Khrystyne Williams - July 14, 2016
			};
			oData.Internal = {
				Save2Mode: "AddActivity",
				Save3Mode: "AddSubactivity",
				CurrentSaveMode: "AddActivity"
			};
			oData.Brand = {};
			oData.Brand.Current = [];
			oData.Category = {};
			oData.Category.Current = [];
			oData.Subcategory = {};
			oData.Subcategory.Current = [];
			// INBHD02 Cross Sub Brand
			oData.CSBCategory = {};
			oData.CSBCategory.Current = [];
			oData.CSBSubcategory = {};
			oData.CSBSubcategory.Current = [];
			oData.CSBBrand = {};
			oData.CSBBrand.Current = [];
			oData.CSBSubbrand = {};
			oData.CSBSubbrand.Current = [];
			oData.CSBSubbrand.Selected = [];
			oData.CSBSubbrand.Change = [];
			oData.CSBSubbrand.NewChange = [];
			oData.CSBSubbrand.Count = {};
			oData.CSBSubbrand.Count.Selected = "(0)";
			oData.CSBSubbrand.Count.Current = "(0)";
			// INBHD02 Cross Sub Brand			
			var oModel = new sap.ui.model.json.JSONModel(oData);
			oModel.setSizeLimit(50000);
			this.setModel(oModel, "AddActivity");

			// Set the initial form to be the display one
			this._showFormFragment("AddActivity");
			this._setPHValues("CategoryKey");
			this._setMonthPicker(1, 12);

			// Make initial OData calls that need further processing
			var sPath = "/VHProjectTypes";
			var that = this;
			oBaseModel.read(sPath, {
				async: true,
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					that._setProjectTypes(oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Initial";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});

			sPath = "/VHActivityTypes";
			oBaseModel.read(sPath, {
				async: true,
				success: function(oData, oResponse) {
					that._setActivityTypes(oData);
					that._setASMConfig();
					that.onParentChange(null);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Initial";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
			sPath = "/VHInitiativePriorities";
			oBaseModel.read(sPath, {
				async: true,
				success: function(oData, oResponse) {
					// The success for this one handles itself, but you should set the initial division data.
					TimeoutUtils.onResetTimer(that);
					that._setPriorities(oData);
					that._initializeGeo();
					that.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function(oError) {
					oError.ErrorOrigin = "Initial";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner

			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			this.oMessageManager = oMessageManager;
			this.oMessageProcessor = oMessageProcessor;
			var oBrand = this.byId("BrandKey");
			DropdownUtils.getBrands(this, oBrand, oData.Input.CategoryKey, oData.Input.SubcategoryKey, oBrand.getSelectedKey(),
				this.getModel("AddActivity"), "/Brand", null, "/Brand/Current");
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("addActivityView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("addActivityView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		onCancel: function() {
			if (this._currentAction === "saveAndAdd") {
				// This means we need to reload items
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Refresh", {});
				this._currentAction = "";
			}
			// Begin of Changes - Khrystyne Williams - Nov 2016
			this._clearErrors();
			// End of Changes - Khrystyne Williams - Nov 2016
			this.getRouter().navTo("activities", {
				objectId: "Activities"
			}, true);
		},
		onSave: function(oEvent) {
			this._currentAction = "save";
			var bComplete = this._validateInput(null);
			if (bComplete) {
				// Start GDH 03252017
				this.getModel("AddActivity").setProperty("/Input/Id", "");
				this._createItem();
				// End GDH 03262017 this._getExternalId();
			}
		},
		onSaveAndAdd: function(oEvent) {
			var oInternal = this.getModel("AddActivity").getData().Internal;
			var sId = oEvent.getSource().getId();
			if (sId.endsWith("Save2")) {
				oInternal.CurrentSaveMode = oInternal.Save2Mode;
			} else if (sId.endsWith("Save3")) {
				oInternal.CurrentSaveMode = oInternal.Save3Mode;
			}
			this._currentAction = "saveAndAdd";
			var bComplete = this._validateInput(null);
			if (bComplete) {
				// Start GDH 03252017
				this.getModel("AddActivity").setProperty("/Input/Id", "");
				this._createItem();
				// End GDH 03262017 this._getExternalId();
			}
		},
		onSelectionChange: function(oEvent) {
			var sChanged = oEvent.getSource().getId();
			var aParts = sChanged.split("--");
			sChanged = aParts[aParts.length - 1];
			this._setPHValues(sChanged);
		},
		onGeoSelectionChange: function(oEvent) {
			var sChanged = oEvent.getSource().getId();
			var aParts = sChanged.split("--");
			sChanged = aParts[aParts.length - 1];
			this._setGeoValues(sChanged);
		},
		// Begin of Changes - Khrystyne Williams - Nov 2016
		onSubActSelectionChange: function(oEvent) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			var oInput = this.getModel("AddActivity").getData().Input;
			if (oData.Input.SubactivityType && oData.Input.SubactivityType !== "") {
				// Set the GL Account
				var aSAType = oData.SubactivityType.Current;
				for (var i = 0; i < aSAType.length; i++) {
					if (aSAType[i].Key === oData.Input.SubactivityType) {
						var oAdditionalData = JSON.parse(aSAType[i].AdditionalData);
						if (oAdditionalData.glAccount) {
							oInput.GlAccount = oAdditionalData.glAccount.toString();
							oData.Display.GlAccount = oAdditionalData.glAccount;
							i = aSAType.length;
						}
					}
				}
			} else {
				oData.Display.GlAccount = "No G/L Account for Sub-Activity Type";
				oInput.GlAccount = "";
			}
			oModel.refresh(false);
		},
		// End of Changes - Khrystyne Williams - Nov 2016

		onMessagesButtonPress: function(oEvent) {
			var oMessagesButton = oEvent.getSource();
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "message>/",
						template: new MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});
				this._messagePopover.attachItemSelect(function(oEvent) {
					// Begin of Changes - Khrystyne Williams - Jan 2017
					// this._messagePopover.close();
					// End of Changes - Khrystyne Williams - Jan 2017
					this._onMessageSelected(oEvent);
				}, this);
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
		},
		onDtChange: function(oEvent) {
			if (this.getOwnerComponent().getModel("ASMConfig")) {
				var bDatesGood = true;
				this.oMessageManager.removeAllMessages();
				var oASMConfigData = this.getOwnerComponent().getModel("ASMConfig").getData();
				var sYear = oASMConfigData.Properties.PlanningYear;
				var oInput = this.getModel("AddActivity").getData().Input;
				var aOptions = this.getOwnerComponent().getModel("masterShared").getData().aAddOptions;
				var dStartDt = sYear + "0101";
				var dEndDt = sYear + "1228";
				var oStartDt = this.byId("StartDt");
				var oEndDt = this.byId("EndDt");
				// PSW Start change For Month Picker May 25th 2016 v2 -->					
				var oMonthSt = this.byId("MonthSt");
				var oMonthEd = this.byId("MonthEd");
				var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
					pattern: "MM/dd/yyyy"
				});
				if (oInput.Type !== "PT") {
					for (var i = 0; i < aOptions.length; i++) {
						if (aOptions[i].Key === oInput.Parent) {
							dStartDt = aOptions[i].StartDt.substring(0, 4) + aOptions[i].StartDt.substring(5, 7) + aOptions[i].StartDt.substring(8, 10);
							dEndDt = aOptions[i].EndDt.substring(0, 4) + aOptions[i].EndDt.substring(5, 7) + aOptions[i].EndDt.substring(8, 10);
							i = aOptions.length;
						}
					}
				}
				var sDt1 = this._getMonthText(parseInt(dStartDt.substring(4, 6)));
				var sDt2 = this._getMonthText(parseInt(dEndDt.substring(4, 6)));
				// PSW Start correction For Month Picker June 16th 2016-->	
				if (oMonthSt.getMonth() < 9) {
					var sMth1 = "0" + (oMonthSt.getMonth() + 1);
				} else {
					// Begin of Changes - Pin-See Wong - Dec 2016
					// var sMth2 = oMonthEd.getMonth() + 1;
					var sMth1 = oMonthSt.getMonth() + 1;
					// End of Changes - Pin-See Wong - Dec 2016
				}

				oInput.StartDt = sYear + sMth1 + "01";

				if (oMonthEd.getMonth() < 9) {
					var sMth2 = "0" + (oMonthEd.getMonth() + 1);
				} else {
					var sMth2 = oMonthEd.getMonth() + 1;
				}

				oInput.EndDt = sYear + sMth2 + "28";
				// PSW End correction For Month Picker June 16th 2016-->	

				if (oInput.StartDt < dStartDt || oInput.StartDt > dEndDt) {
					// Entry is wrong
					bDatesGood = false;
					oStartDt.setValueStateText(this.getResourceBundle().getText("AC_E_badStartDate", [sDt1, sDt2]));
					oStartDt.setValueState(sap.ui.core.ValueState.Error);
					this.oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getResourceBundle().getText("AC_E_badStartDate", [sDt1, sDt2]),
							// Begin of Commenting - Khrystyne Williams - Jan 2017
							// description: "StartDt",
							// End of Commenting - Khrystyne Williams - Jan 2017
							type: sap.ui.core.MessageType.Error,
							processor: this.oMessageProcessor
						})
					);
				} else {
					oStartDt.setValueStateText("");
					oStartDt.setValueState(sap.ui.core.ValueState.None);
				}
				if (oInput.EndDt < dStartDt || oInput.EndDt > dEndDt) {
					// Entry is wrong
					bDatesGood = false;
					oEndDt.setValueStateText(this.getResourceBundle().getText("AC_E_badEndDate", [sDt1, sDt2]));
					oEndDt.setValueState(sap.ui.core.ValueState.Error);
					this.oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getResourceBundle().getText("AC_E_badEndDate", [sDt1, sDt2]),
							// Begin of Commenting - Khrystyne Williams - Jan 2017
							//description: "EndDt",
							// End of Commenting - Khrystyne Williams - Jan 2017
							type: sap.ui.core.MessageType.Error,
							processor: this.oMessageProcessor
						})
					);
				} else {
					oEndDt.setValueStateText("");
					oEndDt.setValueState(sap.ui.core.ValueState.None);
				}
				if (oInput.EndDt < oInput.StartDt) {
					// Entry is wrong
					bDatesGood = false;
					oEndDt.setValueStateText(this.getResourceBundle().getText("AC_E_badDate", []));
					oEndDt.setValueState(sap.ui.core.ValueState.Error);
					this.oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: this.getResourceBundle().getText("AC_E_badDate", []),
							// Begin of Commenting - Khrystyne Williams - Jan 2017
							// description: "StartDt",
							// End of Commenting - Khrystyne Williams - Jan 2017
							type: sap.ui.core.MessageType.Error,
							processor: this.oMessageProcessor
						})
					);
				}
			}
			// PSW End change For Month Picker May 25th 2016 v2-->				
			return bDatesGood;
		},
		onParentChange: function(oEvent) {
			var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
			var oMasterSelect = this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect;
			var oInput = this.getModel("AddActivity").getData().Input;
			var oVisible = this.getModel("AddActivity").getData().Visible;
			var oEnabled = this.getModel("AddActivity").getData().Enabled;
			var oLabels = this.getModel("AddActivity").getData().Labels;
			var sKey = "";
			if (oEvent) {
				if (oEvent.NewParent) {
					sKey = oEvent.NewParent;
					oInput.Parent = oEvent.NewParent;
				} else if (oEvent.getParameter("selectedItem")) {
					sKey = oEvent.getParameter("selectedItem").getProperty("key");
				} else {
					sKey = "";
				}
			} else {
				if (oTableSelect.ParentGuid) {
					sKey = oTableSelect.ParentGuid;
					oInput.Parent = oTableSelect.ParentGuid;
				}
			}
			if (sKey !== "") {
				oVisible.MaxValueC = false;
				var aAddOptions = this.getOwnerComponent().getModel("masterShared").getData().aAddOptions;
				// Begin of Changes - Khrystyne Williams - Dec 2016
				// Retrieve the Display Data
				var oDisplay = this.getModel("AddActivity").getData().Display;
				// End of Changes - Khrystyne Williams - Dec 2016

				for (var i = 0; i < aAddOptions.length; i++) {
					if (sKey === aAddOptions[i].Key) {
						oInput.Type = aAddOptions[i].Type;
						// psutram: Feb 2017 modified next line to pass oEvent as a parameter
						// this._resetAddBasedOnType(oInput.Type);
						this._resetAddBasedOnType(oInput.Type, oEvent);
						if (aAddOptions[i].Type === "AT") {
							oInput.TypeDescription = this.getOwnerComponent().getModel("i18n").getProperty("AC_activity");
							oLabels.Parent = this.getOwnerComponent().getModel("i18n").getProperty("AC_proj");
						} else if (aAddOptions[i].Type === "SA") {
							oInput.TypeDescription = this.getOwnerComponent().getModel("i18n").getProperty("AC_subactivity");
							oLabels.Parent = this.getOwnerComponent().getModel("i18n").getProperty("AC_projAct");
							oInput.ActivityType = aAddOptions[i].ActivityType;
							this._getSubactivityTypes();
							// Begin of Changes - Khrystyne Williams - Dec 2016
							// Clear the previous GL Account display value
							oDisplay.GlAccount = "";
							// End of Changes - Khrystyne Williams - Dec 2016
						}
						oInput.StartDt = aAddOptions[i].StartDt.substring(0, 4) + aAddOptions[i].StartDt.substring(5, 7) + aAddOptions[i].StartDt.substring(
							8, 10);
						oInput.EndDt = aAddOptions[i].EndDt.substring(0, 4) + aAddOptions[i].EndDt.substring(5, 7) + aAddOptions[i].EndDt.substring(8,
							10);
						// Add in all the Parent Values to initialize the child
						if (aAddOptions[i].Channel && aAddOptions[i].Channel !== "") {
							oInput.Channel = aAddOptions[i].Channel;
							oVisible.Channel = true;
							oEnabled.Channel = false;
						} else if (oMasterSelect.hasOwnProperty("Channel") && oMasterSelect.Channel !== "") {
							oInput.Channel = oMasterSelect.Channel;
							oVisible.Channel = true;
							oEnabled.Channel = false;
						}
						if (aAddOptions[i].Function && aAddOptions[i].Function !== "") {
							oInput.Function = aAddOptions[i].Function;
							oVisible.Function = true;
							oEnabled.Function = false;
						} else if (oMasterSelect.hasOwnProperty("Function") && oMasterSelect.Function !== "") {
							oInput.Function = oMasterSelect.Function;
							oVisible.Function = true;
							oEnabled.Function = false;
						}
						if (aAddOptions[i].DivisionKey && aAddOptions[i].DivisionKey !== "") {
							oInput.DivisionKey = aAddOptions[i].DivisionKey;
							this._setGeoValues("DivisionKey");
							oVisible.Division = true;
							oEnabled.Division = false;
						} else if (oMasterSelect.hasOwnProperty("DivisionKey") && oMasterSelect.DivisionKey !== "") {
							oInput.DivisionKey = oMasterSelect.DivisionKey;
							this._setGeoValues("DivisionKey");
							oVisible.Division = true;
							oEnabled.Division = false;
						}
						if (aAddOptions[i].HubKey && aAddOptions[i].HubKey !== "") {
							oInput.HubKey = aAddOptions[i].HubKey;
							this._setGeoValues("HubKey");
							oVisible.Hub = true;
							oEnabled.Hub = false;
						} else if (oMasterSelect.hasOwnProperty("HubKey") && oMasterSelect.HubKey !== "") {
							oInput.HubKey = oMasterSelect.HubKey;
							this._setGeoValues("HubKey");
							oVisible.Hub = true;
							oEnabled.Hub = false;
						}
						if (aAddOptions[i].SubKey && aAddOptions[i].SubKey !== "") {
							oInput.SubKey = aAddOptions[i].SubKey;
							this._setGeoValues("SubKey");
							oVisible.Sub = true;
							oEnabled.Sub = false;
						} else if (oMasterSelect.hasOwnProperty("SubKey") && oMasterSelect.SubKey !== "") {
							oInput.SubKey = oMasterSelect.SubKey;
							this._setGeoValues("SubKey");
							oVisible.Sub = true;
							oEnabled.Sub = false;
						}
						if (aAddOptions[i].BrandKey && aAddOptions[i].BrandKey !== "") {
							oInput.BrandKey = aAddOptions[i].BrandKey;
							this._setPHValues("BrandKey");
							oVisible.Brand = true;
							oEnabled.Brand = false;
						}
						if (aAddOptions[i].CategoryKey && aAddOptions[i].CategoryKey !== "") {
							oInput.CategoryKey = aAddOptions[i].CategoryKey;
							this._setPHValues("CategoryKey");
							oVisible.Category = true;
							oEnabled.Category = false;
						}
						oInput.PcategoryKey = aAddOptions[i].PcategoryKey;
						if (aAddOptions[i].SubcategoryKey && aAddOptions[i].SubcategoryKey !== "") {
							oInput.SubcategoryKey = aAddOptions[i].SubcategoryKey;
							this._setPHValues("SubcategoryKey");
							oVisible.Subcategory = true;
							oEnabled.Subcategory = false;
						}
						if (aAddOptions[i].SubbrandKey && aAddOptions[i].SubbrandKey !== "") {
							oInput.SubbrandKey = aAddOptions[i].SubbrandKey;
							oVisible.Subbrand = true;
							oEnabled.Subbrand = false;
						}
						oInput.SkuKey = aAddOptions[i].SkuKey;
						oInput.ProjectGuid = aAddOptions[i].ProjectGuid;
						oInput.ActivityGuid = aAddOptions[i].ActivityGuid;
						if (aAddOptions[i].PriorityKey && aAddOptions[i].PriorityKey !== "") {
							oInput.PriorityKey = aAddOptions[i].PriorityKey;
							oVisible.Priority = true;
							// Begin of Changes - Khrystyne Williams - Feb 2017
							// oEnabled.Priority = true;
							oEnabled.Priority = false;
							// End of Changes - Khrystyne Williams - Feb 2017
						}
						if (aAddOptions[i].Retailer && aAddOptions[i].Retailer !== "" && aAddOptions[i].Retailer !== "0000") {
							oInput.Retailer = aAddOptions[i].Retailer;
							oVisible.Retailer = true;
							oEnabled.Retailer = true;
						}
						if (aAddOptions[i].Agency && aAddOptions[i].Agency !== "") {
							oInput.Agency = aAddOptions[i].Agency;
							oVisible.Agency = true;
							oEnabled.Agency = true;
						}
						if (aAddOptions[i].MaestroBrief && aAddOptions[i].MaestroBrief !== "") {
							oInput.MaestroBrief = aAddOptions[i].MaestroBrief;
							oVisible.MaestroBrief = true;
							oEnabled.MaestroBrief = true;
						}
						if (aAddOptions[i].Costcenter && aAddOptions[i].Costcenter !== "") {
							oInput.Costcenter = aAddOptions[i].Costcenter;
							oVisible.Costcenter = true;
							oEnabled.Costcenter = false;
						}
						if (aAddOptions[i].GlAccount && aAddOptions[i].GlAccount !== "") {
							oInput.GlAccount = aAddOptions[i].GlAccount;
							oVisible.GlAccount = true;
							oEnabled.GlAccount = false;
						}
						if (aAddOptions[i].Demographics && aAddOptions[i].Demographics !== "") {
							// Begin of Changes - Khrystyne Williams - Feb 2017
							// oInput.GlAccount = aAddOptions[i].Demographics;
							oInput.Demographics = aAddOptions[i].Demographics;
							// End of Changes - Khrystyne Williams - Feb 2017
							oVisible.Demographics = true;
							oEnabled.Demographics = false;
						}
						i = aAddOptions.length;
						DropdownUtils.getCategories(this, oInput.CategoryKey, oInput.BrandKey, this.getModel("AddActivity"), "/Category", null,
							"/Category/Current");
						if (oInput.CategoryKey && oInput.CategoryKey !== "") {
							DropdownUtils.getSubcategories(this, oInput.CategoryKey, oInput.SubcategoryKey, oInput.BrandKey, this.getModel("AddActivity"),
								"/Subcategory", null, "/Subcategory/Current");
						}
					}
				}
			} else {
				// This means we will be creating a project
				oInput.Type = "PT";
				oVisible.MaxValueC = true;
				oInput.TypeDescription = this.getOwnerComponent().getModel("i18n").getProperty("AC_project");
				// PSW Start Change for User data check May 16th 2016
				var oUserData = this.getOwnerComponent().getModel("UserData");
				// psutram: Feb 2017 modified next line to pass oEvent as a parameter
				// this._resetAddBasedOnType(oInput.Type);
				this._resetAddBasedOnType(oInput.Type, oEvent);

				// Add in all the Table Values to initialize the child
				if (oMasterSelect.hasOwnProperty("DivisionKey") && oMasterSelect.DivisionKey !== "") {
					oInput.DivisionKey = oMasterSelect.DivisionKey;
					this._setGeoValues("DivisionKey");
					oVisible.Division = true;
					if (oUserData.getData().DivisionKey !== "") {
						oEnabled.Division = false;
					} else {
						oEnabled.Division = true;
					}
				}
				if (oMasterSelect.hasOwnProperty("HubKey") && oMasterSelect.HubKey !== "") {
					oInput.HubKey = oMasterSelect.HubKey;
					this._setGeoValues("HubKey");
					oVisible.Hub = true;
					if (oUserData.getData().HubKey !== "") {
						oEnabled.Hub = false;
					} else {
						oEnabled.Hub = true;
					}
				}
				if (oMasterSelect.hasOwnProperty("SubKey") && oMasterSelect.SubKey !== "") {
					oInput.SubKey = oMasterSelect.SubKey;
					this._setGeoValues("SubKey");
					oVisible.Sub = true;
					if (oUserData.getData().SubKey !== "") {
						oEnabled.Sub = false;
					} else {
						oEnabled.Sub = true;
					}
				}
				if (oMasterSelect.hasOwnProperty("Function") && oMasterSelect.Function !== "") {
					oInput.Function = oMasterSelect.Function;
					oVisible.Function = true;
					if (oUserData.getData().Function !== "") {
						oEnabled.Function = false;
					} else {
						oEnabled.Function = true;
					}

				}
				if (oMasterSelect.hasOwnProperty("Channel") && oMasterSelect.Channel !== "") {
					oInput.Channel = oMasterSelect.Channel;
					this._setGeoValues("Channel");
					oVisible.Channel = true;
					if (oUserData.getData().Channel !== "") {
						oEnabled.Channel = false;
					} else {
						oEnabled.Channel = true;
					}
					// PSW End of Change for User Data Check May 16th 2016	
				}
				// PSW Start Add Initialise PH from Side Panel June 1st 2016					
				if (oMasterSelect.hasOwnProperty("Category") && oMasterSelect.Category !== "") {
					oInput.CategoryKey = oMasterSelect.Category;
					this._setPHValues("CategoryKey");
					oVisible.Category = true;
					if (oUserData.getData().Category !== "") {
						oEnabled.Category = false;
					} else {
						oEnabled.Category = true;
					}
				}
				if (oMasterSelect.hasOwnProperty("Subcategory") && oMasterSelect.Subcategory !== "") {
					oInput.SubcategoryKey = oMasterSelect.Subcategory;
					this._setPHValues("SubcategoryKey");
					oVisible.Subcategory = true;
					if (oUserData.getData().SubCategory !== "") { // GDH Fixed
						oEnabled.Subcategory = false;
					} else {
						oEnabled.Subcategory = true;
					}
				}
				if (oMasterSelect.hasOwnProperty("Brand") && oMasterSelect.Brand !== "") {
					oInput.BrandKey = oMasterSelect.Brand;
					this._setPHValues("BrandKey");
					oVisible.Brand = true;
					if (oUserData.getData().Brand !== "") {
						oEnabled.Brand = false;
					} else {
						oEnabled.Brand = true;
					}
				}
				oInput.Currency = this.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings/Currency");
				oInput.MaxValueC = parseFloat("0.0");
				oVisible.MaxValueC = true;
			}
			//GRH this.onDtChange(null);
			this.getModel().refresh(false);
			this.getModel("AddActivity").refresh(false);
		},
		onRetailerShow: function(oEvent) {
			RetailerUtils.onShow(oEvent, this.getModel("AddActivity"), this.getModel("i18n"), this.getView().byId("Retailer"));
		},
		onRetailerClear: function(oEvent) {
			RetailerUtils.onClear(oEvent, this.getView().byId("Retailer"));
		},
		onAgencyShow: function(oEvent) {
			VendorUtils.onShow(oEvent, this.getModel("AddActivity"), this.getModel("i18n"), this.getView().byId("Agency"));
		},
		onAgencyClear: function(oEvent) {
			VendorUtils.onClear(oEvent, this.getView().byId("Agency"));
		},
		_getSubactivityTypes: function() {
			// If the activity type is selected, then select the subactivity types.
			var oInput = this.getModel("AddActivity").getData().Input;
			if (oInput.ActivityType && oInput.ActivityType !== "" && oInput.Type === "SA") {
				// Pick up the subactivity types
				var sPath = "/VHSubactivityTypes";
				var filters = [];
				filters.push(new sap.ui.model.Filter({
					path: "Key",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: oInput.ActivityType
				}));
				var that = this;
				this.getModel().read(sPath, {
					async: true,
					filters: filters,
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(that);
						that._setSubactivityTypes(oData);
					},
					error: function(oError) {
						oError.ErrorOrigin = "Initial";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					}
				});
			}

		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */
		_onMessageSelected: function(oEvent) {
			var sField = oEvent.getParameter("item").getDescription();
			var oErrored = this.byId(sField);
			if (oErrored) {
				oErrored.focus();
			}
		},

		_onObjectMatched: function(oEvent) {
			// GDH
			if (this.getOwnerComponent().getModel("masterShared") && this.getOwnerComponent().getModel("masterShared").getData()) {
				if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction !== "NavToAddActivity") {
					this.getRouter().navTo("activities", {
						objectId: "Activities"
					}, true);
				} else {
					// Now Set the Date Fields based on the parent
					this._storedProject = "";
					this._storedActivity = "";
					this._storedProjectName = "";
					var oParent = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
					if (oParent.DivisionKey !== "NoParent") {
						// This means there is a parent and we need to set the child based on it.
						var iStartMonth = oParent.StartDt.substring(5, 7);
						var iEndMonth = oParent.EndDt.substring(5, 7);
						this._setMonthPicker(iStartMonth, iEndMonth);
						this._newAdd = false;
					} else {
						oParent.DivisionKey = "";
						this._newAdd = true;
					}
				}
			} else {
				this.getRouter().navTo("activities", {
					objectId: "Activities"
				}, true);
			}
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getOwnerComponent().getModel("masterShared");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/oDetailBusy/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/oDetailBusy/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/oDetailBusy/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.TileId,
				sObjectName = oObject.Title,
				oViewModel = this.getModel("addActivityView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getOwnerComponent().getModel("masterShared");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/oDetailBusy/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/oDetailBusy/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/oDetailBusy/delay", iOriginalViewBusyDelay);
		},
		_onButtonPressed: function(oEvent, oData) {
			if (oData) {
				alert("Project Button: " + oData.button);
			}
		},
		_formFragments: {},
		_getFormFragment: function(sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];

			if (oFormFragment) {
				return oFormFragment;
			}

			oFormFragment = sap.ui.xmlfragment(this.getView().getId(), "colgate.asm.planning.base.fragment." + sFragmentName, this);

			return this._formFragments[sFragmentName] = oFormFragment;
		},

		_showFormFragment: function(sFragmentName) {
			var oPage = this.getView().byId("page");

			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sFragmentName));
		},

		_setPHValues: function(sChanged) {
			var oACModel = this.getModel("AddActivity");
			var oACData = oACModel.getData();
			var oBrand = this.getView().byId("BrandKey");
			oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			if (sChanged === "CategoryKey") {
				// First clear the keys
				// PSW Start Correction Clear Dependent fields May 26th 2016 v3
				if (oACData.Input.SubcategoryKey) {
					oACData.Input.SubcategoryKey = "";
				}
				// if (oACData.Input.BrandKey) {
				// 	oACData.Input.BrandKey = "";
				// }
				if (oACData.Input.SubbrandKey) {
					oACData.Input.SubbrandKey = "";
				}
				// PSW End Correction Clear Dependent fields May 26th 2016 v3
				var model = this.getModel("Category");
				if (!model) {
					model = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
					model.setSizeLimit(50000);
					this.setModel(model, "Category");
				}
				DropdownUtils.getBrands(this, oBrand, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oBrand.getSelectedKey(),
					this.getModel("AddActivity"), "/Brand", null, "/Brand/Current");
				var sSelected = oACData.Input.CategoryKey;
				if (!sSelected || sSelected === "") {
					oACData.Enabled.Subcategory = false;
					//oACData.Enabled.Brand = false;
					oACData.Enabled.Subbrand = false;
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory");
					//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand");
					oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand");
				} else {
					// May need to change the Brand List
					// Check if you already have these values stored
					if (!oACData.Input.BrandKey) {
						oACData.Input.BrandKey = "";
					}
					DropdownUtils.getSubcategories(this, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oACData.Input.BrandKey, this.getModel(
						"AddActivity"), "/Subcategory", null, "/Subcategory/Current");
					// var combinedKey = oACData.Input.CategoryKey + ":" + oACData.Input.BrandKey;
					// if (oACData.Subcategory && oACData.Subcategory[combinedKey]) {
					// 	// You don't need to select - we already have the data
					// 	oACData.Subcategory.Current = oACData.Subcategory[combinedKey];
					// } else {
					// 	this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
					// 	var oSCModel = this.getModel("Subcategory");
					// 	if (!oSCModel) {
					// 		oSCModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
					// 		oSCModel.setSizeLimit(50000);
					// 		oSCModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
					// 		this.setModel(oSCModel, "Subcategory");
					// 	}
					// 	var filters = [];
					// 	// PSW Start Correction Defaulting of Subcategory Values from side panel June 1st 2016 							
					// 	filters.push(new sap.ui.model.Filter({
					// 		path: "Key",
					// 		operator: sap.ui.model.FilterOperator.EQ,
					// 		value1: oACData.Input.SubcategoryKey
					// 	}));
					// 	// PSW End Correction Defaulting of Subcategory Values from side panel June 1st 2016 
					// 	filters.push(new sap.ui.model.Filter({
					// 		path: "Category",
					// 		operator: sap.ui.model.FilterOperator.EQ,
					// 		value1: oACData.Input.CategoryKey
					// 	}));
					// 	if (!oACData.Enabled.Brand) {
					// 		filters.push(new sap.ui.model.Filter({
					// 			path: "Brand",
					// 			operator: sap.ui.model.FilterOperator.EQ,
					// 			value1: oACData.Input.BrandKey
					// 		}));
					// 	}
					// 	var sPath = "/VHSubcategories";
					// 	var that = this;
					// 	oSCModel.read(sPath, {
					// 		async: true,
					// 		filters: filters,
					// 		success: function(oData, oResponse) {
					// 			TimeoutUtils.onResetTimer(that);
					// 			that._setSubcategories(oData);
					// 		},
					// 		error: function(oError) {
					// 			oError.ErrorOrigin = "Brands";
					// 			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					// 		}
					// 	});
					// }
					oACData.Enabled.Subcategory = true;
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e");
					//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_se");
					oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_sbe");
				}
				//oACData.Enabled.Brand = false;
				oACData.Enabled.Subbrand = false;
				this._resetMaestroBrief();
				// } else if (sChanged === "SubcategoryKey") {
				// 	// First clear the keys
				// 	// PSW Start Correction Clear Dependent fields May 26th 2016 v3					
				// 	// if (oACData.Input.BrandKey) {
				// 	// 	oACData.Input.BrandKey = "";
				// 	// }
				// 	if (oACData.Input.SubbrandKey) {
				// 		oACData.Input.SubbrandKey = "";
				// 	}
				// 	// PSW End Correction Clear Dependent fields May 26th 2016 v3
				// 	var model = this.getModel("Subcategory");
				// 	if (!model) {
				// 		model = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				// 		model.setSizeLimit(50000);
				// 		this.setModel(model, "Subcategory");
				// 	}
				// 	DropdownUtils.getBrands(this, oBrand, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oBrand.getSelectedKey(),
				// 		this.getOwnerComponent().getModel("AddActivity"), "/Brand", null, "/Brand/Current");
				// 	var sSelected = oACData.Input.SubcategoryKey;
				// 	if (!sSelected || sSelected === "") {
				// 		oACData.Enabled.Subcategory = true;
				// 		//oACData.Enabled.Brand = false;
				// 		oACData.Enabled.Subbrand = false;
				// 		oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory");
				// 		//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand");
				// 		oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand");
				// 	} else {
				// 		// May need to change the Brand List
				// 		// Check if you already have these values stored
				// 		// var combinedKey = oACData.Input.CategoryKey + ":" + oACData.Input.SubcategoryKey;
				// 		// if (oACData.Brand && oACData.Brand[combinedKey]) {
				// 		// 	// You don't need to select - we already have the data
				// 		// 	oACData.Brand.Current = oACData.Brand[combinedKey];
				// 		// } else {
				// 		// 	this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				// 		// 	var bmodel = this.getModel("Brand");
				// 		// 	if (!bmodel) {
				// 		// 		bmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				// 		// 		bmodel.setSizeLimit(50000);
				// 		// 		bmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				// 		// 		this.setModel(bmodel, "Brand");
				// 		// 	}
				// 		// 	var filters = [];
				// 		// 	filters.push(new sap.ui.model.Filter({
				// 		// 		path: "Key",
				// 		// 		operator: sap.ui.model.FilterOperator.EQ,
				// 		// 		value1: oACData.Input.BrandKey
				// 		// 	}));
				// 		// 	filters.push(new sap.ui.model.Filter({
				// 		// 		path: "Category",
				// 		// 		operator: sap.ui.model.FilterOperator.EQ,
				// 		// 		value1: oACData.Input.CategoryKey
				// 		// 	}));
				// 		// 	filters.push(new sap.ui.model.Filter({
				// 		// 		path: "PSubCategory",
				// 		// 		operator: sap.ui.model.FilterOperator.EQ,
				// 		// 		value1: oACData.Input.SubcategoryKey
				// 		// 	}));
				// 		// 	var sPath = "/VHBrands";
				// 		// 	var that = this;
				// 		// 	bmodel.read(sPath, {
				// 		// 		async: true,
				// 		// 		filters: filters,
				// 		// 		success: function(oData, oResponse) {
				// 		// 			TimeoutUtils.onResetTimer(that);
				// 		// 			that._setBrands(oData);
				// 		// 		},
				// 		// 		error: function(oError) {
				// 		// 			oError.ErrorOrigin = "Brands";
				// 		// 			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				// 		// 		}
				// 		// 	});
				// 		//}
				// 		oACData.Enabled.Brand = true;
				// 		//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e");
				// 		oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_be");
				// 	}
				// 	oACData.Enabled.Subbrand = false;
				// 	this._resetMaestroBrief();
			} else if (sChanged === "BrandKey" || sChanged === "SubcategoryKey") {
				// First clear out old values
				if (sChanged === "SubcategoryKey") {
					var oBrand = this.getView().byId("BrandKey");
					DropdownUtils.getBrands(this, oBrand, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oACData.Input.BrandKey,
						oACModel, "/Brand", null, "/Brand/Current");
				}
				if (oACData.Input.SubbrandKey) {
					oACData.Input.SubbrandKey = "";
				}
				if (oACData.Input.Subcategory && oACData.Input.Subcategory !== "") {
					oACData.Enabled.Subbrand = true;
				} else {
					oACData.Enabled.Subbrand = false;
				}
				if (oACData.Input.SubcategoryKey !== "") {
					oACData.Enabled.Subcategory = true;
					var sbmodel = this.getModel("Subbrand");
					if (!sbmodel) {
						sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
						sbmodel.setSizeLimit(50000);
						sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
						this.setModel(sbmodel, "Subbrand");
					}
					var filters = [];
					filters.push(new sap.ui.model.Filter({
						path: "Key",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oACData.Input.SubbrandKey
					}));
					filters.push(new sap.ui.model.Filter({
						path: "Category",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oACData.Input.CategoryKey
					}));
					filters.push(new sap.ui.model.Filter({
						path: "PSubCategory",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oACData.Input.SubcategoryKey
					}));
					filters.push(new sap.ui.model.Filter({
						path: "Brand",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oACData.Input.BrandKey
					}));
					var sPath = "/VHSubbrands";
					this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
					var that = this;
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(that);
							that._setSubbrands(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Subbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
						}
					});
					oACData.Enabled.Subbrand = true;
					oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e");
					this._getMaestroBrief();
				}
				DropdownUtils.getCategories(this, oACData.Input.CategoryKey, oACData.Input.BrandKey, this.getModel("AddActivity"), "/Category",
					null,
					"/Category/Current");
				if (oACData.Input.CategoryKey && oACData.Input.CategoryKey !== "") {
					DropdownUtils.getSubcategories(this, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oACData.Input.BrandKey, this.getModel(
						"AddActivity"), "/Subcategory", null, "/Subcategory/Current");
				}
			} else if (sChanged === "SubbrandKey") {
				var oSubbrand = this.getView().byId("SubbrandKey");
				var sKey = oSubbrand.getSelectedKey();

				if (sKey !== "") {
					var aSubbrands = oACData.Subbrand.Current;
					for (var i = 0; i < aSubbrands.length; i++) {
						if (aSubbrands[i].Key === sKey) {
							if (oACData.Input.BrandKey !== aSubbrands[i].Brand) {
								oACData.Input.BrandKey = aSubbrands[i].Brand;
							}
						}
					}
				}
			}
			oACModel.refresh(false);
		},
		_setGeoValues: function(sChanged) {
			var oACModel = this.getModel("AddActivity");
			var oACData = oACModel.getData();
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			if (sChanged === "DivisionKey") {
				// First clear the keys
				if (oACData.Input.HubKey) {
					oACData.Input.HubKey = "";
				}
				if (oACData.Input.SubKey) {
					oACData.Input.SubKey = "";
				}
				var model = this.getModel("Division");
				if (!model) {
					model = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
					model.setSizeLimit(50000);
					this.setModel(model, "Division");
				}
				var sSelected = oACData.Input.DivisionKey;
				if (!sSelected || sSelected === "") {
					oACData.Enabled.Hub = false;
					oACData.Enabled.Sub = false;
					oACData.Placeholders.Hub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub");
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub");
				} else {
					// May need to change the Brand List
					// Check if you already have these values stored
					var combinedKey = oACData.Input.DivisionKey;
					if (oACData.Hub && oACData.Hub[combinedKey]) {
						// You don't need to select - we already have the data
						oACData.Hub.Current = oACData.Hub[combinedKey];
					} else {
						var bmodel = this.getModel("Hub");
						if (!bmodel) {
							bmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
							bmodel.setSizeLimit(50000);
							bmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							this.setModel(bmodel, "Hub");
						}
						var filters = [];
						var sHubKey = oACData.Input.HubKey;
						if (!sHubKey) {
							sHubKey = "";
						}
						var sDivisionKey = oACData.Input.DivisionKey;
						if (!sDivisionKey) {
							sDivisionKey = "";
						}
						filters.push(new sap.ui.model.Filter({
							path: "GeoKey",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sHubKey
						}));
						filters.push(new sap.ui.model.Filter({
							path: "DivisionKey",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sDivisionKey
						}));
						var sPath = "/VHHubs";
						this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
						var that = this;
						bmodel.read(sPath, {
							async: true,
							filters: filters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(that);
								that._setHubs(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Hubs";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							}
						});
					}
					oACData.Enabled.Hub = true;
					oACData.Placeholders.Hub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub_e");
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub_he");
				}
				oACData.Enabled.Sub = false;
				this._resetRetailers();
				this._resetDemographics();
				//this._resetCostcenters();
				//this._getAgencies();
			} else if (sChanged === "HubKey") {
				// First clear out old values
				if (oACData.Input.SubKey) {
					oACData.Input.SubKey = "";
				}
				if (oACData.Input.Sub) {
					oACData.Input.Sub = "";
				}
				var sbmodel = this.getModel("Sub");
				if (!sbmodel) {
					sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
					sbmodel.setSizeLimit(50000);
					sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
					this.setModel(sbmodel, "Sub");
				}
				var filters = [];
				var sSubKey = oACData.Input.SubKey;
				if (!sSubKey) {
					sSubKey = "";
				}
				var sHubKey = oACData.Input.HubKey;
				if (!sHubKey) {
					sHubKey = "";
				}
				var sDivisionKey = oACData.Input.DivisionKey;
				if (!sDivisionKey) {
					sDivisionKey = "";
				}
				if (sHubKey !== "") {
					filters.push(new sap.ui.model.Filter({
						path: "GeoKey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sSubKey
					}));
					filters.push(new sap.ui.model.Filter({
						path: "HubKey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sHubKey
					}));
					filters.push(new sap.ui.model.Filter({
						path: "DivisionKey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sDivisionKey
					}));
					var sPath = "/VHSubs";
					this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
					var that = this;
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(that);
							that._setSubs(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Subs";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
						}
					});
					oACData.Enabled.Sub = true;
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub_e");
					this._resetRetailers();
					//this._resetCostcenters();
					this._resetDemographics();
				} else {
					oACData.Enabled.Sub = false;
					oACData.Placeholders.Hub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub_e");
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub_he");
				}
			} else if (sChanged === "SubKey") {
				// Get the Retailer
				this._getDemographics();
				this._getRetailers();
				this._getAgencies();
				//this._getCostcenters();
			}
		},
		// _setSubcategories: function(oDataIn) {
		// 	var oModel = this.getModel("AddActivity");
		// 	var oData = oModel.getData();
		// 	if (!oData.Subcategory) {
		// 		oData.Subcategory = {};
		// 	}
		// 	oData.Subcategory.Current = oDataIn.results;
		// 	var combinedKey = oData.Input.CategoryKey + ":" + oData.Input.BrandKey;
		// 	oData.Subcategory[combinedKey] = oDataIn.results;
		// 	oModel.refresh(false);
		// 	this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		// },
		// _setBrands: function(oDataIn) {
		// 	var oModel = this.getModel("AddActivity");
		// 	var oData = oModel.getData();
		// 	if (!oData.Brand) {
		// 		oData.Brand = {};
		// 	}
		// 	oData.Brand.Current = oDataIn.results;
		// 	var combinedKey = oData.Input.CategoryKey + ":" + oData.Input.SubcategoryKey;
		// 	oData.Brand[combinedKey] = oDataIn.results;
		// 	oModel.refresh(false);
		// 	this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		// },
		_setSubbrands: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Subbrand) {
				oData.Subbrand = {};
			}
			oData.Subbrand.Current = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setHubs: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Hub) {
				oData.Hub = {};
			}
			oData.Hub.Current = oDataIn.results;
			var combinedKey = oData.Input.DivisionKey;
			oData.Hub[combinedKey] = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setSubs: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Sub) {
				oData.Sub = {};
			}
			oData.Sub.Current = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setProjectTypes: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.ProjectType) {
				oData.ProjectType = {};
			}
			oData.ProjectType.Current = oDataIn.results;
		},
		_setActivityTypes: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.ActivityType) {
				oData.ActivityType = {};
			}
			oData.ActivityType.Current = oDataIn.results;
		},
		_setSubactivityTypes: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.SubactivityType) {
				oData.SubactivityType = {};
			}
			oData.SubactivityType.Current = oDataIn.results;
			var combinedKey = oData.Input.ActivityType;
			oData.SubactivityType[combinedKey] = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setPriorities: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Priority) {
				oData.Priority = {};
			}
			oData.Priority.Current = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setASMConfig: function() {
			// Set the plan year
			var oASMConfig = this.getOwnerComponent().getModel("ASMConfig");
			if (oASMConfig) {
				var oModel = this.getModel("AddActivity");
				var oASMConfigData = oASMConfig.getData();
				var oCurrentData = oModel.getData();
				var sYear = oASMConfigData.Properties.PlanningYear;
				oCurrentData.Input.PlanningYear = sYear;
				oCurrentData.Input.StartDt = sYear + "0101";
				oCurrentData.Input.EndDt = sYear + "1228";
				oModel.refresh(false);
			}
		},
		_validateInput: function() {
			// Check Mandatory Input Fields
			this.oMessageManager.removeAllMessages();
			var bDataGood = this.onDtChange(null);
			if (!bDataGood) {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_DateIssues");
				MessageToast.show(sMessage);
			} else {
				var oData = this.getModel("AddActivity").getData();
				if (oData.Input.Type === "PT") {
					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (!this._checkNotEmpty("Name", oData)) {
					if (!oData.Input.hasOwnProperty("Name") || oData.Input.Name === "") {
						//Set the name to be the project type
						var aPType = oData.ProjectType.Current;
						for (var i = 0; i < aPType.length; i++) {
							if (aPType[i].Key === oData.Input.ProjectType) {
								oData.Input.Name = aPType[i].Description.toString();
								i = aPType.length;
							}
						}
						// bDataGood = false;
					}
					// End of Changes - Khrystyne Williams - Nov 2016

					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (!this._checkNotEmpty("ProjectType", oData)) {
					if (!this._checkTypesNotEmpty("ProjectType", oData)) {

						bDataGood = false;
					}
					// End of Changes - Khrystyne Williams - Nov 2016

					// Begin of Commenting - Khrystyne Williams - August 26, 2016
					// Remove check for Category as it is not required
					// if (!this._checkNotEmpty("CategoryKey", oData)) {
					// 	bDataGood = false;
					// }
					// End of Commenting - Khrystyne Williams - August 26, 2016

					//Begin of Changes - Alex
					// if (!this._checkNotEmpty("PriorityKey", oData)) {
					// 	bDataGood = false;
					// }
					// if (!this._checkNotEmpty("Function", oData)) {
					// 	bDataGood = false;
					// }
					//End of Changes - Alex

					if (!this._checkNotEmpty("DivisionKey", oData)) {
						bDataGood = false;
					}
					// Max Value C is no longer mandatory.
					// if (!this._checkNotEmpty("MaxValueC", oData)) {
					// 	bDataGood = false;
					// }
				} else if (oData.Input.Type === "AT") {
					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (!this._checkNotEmpty("Name", oData)) {
					if (!oData.Input.hasOwnProperty("Name") || oData.Input.Name === "") {
						//Set the name to be the project type
						var aAType = oData.ActivityType.Current;
						for (var i = 0; i < aAType.length; i++) {
							if (aAType[i].Key === oData.Input.ActivityType) {
								oData.Input.Name = aAType[i].Description.toString();
								i = aAType.length;
							}
						}
						// bDataGood = false;
					}
					// End of Changes - Khrystyne Williams - Nov 2016

					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (!this._checkNotEmpty("ActivityType", oData)) {
					if (!this._checkTypesNotEmpty("ActivityType", oData)) {
						bDataGood = false;
					}
					// End of Changes - Khrystyne Williams - Nov 2016
				} else if (oData.Input.Type === "SA") {
					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (!this._checkNotEmpty("Name", oData)) {
					if (!oData.Input.hasOwnProperty("Name") || oData.Input.Name === "") {
						//Set the name to be the project type
						var aSAType = oData.SubactivityType.Current;
						for (var i = 0; i < aSAType.length; i++) {
							if (aSAType[i].Key === oData.Input.SubactivityType) {
								oData.Input.Name = aSAType[i].Description.toString();
								i = aSAType.length;
							}
						}
						// bDataGood = false;
					}
					// End of Changes - Khrystyne Williams - Nov 2016

					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (!this._checkNotEmpty("SubactivityType", oData)) {
					if (!this._checkTypesNotEmpty("SubactivityType", oData)) {
						bDataGood = false;
					}
					if (!this._checkNotEmpty("DivisionKey", oData)) {
						bDataGood = false;
					}
					//Validation for Hub and Sub in SA / Eric Atempa / 1-27-2017
					if (!this._checkNotEmpty("HubKey", oData)) {
						bDataGood = false;
					}
					if (!this._checkNotEmpty("SubKey", oData)) {
						bDataGood = false;
					}
					// if (!this._checkNotEmpty("CategoryKey", oData)) {
					// 	bDataGood = false;
					// }
					// if (!this._checkNotEmpty("SubcategoryKey", oData)) {
					// 	bDataGood = false;
					// }
					// if (!this._checkNotEmpty("BrandKey", oData)) {
					// 	bDataGood = false;
					// }
					// if (!this._checkNotEmpty("SubbrandKey", oData)) {
					// 	bDataGood = false;
					// }
				}
				if (!bDataGood) {
					// Begin of Changes - Khrystyne Williams - Nov 2016
					// var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_BudgetErrors");
					var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_EmptyErrors");
					// End of Changes - Khrystyne Williams - Nov 2016
					MessageToast.show(sMessage);
				}
			}
			return bDataGood;
		},
		_clearErrors: function() {
			this._clearValueState("DivisionKey");
			this._clearValueState("HubKey");
			this._clearValueState("SubKey");
			this.oMessageManager.removeAllMessages();
		},
		_clearValueState: function(sId) {
			var oControl = this.byId(sId);
			oControl.setValueState(sap.ui.core.ValueState.None);
			oControl.setValueStateText("");
		},
		_checkNotEmpty: function(sId, oData) {
			var oControl = this.byId(sId);
			oControl.setValueState(sap.ui.core.ValueState.None);
			oControl.setValueStateText("");
			if (!oData.Input.hasOwnProperty(sId) || oData.Input[sId] === "" || (sId === "MaxValueC" && parseFloat(oData.Input[sId]) ===
					parseFloat("0.0"))) {
				oControl.setValueState(sap.ui.core.ValueState.Error);
				var sProperty = "AC_E_" + sId;
				oControl.setValueStateText(this.getOwnerComponent().getModel("i18n").getProperty(sProperty));
				this.oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: this.getOwnerComponent().getModel("i18n").getProperty(sProperty),
						// description: sId, //Khrystyne commented Feb 2017
						type: sap.ui.core.MessageType.Error,
						processor: this.oMessageProcessor
					})
				);
				return false;
			}
			return true;
		},
		// Begin of Changes - Khrystyne Williams - Nov 2016
		_checkTypesNotEmpty: function(sId, oData) {
			if (!oData.Input.hasOwnProperty(sId) || oData.Input[sId] === "") {
				var sProperty = "AC_E_" + sId;
				this.oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: this.getOwnerComponent().getModel("i18n").getProperty(sProperty),
						// description: sId, // Khrystyne commented Feb 2017
						type: sap.ui.core.MessageType.Error,
						processor: this.oMessageProcessor
					})
				);
				return false;
			}
			return true;
		},
		// End of Changes - Khrystyne Williams - Nov 2016
		_createItem: function() {
			var oData = this.getModel("AddActivity").getData();
			var aKeys = Object.keys(oData.Input);
			var oItem = {};
			for (var i = 0; i < aKeys.length; i++) {
				oItem[aKeys[i]] = oData.Input[aKeys[i]];
			}
			oItem.StartDt = oData.Input.StartDt.substring(0, 4) + "-" + oData.Input.StartDt.substring(4, 6) + "-" + oData.Input.StartDt.substring(
				6, 8) + "T00:00:00";
			oItem.EndDt = oData.Input.EndDt.substring(0, 4) + "-" + oData.Input.EndDt.substring(4, 6) + "-" + oData.Input.EndDt.substring(6, 8) +
				"T00:00:00";
			var oDate = new Date();
			var iMonth = parseInt(oDate.getMonth()) + 1;
			if (oItem.MaxValueC && parseFloat(oItem.MaxValueC) > parseFloat("0.0")) {
				oItem.MaxValueC = parseFloat(oItem.MaxValueC).toString();
			} else {
				oItem.MaxValueC = parseFloat("0.0").toString();
			}
			var aOptions = this.getOwnerComponent().getModel("masterShared").getData().aAddOptions;
			if (oItem.Type === "PT") {
				this._newAdd = true;
				oItem.ActivityType = oItem.ProjectType;
				delete oItem.SubactivityType;
				delete oItem.ProjectType;
			} else if (oItem.Type === "SA") {
				this._newAdd = false;
				oItem.ActivityType = oItem.SubactivityType;
				delete oItem.SubactivityType;
				delete oItem.ProjectType;
				for (var i = 0; i < aOptions.length; i++) {
					if (aOptions[i].Key === oItem.Parent) {
						if (aOptions[i].ProjectGuid) {
							oItem.ProjectGuid = aOptions[i].ProjectGuid;
						}
						if (aOptions[i].ActivityGuid) {
							oItem.ActivityGuid = aOptions[i].ActivityGuid;
						}
						if (aOptions[i].CategoryBucket) {
							oItem.CategoryBucket = aOptions[i].CategoryBucket;
						}
					}
				}
				//bhavik
				if (oItem.SubbrandKey) {
					for (var j = 0; j < oData.Subbrand.Current.length; j++) {
						if (oData.Subbrand.Current[j].Key === oItem.SubbrandKey) {
							var desc = oData.Subbrand.Current[j].Description;
							break;
						}
					}
					var newdata = {},
						FData = {};

					newdata.SubbrandKey = oItem.SubbrandKey;
					newdata.SubbrandDesc = desc;
					newdata.LeadSubbrand = "X";
					newdata.UpdatedFlag = "I";
					oData.CSBSubbrand.Change.push(newdata);

					//CSBTest
					FData.K = oItem.SubbrandKey;
					FData.L = "X";
					FData.U = "I";
					oData.CSBSubbrand.NewChange.push(FData);
					//CSBTest
				}
				// if (oData.CSBSubbrand.Change.length) {
				// 	oItem.CsbConfig = JSON.stringify(oData.CSBSubbrand.Change); //bhavik
				// }
				if (oData.CSBSubbrand.NewChange.length) {
					oItem.CsbConfig = JSON.stringify(oData.CSBSubbrand.NewChange); //bhavik
				}
				//bhavik
			} else if (oItem.Type === "AT") {
				this._newAdd = true;
				delete oItem.SubactivityType;
				delete oItem.ProjectType;
				for (var i = 0; i < aOptions.length; i++) {
					if (aOptions[i].Key === oItem.Parent) {
						if (aOptions[i].ProjectGuid) {
							oItem.ProjectGuid = aOptions[i].ProjectGuid;
						}
						if (aOptions[i].ActivityGuid) {
							oItem.ActivityGuid = oItem.Guid;
						}
						if (aOptions[i].CategoryBucket) {
							oItem.CategoryBucket = aOptions[i].CategoryBucket;
						}
					}
				}
			}
			oItem.ItemType = oItem.Type;
			delete oItem.Type;
			delete oItem.TypeDescription;
			delete oItem.Parent;
			var sProjectName = "";
			for (var i = 0; i < aOptions.length; i++) {
				if (aOptions[i].Key === oItem.ProjectGuid) {
					sProjectName = aOptions[i].Description;
					this._storedProjectName = sProjectName;
					i = aOptions.length;
				}
			}

			var oModel = this.getModel("Category");
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			var that = this;
			oModel.create("/Items", oItem, {
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					// Add a Success toast and navigate back to the Project view and refresh the data.
					if (!oData.Name || oData.Name === "") {
						oData.ErrorOrigin = "CreateProject";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oData);
					} else {
						var sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_created", [oData.Name]);
						if (oData.ItemType === "PT") {
							that._storedProject = oData.ProjectGuid;
							that._storedProjectName = oData.Name;
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_pCreated", [oData.Name]);
						} else if (oData.ItemType === "AT") {
							if (!that._storedProject || that._storedProject === "") {
								that._storedProject = oData.ProjectGuid;
							}
							that._storedActivity = oData.ActivityGuid;
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_aCreated", [oData.Name]);
						} else if (oData.ItemType === "SA") {
							if (!that._storedProject || that._storedProject === "") {
								that._storedProject = oData.ProjectGuid;
							}
							if (!that._storedActivity || that._storedActivity === "") {
								that._storedActivity = oData.ActivityGuid;
							}
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_saCreated", [oData.Name]);
						}
						MessageToast.show(sMessage);
						if (that._currentAction === "save") {
							//							that.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Refresh", {});
							that.getRouter().navTo("activities", {
								objectId: "Activities"
							}, true);
							that._currentAction = "";
						} else {
							// Add another
							var oInternal = that.getModel("AddActivity").getData().Internal;
							var oEvent = {};
							if (oInternal.CurrentSaveMode === "AddActivity") {
								oEvent.NewParent = that._storedProject;
								oData.ProjectGuid = that._storedProject;
							} else if (oInternal.CurrentSaveMode === "AddSubactivity") {
								oEvent.NewParent = that._storedActivity;
								oData.ProjectGuid = that._storedProject;
								oData.ActivityGuid = that._storedActivity;
							}
							that._addOption(oData, that._storedProjectName);
							that.onParentChange(oEvent);
						}
					}
				},
				error: function(oError) {
					oError.ErrorOrigin = "CreateProject";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
		},
		_addOption: function(oDataIn, sProjectName) {
			var aOptions = this.getOwnerComponent().getModel("masterShared").getData().aAddOptions;
			var oOption = {};
			var oRecord = JSON.parse(JSON.stringify(oDataIn));
			delete oRecord.__metadata;
			oOption.Key = oRecord.Guid;
			oOption.DivisionKey = oRecord.DivisionKey;
			oOption.HubKey = oRecord.HubKey;
			oOption.SubKey = oRecord.SubKey;
			oOption.CategoryBucket = oRecord.CategoryBucket;
			oOption.CategoryKey = oRecord.CategoryKey;
			oOption.PcategoryKey = oRecord.PcategoryKey;
			oOption.SubcategoryKey = oRecord.SubcategoryKey;
			oOption.BrandKey = oRecord.BrandKey;
			oOption.SubbrandKey = oRecord.SubbrandKey;
			oOption.SkuKey = oRecord.SkuKey;
			oOption.PriorityKey = oRecord.PriorityKey;
			oOption.Channel = oRecord.Channel;
			oOption.Retailer = oRecord.Retailer;
			oOption.Agency = oRecord.Agency;
			oOption.Function = oRecord.Function;
			oOption.MaestroBrief = oRecord.MaestroBrief;
			oOption.ActivityType = oRecord.ActivityType;
			oOption.Costcenter = oRecord.Costcenter;
			oOption.GlAccount = oRecord.GlAccount;
			oOption.StartDt = oRecord.StartDt;
			oOption.EndDt = oRecord.EndDt;
			oOption.Demographics = oRecord.Demographics;
			if (oRecord.ItemType === "PT") {
				oOption.Key = oRecord.Guid;
				oOption.Type = "AT";
				oOption.ProjectGuid = oRecord.Guid;
				oOption.Description = oRecord.Name;
				aOptions.push(oOption);
			} else if (oRecord.ItemType === "AT") {
				oOption.Key = oRecord.Guid;
				oOption.Type = "SA";
				oOption.ProjectGuid = oRecord.ProjectGuid;
				oOption.ActivityGuid = oRecord.Guid;
				oOption.Description = sProjectName + " : " + oRecord.Name;
				aOptions.push(oOption);
			} else if (oRecord.ItemType === "SA") {
				// There is nothing to do here
			}
			this.getOwnerComponent().getModel("masterShared").setProperty("aAddOptions", aOptions);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
			this.getOwnerComponent().getModel("masterShared").refresh(false);
		},
		_getExternalId: function() {
			var oModel = this.getModel("Category");
			var filters = [];
			filters.push(new sap.ui.model.Filter({
				path: "Nrrangenr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: '01'
			}));
			var sPath = "/Ids";
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			var that = this;
			oModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					that.getModel("AddActivity").setProperty("/Input/Id", oData.results[0].Number);
					that._createItem();
				},
				error: function(oError) {
					oError.ErrorOrigin = "ExternalId";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
		},
		_handleODataErrors: function(oDataIn) {
			var sOrigin = oDataIn.ErrorOrigin;
			alert("Error Occurred");
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_handleInitialize: function(oDataIn) {
			// This is called on subsequent loads of this view.
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			oData.Enabled.Division = true;
			oData.Enabled.Hub = true;
			oData.Enabled.Sub = true;
			oData.Enabled.ProjectType = true;
			oData.Enabled.ActivityType = true;
			oData.Enabled.SubactivityType = true;
			oData.Enabled.StartDt = true;
			oData.Enabled.EndDt = true;
			oData.Enabled.Category = true;
			oData.Enabled.Subcategory = false;
			oData.Enabled.Brand = true;
			oData.Enabled.Subbrand = false;
			oData.Enabled.Channel = true;
			oData.Enabled.Function = true;
			oData.Enabled.Agency = false;
			oData.Enabled.Retailer = false;
			oData.Enabled.Demographics = true;
			oData.Enabled.Costcenter = true;
			oData.Enabled.MaestroBrief = false;
			oData.Input = {};
			oData.Display.GlAccount = "";

			this._setASMConfig();
			this._initializeGeo();
			this._initializeCSB(oModel); //INBHD02

			var oACModel = this.getModel("AddActivity");
			var oACData = oACModel.getData();
			oACData.Placeholders.MaestroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_maestroBrief");
			oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency");
			oACData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer");
			oACData.Enabled.MaestroBrief = false;
			oACData.Enabled.Agency = false;
			oACData.Enabled.Retailer = false;
			oACData.Visible.MaxValueC = true;
			sap.ui.core.BusyIndicator.hide();
			this.onParentChange(null);
		},
		// PSW Start change For Month Picker May 26th 2016 -->		
		_setMonthPicker: function(iStartMonth, iEndMonth) {
			var oMth1 = this.byId("MonthSt");
			var oMth2 = this.byId("MonthEd");
			oMth1.setMonth(iStartMonth - 1);
			oMth2.setMonth(iEndMonth - 1);
		},
		// PSW End change For Month Picker May 26th 2016 -->
		_initializeGeo: function() {
			var oMasterSelect = this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect;
			var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
			var oACData = this.getModel("AddActivity").getData();
			if (oMasterSelect.hasOwnProperty("DivisionKey") && oMasterSelect.DivisionKey !== "") {
				oACData.Input.DivisionKey = oMasterSelect.DivisionKey;
				this._setGeoValues("DivisionKey");
				oACData.Enabled.Division = false;
			} else if (oTableSelect.hasOwnProperty("DivisionKey") && oTableSelect.DivisionKey !== "") {
				oACData.Input.DivisionKey = oTableSelect.DivisionKey;
				this._setGeoValues("DivisionKey");
				oACData.Enabled.Division = false;
			}
			if (oMasterSelect.hasOwnProperty("HubKey") && oMasterSelect.HubKey !== "") {
				oACData.Input.HubKey = oMasterSelect.HubKey;
				this._setGeoValues("HubKey");
				oACData.Enabled.Hub = false;
			} else if (oTableSelect.hasOwnProperty("HubKey") && oTableSelect.HubKey !== "") {
				oACData.Input.HubKey = oTableSelect.HubKey;
				this._setGeoValues("HubKey");
				oACData.Enabled.Hub = false;
			}
			if (oMasterSelect.hasOwnProperty("SubKey") && oMasterSelect.SubKey !== "") {
				oACData.Input.SubKey = oMasterSelect.SubKey;
				this._setGeoValues("SubKey");
				oACData.Enabled.Sub = false;
			} else if (oTableSelect.hasOwnProperty("SubKey") && oTableSelect.SubKey !== "") {
				oACData.Input.SubKey = oTableSelect.SubKey;
				this._setGeoValues("SubKey");
				oACData.Enabled.Sub = false;
			} else {
				//this._getCostcenters();
				this._getDemographics();
			}
			if (oMasterSelect.hasOwnProperty("Function") && oMasterSelect.Function !== "") {
				oACData.Input.Function = oMasterSelect.Function;
				oACData.Enabled.Function = false;
			} else if (oTableSelect.hasOwnProperty("Function") && oTableSelect.Function !== "") {
				oACData.Input.Function = oTableSelect.Function;
				oACData.Enabled.Function = false;
			}
			if (oMasterSelect.hasOwnProperty("Channel") && oMasterSelect.Channel !== "") {
				oACData.Input.Channel = oMasterSelect.Channel;
				oACData.Enabled.Channel = false;
			} else if (oTableSelect.hasOwnProperty("Channel") && oTableSelect.Channel !== "") {
				oACData.Input.Channel = oTableSelect.Channel;
				oACData.Enabled.Channel = false;
			}
			// PSW Start Add Initialize PH from Side Panel June 1st 2016 -->
			if (oMasterSelect.hasOwnProperty("Brand") && oMasterSelect.Brand !== "") {
				oACData.Input.BrandKey = oMasterSelect.Brand;
				this._setPHValues("BrandKey");
				oACData.Enabled.Brand = false;
			} else if (oTableSelect.hasOwnProperty("Brand") && oTableSelect.Brand !== "") {
				oACData.Input.BrandKey = oTableSelect.Brand;
				this._setPHValues("BrandKey");
				oACData.Enabled.Brand = false;
			}
			if (oMasterSelect.hasOwnProperty("Category") && oMasterSelect.Category !== "") {
				oACData.Input.CategoryKey = oMasterSelect.Category;
				this._setPHValues("CategoryKey");
				oACData.Enabled.Category = false;
			} else if (oTableSelect.hasOwnProperty("Category") && oTableSelect.Category !== "") {
				oACData.Input.CategoryKey = oTableSelect.Category;
				this._setPHValues("CategoryKey");
				oACData.Enabled.Category = false;
			}
			if (oMasterSelect.hasOwnProperty("Subcategory") && oMasterSelect.Subcategory !== "") {
				oACData.Input.SubcategoryKey = oMasterSelect.Subcategory;
				this._setPHValues("SubcategoryKey");
				oACData.Enabled.Subcategory = false;
			} else if (oTableSelect.hasOwnProperty("Subcategory") && oTableSelect.Subcategory !== "") {
				oACData.Input.SubcategoryKey = oTableSelect.Subcategory;
				this._setPHValues("SubcategoryKey");
				oACData.Enabled.Subcategory = false;
			} else {
				this._setPHValues("SubcategoryKey");
			}
			DropdownUtils.getCategories(this, oACData.Input.CategoryKey, oACData.Input.BrandKey, this.getModel("AddActivity"), "/Category",
				null,
				"/Category/Current");
			if (oACData.Input.CategoryKey && oACData.Input.CategoryKey !== "") {
				DropdownUtils.getSubcategories(this, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oACData.Input.BrandKey, this.getModel(
					"AddActivity"), "/Subcategory", null, "/Subcategory/Current");
			}

			// PSW End Add Initialize PH from Side Panel June 1st 2016 -->	
		},

		// psutram: feb 2017 changes to visibility of Cancel button, added a new parameter oEvent
		// _resetAddBasedOnType: function(sType) {
		_resetAddBasedOnType: function(sType, oEvent) {

			var oInput = this.getModel("AddActivity").getData().Input;
			var oVisible = this.getModel("AddActivity").getData().Visible;
			var oEnabled = this.getModel("AddActivity").getData().Enabled;
			var oLabels = this.getModel("AddActivity").getData().Labels;
			var oInternal = this.getModel("AddActivity").getData().Internal;
			this._setRequiredFlags(sType);
			if (sType === "PT") {
				// Project
				oInput.ProjectType = "";
				oVisible.ProjectType = true;
				oEnabled.ProjectType = true;

				oInput.ActivityType = "";
				oVisible.ActivityType = false;
				oEnabled.ActivityType = true;

				oInput.SubactivityType = "";
				oVisible.SubactivityType = false;
				oEnabled.SubactivityType = true;

				oInput.DivisionKey = "";
				oVisible.Division = true;
				oEnabled.Division = true;

				oInput.HubKey = "";
				oVisible.Hub = true;
				oEnabled.Hub = false;

				oInput.SubKey = "";
				oVisible.Sub = true;
				oEnabled.Sub = false;

				oInput.CategoryKey = "";
				oVisible.Category = true;
				oEnabled.Category = true;

				oInput.PcategoryKey = "";

				oInput.SubcategoryKey = "";
				oVisible.Subcategory = true;
				oEnabled.Subcategory = false;

				oInput.BrandKey = "";
				oVisible.Brand = true;
				oEnabled.Brand = true;

				oInput.SubbrandKey = "";
				oVisible.Subbrand = true;
				oEnabled.Subbrand = false;

				oInput.SkuKey = "";
				oInput.ProjectGuid = "";
				oInput.ActivityGuid = "";

				oInput.PriorityKey = "";
				oVisible.Priority = true;
				oEnabled.Priority = true;

				oInput.Channel = "";
				oVisible.Channel = true;
				oEnabled.Channel = true;

				oInput.Demographics = "";
				oVisible.Demographics = true;
				oEnabled.Demographics = true;

				oInput.Retailer = "";
				oVisible.Retailer = false;
				oEnabled.Retailer = false;

				oInput.Agency = "";
				oVisible.Agency = false;
				oEnabled.Agency = true;

				oInput.Function = "";
				oVisible.Function = true;
				oEnabled.Function = true;

				oInput.MaestroBrief = "";
				oVisible.MaestroBrief = false;
				oEnabled.MaestroBrief = true;

				oInput.Costcenter = "";
				oVisible.Costcenter = false;
				oEnabled.Costcenter = false;

				oInput.GlAccount = "";
				oVisible.GlAccount = false;
				oEnabled.GlAccount = true;

				oInput.PO = "";
				oVisible.PO = false;
				oEnabled.PO = true;

				oInput.Parent = "";
				oVisible.Parent = false;
				oVisible.Save2 = true;
				oVisible.Save3 = false;
				// Begin of Changes - Khrystyne Williams - Feb 2017
				oVisible.Cancel = true;
				// End of Changes - Khrystyne Williams - Feb 2017
				oLabels.Save2 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_saveCA");
				oLabels.Save3 = "";
				oInternal.Save2Mode = "AddActivity";

				// Begin of Addition - Khrystyne Williams - July 14, 2016
				oVisible.Title1 = true;
				oVisible.Title2 = false;
				oVisible.Title3 = false;
				oLabels.Title1 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_Title1");
				oLabels.Title2 = "";
				oLabels.Title3 = "";
				// End of Addition - Khrystyne Williams - July 14, 2016

				oInput.LongText = "";
				oInput.Name = "";
			} else if (sType === "AT") {
				// Activity
				oInput.ProjectType = "";
				oVisible.ProjectType = false;
				oEnabled.ProjectType = true;

				oInput.ActivityType = "";
				oVisible.ActivityType = true;
				oEnabled.ActivityType = true;

				oInput.SubactivityType = "";
				oVisible.SubactivityType = false;
				oEnabled.SubactivityType = true;

				oInput.DivisionKey = "";
				oVisible.Division = true;
				oEnabled.Division = true;

				oInput.HubKey = "";
				oVisible.Hub = true;
				oEnabled.Hub = false;

				oInput.SubKey = "";
				oVisible.Sub = true;
				oEnabled.Sub = false;

				oInput.CategoryKey = "";
				oVisible.Category = true;
				oEnabled.Category = true;

				oInput.PcategoryKey = "";

				oInput.SubcategoryKey = "";
				oVisible.Subcategory = true;
				oEnabled.Subcategory = false;

				oInput.BrandKey = "";
				oVisible.Brand = true;
				oEnabled.Brand = true;

				oInput.SubbrandKey = "";
				oVisible.Subbrand = true;
				oEnabled.Subbrand = false;

				oInput.SkuKey = "";
				oInput.ProjectGuid = "";
				oInput.ActivityGuid = "";

				oInput.PriorityKey = "";
				oVisible.Priority = true;
				oEnabled.Priority = true;

				oInput.Channel = "";
				oVisible.Channel = true;
				oEnabled.Channel = true;

				oInput.Demographics = "";
				oVisible.Demographics = true;
				oEnabled.Demographics = true;

				oInput.Retailer = "";
				oVisible.Retailer = true;
				oEnabled.Retailer = false;

				oInput.Agency = "";
				// Begin of Changes - Khrystyne Williams - Nov 2016
				oVisible.Agency = false;
				// End of Changes - Khrystyne Williams - Nov 2016
				oEnabled.Agency = false;

				oInput.Function = "";
				oVisible.Function = true;
				oEnabled.Function = true;

				oInput.MaestroBrief = "";
				oVisible.MaestroBrief = true;
				oEnabled.MaestroBrief = false;

				oInput.Costcenter = "";
				oVisible.Costcenter = false;
				oEnabled.Costcenter = false;

				oInput.GlAccount = "";
				oVisible.GlAccount = false;
				oEnabled.GlAccount = false;

				oInput.PO = "";
				oVisible.PO = false;
				oEnabled.PO = false;

				oVisible.Parent = true;
				oEnabled.Parent = false;
				oVisible.Save2 = true;
				oVisible.Save3 = true;
				oLabels.Save2 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_saveCS");
				oLabels.Save3 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_saveCA");
				oInternal.Save2Mode = "AddSubactivity";
				oInternal.Save3Mode = "AddActivity";

				// Begin of Addition - Khrystyne Williams - July 14, 2016
				// Eric Atempa / 2-1-17 / Changes for Cancel
				if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction === "NewATWithPT") {
					// oVisible.Title1 = true;
					oVisible.Cancel = true;
				} else {
					// oVisible.Title1 = false;
					// psutram: feb 2017 changes to visibility of Cancel button
					// oVisible.Cancel = false;
					if ((oEvent) && (oEvent.NewParent) && this._newAdd) {
						oVisible.Cancel = false;
					} else {
						oVisible.Cancel = true;
					}

				}

				oVisible.Title1 = false; // Khrystyne Williams - Feb 2017 - Added back
				oVisible.Title2 = true;
				oVisible.Title3 = false;
				oLabels.Title1 = "";
				oLabels.Title2 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_Title2");
				oLabels.Title3 = "";
				// End of Addition - Khrystyne Williams - July 14, 2016

				oInput.LongText = "";
				oInput.Name = "";

			} else if (sType === "SA") {
				// SubActivity
				oInput.ProjectType = "";
				oVisible.ProjectType = false;
				oEnabled.ProjectType = true;

				oInput.ActivityType = "";
				oVisible.ActivityType = true;
				oEnabled.ActivityType = false;

				oInput.SubactivityType = "";
				oVisible.SubactivityType = true;
				oEnabled.SubactivityType = true;

				oInput.DivisionKey = "";
				oVisible.Division = true;
				oEnabled.Division = true;

				oInput.HubKey = "";
				oVisible.Hub = true;
				oEnabled.Hub = false;

				oInput.SubKey = "";
				oVisible.Sub = true;
				oEnabled.Sub = false;

				oInput.CategoryKey = "";
				oVisible.Category = true;
				oEnabled.Category = true;

				oInput.PcategoryKey = "";

				oInput.SubcategoryKey = "";
				oVisible.Subcategory = true;
				oEnabled.Subcategory = false;

				oInput.BrandKey = "";
				oVisible.Brand = true;
				oEnabled.Brand = true;

				oInput.SubbrandKey = "";
				oVisible.Subbrand = true;
				oEnabled.Subbrand = false;

				oInput.SkuKey = "";
				oInput.ProjectGuid = "";
				oInput.ActivityGuid = "";

				oInput.PriorityKey = "";
				oVisible.Priority = true;
				oEnabled.Priority = true;

				oInput.Channel = "";
				oVisible.Channel = true;
				oEnabled.Channel = true;

				oInput.Demographics = "";
				oVisible.Demographics = true;
				oEnabled.Demographics = true;

				oInput.Retailer = "";
				oVisible.Retailer = true;
				oEnabled.Retailer = false;

				oInput.Agency = "";
				oVisible.Agency = true;
				oEnabled.Agency = false;

				oInput.Function = "";
				oVisible.Function = true;
				oEnabled.Function = true;

				oInput.MaestroBrief = "";
				oVisible.MaestroBrief = true;
				oEnabled.MaestroBrief = false;

				oInput.Costcenter = "";
				oVisible.Costcenter = true;
				oEnabled.Costcenter = true;

				oInput.GlAccount = "";
				oVisible.GlAccount = true;
				oEnabled.GlAccount = true;

				oInput.PO = "";
				oVisible.PO = true;
				oEnabled.PO = true;

				oVisible.Parent = true;
				oEnabled.Parent = false;
				oVisible.Save2 = true;
				oVisible.Save3 = true;
				oLabels.Save2 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_saveCS");
				oLabels.Save3 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_saveCA");
				oInternal.Save2Mode = "AddSubactivity";
				oInternal.Save3Mode = "AddActivity";

				// Begin of Addition - Khrystyne Williams - July 14, 2016

				// Eric Atempa / 2-1-17 / Changes for Cancel
				if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction === "NewSAWithAT") {
					// oVisible.Title1 = true;
					oVisible.Cancel = true;
				} else {
					// oVisible.Title1 = false;
					// psutram: feb 2017 changes to visibility of Cancel button
					// oVisible.Cancel = false;
					if ((oEvent) && (oEvent.NewParent) && this._newAdd) {
						oVisible.Cancel = false;
					} else {
						oVisible.Cancel = true;
					}
				}

				oVisible.Title1 = false;
				oVisible.Title2 = false;
				oVisible.Title3 = true;
				oLabels.Title1 = "";
				oLabels.Title2 = "";
				oLabels.Title3 = this.getOwnerComponent().getModel("i18n").getProperty("AC_B_Title3");
				// End of Addition - Khrystyne Williams - July 14, 2016

				oInput.LongText = "";
				oInput.Name = "";

				//INBHD02
				oVisible.CrossSubBrand = true;
				oVisible.CrossSubBrandList = true;
				//INBHD02
			}
			this.getModel("AddActivity").refresh(false);
		},
		_resetDemographics: function() {
			var oACData = this.getModel("AddActivity").getData();
			oACData.Enabled.Demographics = true;
			oACData.Input.Demographics = "";
			oACData.Demographics.Current = {};
			oACData.Placeholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_e");
		},
		_getDemographics: function() {
			// Get the Retailers
			var oRModel = this.getModel("Demographics");
			var oACModel = this.getModel("AddActivity");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oACData = oACModel.getData();
			// Clear the current retailer (if any)
			oACData.Input.Demographics = "";
			if (!oRModel) {
				oRModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oRModel.setSizeLimit(50000);
				oRModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(oRModel, "Demographics");
			}
			var filters = [];
			if (oACData.Input.SubKey && oACData.Input.SubKey !== "") {
				var sAdditionalData = "{ SUB:'" + oACData.Input.SubKey + "'}";
				filters.push(new sap.ui.model.Filter({
					path: "AdditionalData",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sAdditionalData
				}));
			}
			var sPath = "/VHDemographics";
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			var that = this;
			oRModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					that._setDemographics(oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Demographics";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
		},
		_setDemographics: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Demographics) {
				oData.Demographics = {};
			}
			oData.Demographics.Current = oDataIn.results;
			if (oData.Demographics.Current.length === 0) {
				oData.Enabled.Demographics = false;
				oData.Placeholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_n");
			} else {
				oData.Enabled.Demographics = true;
				oData.Placeholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_e");
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetCostcenters: function() {
			var oACData = this.getModel("AddActivity").getData();
			oACData.Enabled.Costcenter = true;
			oACData.Input.Costcenter = "";
			oACData.Costcenter.Current = {};
			oACData.Placeholders.Costcenter = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_costcenter_e");
		},
		_getCostcenters: function() {
			// Get the Retailers
			var oRModel = this.getModel("Costcenter");
			var oACModel = this.getModel("AddActivity");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oACData = oACModel.getData();
			// Clear the current retailer (if any)
			oACData.Input.Costcenter = "";
			if (!oRModel) {
				oRModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oRModel.setSizeLimit(50000);
				oRModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(oRModel, "Costcenter");
			}
			var filters = [];
			if (oACData.Input.SubKey && oACData.Input.SubKey !== "") {
				var sAdditionalData = "{ SUB:'" + oACData.Input.SubKey + "'}";
				filters.push(new sap.ui.model.Filter({
					path: "AdditionalData",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sAdditionalData
				}));
			}
			var sPath = "/VHCostcenter";
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			var that = this;
			oRModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					that._setCostcenters(oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Costcenter";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				}
			});
		},
		_setCostcenters: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Costcenter) {
				oData.Costcenter = {};
			}
			oData.Costcenter.Current = [];
			for (var i = 0; i < oDataIn.results.length; i++) {
				var oRecord = {};
				oRecord.Key = oDataIn.results[i].Key;
				oRecord.Description = oDataIn.results[i].Key + " - " + oDataIn.results[i].Description;
				oRecord.Selected = oDataIn.results[i].Selected;
				oRecord.AdditionalData = oDataIn.results[i].AdditionalData;
				oData.Costcenter.Current.push(oRecord);
			}
			if (oData.Costcenter.Current.length === 0) {
				oData.Enabled.Costcenter = false;
				oData.Placeholders.Costcenter = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_costcenter_n");
			} else {
				oData.Enabled.Costcenter = true;
				oData.Placeholders.Costcenter = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_costcenter_e");
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetRetailers: function() {
			var oACData = this.getModel("AddActivity").getData();
			oACData.Enabled.Retailer = false;
			oACData.Input.Retailer = "";
			oACData.Retailer.Current = {};
			oACData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer");
		},
		_getRetailers: function() {
			// Get the Retailers
			var oRModel = this.getModel("Retailer");
			var oACModel = this.getModel("AddActivity");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oACData = oACModel.getData();
			// Clear the current retailer (if any)
			oACData.Input.Retailer = "";
			if (!oRModel) {
				oRModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oRModel.setSizeLimit(50000);
				oRModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(oRModel, "Retailer");
			}
			if (oACData.Input.SubKey && oACData.Input.SubKey !== "") {
				var filters = [];
				var sAdditionalData = "{ SUB:'" + oACData.Input.SubKey + "'}";
				filters.push(new sap.ui.model.Filter({
					path: "AdditionalData",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sAdditionalData
				}));
				var sPath = "/VHRetailers";
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				var that = this;
				oRModel.read(sPath, {
					async: true,
					filters: filters,
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(that);
						that._setRetailers(oData);
					},
					error: function(oError) {
						oError.ErrorOrigin = "Retailer";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					}
				});
			}
		},
		_setRetailers: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Retailer) {
				oData.Retailer = {};
			}
			oData.Retailer.Current = oDataIn.results;
			if (oData.Retailer.Current.length === 0) {
				oData.Enabled.Retailer = false;
				oData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer_n");
			} else {
				oData.Enabled.Retailer = true;
				oData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer_e");
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetAgencies: function() {
			var oACData = this.getModel("AddActivity").getData();
			oACData.Enabled.Agency = false;
			oACData.Input.Agency = "";
			oACData.Agency.Current = {};
			oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency");
		},
		_getAgencies: function() {
			// Get the Retailers
			var oRModel = this.getModel("Agency");
			var oACModel = this.getModel("AddActivity");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oACData = oACModel.getData();
			oACData.Input.Agency = "";
			if (!oRModel) {
				oRModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oRModel.setSizeLimit(50000);
				oRModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(oRModel, "Agency");
			}
			if (oACData.Input.SubKey && oACData.Input.SubKey !== "") {
				var filters = [];
				var sAdditionalData = "{ SUB:'" + oACData.Input.SubKey + "'}";
				filters.push(new sap.ui.model.Filter({
					path: "AdditionalData",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sAdditionalData
				}));
				var sPath = "/VHAgencies";
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				var that = this;
				oRModel.read(sPath, {
					async: true,
					filters: filters,
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(that);
						that._setAgencies(oData);
					},
					error: function(oError) {
						oError.ErrorOrigin = "Agency";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					}
				});
			}
		},
		_setAgencies: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.Agency) {
				oData.Agency = {};
			}
			oData.Agency.Current = oDataIn.results;
			if (oData.Agency.Current.length === 0) {
				oData.Enabled.Agency = false;
				oData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency_n");
			} else {
				oData.Enabled.Agency = true;
				oData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency_e");
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetMaestroBrief: function() {
			var oACData = this.getModel("AddActivity").getData();
			oACData.Enabled.MaestroBrief = false;
			oACData.Input.MaestroBrief = "";
			oACData.MaestroBrief.Current = {};
			oACData.Placeholders.MasteroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_maestroBrief");
		},
		_getMaestroBrief: function() {
			// Get the Retailers
			var oRModel = this.getModel("MaestroBrief");
			var oACModel = this.getModel("AddActivity");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oACData = oACModel.getData();
			if (!oRModel) {
				oRModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oRModel.setSizeLimit(50000);
				oRModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(oRModel, "MaestroBrief");
			}
			if (oACData.Input.DivisionKey && oACData.Input.DivisionKey !== "" && oACData.Input.CategoryKey && oACData.Input.CategoryKey !== "") {
				var filters = [];
				filters.push(new sap.ui.model.Filter({
					path: "DivisionKey",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: oACData.Input.DivisionKey
				}));
				filters.push(new sap.ui.model.Filter({
					path: "CategoryKey",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: oACData.Input.CategoryKey
				}));
				if (oACData.Input.SubecategoryKey && oACData.Input.SubcategoryKey !== "") {
					filters.push(new sap.ui.model.Filter({
						path: "SubcategoryKey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oACData.Input.SubcategoryKey
					}));
				}
				if (oACData.Input.BrandKey && oACData.Input.BrandKey !== "") {
					filters.push(new sap.ui.model.Filter({
						path: "BrandKey",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oACData.Input.BrandKey
					}));
				}
				var sPath = "/VHBriefs";
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				var that = this;
				oRModel.read(sPath, {
					async: true,
					filters: filters,
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(that);
						that._setMaestroBrief(oData);
					},
					error: function(oError) {
						oError.ErrorOrigin = "MaestroBrief";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					}
				});
			}
		},
		_setMaestroBrief: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.MaestroBrief) {
				oData.MaestroBrief = {};
			}
			oData.MaestroBrief.Current = oDataIn.results;
			if (oData.MaestroBrief.Current.length === 0) {
				oData.Enabled.MaestroBrief = false;
				oData.Placeholders.MaestroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_maestroBrief_n");
			} else {
				oData.Enabled.MaestroBrief = true;
				oData.Placeholders.MaestroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_maestroBrief_e");
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setRequiredFlags: function(sItemType) {

			if (sItemType === "PT") {
				// Begin of Changes - Alex 
				// this.byId("FEPriorityKey")._oLabel.setRequired(true);
				// this.byId("FEFunction")._oLabel.setRequired(true);
				// End of Changes - Alex
				this.byId("FEHub")._oLabel.setRequired(false);
				this.byId("FESub")._oLabel.setRequired(false);
				//The Project Hub is no longer required
				//this.byId("FEMaxValueC")._oLabel.setRequired(true);
			} else if (sItemType === "AT") {
				this.byId("FEHub")._oLabel.setRequired(false);
				this.byId("FESub")._oLabel.setRequired(false);
			} else if (sItemType === "SA") {
				// Added for required fields / USERA04 / 1-27-17
				this.byId("FEHub")._oLabel.setRequired(true);
				this.byId("FESub")._oLabel.setRequired(true);
				//end of USERA04 
			}
			// Flags the same for all  (This accessor should really be changed - it's using an internal interface now)
			this.byId("FEParent")._oLabel.setRequired(true);
			// Begin of Changes - Khrystyne Williams - Nov 2016
			// this.byId("FEName")._oLabel.setRequired(true);
			// End of Changes - Khrystyne Williams - Nov 2016
			this.byId("FEProjectType")._oLabel.setRequired(true);
			this.byId("FEActivityType")._oLabel.setRequired(true);
			this.byId("FESubactivityType")._oLabel.setRequired(true);
			this.byId("FEDivision")._oLabel.setRequired(true);
			// Begin of Commenting - Khrystyne Williams - August 26, 2016
			// Make category a non-mandatory field 
			// this.byId("FECategory")._oLabel.setRequired(true);
			// End of Commenting - Khrystyne Williams - August 26, 2016
		},
		_getMonthText: function(iMonth) {
			var sDt1 = iMonth;
			switch (sDt1) {
				case 1:
					sDt1 = this.getResourceBundle().getText("AC_M_Jan");
					break;
				case 2:
					sDt1 = this.getResourceBundle().getText("AC_M_Feb");
					break;
				case 3:
					sDt1 = this.getResourceBundle().getText("AC_M_Mar");
					break;
				case 4:
					sDt1 = this.getResourceBundle().getText("AC_M_Apr");
					break;
				case 5:
					sDt1 = this.getResourceBundle().getText("AC_M_May");
					break;
				case 6:
					sDt1 = this.getResourceBundle().getText("AC_M_Jun");
					break;
				case 7:
					sDt1 = this.getResourceBundle().getText("AC_M_Jul");
					break;
				case 8:
					sDt1 = this.getResourceBundle().getText("AC_M_Aug");
					break;
				case 9:
					sDt1 = this.getResourceBundle().getText("AC_M_Sep");
					break;
				case 10:
					sDt1 = this.getResourceBundle().getText("AC_M_Oct");
					break;
				case 11:
					sDt1 = this.getResourceBundle().getText("AC_M_Nov");
					break;
				case 12:
					sDt1 = this.getResourceBundle().getText("AC_M_Dec");
					break;
				default:
					sDt1 = "Error";
					break;
			}
			return sDt1;
		},
		onCheckValues: function(oEvent) {
			FieldCheckUtils.onCheckField(this, this.getModel("AddActivity"), "/Input/Name");
		},
		onBudgetChange: function(oEvent) {
			var oField = oEvent.getSource();
			var sCurrentValue = oEvent.getParameters().value;
			sCurrentValue = sCurrentValue.replace(/,/g, "");
			sCurrentValue = sCurrentValue.replace(/\./g, "");
			var bNumber = /^-*[0-9,\.]+$/.test(sCurrentValue);
			if (sCurrentValue !== "" && (!bNumber || parseFloat(sCurrentValue) < 0.0)) {
				oField.setValue("0");
				oField.setValueState(sap.ui.core.ValueState.Warning);
				oField.setValueStateText(this.getOwnerComponent().getModel("i18n").getResourceBundle()
					.getText(
						"A_E_notValid", [sCurrentValue]));
			} else {
				oField.setValueState(sap.ui.core.ValueState.None);
				oField.setValueStateText("");
			}
			this.getModel("AddActivity").refresh(false);
		},

		// // INBHD02
		// //New Utills Changes  bhavik

		// onSelectCrossBrand: function(oEvent) {
		// 	CrossSubBrandUtils.onSelectCrossBrand("AddActivity", this, oEvent);
		// },

		// _onCSBFilterchange: function(oEvent) {
		// 	CrossSubBrandUtils._onCSBFilterchange("AddActivity", this, oEvent);
		// },

		// onSearchCSB: function(oEvent) {
		// 	CrossSubBrandUtils.onSearchCSB("AddActivity", this, oEvent);
		// },

		// _clearAllCSBSelection: function(oEvent) {
		// 	CrossSubBrandUtils._clearAllCSBSelection("AddActivity", this, oEvent);
		// },

		// _addCSBbrands: function(oEvent) {
		// 	CrossSubBrandUtils._addCSBbrands("AddActivity", this, oEvent);
		// },

		// _deleteCSBBrands: function(oEvent) {
		// 	CrossSubBrandUtils._deleteCSBBrands("AddActivity", this, oEvent);
		// },

		// onCSBok: function(oEvent) {
		// 	CrossSubBrandUtils.onCSBok("AddActivity", this, oEvent);
		// },

		// onCSBcancel: function(oEvent) {
		// 	CrossSubBrandUtils.onCSBcancel("AddActivity", this, oEvent);
		// }

		// //New Utills Changes bhavik

		onSelectCrossBrand: function(oEvent) {

			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner

			var oModel = this.getModel("AddActivity");
			var oInput = oModel.getData();

			if (!this.oPersonalizationDialog) {
				this.oPersonalizationDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.CrossSubBrand_add", this);
				this.getView().addDependent(this.oPersonalizationDialog);
				this._getdefaultCSBfilter();
			}

			this.oPersonalizationDialog.open();

			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},

		onCSBok: function(oEvent) {
			oEvent.getSource().close();
			if (this.oPersonalizationDialog) {
				this.oPersonalizationDialog.destroy();
				this.oPersonalizationDialog = null;
			}
		},

		onCSBcancel: function(oEvent) {
			var that = this;
			var event = oEvent.getSource();

			var dialog = new Dialog({
				title: 'Confirm',
				type: 'Message',
				state: 'Warning',
				content: new Text({
					text: this.getModel("i18n").getResourceBundle().getText("CSBConfirmcancel")
				}),
				beginButton: new Button({
					text: 'Yes',
					press: function() {
						dialog.close();
						that._discardallCSBChange();
						event.close();
						if (that.oPersonalizationDialog) {
							that.oPersonalizationDialog.destroy();
							that.oPersonalizationDialog = null;
						}
					}
				}),
				endButton: new Button({
					text: 'Cancel',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		onSearchCSB: function(oEvent) {
			var sQuery = oEvent.getParameter("query");

			this._oGlobalFilter = null;
			if (sQuery) {
				this._oGlobalFilter = new Filter([
					new Filter("SubbrandDesc", FilterOperator.Contains, sQuery)
				], false);
			}

			var binding = oEvent.oSource.getParent();
			binding.getParent().getBinding("rows").filter(this._oGlobalFilter, "Application");
		},

		_getCSBSubbrand: function(CSBCategoryKey, CSBSubcategoryKey, CSBBrandKey) {

			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");

			var sbmodel = this.oPersonalizationDialog.getModel("CSBBrands");
			if (!sbmodel) {
				sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				sbmodel.setSizeLimit(50000);
				sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.oPersonalizationDialog.setModel(sbmodel, "CSBBrands");
			}

			var filters = [];

			filters.push(new sap.ui.model.Filter("CategoryKey", sap.ui.model.FilterOperator.EQ, CSBCategoryKey));

			filters.push(new sap.ui.model.Filter("PcategoryKey", sap.ui.model.FilterOperator.EQ, CSBSubcategoryKey));

			filters.push(new sap.ui.model.Filter("BrandKey", sap.ui.model.FilterOperator.EQ, CSBBrandKey));

			var sPath = "/VHCrossSubBrand";
			var that2 = this;

			var oSBPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(this);
							that2._setCSBSubbrand(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Subbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
		},

		_setCSBSubbrand: function(oDataIn) {

			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.CSBSubbrand) {
				oData.CSBSubbrand = {};
			}
			oData.CSBSubbrand.Current = [];
			oData.CSBSubbrand.Current = oDataIn.results;
			oModel.refresh(false);
			this._setinitialCSBSubbrandvalues();
		},

		_onCSBFilterchange: function(oEvent) {
			var oModel = this.getModel("AddActivity");
			var oInput = oModel.getData();

			var id = oEvent.getParameter("id");

			if (id === "CSBCategoryKey") {

				oInput.CSBSubbrand.CSBSubcategoryKey = "";
				oInput.CSBSubcategory.Current = [];

				oInput.CSBSubbrand.CSBBrandKey = "";
				oInput.CSBBrand.Current = [];

				oModel.refresh(false);

				this._getCSBSubcategory();
				this._getCSBBrand();

			} else {

				if (id === "CSBSubcategoryKey") {

					oInput.CSBSubbrand.CSBBrandKey = "";
					oInput.CSBBrand.Current = [];

					oModel.refresh(false);

					this._getCSBBrand();
				}
			}

			this._getCSBSubbrand(oInput.CSBSubbrand.CSBCategoryKey, oInput.CSBSubbrand.CSBSubcategoryKey, oInput.CSBSubbrand.CSBBrandKey);
		},

		_getCSBSubcategory: function() {
			var oModel = this.getModel("AddActivity");
			var oInput = oModel.getData();
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var that = this;

			var sbmodel = this.oPersonalizationDialog.getModel("CSBvhph");
			if (!sbmodel) {
				sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				sbmodel.setSizeLimit(50000);
				sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.oPersonalizationDialog.setModel(sbmodel, "CSBvhph");
			}

			var filters = [];
			filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBCategoryKey));

			var sPath = "/VHSubcategories";

			var oSBPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData) {
							TimeoutUtils.onResetTimer(this);
							that._setCSBSubcategory(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Subbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
		},

		_setCSBSubcategory: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();

			if (!oData.CSBSubcategory) {
				oData.CSBSubcategory = {};
			}
			oData.CSBSubcategory.Current = [];
			oData.CSBSubcategory.Current = oDataIn.results;
			oModel.refresh(false);
		},

		_getCSBBrand: function() {
			var oModel = this.getModel("AddActivity");
			var oInput = oModel.getData();
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var that = this;

			var sbmodel = this.oPersonalizationDialog.getModel("CSBvhph");
			if (!sbmodel) {
				sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				sbmodel.setSizeLimit(50000);
				sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.oPersonalizationDialog.setModel(sbmodel, "CSBvhph");
			}

			var filters = [];

			filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBCategoryKey));
			filters.push(new sap.ui.model.Filter("PSubCategory", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBSubcategoryKey));

			var sPath = "/VHBrands";

			var oSBPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData) {
							TimeoutUtils.onResetTimer(this);
							that._setCSBBrand(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Subbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
		},

		_setCSBBrand: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();

			if (!oData.CSBBrand) {
				oData.CSBBrand = {};
			}
			oData.CSBBrand.Current = [];
			oData.CSBBrand.Current = oDataIn.results;
			oModel.refresh(false);
		},

		_getExistingCSBSubbrand: function(AsmID) {
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");

			var sbmodel = this.getModel("CSBESubbrands");

			if (!sbmodel) {
				sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				sbmodel.setSizeLimit(50000);
				sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.setModel(sbmodel, "CSBESubbrands");
			}

			var filters = [];
			filters.push(new sap.ui.model.Filter("AsmId", sap.ui.model.FilterOperator.EQ, AsmID));

			var sPath = "/CrossSubBrandListSet";
			var that = this;

			var oSBPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(this);
							that._setExistingCSBSubbrand(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "GetSubbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
		},

		_setExistingCSBSubbrand: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.CSBSubbrand) {
				oData.CSBSubbrand = {};
			}
			oData.CSBSubbrand.Selected = oDataIn.results;
			oData.CSBSubbrand.Count.Selected = "(" + oData.CSBSubbrand.Selected.length + ")";
			oModel.refresh(false);
		},

		_getdefaultCSBfilter: function() {
			var oModel = this.getModel("AddActivity");
			var oInput = oModel.getData();

			oInput.CSBSubbrand.CSBCategoryKey = oInput.Input.CategoryKey;
			oInput.CSBSubbrand.CSBSubcategoryKey = oInput.Input.SubcategoryKey;
			oInput.CSBSubbrand.CSBBrandKey = oInput.Input.BrandKey;

			this._getCSBCategory();
			oInput.CSBSubcategory.Current = oInput.Subcategory.Current;
			oInput.CSBBrand.Current = oInput.Brand.Current;

			this._getCSBSubbrand(oInput.Input.CategoryKey, oInput.Input.SubcategoryKey, oInput.Input.BrandKey);

			oModel.refresh(false);

		},

		_getCSBCategory: function() {

			var oModel = this.getModel("AddActivity");
			var oInput = oModel.getData();
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var that = this;

			var sbmodel = this.oPersonalizationDialog.getModel("CSBvhph");
			if (!sbmodel) {
				sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
				sbmodel.setSizeLimit(50000);
				sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				this.oPersonalizationDialog.setModel(sbmodel, "CSBvhph");
			}

			var filters = [];
			var sPath = "/VHCategories";

			var oSBPromise = new Promise(function(resolve, reject) {
				setTimeout(function() {
					sbmodel.read(sPath, {
						async: true,
						filters: filters,
						success: function(oData) {
							TimeoutUtils.onResetTimer(this);
							that._setCSBCategory(oData);
							resolve(oData);
						},
						error: function(oError) {
							oError.ErrorOrigin = "Subbrands";
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							reject(oError);
						}
					});
				}, 200);
			});
		},

		_setCSBCategory: function(oDataIn) {
			var oModel = this.getModel("AddActivity");
			var oData = oModel.getData();
			if (!oData.CSBCategory) {
				oData.CSBCategory = {};
			}
			oData.CSBCategory.Current = [];
			oData.CSBCategory.Current = oDataIn.results;
			oModel.refresh(false);
		},

		_addCSBbrands: function(oEvent) {

			var oModel = this.getModel("AddActivity"),
				CSBTable = oEvent.oSource.getParent().getParent(),
				SelectedRowContext = CSBTable.getSelectedIndices(),
				binding = CSBTable.getBinding();

			if (SelectedRowContext.length) {
				for (var i = 0; i < SelectedRowContext.length; i++) {
					var rowIndices = "",
						newdata = {},
						FData = {};

					rowIndices = SelectedRowContext[i];

					var selctedrow = binding.oList[rowIndices];

					newdata.SubbrandKey = selctedrow.SubbrandKey;
					newdata.SubbrandDesc = selctedrow.SubbrandDesc;
					newdata.LeadSubbrand = "";
					newdata.UpdatedFlag = "I";

					oModel.oData.CSBSubbrand.Change.push(newdata);
					oModel.oData.CSBSubbrand.Selected.push(newdata);

					//CSBTest
					FData.K = selctedrow.SubbrandKey;
					FData.L = "";
					FData.U = "I";
					oModel.oData.CSBSubbrand.NewChange.push(FData);
					//CSBTest					

				}

				var reverse = [].concat(CSBTable.getSelectedIndices()).reverse();

				reverse.forEach(function(index) {
					oModel.getData().CSBSubbrand.Current.splice(index, 1);
				});

				oModel.oData.CSBSubbrand.Count.Selected = "(" + oModel.oData.CSBSubbrand.Selected.length + ")";
				oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";

				oModel.refresh(false);
				CSBTable.clearSelection();

			} else {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_CSBAddError");
				MessageToast.show(sMessage);
			}
		},

		_deleteCSBBrands: function(oEvent) {
			var oModel = this.getModel("AddActivity"),
				oChange = oModel.getData().CSBSubbrand.Change,

				CSBTable_Selected = oEvent.oSource.getParent().getParent(),
				SelectedRowContext = CSBTable_Selected.getSelectedIndices(),
				binding = CSBTable_Selected.getBinding();

			if (SelectedRowContext.length) {
				for (var i = 0; i < SelectedRowContext.length; i++) {
					var newdata = {},
						FData = {},
						flag = "";
					var rowIndices = SelectedRowContext[i];
					var selctedrow = binding.oList[rowIndices];

					for (var j = 0; j < oChange.length; j++) {
						if (oChange[j].SubbrandKey === selctedrow.SubbrandKey && oChange[j].UpdatedFlag === "I") {
							oModel.getData().CSBSubbrand.Change.splice(j, 1);

							newdata.SubbrandKey = selctedrow.SubbrandKey;
							newdata.SubbrandDesc = selctedrow.SubbrandDesc;
							newdata.LeadSubbrand = "";
							newdata.UpdatedFlag = "D";

							oModel.oData.CSBSubbrand.Current.push(newdata);

							//CSBTest
							oModel.getData().CSBSubbrand.NewChange.splice(j, 1);
							//CSBTest					

							flag = "X";
							break;
						}
					}

					if (flag !== "X") {
						newdata.SubbrandKey = selctedrow.SubbrandKey;
						newdata.SubbrandDesc = selctedrow.SubbrandDesc;
						newdata.LeadSubbrand = "";
						newdata.UpdatedFlag = "D";

						oModel.oData.CSBSubbrand.Change.push(newdata);
						oModel.oData.CSBSubbrand.Current.push(newdata);

						//CSBTest
						FData.K = selctedrow.SubbrandKey;
						FData.L = "";
						FData.U = "D";
						oModel.oData.CSBSubbrand.NewChange.push(FData);
						//CSBTest					
					}
				}

				var reverse = [].concat(CSBTable_Selected.getSelectedIndices()).reverse();

				reverse.forEach(function(index) {
					oModel.getData().CSBSubbrand.Selected.splice(index, 1);
				});

				oModel.oData.CSBSubbrand.Count.Selected = "(" + oModel.oData.CSBSubbrand.Selected.length + ")";
				oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";

				oModel.refresh(false);
				CSBTable_Selected.clearSelection();

			} else {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_CSBDeleteError");
				MessageToast.show(sMessage);
			}

		},

		_setinitialCSBSubbrandvalues: function() {
			var oModel = this.getModel("AddActivity");

			var sData = oModel.getData().CSBSubbrand.Selected,
				cData = oModel.getData().CSBSubbrand.Current;

			for (var i = 0; i < sData.length; i++) {
				for (var j = 0; j < cData.length; j++) {
					if (sData[i].SubbrandKey === cData[j].SubbrandKey) {
						oModel.getData().CSBSubbrand.Current.splice(j, 1);
						oModel.refresh(false);
						break;
					}
				}
			}
			oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";
			oModel.refresh(false);

			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},

		_discardallCSBChange: function() {
			var oModel = this.getModel("AddActivity");

			var sData = oModel.getData().CSBSubbrand.Selected,
				cData = oModel.getData().CSBSubbrand.Change;

			for (var j = 0; j < cData.length; j++) {
				for (var i = 0; i < sData.length; i++) {
					if (sData[i].SubbrandKey === cData[j].SubbrandKey) {
						oModel.getData().CSBSubbrand.Selected.splice(i, 1);
						oModel.refresh(false);
						break;
					}
				}
			}

			oModel.getData().CSBSubbrand.Change = [];
			oModel.refresh(false);
		},

		_clearAllCSBSelection: function(oEvent) {
			var Table = oEvent.oSource.getParent().getParent();
			Table.clearSelection();
		},

		_initializeCSB: function(oModel) {
			var oData = oModel.getData();

			oData.CSBSubbrand.Change = [];
			oData.CSBSubbrand.NewChange = [];
			oData.CSBSubbrand.Selected = [];
			oData.CSBSubbrand.Count.Current = "(0)";
			oData.CSBSubbrand.Count.Selected = "(0)";

			oModel.refresh(false);
		}

		// INBHD02		

	});
});