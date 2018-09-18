/*global location */
sap.ui.define([
	"colgate/asm/planning/base/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"colgate/asm/planning/base/model/formatter",
	"colgate/asm/planning/base/util/FormatUtils",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/m/MessageToast",
	"colgate/asm/planning/base/util/VendorUtils",
	"colgate/asm/planning/base/util/RetailerUtils",
	"colgate/asm/planning/base/util/TimeoutUtils",
	"colgate/asm/planning/base/util/DropdownUtils",
	"colgate/asm/planning/base/util/FieldCheckUtils",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/Dialog"
	// "colgate/asm/planning/base/util/CrossSubBrandUtils"
], function(BaseController, JSONModel, formatter, FormatUtils, MessagePopover, MessagePopoverItem, MessageToast, VendorUtils,
	RetailerUtils, TimeoutUtils, DropdownUtils, FieldCheckUtils, Filter, FilterOperator, Button, Text, Dialog) {
	"use strict";

	return BaseController.extend("colgate.asm.planning.base.controller.ChangeActivity", {

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

			this.getRouter().getRoute("changeActivity").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("displayActivity").attachPatternMatched(this._onObjectMatched, this);

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
			// oEventBus.subscribe("colgate.asm.planning.initialize", "ChangeActivity", function(sChannelId, sEventId, oData) {
			// 	this._handleInitialize(oData);
			// }, this);
			// oEventBus.subscribe("colgate.asm.planning.master.event", "ConfigurationLoaded", function(sChannelId, sEventId, oData) {
			// 	this._setASMConfig();
			// }, this);

			// Set up the initial selections
			var oData = {};
			oData.Placeholders = {
				Brand: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_e"),
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
			oData.Costcenter = {};
			oData.Status = {};
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
			oData.Visible = {
				Parent: true,
				LevelType: true,
				Name: true,
				ProjectType: true,
				ActivityType: true,
				SubactivityType: true,
				Status: true,
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
				MaxValueC: true,
				Demographics: true,
				GlAccount: true,
				MaestroBrief: true,
				Costcenter: true,
				PO: true,
				CrossSubBrand: false //INBHD02
			};
			oData.Enabled = {
				Parent: true,
				LevelType: true,
				Name: true,
				ProjectType: true,
				ActivityType: true,
				SubactivityType: true,
				Status: false,
				Priority: true,
				Function: true,
				Channel: true,
				LongText: true,
				Division: true,
				Hub: true,
				Sub: true,
				Category: true,
				Subcategory: false,
				Brand: true,
				Subbrand: false,
				Retailer: false,
				Agency: false,
				Demographics: true,
				GlAccount: true,
				MaestroBrief: false,
				Costcenter: true,
				PO: true,
				CrossSubBrandButton: true //INBHD02
			};
			var oModel = new sap.ui.model.json.JSONModel(oData);
			oModel.setSizeLimit(50000);
			this.setModel(oModel, "ChangeActivity");

			// Set the initial form to be the display one
			//this._showFormFragment("ChangeActivity");
			this._setPHValues("CategoryKey");

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
					that._setPriorities(oData);
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

			DropdownUtils.getBrands(this, this.getView().byId("ChangeActivity"), "", "", "", oModel, "/Brand", null, "/Brand/Current");
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("changeActivityView");

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
			var oViewModel = this.getModel("changeActivityView"),
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
			this.getRouter().navTo("activities", {
				objectId: "Activities"
			}, true);
		},
		onSave: function(oEvent) {
			this._currentAction = "save";
			var bComplete = this._validateInput(null);
			if (bComplete) {
				this._updateItem();
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			var oInput = this.getModel("ChangeActivity").getData().Input;
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
				var bDataGood = true;
				this.oMessageManager.removeAllMessages();
				var oASMConfigData = this.getOwnerComponent().getModel("ASMConfig").getData();
				var sYear = oASMConfigData.Properties.PlanningYear;
				var oInput = this.getModel("ChangeActivity").getData().Input;
				var oTableSelectParent = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent;
				var dStartDt = sYear + "0101";
				var dEndDt = sYear + "1228";
				var oStartDt = this.byId("StartDt");
				var oEndDt = this.byId("EndDt");
				var oMonthSt = this.byId("MonthSt");
				var oMonthEd = this.byId("MonthEd");
				var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
					pattern: "MM/yyyy"
				});
				if (oInput.ItemType !== "PT") {
					dStartDt = oTableSelectParent.StartDt.substring(0, 4) + oTableSelectParent.StartDt.substring(5, 7) +
						oTableSelectParent.StartDt.substring(8, 10);
					dEndDt = oTableSelectParent.EndDt.substring(0, 4) + oTableSelectParent.EndDt.substring(5, 7) + oTableSelectParent.EndDt.substring(
						8, 10);
				}
				var sDt1 = this._getMonthText(parseInt(dStartDt.substring(4, 6)));
				var sDt2 = this._getMonthText(parseInt(dEndDt.substring(4, 6)));
				// PSW Start correction For Month Picker June 16th 2016 -->						
				if (oMonthSt.getMonth() < 9) {
					var sMth1 = "0" + (oMonthSt.getMonth() + 1);
				} else {
					var sMth1 = oMonthSt.getMonth() + 1;
				};
				oInput.StartDt = sYear + sMth1 + "01";

				if (oMonthEd.getMonth() < 9) {
					var sMth2 = "0" + (oMonthEd.getMonth() + 1);
				} else {
					var sMth2 = oMonthEd.getMonth() + 1;
				};
				oInput.EndDt = sYear + sMth2 + "28";
				//psutram: change to check if the date can be modified.
				var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectRaw;
				if (oInput.CHasChildren === "X") {
					var dOriginalStartDt = oTableSelect.StartDt.substring(0, 4) + oTableSelect.StartDt.substring(5, 7) +
						oTableSelect.StartDt.substring(8, 10);
					var dOriginalEndDt = oTableSelect.EndDt.substring(0, 4) + oTableSelect.EndDt.substring(5, 7) + oTableSelect.EndDt.substring(
						8, 10);
					// var oDisplay = this.getModel("ChangeActivity").getData().Display;
					// dOriginalStartDt = 	oDisplay.StartDt;
					// dOriginalEndDt = 	oDisplay.EndDt;
					if (dOriginalStartDt !== oInput.StartDt || dOriginalEndDt.substring(0, 6) !== oInput.EndDt.substring(0, 6)) {
						if (dOriginalStartDt >= oInput.StartDt && dStartDt <= oInput.StartDt &&
							dOriginalEndDt.substring(0, 6) <= oInput.EndDt.substring(0, 6) &&
							dEndDt.substring(0, 6) >= oInput.EndDt.substring(0, 6)) {
							bDataGood = true;
						} else {
							// Above change is because some old records have real month end dates - this eliminates that part of the check.
							oInput.StartDt = oTableSelect.StartDt;
							oInput.EndDt = oTableSelect.EndDt;
							this._setMonthPicker();
							bDataGood = false; // GDH Change on new issue - but messages should not say the data is good. 04/07/2017
							this.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: this.getResourceBundle().getText("AC_E_DateNotModifiable"),
									// Begin of Commenting - Khrystyne Williams - Jan 2017
									// description: "StartDt, EndDt",
									// description: "StartDt",
									// End of Commenting - Khrystyne Williams - Jan 2017
									type: sap.ui.core.MessageType.Information,
									processor: this.oMessageProcessor
								})
							);
						}
					}
				} else {
					// PSW End correction For Month Picker June 16th 2016-->					
					if (oInput.StartDt < dStartDt || oInput.StartDt > dEndDt) {
						// Entry is wrong
						bDataGood = false;
						oStartDt.setValueStateText(this.getResourceBundle().getText("AC_E_badStartDate", [sDt1, sDt2]));
						oStartDt.setValueState(sap.ui.core.ValueState.Error);
						oInput.StartDt = oTableSelect.StartDt;
						oInput.EndDt = oTableSelect.EndDt;
						this._setMonthPicker();
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
						bDataGood = false;
						oEndDt.setValueStateText(this.getResourceBundle().getText("AC_E_badEndDate", [sDt1, sDt2]));
						oEndDt.setValueState(sap.ui.core.ValueState.Error);
						oInput.StartDt = oTableSelect.StartDt;
						oInput.EndDt = oTableSelect.EndDt;
						this._setMonthPicker();
						this.oMessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: this.getResourceBundle().getText("AC_E_badEndDate", [sDt1, sDt2]),
								// Begin of Commenting - Khrystyne Williams - Jan 2017
								// description: "EndDt",
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
						bDataGood = false;
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
				// end of changes
			}

			return bDataGood;
		},
		onAgencyShow: function(oEvent) {
			VendorUtils.onShow(oEvent, this.getModel("ChangeActivity"), this.getModel("i18n"), this.getView().byId("Agency"));
		},
		onAgencyClear: function(oEvent) {
			VendorUtils.onClear(oEvent, this.getView().byId("Agency"));
		},
		onRetailerShow: function(oEvent) {
			RetailerUtils.onShow(oEvent, this.getModel("ChangeActivity"), this.getModel("i18n"), this.getView().byId("Retailer"));
		},
		onRetailerClear: function(oEvent) {
			RetailerUtils.onClear(oEvent, this.getView().byId("Retailer"));
		},
		_getSubactivityTypes: function() {
			// If the activity type is selected, then select the subactivity types.
			var oInput = this.getModel("ChangeActivity").getData().Input;
			if (oInput.ActivityType && oInput.ActivityType !== "" && oInput.ItemType === "SA") {
				// Pick up the subactivity types
				var sPath = "/VHSubactivityTypes";
				var filters = [];
				if (oInput && oInput.ActivityType) {
					filters.push(new sap.ui.model.Filter({
						path: "Key",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: oInput.ActivityType
					}));
				}
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
				if ((this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction !== "NavToChangeActivity") && (this.getModel(
						"masterShared").getData().oInternalEvents.lastAction !== "NavToDisplayActivity")) {
					this.getRouter().navTo("activities", {
						objectId: "Activities"
					}, true);
				} else {
					var bChangeMode = true;
					if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction === "NavToChangeActivity") {
						bChangeMode = true;
						this._showFormFragment("ChangeActivity");
					} else if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction === "NavToDisplayActivity") {
						bChangeMode = false;
						this._showFormFragment("DisplayActivity");
					}
					// Set up the data to change:
					this._handleInitialize();
					var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
					this.getModel("ChangeActivity").getData().Input = oTableSelect;
					// PSW Start change For Month Picker May 25th 2016 v2-->
					if (bChangeMode) {
						this._setMonthPicker();
					}
					// PSW End change For Month Picker May 25th 2016 v2-->
					var oConfig = JSON.parse(oTableSelect.Config);
					if (oConfig.StatusList) {
						this.getModel("ChangeActivity").getData().Status = oConfig.StatusList;
					}
					this._resetChange();
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
				oViewModel = this.getModel("changeActivityView");

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
			var oACModel = this.getModel("ChangeActivity");
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var that = this;
			// Check if you already have these values stored
			if (!oACModel.getProperty("/Input/BrandKey")) {
				oACModel.setProperty("/Input/BrandKey", "");
			}
			if (!oACModel.getProperty("/Input/SubbrandKey")) {
				oACModel.setProperty("/Input/SubbrandKey", "");
			}
			if (!oACModel.getProperty("/Input/SubcategoryKey")) {
				oACModel.setProperty("/Input/SubcategoryKey", "");
			}
			if (!oACModel.getProperty("/Input/CategoryKey")) {
				oACModel.setProperty("/Input/CategoryKey", "");
			}
			if (sChanged === "CategoryKey") {
				// First clear the keys
				if (oACModel.getProperty("/Input/SubcategoryKey")) {
					oACModel.setProperty("/Input/SubcategoryKey", "");
				}
				if (oACModel.getProperty("/Input/SubbrandKey")) {
					oACModel.setProperty("/Input/SubbrandKey", "");
				}
				var oModel = this.getModel("Category");
				if (!oModel) {
					oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
					oModel.setSizeLimit(50000);
					this.setModel(oModel, "Category");
				}
				var sSelected = oACModel.getProperty("/Input/CategoryKey");
				// May need to change the Brand List
				var oBrand = this.getView().byId("BrandKey");
				DropdownUtils.getBrands(this, oBrand, oACModel.getProperty("/Input/CategoryKey"), oACModel.getProperty("/Input/SubcategoryKey"),
					oACModel.getProperty("/Input/BrandKey"),
					oACModel, "/Brand", null, "/Brand/Current");
				if (!sSelected || sSelected === "") {
					oACModel.setProperty("/Enabled/Subcategory", false);
					oACModel.setProperty("/Enabled/Subbrand", false);
					oACModel.setProperty("/Placeholders/Category", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_category"));
					oACModel.setProperty("/Placeholders/Subcategory", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory"));
					if (oACModel.getProperty("/Input/BrandKey") !== "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_cse"));
						//oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
					} else {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand"));
					}
				} else {
					oACModel.setProperty("/Enabled/Subcategory", true);
					DropdownUtils.getSubcategories(this, oACModel.getProperty("/Input/CategoryKey"), oACModel.getProperty("/Input/SubcategoryKey"),
						oACModel.getProperty("/Input/BrandKey"), this.getModel(
							"ChangeActivity"), "/Subcategory", null, "/Subcategory/Current");
					oACModel.setProperty("/Placeholders/Subcategory", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e"));
					if (oACModel.getProperty("/Input/SubcategoryKey") === "" && oACModel.getProperty("/Input/BrandKey") === "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_sbe"));
					} else if (oACModel.getProperty("/Input/SubcategoryKey") === "" && oACModel.getProperty("/Input/BrandKey") !== "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_se"));
						//oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
					} else if (oACModel.getProperty("/Input/SubcategoryKey") !== "" && oACModel.getProperty("/Input/BrandKey") === "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_be"));
					} else {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
					}
				}
				this._resetMaestroBrief();
			} else if (sChanged === "BrandKey" || sChanged === "SubcategoryKey") {
				// First clear out old values
				if (oACModel.getProperty("/Input")) {
					oACModel.setProperty("/Input/SubbrandKey", "");
				}
				if (oACModel.getProperty("/Input/CategoryKey") === "") {
					if (oACModel.getProperty("/Input/SubcategoryKey") === "" && oACModel.getProperty(
							"/Input/BrandKey") === "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand"));
					} else if (oACModel.getProperty("/Input/SubcategoryKey") === "" && oACModel.getProperty(
							"/Input/BrandKey") !== "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_cse"));
						//oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
					} else if (oACModel.getProperty("/Input/SubcategoryKey") !== "" && oACModel.getProperty(
							"/Input/BrandKey") === "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_sbe"));
					}
				} else {
					if (oACModel.getProperty("/Input/SubcategoryKey") === "" && oACModel.getProperty(
							"/Input/BrandKey") === "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_sbe"));
					} else if (oACModel.getProperty("/Input/SubcategoryKey") === "" && oACModel.getProperty(
							"/Input/BrandKey") !== "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_se"));
						//oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
					} else if (oACModel.getProperty("/Input/SubcategoryKey") !== "" && oACModel.getProperty(
							"/Input/BrandKey") === "") {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_be"));
					} else {
						oACModel.setProperty("/Placeholders/Subbrand", this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
					}
				}
				var oPromise = null;
				if (sChanged === "SubcategoryKey") {
					var oBrand = this.getView().byId("BrandKey");
					oPromise = DropdownUtils.getBrands(this, oBrand, oACModel.getProperty("/Input/CategoryKey"), oACModel.getProperty(
							"/Input/SubcategoryKey"),
						oACModel.getProperty("/Input/BrandKey"),
						oACModel, "/Brand", null, "/Brand/Current");
				} else if (sChanged === "BrandKey") {
					oPromise = DropdownUtils.getCategories(this, oACModel.getProperty("/Input/CategoryKey"), oACModel.getProperty(
							"/Input/BrandKey"),
						this.getModel("ChangeActivity"), "/Category",
						null,
						"/Category/Current");
				}
				oPromise.then(function(oData) {
					if (oACModel.getProperty("/Input/CategoryKey") !== "") {
						//Khrystyne PH locking issue 09.18.2018
						if (oACModel.getProperty("/Input/Status") === "9002") {
							oACModel.setProperty("/Enabled/Subcategory", true);
						} else {
							oACModel.setProperty("/Enabled/Subcategory", false);
						}
						//Khrystyne PH locking issue 09.18.2018
						oACModel.setProperty("/Placeholders/Subcategory", that.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e"));

					} else {
						oACModel.setProperty("/Enabled/Subcategory", false);
						oACModel.setProperty("/Placeholders/Subcategory", that.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory"));
					}
					if (oACModel.getProperty("/Input/CategoryKey") && oACModel.getProperty("/Input/CategoryKey") !== "") {
						DropdownUtils.getSubcategories(that, oACModel.getProperty("/Input/CategoryKey"), oACModel.getProperty("/Input/SubcategoryKey"),
							oACModel.getProperty("/Input/BrandKey"), that.getModel(
								"ChangeActivity"), "/Subcategory", null, "/Subcategory/Current");
					}
					if (oACModel.getProperty("/Input/BrandKey") && oACModel.getProperty("/Input/BrandKey") !== "" &&
						oACModel.getProperty("/Input/CategoryKey") && oACModel.getProperty("/Input/CategoryKey") !== "" &&
						oACModel.getProperty("/Input/SubcategoryKey") && oACModel.getProperty("/Input/SubcategoryKey") !== "") {
						//Khrystyne PH locking issue 09.18.2018
						if (oACModel.getProperty("/Input/Status") === "9002") {
							oACModel.setProperty("/Enabled/Subbrand", true);
						} else {
							oACModel.setProperty("/Enabled/Subbrand", false);
						}
						//Khrystyne PH locking issue 09.18.2018
						oACModel.setProperty("/Placeholders/Subbrand", that.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
						var sbmodel = that.getModel("Subbrand");
						if (!sbmodel) {
							sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
							sbmodel.setSizeLimit(50000);
							sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							that.setModel(sbmodel, "Subbrand");
						}
						var filters = [];
						filters.push(new sap.ui.model.Filter({
							path: "Key",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: oACModel.getProperty("/Input/SubbrandKey")
						}));
						if (oACModel.getProperty("/Input/CategoryKey") !== "") {
							filters.push(new sap.ui.model.Filter({
								path: "Category",
								operator: sap.ui.model.FilterOperator.EQ,
								value1: oACModel.getProperty("/Input/CategoryKey")
							}));
						}
						if (oACModel.getProperty("/Input/SubcategoryKey") !== "") {
							filters.push(new sap.ui.model.Filter({
								path: "PSubCategory",
								operator: sap.ui.model.FilterOperator.EQ,
								value1: oACModel.getProperty("/Input/SubcategoryKey")
							}));
						}
						filters.push(new sap.ui.model.Filter({
							path: "Brand",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: oACModel.getProperty("/Input/BrandKey")
						}));
						var sPath = "/VHSubbrands";
						that.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
						var that2 = that;
						var oSBPromise = new Promise(function(resolve, reject) {
							setTimeout(function() {
								sbmodel.read(sPath, {
									async: true,
									filters: filters,
									success: function(oData, oResponse) {
										TimeoutUtils.onResetTimer(that);
										that2._setSubbrands(oData);
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
						oSBPromise.then(function(oData) {
							//Khrystyne PH locking issue 09.18.2018
							if (oACModel.getProperty("/Input/Status") === "9002") {
								oACModel.setProperty("/Enabled/Subbrand", true);
							} else {
								oACModel.setProperty("/Enabled/Subbrand", false);
							}
							//Khrystyne PH locking issue 09.18.2018
							oACModel.setProperty("/Placeholders/Subbrand", that2.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e"));
							that2._getMaestroBrief();
						});
					} else {
						oACModel.setProperty("/Enabled/Subbrand", false);
					}
				});
			} else if (sChanged === "SubbrandKey") {
				var oSubbrand = this.getView().byId("SubbrandKey");
				var sKey = oSubbrand.getSelectedKey();

				if (sKey !== "") {
					var aSubbrands = oACModel.getProperty("/Subbrand/Current");
					for (var i = 0; i < aSubbrands.length; i++) {
						if (aSubbrands[i].Key === sKey) {
							if (oACModel.getProperty("/Input/BrandKey") !== aSubbrands[i].Brand) {
								oACModel.setProperty("/Input/BrandKey", aSubbrands[i].Brand);
							}
						}
					}
				}
			}
		},
		_setGeoValues: function(sChanged) {
			var oACModel = this.getModel("ChangeActivity");
			var oACData = oACModel.getData();
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			if (sChanged === "DivisionKey") {
				// First clear the keys
				// PSW Start Correction Clear Dependent fields May 26th 2016 v3						
				if (oACData.Input.Hub) {
					oACData.Input.Hub = "";
				}
				// PSW End Correction Clear Dependent fields May 26th 2016 v3
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
					// First clear out old values
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
				this._getRetailers();
				//this._getCostcenters();
				this._getDemographics();
				this._getAgencies();
			}
		},
		_setSubcategories: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.Subcategory) {
				oData.Subcategory = {};
			}
			oData.Subcategory.Current = oDataIn.results;
			var combinedKey = oData.Input.CategoryKey + oData.Input.SubcategoryKey;
			oData.Subcategory[combinedKey] = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		// _setBrands: function(oDataIn) {
		// 	var oModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.Subbrand) {
				oData.Subbrand = {};
			}
			oData.Subbrand.Current = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setHubs: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.Sub) {
				oData.Sub = {};
			}
			oData.Sub.Current = oDataIn.results;
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setProjectTypes: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.ProjectType) {
				oData.ProjectType = {};
			}
			oData.ProjectType.Current = oDataIn.results;
		},
		_setActivityTypes: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.ActivityType) {
				oData.ActivityType = {};
			}
			oData.ActivityType.Current = oDataIn.results;
		},
		_setSubactivityTypes: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
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
				var oModel = this.getModel("ChangeActivity");
				var oASMConfigData = oASMConfig.getData();
				var oCurrentData = oModel.getData();
				var sYear = oASMConfigData.Properties.PlanningYear;
				oCurrentData.Input.PlanningYear = sYear;
				// Begin of Commenting - Khrystyne Williams - Oct
				// oCurrentData.Input.StartDt = sYear + "0101";
				// oCurrentData.Input.EndDt = sYear + "1231";
				// End of Commenting - Khrystyne Williams - Oct
				oModel.refresh(false);
			}
		},
		_validateInput: function() {
			// Check Mandatory Input Fields
			this.oMessageManager.removeAllMessages();
			var bDataGood = this.onDtChange(null);
			var oData = this.getModel("ChangeActivity").getData();
			if (oData.Input.ItemType === "PT") {
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

				if (!this._checkNotEmpty("ProjectType", oData)) {
					bDataGood = false;
				}
				// Begin of Commenting - Khrystyne Williams - August 26, 2016
				// Remove validation as Category is not mandatory
				// if (!this._checkNotEmpty("CategoryKey", oData)) {
				// 	bDataGood = false;
				// }
				// End of Commenting - Khrystyne Williams - August 26, 2016
				if (!this._checkNotEmpty("DivisionKey", oData)) {
					bDataGood = false;
				}
			} else if (oData.Input.ItemType === "AT") {
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

				if (!this._checkNotEmpty("Status", oData)) {
					bDataGood = false;
				}
				if (!this._checkNotEmpty("ActivityType", oData)) {
					bDataGood = false;
				}
			} else if (oData.Input.ItemType === "SA") {
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
				if (!this._checkNotEmpty("Status", oData)) {
					bDataGood = false;
				}
				if (!this._checkNotEmpty("SubactivityType", oData)) {
					bDataGood = false;
				}
				//Validation for Hub and Sub in SA / USERA04 / 1-27-2017
				if (!this._checkNotEmpty("HubKey", oData)) {
					bDataGood = false;
				}
				if (!this._checkNotEmpty("SubKey", oData)) {
					bDataGood = false;
				}
				if (oData.Input.Status === "9012" || oData.Input.Status === "9013" || oData.Input.Status === "9014") {
					if (!this._checkNotEmpty("CategoryKey", oData)) {
						bDataGood = false;
					}
					if (!this._checkNotEmpty("SubcategoryKey", oData)) {
						bDataGood = false;
					}
					if (!this._checkNotEmpty("BrandKey", oData)) {
						bDataGood = false;
					}
					if (!this._checkNotEmpty("SubbrandKey", oData)) {
						bDataGood = false;
					}
				}
			}
			if (!bDataGood) {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_BudgetErrors");
				MessageToast.show(sMessage);
			}
			return bDataGood;
		},
		_checkAllowStatusChange: function() {
			var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
			var oTableSelectParent = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent;
			if (oTableSelect.hasOwnProperty("Status") && oTableSelectParent.hasOwnProperty("Status") && oTableSelect.Status ===
				oTableSelectParent.Status) {
				// Cannot change this status because cannot be moved ahead of the parent
				return false;
			}
			return true;
		},
		_checkNotEmpty: function(sId, oData) {
			var oControl = this.byId(sId);
			oControl.setValueState(sap.ui.core.ValueState.None);
			oControl.setValueStateText("");
			if (!oData.Input.hasOwnProperty(sId) || oData.Input[sId] === "") {
				oControl.setValueState(sap.ui.core.ValueState.Error);
				var sProperty = "AC_E_" + sId;
				oControl.setValueStateText(this.getOwnerComponent().getModel("i18n").getProperty(sProperty));
				this.oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: this.getOwnerComponent().getModel("i18n").getProperty(sProperty),
						description: sId,
						type: sap.ui.core.MessageType.Error,
						processor: this.oMessageProcessor
					})
				);
				return false;
			}
			return true;
		},
		_updateItem: function() {
			var oRaw = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectRaw;
			var oData = this.getModel("ChangeActivity").getData();
			var aKeys = Object.keys(oRaw);
			var oItem = {};
			for (var i = 0; i < aKeys.length; i++) {
				oItem[aKeys[i]] = oData.Input[aKeys[i]];
			}
			oItem.StartDt = oData.Input.StartDt.substring(0, 4) + "-" + oData.Input.StartDt.substring(4, 6) + "-" + oData.Input.StartDt.substring(
				6, 8) + "T00:00:00";
			oItem.EndDt = oData.Input.EndDt.substring(0, 4) + "-" + oData.Input.EndDt.substring(4, 6) + "-" + oData.Input.EndDt.substring(6, 8) +
				"T00:00:00";
			oItem.CreatedTime = oItem.CreatedTime.replace("Z", "");
			oItem.ChangedTime = oItem.ChangedTime.replace("Z", "");
			if (oItem.Agency === "") {
				oItem.AgencyDesc = "";
			}
			var oDate = new Date();
			var iMonth = parseInt(oDate.getMonth()) + 1;
			//Time Created/Modified on Server // USERA04 // 2/28/17
			//oItem.ChangedTime = oDate.getFullYear() + "-" + iMonth + "-" + oDate.getDate() + "T00:00:00";

			// Remove fields that were added in extra.
			delete oItem.OriginalName;
			FormatUtils.stringifyNumbers(oItem);
			if (oItem.ItemType === "PT") {
				oItem.ActivityType = oData.Input.ProjectType;
				// oItem.AmtB1 = "0";
				// oItem.AmtB2 = "0";
				// oItem.AmtB3 = "0";
				// oItem.AmtB4 = "0";
				// oItem.AmtB5 = "0";
				// oItem.AmtB6 = "0";
				// oItem.AmtB7 = "0";
				// oItem.AmtB8 = "0";
				// oItem.AmtB9 = "0";
				// oItem.AmtB10 = "0";
				// oItem.AmtB11 = "0";
				// oItem.AmtB12 = "0";
			} else if (oItem.ItemType === "SA") {
				oItem.ActivityType = oData.Input.SubactivityType;
				oItem.ActivityTypeDesc = "";

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
				// 	oItem.CsbConfig = JSON.stringify(oData.CSBSubbrand.Change);
				// }
				if (oData.CSBSubbrand.NewChange.length) {
					oItem.CsbConfig = JSON.stringify(oData.CSBSubbrand.NewChange);
				}
				//bhavik				
			} else if (oItem.ItemType === "AT") {
				// No change needed in Activity Type
			}
			// oItem.AmtBTot = "0";
			// oItem.AmtATot = "0";
			// oItem.AmtCTot = "0";
			// oItem.AmtCbTot = "0";
			oItem.ItemType = oData.Input.ItemType;
			delete oItem.__metadata;
			var oConfig = {};
			oConfig.UPDITEM = "X";
			oItem.Config = JSON.stringify(oConfig);

			var oModel = this.getModel("Category");
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			var that = this;
			var sPath = oRaw.__metadata.uri.substring(oRaw.__metadata.uri.lastIndexOf("/"));

			oModel.update(sPath, oItem, {
				success: function(oData, oResponse) {
					TimeoutUtils.onResetTimer(that);
					// Add a Success toast and navigate back to the Project view and refresh the data.
					if (oResponse.statusCode !== "204") {
						oData.ErrorOrigin = "UpdateProject";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oData);
					} else {
						// that.batchupdate();

						var oInput = that.getModel("ChangeActivity").getData().Input;

						//Different Messages generated depending on item type / USERA04 / 2/10/17
						//var sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_created", [oInput.Name]);
						var sMessage;
						if (oItem.ItemType === "PT") {
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_pCreated", [oInput.Name]);
						} else if (oItem.ItemType === "SA") {
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_saCreated", [oInput.Name]);
						} else if (oItem.ItemType === "AT") {
							sMessage = that.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_S_aCreated", [oInput.Name]);
						}
						//end of USERA04

						MessageToast.show(sMessage);
						if (that._currentAction === "save") {
							//							that.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Refresh", {});
							that.getRouter().navTo("activities", {
								objectId: "Activities"
							}, true);
							//DblClick Changes // USERA04 // 3/7/17
							var oInternalEvents = that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents;
							var oEventBus = sap.ui.getCore().getEventBus();
							if (oInternalEvents.currentMode === "Edit") {
								oEventBus.publish("colgate.asm.planning.master.button.pressed", "CancelBudgetEdit", {});
							} else if (oInternalEvents.currentMode === "Status") {
								oEventBus.publish("colgate.asm.planning.master.button.pressed", "CancelStatus", {});
							}
							//End Of USERA04

							that._currentAction = "";
						}
					}
				},
				error: function(oError) {
					oError.ErrorOrigin = "UpdateProject";
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
			var oModel = this.getModel("ChangeActivity");
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
			this._setASMConfig();
			this._initializeChange();
			this._initializeCSB(oModel); //INBHD02
			var oACModel = this.getModel("ChangeActivity");
			var oACData = oACModel.getData();
			oACData.Placeholders.MaestroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_maestroBrief");
			oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency");
			oACData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer");
			oACData.Enabled.MaestroBrief = false;
			oACData.Enabled.Agency = false;
			oACData.Enabled.Retailer = false;
			sap.ui.core.BusyIndicator.hide();

		},
		// PSW Start change For Month Picker May 25th 2016 v2-->		
		_setMonthPicker: function() {

			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			var oMth1 = this.byId("MonthSt");
			var oMth2 = this.byId("MonthEd");
			oMth1.setMonth((oData.Input.StartDt.substring(7, 5) - 1));
			oMth2.setMonth((oData.Input.EndDt.substring(7, 5) - 1));

		},
		// PSW End change For Month Picker May 25th 2016 v2-->
		_initializeChange: function() {
			var oUserData = this.getOwnerComponent().getModel("UserData").getData();
			var oMasterSelect = this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect;
			var oParentSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent;
			var oTableSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
			var bNoChildDependency = !JSON.parse(oTableSelect.Config).Children;
			var oACData = this.getModel("ChangeActivity").getData();

			if (oUserData.hasOwnProperty("DivisionKey") && oUserData.DivisionKey !== "") {
				oACData.Input.DivisionKey = oUserData.DivisionKey;
				this._setGeoValues("DivisionKey");
				oACData.Enabled.Division = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("DivisionKey") && oParentSelect.DivisionKey !== "") {
				oACData.Input.DivisionKey = oParentSelect.DivisionKey;
				this._setGeoValues("DivisionKey");
				oACData.Enabled.Division = false;
			} else if (oTableSelect.hasOwnProperty("DivisionKey") && oTableSelect.DivisionKey !== "") {
				oACData.Input.DivisionKey = oTableSelect.DivisionKey;
				this._setGeoValues("DivisionKey");
				oACData.Enabled.Division = bNoChildDependency;
			} else if (oMasterSelect.hasOwnProperty("DivisionKey") && oMasterSelect.DivisionKey !== "") {
				oACData.Input.DivisionKey = oMasterSelect.DivisionKey;
				this._setGeoValues("DivisionKey");
				oACData.Enabled.Division = bNoChildDependency;
			} else {
				oACData.Enabled.Division = bNoChildDependency;
			}

			if (oUserData.hasOwnProperty("HubKey") && oUserData.HubKey !== "") {
				oACData.Input.HubKey = oUserData.HubKey;
				this._setGeoValues("HubKey");
				oACData.Enabled.Hub = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("HubKey") && oParentSelect.HubKey !== "") {
				oACData.Input.HubKey = oParentSelect.HubKey;
				this._setGeoValues("HubKey");
				oACData.Enabled.Hub = false;
			} else if (oTableSelect.hasOwnProperty("HubKey") && oTableSelect.HubKey !== "") {
				oACData.Input.HubKey = oTableSelect.HubKey;
				this._setGeoValues("HubKey");
				oACData.Enabled.Hub = bNoChildDependency;
			} else if (oMasterSelect.hasOwnProperty("HubKey") && oMasterSelect.HubKey !== "") {
				oACData.Input.HubKey = oMasterSelect.HubKey;
				this._setGeoValues("HubKey");
				oACData.Enabled.Hub = bNoChildDependency;
			} else {
				oACData.Enabled.Hub = bNoChildDependency;
			}

			if (oUserData.hasOwnProperty("SubKey") && oUserData.SubKey !== "") {
				oACData.Input.SubKey = oUserData.SubKey;
				this._setGeoValues("SubKey");
				oACData.Enabled.Sub = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("SubKey") && oParentSelect.SubKey !== "") {
				oACData.Input.SubKey = oParentSelect.SubKey;
				this._setGeoValues("SubKey");
				oACData.Enabled.Sub = false;
			} else if (oTableSelect.hasOwnProperty("SubKey") && oTableSelect.SubKey !== "") {
				oACData.Input.SubKey = oTableSelect.SubKey;
				this._setGeoValues("SubKey");
				oACData.Enabled.Sub = bNoChildDependency;
			} else if (oMasterSelect.hasOwnProperty("SubKey") && oMasterSelect.SubKey !== "") {
				oACData.Input.SubKey = oMasterSelect.SubKey;
				this._setGeoValues("SubKey");
				oACData.Enabled.Sub = bNoChildDependency;
			} else {
				oACData.Enabled.Sub = bNoChildDependency;
			}

			if (oUserData.hasOwnProperty("Function") && oUserData.Function !== "") {
				oACData.Input.Function = oUserData.Function;
				oACData.Enabled.Function = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("Function") && oParentSelect.Function !== "") {
				oACData.Input.Function = oParentSelect.Function;
				oACData.Enabled.Function = false;
			} else if (oTableSelect.hasOwnProperty("Function") && oTableSelect.Function !== "") {
				oACData.Input.Function = oTableSelect.Function;
				oACData.Enabled.Function = bNoChildDependency;
			} else if (oMasterSelect.hasOwnProperty("Function") && oMasterSelect.Function !== "") {
				oACData.Input.Function = oMasterSelect.Function;
				oACData.Enabled.Function = bNoChildDependency;
			} else {
				oACData.Enabled.Function = bNoChildDependency;
			}

			if (oUserData.hasOwnProperty("Channel") && oUserData.Channel !== "") {
				oACData.Input.Channel = oUserData.Channel;
				oACData.Enabled.Channel = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("Channel") && oParentSelect.Channel !== "") {
				oACData.Input.Channel = oParentSelect.Channel;
				oACData.Enabled.Channel = false;
			} else if (oTableSelect.hasOwnProperty("Channel") && oTableSelect.Channel !== "") {
				oACData.Input.Channel = oTableSelect.Channel;
				oACData.Enabled.Channel = bNoChildDependency;
			} else if (oMasterSelect.hasOwnProperty("Channel") && oMasterSelect.Channel !== "") {
				oACData.Input.Channel = oMasterSelect.Channel;
				oACData.Enabled.Channel = bNoChildDependency;
			} else {
				oACData.Enabled.Channel = bNoChildDependency;
			}

			if (oUserData.hasOwnProperty("BrandKey") && oUserData.BrandKey !== "") {
				oACData.Input.BrandKey = oUserData.BrandKey;
				this._setPHValues("BrandKey");
				oACData.Enabled.Brand = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("BrandKey") && oParentSelect.BrandKey !== "") {
				oACData.Input.BrandKey = oParentSelect.BrandKey;
				this._setPHValues("BrandKey");
				oACData.Enabled.Brand = false;
			} else if (oTableSelect.hasOwnProperty("BrandKey") && oTableSelect.BrandKey !== "") {
				oACData.Input.BrandKey = oTableSelect.BrandKey;
				this._setPHValues("BrandKey");
				oACData.Enabled.Brand = bNoChildDependency;
			} else if (oMasterSelect.hasOwnProperty("BrandKey") && oMasterSelect.BrandKey !== "") {
				oACData.Input.BrandKey = oMasterSelect.BrandKey;
				this._setPHValues("BrandKey");
				oACData.Enabled.Brand = bNoChildDependency;
			} else {
				// if (oACData.Input.hasOwnProperty("SubcategoryKey") && oACData.Input.SubcategoryKey !== "") {
				// 	oACData.Enabled.Brand = bNoChildDependency;
				// } else {
				// 	oACData.Enabled.Brand = false;
				// }
			}

			if (oUserData.hasOwnProperty("CategoryKey") && oUserData.CategoryKey !== "") {
				oACData.Input.CategoryKey = oUserData.CategoryKey;
				this._setPHValues("CategoryKey");
				oACData.Enabled.Category = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("CategoryKey") && oParentSelect.CategoryKey !== "") {
				oACData.Input.CategoryKey = oParentSelect.CategoryKey;
				this._setPHValues("CategoryKey");
				oACData.Enabled.Category = false;
			} else if (oTableSelect.hasOwnProperty("CategoryKey") && oTableSelect.CategoryKey !== "") {
				oACData.Input.CategoryKey = oTableSelect.CategoryKey;
				this._setPHValues("CategoryKey");
				oACData.Enabled.Category = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_category");
				}
			} else if (oMasterSelect.hasOwnProperty("CategoryKey") && oMasterSelect.CategoryKey !== "") {
				oACData.Input.CategoryKey = oMasterSelect.CategoryKey;
				this._setPHValues("CategoryKey");
				oACData.Enabled.Category = bNoChildDependency;
				if (bNoChildDependency) {
					oACData.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_category");
				}
			} else {
				oACData.Enabled.Category = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_category");
				}
			}

			if (oUserData.hasOwnProperty("SubcategoryKey") && oUserData.SubcategoryKey !== "") {
				oACData.Input.SubcategoryKey = oUserData.SubcategoryKey;
				this._setPHValues("SubcategoryKey");
				oACData.Enabled.Subcategory = false;
			} else if (oParentSelect && oParentSelect.hasOwnProperty("SubcategoryKey") && oParentSelect.SubcategoryKey !== "") {
				oACData.Input.SubcategoryKey = oParentSelect.SubcategoryKey;
				this._setPHValues("SubcategoryKey");
				oACData.Enabled.Subcategory = false;
			} else if (oTableSelect.hasOwnProperty("SubcategoryKey") && oTableSelect.SubcategoryKey !== "") {
				oACData.Input.SubcategoryKey = oTableSelect.SubcategoryKey;
				this._setPHValues("SubcategoryKey");
				oACData.Enabled.Subcategory = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e");
				}
			} else if (oMasterSelect.hasOwnProperty("SubcategoryKey") && oMasterSelect.SubcategoryKey !== "") {
				oACData.Input.SubcategoryKey = oMasterSelect.SubcategoryKey;
				this._setPHValues("SubcategoryKey");
				oACData.Enabled.Subcategory = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e");
				}
			} else {
				if (oACData.Input.hasOwnProperty("CategoryKey") && oACData.Input.CategoryKey !== "") {
					oACData.Enabled.Subcategory = bNoChildDependency;
					if (!bNoChildDependency) {
						oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
					} else {
						oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subcategory_e");
					}
				} else {
					oACData.Enabled.Subcategory = false;
				}
			}

			if (oACData.Input.hasOwnProperty("SubcategoryKey") && oACData.Input.SubcategoryKey !== "") {
				oACData.Enabled.Subbrand = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_subbrand_e");
				}
			} else {
				oACData.Enabled.Subbrand = false;
			}

			if (oParentSelect && oParentSelect.hasOwnProperty("Agency") && oParentSelect.Agency !== "") {
				oACData.Input.Agency = oParentSelect.Agency;
				oACData.Enabled.Agency = false;
			} else if (oTableSelect.hasOwnProperty("Agency") && oTableSelect.Agency !== "") {
				oACData.Input.Agency = oTableSelect.Agency;
				oACData.Enabled.Agency = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency_e");
				}
			} else {
				oACData.Enabled.Agency = bNoChildDependency;
				if (!bNoChildDependency) {
					oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				} else {
					oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency_e");
				}
			}

			if (oParentSelect && oParentSelect.hasOwnProperty("Demographics") && oParentSelect.Demographics !== "") {
				oACData.Input.Demographics = oParentSelect.Demographics;
				oACData.Enabled.Demographics = false;
			} else if (oTableSelect.hasOwnProperty("Demographics") && oTableSelect.Demographics !== "") {
				oACData.Input.Demographics = oTableSelect.Demographics;
				oACData.Enabled.Demographics = bNoChildDependency;
			} else {
				oACData.Enabled.Demographics = bNoChildDependency;
			}

			if (oParentSelect && oParentSelect.hasOwnProperty("Costcenter") && oParentSelect.Costcenter !== "") {
				oACData.Input.Costcenter = oParentSelect.Costcenter;
				oACData.Enabled.Costcenter = false;
			} else if (oTableSelect.hasOwnProperty("Costcenter") && oTableSelect.Costcenter !== "") {
				oACData.Input.Costcenter = oTableSelect.Costcenter;
				oACData.Enabled.Costcenter = bNoChildDependency;
			} else {
				oACData.Enabled.Costcenter = bNoChildDependency;
			}
			var sBrand = oACData.Input.BrandKey;
			if (oACData.Enabled.Brand) {
				sBrand = "";
			}
			DropdownUtils.getCategories(this, oACData.Input.CategoryKey, sBrand, this.getModel("ChangeActivity"), "/Category", null,
				"/Category/Current");
			if (oACData.Input.CategoryKey && oACData.Input.CategoryKey !== "") {
				DropdownUtils.getSubcategories(this, oACData.Input.CategoryKey, oACData.Input.SubcategoryKey, oACData.Input.BrandKey, this.getModel(
					"ChangeActivity"), "/Subcategory", null, "/Subcategory/Current");

				//INBHD02
				if (oTableSelect.ItemType === "SA") {

					this._getExistingCSBSubbrand(oTableSelect.Id);
				}
				//INBHD02								
			}
		},
		_resetChange: function() {
			var oModel = this.getModel("ChangeActivity");
			var oInput = oModel.getData().Input;
			var oPlaceholders = oModel.getData().Placeholders;
			var oOriginal = this.getOwnerComponent().getModel("masterShared").getData().oTableSelect;
			var oParent = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent;
			var oVisible = this.getModel("ChangeActivity").getData().Visible;
			var oEnabled = this.getModel("ChangeActivity").getData().Enabled;
			var sSubbrandKey = oOriginal.SubbrandKey;
			var bNoChildDependency = !JSON.parse(oInput.Config).Children;
			oInput.StartDt = oInput.StartDt.substring(0, 4) + oInput.StartDt.substring(5, 7) + oInput.StartDt.substring(
				8, 10);
			oInput.EndDt = oInput.EndDt.substring(0, 4) + oInput.EndDt.substring(5, 7) + oInput.EndDt.substring(8, 10);
			oInput.OriginalName = oInput.Name;
			oEnabled.ProjectType = bNoChildDependency;
			oEnabled.ActivityType = bNoChildDependency;
			oEnabled.SubactivityType = bNoChildDependency;
			oEnabled.StartDt = bNoChildDependency;
			oEnabled.EndDt = bNoChildDependency;
			oEnabled.Retailer = bNoChildDependency;
			oEnabled.MaestroBrief = bNoChildDependency;
			oEnabled.Demographics = bNoChildDependency;
			oEnabled.Costcenter = bNoChildDependency;
			oEnabled.GlAccount = bNoChildDependency;
			oEnabled.PO = bNoChildDependency;
			oEnabled.Priority = true; // You can always change the priority
			if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction !== "NavToDisplayActivity") {
				this._setRequiredFlags(oInput.ItemType);
				if ((oInput.Status === '9012' || oInput.Status === '9013' || oInput.Status === '9014') && oInput.ItemType === "SA") {
					// Change Required Fields for Published
					this.byId("FEHub")._oLabel.setRequired(true);
					this.byId("FESub")._oLabel.setRequired(true);
					this.byId("FECategory")._oLabel.setRequired(true);
					this.byId("FESubcategory")._oLabel.setRequired(true);
					this.byId("FEBrand")._oLabel.setRequired(true);
					this.byId("FESubbrand")._oLabel.setRequired(true);
				} else {
					if (oInput.ItemType === "SA") {
						this.byId("FEHub")._oLabel.setRequired(true);
						this.byId("FESub")._oLabel.setRequired(true);
					} else {
						this.byId("FEHub")._oLabel.setRequired(false);
						this.byId("FESub")._oLabel.setRequired(false);
					}
					this.byId("FECategory")._oLabel.setRequired(false);
					this.byId("FESubcategory")._oLabel.setRequired(false);
					this.byId("FEBrand")._oLabel.setRequired(false);
					this.byId("FESubbrand")._oLabel.setRequired(false);
				}
			}
			// psutram Modified Dec 12th 2016. 
			// For Status of Release/9014 the SubActivityType and Subsidary values cannot be modified
			if (oInput.Status === "9014") {
				oEnabled.SubactivityType = false;
				oEnabled.Sub = false;
				oEnabled.Hub = false;
				oEnabled.Category = false;
				oEnabled.Subcategory = false;
				oEnabled.Brand = false;
				oEnabled.Subbrand = false;
				oEnabled.CrossSubBrandButton = false; //INBHD02				
			} else {
				oEnabled.CrossSubBrandButton = true; //INBHD02
			}
			// end of changes
			oModel.refresh(false);
			if (oInput.ItemType === "AT" || oInput.ItemType === "SA") {
				oVisible.MaxValueC = false;
				// Activity
				if (oInput.ItemType === "AT") {
					oVisible.ProjectType = false;
					oVisible.ActivityType = true;
					oVisible.SubactivityType = false;
					oInput.SubactivityType = "";
					oInput.ProjectType = "";
					oInput.TypeDescription = this.getOwnerComponent().getModel("i18n").getProperty("AC_activity");
					oVisible.Retailer = true;
					oVisible.Agency = false;
					oVisible.MaestroBrief = true;
					oVisible.Costcenter = true;
					oVisible.PO = false;
					oVisible.GlAccount = false;
					oVisible.Status = true;
					//INBHD02
					oVisible.CrossSubBrand = false;
					oVisible.CrossSubBrandList = false;
					//INBHD02
				} else if (oInput.ItemType === "SA") {
					oInput.ProjectType = "";
					oInput.SubactivityType = oInput.ActivityType;
					oInput.ActivityType = oParent.ActivityType;
					oInput.ActivityTypeDesc = oParent.ActivityTypeDesc;
					oVisible.ProjectType = false;
					oVisible.ActivityType = true;
					oEnabled.ActivityType = false;
					oVisible.SubactivityType = true;
					oInput.TypeDescription = this.getOwnerComponent().getModel("i18n").getProperty("AC_subactivity");
					oVisible.Retailer = true;
					oVisible.Agency = true;
					oVisible.MaestroBrief = true;
					oVisible.GlAccount = true;
					oVisible.Costcenter = true;
					oVisible.PO = false;
					oVisible.Status = true;
					//INBHD02					
					oVisible.CrossSubBrand = true;
					oVisible.CrossSubBrandList = true;
					//INBHD02
					this._getSubactivityTypes();
				}
			} else if (oInput.ItemType === "PT") {
				oVisible.ProjectType = true;
				oInput.ProjectType = oInput.ActivityType;
				oVisible.ActivityType = false;
				oInput.ActivityType = "";
				oVisible.SubactivityType = false;
				oInput.SubactivityType = "";
				oVisible.Retailer = false;
				oVisible.Agency = false;
				oVisible.MaestroBrief = false;
				oInput.TypeDescription = this.getOwnerComponent().getModel("i18n").getProperty("AC_project");
				oVisible.GlAccount = false;
				oVisible.Costcenter = false;
				oVisible.PO = false;
				oVisible.Status = false;
				oVisible.MaxValueC = true;
				//INBHD02				
				oVisible.CrossSubBrand = false;
				oVisible.CrossSubBrandList = false;
				//INBHD02
			}
			if (!bNoChildDependency) {
				// Now we need to turn off editable of fields that shouldn't be edited
				oEnabled.Division = bNoChildDependency;
				oEnabled.Hub = bNoChildDependency;
				oEnabled.Sub = bNoChildDependency;
				oEnabled.ProjectType = bNoChildDependency;
				oEnabled.ActivityType = bNoChildDependency;
				oEnabled.SubactivityType = bNoChildDependency;
				oEnabled.StartDt = bNoChildDependency;
				oEnabled.EndDt = bNoChildDependency;
				oEnabled.Category = bNoChildDependency;
				oEnabled.Subcategory = bNoChildDependency;
				oEnabled.Brand = bNoChildDependency;
				oEnabled.Subbrand = bNoChildDependency;
				oEnabled.Channel = bNoChildDependency;
				oEnabled.Function = bNoChildDependency;
				oEnabled.Agency = bNoChildDependency;
				oEnabled.Retailer = bNoChildDependency;
				oEnabled.Demographics = bNoChildDependency;
				oEnabled.Costcenter = bNoChildDependency;
				oEnabled.MaestroBrief = bNoChildDependency;
				oPlaceholders.Division = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Hub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.ActivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.SubactivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Category = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Subbrand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Channel = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.ActivityType = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Function = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.Costcenter = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				oPlaceholders.MaestroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
			}
			oModel.refresh(false);
			// this.getModel("ChangeActivity").refresh(false);
		},
		_resetDemographics: function() {
			var oACData = this.getModel("ChangeActivity").getData();
			oACData.Enabled.Demographics = false;
			oACData.Input.Demographics = "";
			oACData.Demographics.Current = {};
			oACData.Placeholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_e");
		},
		_getDemographics: function() {
			// Get the Retailers
			var oRModel = this.getModel("Demographics");
			var oACModel = this.getModel("ChangeActivity");
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
			if (oACData.Input.SubKey && oACData.Input.SubKey !== "") {
				var filters = [];
				var sAdditionalData = "{ SUB:'" + oACData.Input.SubKey + "'}";
				filters.push(new sap.ui.model.Filter({
					path: "AdditionalData",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sAdditionalData
				}));
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
			}
		},
		_setDemographics: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.Demographics) {
				oData.Demographics = {};
			}
			oData.Demographics.Current = oDataIn.results;
			if (oData.Demographics.Current.length === 0) {
				oData.Enabled.Demographics = false;
				oData.Placeholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_n");
			} else {
				if (!JSON.parse(oData.Input.Config).Children) {
					var oParentSelect = this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent;
					if (oParentSelect && oParentSelect.hasOwnProperty("Demographics") && oParentSelect.Demographics !== "") {
						oData.Enabled.Demographics = false;
					} else {
						oData.Enabled.Demographics = true;
						oData.Placeholders.Demographics = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_demographics_e");
					}
				}
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetCostcenters: function() {
			var oACData = this.getModel("ChangeActivity").getData();
			oACData.Enabled.Costcenter = false;
			oACData.Input.Costcenter = "";
			oACData.Costcenter.Current = {};
			oACData.Placeholders.Costcenter = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_costcenter_e");
		},
		_getCostcenters: function() {
			// Get the Costcenter
			var oRModel = this.getModel("Costcenter");
			var oACModel = this.getModel("ChangeActivity");
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
			if (oACData.Input.SubKey && oACData.Input.SubKey !== "") {
				var filters = [];
				var sAdditionalData = "{ SUB:'" + oACData.Input.SubKey + "'}";
				filters.push(new sap.ui.model.Filter({
					path: "AdditionalData",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sAdditionalData
				}));
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
			}
		},
		_setCostcenters: function(oDataIn) {
			var oModel = this.getModel("ChangeActivity");
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
				if (!JSON.parse(oData.Input.Config).Children) {
					oData.Enabled.Costcenter = true;
					oData.Placeholders.Costcenter = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_costcenter_e");
				}
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetRetailers: function() {
			var oACData = this.getModel("ChangeActivity").getData();
			oACData.Enabled.Retailer = false;
			oACData.Input.Retailer = "";
			oACData.Retailer.Current = {};
			oACData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer");
		},
		_getRetailers: function() {
			// Get the Retailers
			var oRModel = this.getModel("Retailer");
			var oACModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.Retailer) {
				oData.Retailer = {};
			}
			oData.Retailer.Current = oDataIn.results;
			if (oData.Retailer.Current.length === 0) {
				oData.Enabled.Retailer = false;
				oData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer_n");
			} else {
				var oInput = this.getModel("ChangeActivity").getData().Input;
				var bNoChildDependency = !JSON.parse(oInput.Config).Children;
				oData.Enabled.Retailer = bNoChildDependency;
				if (bNoChildDependency) {
					oData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_retailer_e");
				} else {
					oData.Placeholders.Retailer = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hasChild");
				}
			}
			oModel.refresh(false);
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_resetAgencies: function() {
			var oACData = this.getModel("ChangeActivity").getData();
			oACData.Enabled.Agency = false;
			oACData.Input.Agency = "";
			oACData.Agency.Current = {};
			oACData.Placeholders.Agency = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency");
		},
		_getAgencies: function() {
			// Get the Retailers
			var oRModel = this.getModel("Agency");
			var oACModel = this.getModel("ChangeActivity");
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
				var sAdditionalData = "{ Sub:'" + oACData.Input.SubKey + "'}";
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
			var oModel = this.getModel("ChangeActivity");
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
			var oACData = this.getModel("ChangeActivity").getData();
			oACData.Enabled.MaestroBrief = false;
			oACData.Input.MaestroBrief = "";
			oACData.MaestroBrief.Current = {};
			oACData.Placeholders.MasteroBrief = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_maestroBrief");
		},
		_getMaestroBrief: function() {
			// Get the Retailers
			var oRModel = this.getModel("MaestroBrief");
			var oACModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
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
				this.byId("FEProjectType")._oLabel.setRequired(true);
				//BEGINNING OF EDITS - ALEX
				// this.byId("FEPriorityKey")._oLabel.setRequired(true);
				// this.byId("FEFunction")._oLabel.setRequired(true);
				//END OF EDITS - ALEX
				this.byId("FEStatus")._oLabel.setRequired(false);
				this.byId("FEActivityType")._oLabel.setRequired(false);
				this.byId("FESubactivityType")._oLabel.setRequired(false);
				this.byId("FEHub")._oLabel.setRequired(false);
				this.byId("FESub")._oLabel.setRequired(false);
			} else if (sItemType === "AT") {
				this.byId("FEProjectType")._oLabel.setRequired(false);
				this.byId("FEStatus")._oLabel.setRequired(true);
				this.byId("FEActivityType")._oLabel.setRequired(true);
				this.byId("FESubactivityType")._oLabel.setRequired(false);
				this.byId("FEHub")._oLabel.setRequired(false);
				this.byId("FESub")._oLabel.setRequired(false);
			} else if (sItemType === "SA") {
				this.byId("FEProjectType")._oLabel.setRequired(false);
				this.byId("FEStatus")._oLabel.setRequired(true);
				this.byId("FEActivityType")._oLabel.setRequired(true);
				this.byId("FESubactivityType")._oLabel.setRequired(true);
				// Begin of Changes - Khrystyne Williams - Feb 2017
				this.byId("FEHub")._oLabel.setRequired(true);
				this.byId("FESub")._oLabel.setRequired(true);
				// End of Changes - Khrystyne Williams - Feb 2017
			}
			// Flags the same for all  (This accessor should really be changed - it's using an internal interface now)
			// Begin of Changes - Khrystyne Williams - Nov 2016
			// this.byId("FEName")._oLabel.setRequired(true);
			// End of Changes - Khrystyne Williams - Nov 2016
			this.byId("FEDivision")._oLabel.setRequired(true);

			// Begin of Commenting - Khrystyne Williams - August 26, 2016
			// Make Category a non-mandatory field
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
			FieldCheckUtils.onCheckField(this, this.getModel("ChangeActivity"), "/Input/Name");
		},

		// INBHD02
		onSelectCrossBrand: function(oEvent) {
			var oModel = this.getModel("ChangeActivity");
			// var oInput = oModel.getData();

			if (!this.oPersonalizationDialog) {
				this.oPersonalizationDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.CrossSubBrand", this);
				this.getView().addDependent(this.oPersonalizationDialog);
				this._getdefaultCSBfilter();
				this._initializeCSBCount(oModel);
			}
			this.oPersonalizationDialog.open();
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
						// text: 'Are you sure you want to discard all the changes?'
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
			if (CSBCategoryKey) {
				filters.push(new sap.ui.model.Filter("CategoryKey", sap.ui.model.FilterOperator.EQ, CSBCategoryKey));
			}
			if (CSBSubcategoryKey) {
				filters.push(new sap.ui.model.Filter("PcategoryKey", sap.ui.model.FilterOperator.EQ, CSBSubcategoryKey));
			}
			if (CSBBrandKey) {
				filters.push(new sap.ui.model.Filter("BrandKey", sap.ui.model.FilterOperator.EQ, CSBBrandKey));
			}
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
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner

			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.CSBSubbrand) {
				oData.CSBSubbrand = {};
			}
			oData.CSBSubbrand.Current = [];
			oData.CSBSubbrand.Current = oDataIn.results;
			// oData.CSBSubbrand.Count.Current = "(" + oData.CSBSubbrand.Current.length + ")";
			oModel.refresh(false);
			this._setinitialCSBSubbrandvalues();

			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},

		_onCSBFilterchange: function(oEvent) {
			var oModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
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
			if (oInput.CSBSubbrand.CSBCategoryKey) {
				filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBCategoryKey));
			}
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();

			if (!oData.CSBSubcategory) {
				oData.CSBSubcategory = {};
			}
			oData.CSBSubcategory.Current = [];
			oData.CSBSubcategory.Current = oDataIn.results;
			oModel.refresh(false);
		},

		_getCSBBrand: function() {
			var oModel = this.getModel("ChangeActivity");
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
			if (oInput.CSBSubbrand.CSBCategoryKey) {
				filters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBCategoryKey));
			}
			if (oInput.CSBSubbrand.CSBSubcategoryKey) {
				filters.push(new sap.ui.model.Filter("PSubCategory", sap.ui.model.FilterOperator.EQ, oInput.CSBSubbrand.CSBSubcategoryKey));
			}
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
			var oModel = this.getModel("ChangeActivity");
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
			if (AsmID) {
				filters.push(new sap.ui.model.Filter("AsmId", sap.ui.model.FilterOperator.EQ, AsmID));
			}
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.CSBSubbrand) {
				oData.CSBSubbrand = {};
			}

			if (oDataIn.results.length === 0) {
				oData.CSBSubbrand.Selected = [];
			} else {
				oData.CSBSubbrand.Selected = oDataIn.results;
			}

			oData.CSBSubbrand.Count.Selected = "(" + oData.CSBSubbrand.Selected.length + ")";
			oModel.refresh(false);
		},

		_getdefaultCSBfilter: function() {
			var oModel = this.getModel("ChangeActivity");
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

			var oModel = this.getModel("ChangeActivity");
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
			var oModel = this.getModel("ChangeActivity");
			var oData = oModel.getData();
			if (!oData.CSBCategory) {
				oData.CSBCategory = {};
			}
			oData.CSBCategory.Current = [];
			oData.CSBCategory.Current = oDataIn.results;
			oModel.refresh(false);
		},

		_addCSBbrands: function(oEvent) {
			var oModel = this.getModel("ChangeActivity"),
				CSBTable = oEvent.oSource.getParent().getParent(),
				SelectedRowContext = CSBTable.getSelectedIndices(),
				binding = CSBTable.getBinding("rows"),
				bindingaIndices = binding.aIndices;

			if (SelectedRowContext.length) {
				for (var i = 0; i < SelectedRowContext.length; i++) {
					var rowIndices = "",
						newdata = {},
						FData = {};

					rowIndices = bindingaIndices[SelectedRowContext[i]];

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
				// var reverse = [].concat(binding.aIndices).reverse();
				reverse.forEach(function(index) {
					oModel.getData().CSBSubbrand.Current.splice(index, 1);
				});

				oModel.oData.CSBSubbrand.Count.Selected = "(" + oModel.oData.CSBSubbrand.Selected.length + ")";
				oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";

				// oModel.oData.CSBSubbrand.Current.sort();

				oModel.refresh(false);
				oModel.oData.CSBSubbrand.Selected.sort();
				CSBTable.clearSelection();

			} else {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_CSBAddError");
				MessageToast.show(sMessage);
			}
		},

		_deleteCSBBrands: function(oEvent) {
			var oModel = this.getModel("ChangeActivity"),
				oChange = oModel.getData().CSBSubbrand.Change,

				CSBTable_Selected = oEvent.oSource.getParent().getParent(),
				SelectedRowCount = CSBTable_Selected.getSelectedIndices(),
				binding = CSBTable_Selected.getBinding("rows"),
				SelectedRowContext = binding.aIndices;

			if (SelectedRowCount.length) {
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

				// var reverse = [].concat(CSBTable_Selected.getSelectedIndices()).reverse();
				var reverse = [].concat(binding.aIndices).reverse();
				reverse.forEach(function(index) {
					oModel.getData().CSBSubbrand.Selected.splice(index, 1);
				});

				oModel.oData.CSBSubbrand.Count.Selected = "(" + oModel.oData.CSBSubbrand.Selected.length + ")";
				oModel.oData.CSBSubbrand.Count.Current = "(" + oModel.oData.CSBSubbrand.Current.length + ")";

				// oModel.oData.CSBSubbrand.Selected.sort();

				oModel.refresh(false);
				oModel.oData.CSBSubbrand.Current.sort();
			} else {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_CSBDeleteError");
				MessageToast.show(sMessage);
			}

		},

		_setinitialCSBSubbrandvalues: function() {
			var oModel = this.getModel("ChangeActivity");

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
		},

		_discardallCSBChange: function() {
			var oModel = this.getModel("ChangeActivity");

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
		},

		_initializeCSBCount: function(oModel) {
			var oData = oModel.getData();

			if (oData.CSBSubbrand.Selected.length) {
				oData.CSBSubbrand.Count.Selected = {};
				oData.CSBSubbrand.Count.Selected = "(" + oData.CSBSubbrand.Selected.length + ")";
			} else {
				oData.CSBSubbrand.Count.Selected = "(0)";
			}

			oModel.refresh(false);
		}

		// sortCSBTable: function(oTable) {

		// 	oTable.sort(oView.byId("name"), SortOrder.Ascending, true);
		// }

		// INBHD02		
	});
});