/*global location */
sap.ui.define([
	"colgate/asm/planning/base/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"colgate/asm/planning/base/model/formatter",
	"colgate/asm/planning/base/util/ValidationUtils",
	"colgate/asm/planning/base/util/PersonalizationUtils",
	"colgate/asm/planning/base/util/CustomCurrencyType",
	"colgate/asm/planning/base/util/CustomCurrencyTypeFull",
	"colgate/asm/planning/base/util/CopyUtils",
	"colgate/asm/planning/base/util/StatusChangeUtils",
	"colgate/asm/planning/base/util/ColumnCatalog",
	"colgate/asm/planning/base/util/FieldControlUtils",
	"colgate/asm/planning/base/util/MonthPicker",
	"sap/m/MessageToast",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	'sap/ui/model/Filter',
	'sap/ui/model/Sorter',
	'sap/m/MessageBox',
	'sap/m/Dialog',
	'sap/ui/layout/VerticalLayout',
	'sap/ui/layout/HorizontalLayout',
	'colgate/asm/planning/base/util/VendorUtils',
	'colgate/asm/planning/base/util/TimeoutUtils',
	'colgate/asm/planning/base/util/OverlayUtils',
	"colgate/asm/planning/base/util/SpinnerUtils"
], function(BaseController, JSONModel, formatter, ValidationUtils, PersonalizationUtils, CustomCurrencyType, CustomCurrencyTypeFull,
	CopyUtils, StatusChangeUtils, ColumnCatalog, FieldControlUtils,
	MonthPicker, MessageToast, MessagePopover, MessagePopoverItem, Filter, Sorter,
	MessageBox, Dialog, VerticalLayout,
	HorizontalLayout, VendorUtils, TimeoutUtils, OverlayUtils, SpinnerUtils) {
	"use strict";

	return BaseController.extend("colgate.asm.planning.base.controller.Activities", {

		formatter: formatter,
		_oDialog: null,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				oTableControl: {
					editable: false,
					visibleRowCount: 15,
					addEnabled: true,
					ssaveEnabled: false,
					statusEnabled: true,
					selMatchEnabled: false,
					editEnabled: false,
					copyEnabled: false, //Added by Dipen on June 7th, 2016
					deleteEnabled: false,
					checkEnabled: true,
					distributeEnabled: false,
					projectFilterEnabled: true,
					eMailVisible: true,
					clearVisible: true,
					personalizeVisible: true,
					bAddVisible: true,
					bSSaveVisible: false,
					bDeleteVisible: true,
					bCheckVisible: true,
					bSCancelVisible: false,
					bVariantVisible: true,
					bStatusVisible: true,
					bEditVisible: true,
					bCopyVisible: true,
					bDisplayVisible: true,
					bValidateVisible: false,
					bSaveVisible: false,
					bCancelVisible: false,
					bEMailVisible: true,
					bClearVisible: true,
					bPersonalizeVisible: true,
					bDistributeVisible: false,
					//psutram modified Dec 15th, 2016 to include Refresh and Calculate functionality
					bRefreshVisible: true,
					refreshEnabled: true,
					bCalculateVisible: false,
					calculateEnabled: true,
					projectFilterText: this.getOwnerComponent().getModel("i18n").getProperty("TS_myProjects"),
					projectFilterPressed: true,
					projectFilterCount: 0,
					projectFilterYear: "",
					projectFilterYearNew: ""

				},
				oPlaceholder: {
					budget: this.getOwnerComponent().getModel("i18n").getProperty("C_P_Budget")
				},
				oTabButtons: {
					visible: {
						save: false,
						edit: true,
						cancel: false
					}
				},
				oDynText: {
					rows: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_filter", ["0", "0"]),
					shareSendEMailSubject: "Subject",
					shareSendEMailMessage: "Here's the Message"
				},
				oTabHeader: {
					currency: "",
					mode: "Normal"
				},
				oFStatus: {
					Selected: "",
					Options: [],
					Enabled: true,
					Visible: true,
					Placeholder: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_P_fStatus", [])
				},
				oTStatus: {
					Selected: "",
					Options: [],
					Enabled: false,
					Visible: true,
					Placeholder: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_P_tStatus_e", [])
				},
				oDist: {
					Amt: 0
				}
			});

			this.getRouter().getRoute("activities").attachPatternMatched(this._onObjectMatched, this);
			oViewModel.setSizeLimit(50000);
			this.setModel(oViewModel, "projectView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			var oBaseModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
			oBaseModel.setSizeLimit(50000);
			this.setModel(oBaseModel);

			//GDH - Receive events when screen is shown 
			var oEventBus = sap.ui.getCore().getEventBus();
			this._Event_ConfigurationLoaded = false;
			this._Event_VariantsSet = false;
			this._Event_PersonalizationInitialized = false;
			oEventBus.subscribe("colgate.asm.planning.master.listItemSelected", "Activities", function(sChannelId, sEventId, oData) {
				// USERA04 / 2-1-17 / Resets display from status mode.
				var cMode = this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.currentMode;
				if (cMode === "Edit" || cMode === "Status") {
					// Cancel Edit or Status Mode
					// if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.currentMode === "Edit") {
					var that = this;
					var oData2 = oData;
					sap.m.MessageBox.show(
						this.getModel("i18n").getResourceBundle().getText("B_T_confirmCancel_Body"), {
							icon: sap.m.MessageBox.Icon.QUESTION,
							title: this.getModel("i18n").getResourceBundle().getText("B_T_confirmSwitch"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction) {
								if (oAction === sap.m.MessageBox.Action.YES) {
									if (cMode === "Status") {
										sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.button.pressed", "CancelStatus", {});
									} else {
										that.onCancel(null);
										that._getItems(oData2);
									}
								}
							}
						}
					);
				} else {
					this._getItems(oData);
				}
			}, this);

			//DblClick Changes // USERA04 // 3/7/17
			oEventBus.subscribe("colgate.asm.planning.master.listItemSelected", "Update", function(sChannelId, sEventId, oData) {
				var cMode = this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.currentMode;
				if (cMode === "Edit" || cMode === "Status") {
					var that = this;
					sap.m.MessageBox.show(
						this.getModel("i18n").getResourceBundle().getText("B_T_confirmCancel_Body"), {
							icon: sap.m.MessageBox.Icon.QUESTION,
							title: this.getModel("i18n").getResourceBundle().getText("B_T_editRow"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction) {
								if (oAction === sap.m.MessageBox.Action.YES) {
									that.onEdit(oData);
								}
							}
						}
					);
				} else {
					this.onEdit(oData);
				}
			}, this);
			//End Of USERA04

			// Eric Atempa / 1-27-2017 / Added new subscribe to refresh data
			oEventBus.subscribe("colgate.asm.planning.master.reinitialize", "CurrencyChange", function(sChannelId, sEventId, oData) {
				this.onCancel(null);
				this._getItems(oData);
			}, this);

			oEventBus.subscribe("colgate.asm.planning.master.reinitialize", "ChangeStatus", function(sChannelId, sEventId, oData) {
				//			    this._onStatusChange(null);
				this._getItems(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.activities", "RecalculateTotals", function(sChannelId, sEventId, oData) {
				var that = this;
				setTimeout(function() {
					that._validateInput();
				}, 200);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.master.button.pressed", "Projects", function(sChannelId, sEventId, oData) {
				this._onButtonPressed(null, oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.project", "Refresh", function(sChannelId, sEventId, oData) {
				this._onRefresh(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.project", "Errors", function(sChannelId, sEventId, oData) {
				this._handleODataErrors(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.project", "Success", function(sChannelId, sEventId, oData) {
				this._handleODataSuccess(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.project", "ApplyStyles", function(sChannelId, sEventId, oData) {
				var that = this;
				setTimeout(function() {
					that._setRowStyle();
				}, 100);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.master.button.pressed", "CancelStatus", function(sChannelId, sEventId, oData) {
				this._onStatusChange(null);
			}, this);

			//DblClick Changes // USERA04 // 3/7/17
			oEventBus.subscribe("colgate.asm.planning.master.button.pressed", "CancelBudgetEdit", function(sChannelId, sEventId, oData) {
				this.__setBudgetEditable(false);
			}, this);
			//End of USERA04

			oEventBus.subscribe("colgate.asm.planning.master.button.pressed", "SaveStatus", function(sChannelId, sEventId, oData) {
				StatusChangeUtils.onSave(this, MessageToast);
			}, this);
			// oEventBus.subscribe("colgate.asm.planning.master.event", "UserDataLoaded", function(sChannelId, sEventId, oData) {
			// 	// Update table personalization
			// }, this);
			oEventBus.subscribe("colgate.asm.planning.app.event", "InitializationComplete", function(sChannelId, sEventId, oData) {
				// Update table personalization
				if (this.getOwnerComponent().getModel("masterShared") && this.getOwnerComponent().getModel("masterShared").getData()) {
					if (!this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/activityPersonalizedInitialized")) {
						this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/activityPersonalizationInitialized", true);
						this._p13nInitialize();
						this._setUpInitialVariant();
						this._onRefresh();
					}
				}
				this._confirmHeaderVisibilitySettings();
			}, this);

			oEventBus.subscribe("colgate.asm.planning.app.event", "StartEventComplete", function(sChannelId, sEventId, oData) {
				if (oData.Location === "RoleOverlay") {
					this._RoleOverlayComplete = true;
				}
				if (oData.Location === "LocationList") {
					this._LocationListComplete = true;
				}
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				this.getOwnerComponent().getModel("masterShared").refresh(false);
				if (this._RoleOverlayComplete && this._LocationListComplete) {
					var that = this;
					setTimeout(function() {
						that._allowGetItems = true;
						that._getItems(that._lastSelectionConfig);
					}, 200);
				}
			}, this);

			// Set up the initial selections
			var oData = {};
			oData.OnScreen = [];
			oData.AsInputArray = [];
			oData.FromService = [];
			oData.ChangeControls = [];
			oData.CurrentChangeControl = {};
			var oModel = new sap.ui.model.json.JSONModel(oData);
			oModel.setSizeLimit(50000);
			this.setModel(oModel, "Project");

			//Set up error handling
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			this.oMessageManager = oMessageManager;
			this.oMessageProcessor = oMessageProcessor;

			// Set up number of rows for the table
			var oTable = this.byId("Table");
			var oBinding = oTable.getBinding("rows");
			oBinding.attachChange(function(sReason) {
				var totalRows = this.getModel("Project").getData().AsInputArray.length;
				var iTableRowCount = oBinding.getLength();
				this.getModel("projectView").getData().oDynText.rows =
					this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_filter", [iTableRowCount, totalRows]);
				// Set the Visible Row Count
				if (this.getOwnerComponent().getModel("P13n")) {
					var iMaxTableRows = parseInt(this.getOwnerComponent().getModel("P13n_ActivitiesConfig").getData().MaxTableRows);
					if (iTableRowCount > iMaxTableRows) {
						iTableRowCount = iMaxTableRows;
					}
					this.getModel("projectView").getData().oTableControl.visibleRowCount = iTableRowCount;
				}
				this.getModel("projectView").refresh(false);
				// Add in a check to see if there are entries where the filter should not be shown anymore.
				var aFilters = oBinding.aFilters;
				var aColumns = this.byId("Table").getColumns();
				for (var i = 0; i < aColumns.length; i++) {
					if (aColumns[i].getFiltered()) {
						var bFiltered = false;
						for (var j = 0; j < aFilters.length; j++) {
							if (aFilters[j].sPath.substring(aFilters[j].sPath.lastIndexOf(">") + 1) === aColumns[i].getFilterProperty()) {
								bFiltered = true;
							}
						}
						aColumns[i].setFiltered(bFiltered);
					}
				}
				//				this._validateInput(); // Used to re-calculate totals.
				//				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "ApplyStyles", {});
			}, this);
			oTable.attachColumnMove({}, function(oEvent) {
				this.__setVariantChangedIndicator();
			}, this);
			oTable.attachColumnResize({}, function(oEvent) {
				this.__setVariantChangedIndicator();
			}, this);

			var that = this;
			// Note: The below event is not officially supported and the tie back to the SAPUI5 framework (via the path) could change.
			// This was done only because the requirement was deemed to be important - but it is understood that supporting double click
			// can add extra effort to the support of this product.
			oTable.attachBrowserEvent("dblclick", function(oEvent) {
				var sPath = oEvent.target.id;
				if (sPath.indexOf("-row") > 0) {
					var iIndex = parseInt(sPath.substring(sPath.indexOf("-row") + 4));
					var iRow = oTable.getRows()[iIndex].getIndex();
					oTable.clearSelection();
					oTable.addSelectionInterval(iRow, iRow);

					//DblClick Changes // USERA04 // 3/7/17
					//that.onEdit(oEvent);
					oEventBus = sap.ui.getCore().getEventBus();
					oEventBus.publish("colgate.asm.planning.master.listItemSelected", "Update", oEvent);
					//End Of USERA04

				}
			});

			this._onRefresh();
			$(document).ready(function() {
				// Attach Scroll Handler  
				// that.byId("Table")._oVSb.attachScroll(function() {
				// 	sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "ApplyStyles", {});
				// });
			});
			this.byId("Table").addEventDelegate({
				onAfterRendering: function() {
					this._validateInput(); // To re-calculate totals
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "ApplyStyles", {});
				}
			}, this);
			// 			PSW add 2 lines May 16th 2016
			var oTitle = this.getOwnerComponent().getModel("i18n").getProperty("CP_PopUpTitle");
			this.byId("Variant-popover-popover-title").setText(oTitle);
			// This section is using internal interfaces to set P13n titles that are not directly accessible via the public interface.  
			// If possible, this should be moved to public interfaces.
			var oManagementTable = this.byId("Variant").oManagementTable;
			var oManagementSave = this.byId("Variant").oSaveSave;
			var that = this;
			oManagementTable.onAfterRendering = function() {
				that.byId("Variant-managementHeaderText").setText(that.getOwnerComponent().getModel("i18n").getProperty("CP_ManageVariantTitle"));
				that.byId("Variant-managementsave").setText(that.getOwnerComponent().getModel("i18n").getProperty("CP_ManageVariantSave"));
				var aItems = this.getItems();
				var aVariants = that.getOwnerComponent().getModel("P13n_Variants").getProperty("/Variants");
				var sDefaultVariant = that.getOwnerComponent().getModel("P13n_Variants").getProperty("/DefaultVariant");
				for (var i = 0; i < aItems.length; i++) {
					var oItem = aItems[i];
					if (oItem) {
						var aCells = oItem.getCells();
						if (aCells.length > 3) {
							if (oItem.getKey() === "*standard*") {
								aCells[1].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_shared"));
								aCells[3].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_authorInternal"));
								if (sDefaultVariant === "*standard*") {
									aCells[2].setSelected(true);
								} else {
									aCells[2].setSelected(false);
								}
							} else {
								if (aCells[4]) {
									if (aCells[4].getEnabled()) {
										aCells[1].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_private"));
										aCells[3].setText(that.getOwnerComponent().getModel("masterShared").getProperty("/oUser/name"));
									} else {
										aCells[1].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_shared"));
										aCells[3].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_authorInternal"));
									}
								} else {
									// There is no Author entry in the pop-up (for older version of UI5)
									if (aCells[3].getEnabled()) {
										aCells[1].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_private"));
									} else {
										aCells[1].setText(that.getOwnerComponent().getModel("i18n").getProperty("V_shared"));
									}
								}
								aCells[2].setSelected(false);
								for (var j = 0; j < aVariants.length; j++) {
									if (oItem.getKey() === "Variant" + j && sDefaultVariant === "Variant" + j) {
										aCells[2].setSelected(true);
										j = aVariants.length;
									}
								}
							}
						}
					}
				}
			};
			oManagementSave.onAfterRendering = function() {
				that.byId("Variant-savedialog-title").setText(that.getOwnerComponent().getModel("i18n").getProperty("CP_SaveAsTitle"));
			};
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		// /**
		//  * Event handler when the share in JAM button has been clicked
		//  * @public
		//  */
		// onShareInJamPress: function() {
		// 	var oViewModel = this.getModel("projectView"),
		// 		oShareDialog = sap.ui.getCore().createComponent({
		// 			name: "sap.collaboration.components.fiori.sharing.dialog",
		// 			settings: {
		// 				object: {
		// 					id: location.href,
		// 					share: oViewModel.getProperty("/shareOnJamTitle")
		// 				}
		// 			}
		// 		});

		// 	oShareDialog.open();
		// },

		// handleViewSettingsDialogButtonPressed: function(oEvent) {
		// 	if (!this._oDialog) {
		// 		this._oDialog = sap.ui.xmlfragment("colgate.asm.planning.base.view.ProjectsTableControl", this);
		// 		// For some reason, the internationalized texts aren't working in the XML for this screen, so they must be set
		// 		var aSort = this._oDialog.getSortItems();
		// 		for (var i = 0; i < aSort.length; i++) {
		// 			var sId = aSort[i].getId();
		// 			if (sId === "CTC_Brand") {
		// 				aSort[i].setText(this.getModel("i18n").getProperty("C_L_brand"));
		// 			} else if (sId === "CTC_Subbrand") {
		// 				aSort[i].setText(this.getModel("i18n").getProperty("C_L_subbrand"));
		// 			} else if (sId === "CTC_Project") {
		// 				aSort[i].setText(this.getModel("i18n").getProperty("C_L_project"));
		// 			} else if (sId === "CTC_Category") {
		// 				aSort[i].setText(this.getModel("i18n").getProperty("C_L_category"));
		// 			} else if (sId === "CTC_Priority") {
		// 				aSort[i].setText(this.getModel("i18n").getProperty("C_L_priority"));
		// 			} else if (sId === "CTC_Plan") {
		// 				aSort[i].setText(this.getModel("i18n").getProperty("C_L_plan"));
		// 			}
		// 		}
		// 	}
		// 	// toggle compact style
		// 	jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		// 	this._oDialog.open();
		// },
		onToggle: function(oEvent) {
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "ApplyStyles", {});
		},
		onRowSelectionChange: function(oEvent) {
			// Begin of Commenting - Khrystyne Williams - Nov 2016
			// ValidationUtils.removeErrorMessages(this);
			// End of Commenting - Khrystyne Williams - Nov 2016
			var aSelected = this.byId("Table").getSelectedIndices();
			var oTableControlConfig = this.getModel("projectView").getData().oTableControl;
			if (aSelected.length > 0) {
				if (aSelected[0] === 0) {
					oTableControlConfig.deleteEnabled = false;
				} else {
					oTableControlConfig.deleteEnabled = true;
				}
				if (aSelected.length === 1 && aSelected[0] !== 0) {
					oTableControlConfig.editEnabled = true;
					oTableControlConfig.distributeEnabled = true;

					// psutram added for Calculate button					
					oTableControlConfig.calculateEnabled = true;

					// Begin of Changes - Khrystyne Williams - Nov 2016
					// if (oTableControlConfig.bSSaveVisible) {
					// This means you are in Plan & Budget Edit Mode
					//Added by Dipen on June 7, 2016
					// Begin of Commenting - Khrystyne Williams - Nov 2016
					oTableControlConfig.copyEnabled = true;
					// if (oTableControlConfig.bSaveVisible) {
					// 	// End of Changes - Khrystyne Williams - Nov 2016
					// 	// This means you are in Status mode
					// 	var sFStatus = this.getModel("projectView").getProperty("/oFStatus/Selected");
					// 	if (!sFStatus || sFStatus === "") {
					// 		var iHoldSelected = aSelected[0];
					// 		var sPath = this.byId("Table").getContextByIndex(aSelected[0]).getPath();
					// 		var oTableSelect = JSON.parse(JSON.stringify(this.getModel("Project").getProperty(sPath)));
					// 		this.getModel("projectView").setProperty("/oFStatus/Selected", oTableSelect.Status);
					// 		this.onFStatusChange({});
					// 		this.byId("Table").addSelectionInterval(iHoldSelected, iHoldSelected);
					// 	}
					// }
					// End of Commenting - Khrystyne Williams - Nov 2016
					// Check if in displayOnlyMode
					// Now that we have advanced copy as well, we can't just go off and display the record until someone 
					// presses the button.
					// if (this.getOwnerComponent().getModel("masterShared") &&
					// 	this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/displayOnlyMode") === true) {
					// 	this.onDisplay(oEvent);
					// }
				} else {
					oTableControlConfig.editEnabled = false;
					oTableControlConfig.distributeEnabled = true;

					//psutram modified for Refresh functionality
					//oTableControlConfig.bRefreshVisible = false;
					//psutram modified for Calculator functionality
					//oTableControlConfig.bCalculateVisible = true;
					//oTableControlConfig.calculateEnabled = true;

					//Added by Dipen on June 7, 2016
					oTableControlConfig.copyEnabled = false;
				}
			} else {
				oTableControlConfig.deleteEnabled = false;
				oTableControlConfig.editEnabled = false;
				oTableControlConfig.distributeEnabled = false;

				// psutram modified for Calculator functionality
				//oTableControlConfig.calculateEnabled = false;

				//Added by Dipen on June 7, 2016
				oTableControlConfig.copyEnabled = false;
			}
			this.getModel("projectView").refresh(false);
		},
		onAddActivity: function(oEvent) {
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			this.getOwnerComponent().getModel("masterShared").refresh(false);
			var oTableSelectTemplate = {};
			var oTableSelect = {};
			// Begin of Changes - Khrystyne Williams - Nov 2016
			var addnew = true;
			// End of Changes - Khrystyne Williams - Nov 2016
			oTableSelectTemplate.DivisionKey = "";
			oTableSelectTemplate.HubKey = "";
			oTableSelectTemplate.SubKey = "";
			oTableSelectTemplate.Function = "";
			oTableSelectTemplate.Channel = "";
			var aSelected = this.byId("Table").getSelectedIndices();
			if (aSelected.length > 1) {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_AddActivity_2");
				MessageToast.show(sMessage);
				oTableSelect = oTableSelectTemplate;
				// Begin of Changes - Khrystyne Williams - Nov 2016
				addnew = false;
				// End of Changes - Khrystyne Williams - Nov 2016
			} else {
				if (aSelected.length === 1) {
					// Must update the geo model
					var sPath = this.byId("Table").getContextByIndex(aSelected[0]).getPath();
					oTableSelect = JSON.parse(JSON.stringify(this.getModel("Project").getProperty(sPath)));
					if (oTableSelect.ItemType === "SA") {
						var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_AddActivity_Sub");
						MessageToast.show(sMessage);
						oTableSelect = oTableSelectTemplate;
						addnew = false;
					} else {
						// Eric Atempa / 2-1-17 / Changes for Cancel
						if (oTableSelect.ItemType === "PT") {
							this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "NewATWithPT";
						} else if (oTableSelect.ItemType === "AT") {
							this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "NewSAWithAT";
						}

						oTableSelect.ParentGuid = oTableSelect.Guid;
						oTableSelect.__parentIndex = oTableSelect.__index;
					}
				} else {
					oTableSelectTemplate.DivisionKey = "NoParent";
					oTableSelect = oTableSelectTemplate;
				}
			}
			this.getOwnerComponent().getModel("masterShared").getData().oTableSelect = oTableSelect;
			var that = this;
			// Begin of Changes - Khrystyne Williams - Nov 2016
			if (addnew) {
				setTimeout(function() {
					that._onAddActivity(oEvent);
				}, 200);
			} else {
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.spinner", "StopSpinner", {});
			}
			// End of Changes - Khrystyne Williams - Nov 2016
		},

		getMyProjects: function(oEvent) {
			//INBHD02			
			var oModel = this.getModel("projectView");
			var oTableControlData = oModel.getData().oTableControl;

			if (oTableControlData.projectFilterYearNew !== oTableControlData.projectFilterYear) {
				oTableControlData.projectFilterYearNew = oTableControlData.projectFilterYear;
				oTableControlData.projectFilterCount = 0;
			} else {
				oTableControlData.projectFilterCount++;
			}

			oModel.refresh(false);

			var bPressed = oEvent.mParameters.pressed;
			if (oTableControlData.projectFilterCount === 0) {
				if (oTableControlData.projectFilterPressed === true) {
					this._getMyProjects(bPressed);
				} else {
					this._getItems(this._lastSelectionConfig);
				}
			} else {
				this._getMyProjects(bPressed);
			}
		},

		_getMyProjects: function(bPressed) {
			this.byId("Table").clearSelection();
			if (bPressed === true) {
				var oMyProjectFilter = new Filter("_myItem", sap.ui.model.FilterOperator.EQ, "X");
				this.getView().byId("Table").getBinding("rows").filter(oMyProjectFilter, "Application");
				this._validateInput();
			} else {
				this.getView().byId("Table").getBinding("rows").filter(null, "Application");
				this._validateInput();
			}
		},

		onShowTableSettings: function(oEvent) {
			var oButton = oEvent.getSource();
			// create action sheet only once
			if (!this._tableActionSheet) {
				this._tableActionSheet = sap.ui.xmlfragment(
					"colgate.asm.planning.base.fragment.TableSettings",
					this
				);
				this.getView().addDependent(this._tableActionSheet);
			}
			this._tableActionSheet.openBy(oButton);
		},
		onCopy: function(oEvent) {
			var that = this;
			var dialog = new Dialog("cp_dialog", {
				title: this.getModel("i18n").getResourceBundle().getText("CP_title"),
				type: 'Message',
				content: [
					new sap.m.HBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Center,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.m.Label({
								text: this.getModel("i18n").getResourceBundle().getText("CP_include")
							}),
							new sap.m.CheckBox("cp_include", {})
						]
					}),
					new sap.m.HBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Center,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.m.Label({
								text: this.getModel("i18n").getResourceBundle().getText("CP_includeBudget")
							}),
							new sap.m.CheckBox("cp_includeBudget", {})
						]
					}),
					//INBHD02
					new sap.m.HBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Center,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.m.Label({
								text: this.getModel("i18n").getResourceBundle().getText("CP_includeCSB")
							}),
							new sap.m.CheckBox("cp_includeCSB", {})
						]
					})
					//INBHD02
				],
				beginButton: new sap.m.Button({
					text: this.getModel("i18n").getResourceBundle().getText("CP_copy"),
					press: function() {
						var bInclude = sap.ui.getCore().byId("cp_include").getSelected();
						var bIncludeBudget = sap.ui.getCore().byId("cp_includeBudget").getSelected();
						var bIncludeCSB = sap.ui.getCore().byId("cp_includeCSB").getSelected();

						var sPrefix = "";
						var aSelected = that.byId("Table").getSelectedIndices();
						if (aSelected.length === 1) {
							var sPath = that.byId("Table").getContextByIndex(aSelected[0]).getPath();
							var oTableSelect = JSON.parse(JSON.stringify(that.getModel("Project").getProperty(sPath)));
							CopyUtils.copyItems(that, bInclude, bIncludeBudget, bIncludeCSB, sPrefix, oTableSelect, that.getModel("Project").getProperty(
								"/AsInputArray"));
							dialog.close();
						}
					}
				}),
				endButton: new sap.m.Button({
					text: this.getModel("i18n").getResourceBundle().getText("CP_cancel"),
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
		onSave: function(oEvent) {
			var bComplete = this.onValidateFull(null);
			if (bComplete) {
				this._saveBudget();
			}
		},
		onConfirmCancel: function() {
			var that = this;
			sap.m.MessageBox.show(
				this.getModel("i18n").getResourceBundle().getText("B_T_confirmCancel_Body"), {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: this.getModel("i18n").getResourceBundle().getText("B_T_confirmCancel"),
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							that.onCancel(null);
						}

					}
				}
			);
		},
		onCancel: function(oEvent) {
			this.getModel("projectView").setProperty("/oTableControl/bEditVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/statusEnabled", true);
			this.getModel("projectView").setProperty("/oTableControl/bValidateVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bSaveVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bCancelVisible", false);
			// Begin of Changes - Khrystyne Williams - Nov 2016
			this.getModel("projectView").setProperty("/oTableControl/bAddVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/selMatchEnabled", false);
			this.getModel("projectView").setProperty("/oTableControl/bDistributeVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", true);

			// psutram modified for Calculate and Refresh functionality
			this.getModel("projectView").setProperty("/oTableControl/bCalculateVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", true);

			this.onSelectNone(oEvent);
			// End of Changes - Khrystyne Williams - Nov 2016
			this.__setBudgetEditable(false);
			var oTree = this.getModel("Project").getProperty("/FromService");
			this.getModel("Project").setProperty("/OnScreen", JSON.parse(JSON.stringify(oTree)));
			this.onValidate(null);
			this.getModel("Project").refresh(false);

			// Something like this will be needed again for edit screens.
			// this.oMessageManager.removeAllMessages();
			// var oModel = this.getModel("Project");
			// var oData = oModel.getData();
			// var aOnScreen = oData.OnScreen;
			// var aFromService = oData.FromService;
			// for (var i = 0; i < aOnScreen.length; i++) {
			// 	aOnScreen[i].Budget = aFromService[i].Budget;
			// 	aOnScreen[i].Budget_valueState = sap.ui.core.ValueState.None;
			// 	aOnScreen[i].Budget_valueStateText = "";
			// }
			// // Make sure bad values in the screen are restored
			// var aItems = this.byId("Table").getItems();
			// for (var i = 0; i < aItems.length; i++) {
			// 	// Because of the auto typing and limitation on certain browsers
			// 	// we must do a separate check
			// 	var nIndex = aItems[i].getId().indexOf('-');
			// 	if (nIndex > 0) {
			// 		// This is to get rid of the grouping rows
			// 		var sSuffix = aItems[i].getId().substring(nIndex + 1);
			// 		var sPrefix = this.byId("budgetInput").getId();
			// 		var sId = sPrefix + "-" + sSuffix;
			// 		var oBudgetInput = this.byId(sPrefix + "-" + sSuffix);
			// 		var sBindingPath = oBudgetInput.getBinding("value").getBindings()[0].getContext().getPath();
			// 		var nIndex = sBindingPath.substring(sBindingPath.lastIndexOf("/") + 1);
			// 		oBudgetInput.setValue(aOnScreen[nIndex].Budget);
			// 	}
			// }
			// oModel.refresh(false);
			// this.getModel("projectView").setProperty("/oTableControl/editable", false);
			// this.getModel("projectView").setProperty("/oTabButtons/visible/edit", true);
			// this.getModel("projectView").setProperty("/oTabButtons/visible/cancel", false);
			// this.getModel("projectView").setProperty("/oTabButtons/visible/save", false);
		},
		onTStatusChange: function(oEvent) {
			// Enable Save
			if (oEvent.getSource().getSelectedKey() !== "") {
				this.getModel("projectView").setProperty("/oTableControl/sSaveEnabled", true);
			}
		},
		onFStatusChange: function(oEvent) {
			// Clear out target values
			this.getModel("projectView").setProperty("/oTableControl/sSaveEnabled", false);
			this.getModel("projectView").setProperty("/oTStatus/Selected", "");
			var sFStatus = this.getModel("projectView").getProperty("/oFStatus/Selected");
			if (sFStatus && sFStatus !== "") {
				this.getModel("projectView").setProperty("/oTableControl/selMatchEnabled", true);
			} else {
				this.getModel("projectView").setProperty("/oTableControl/selMatchEnabled", false);
			}
			// Check all table entries that match
			//var oTable = this.byId("Table");
			// Begin of Commenting - Khrystyne Williams - Nov 2016
			// Do not clear selection if the From Status changes
			// oTable.clearSelection();
			// End of Commenting - Khrystyne Williams - Nov 2016
			var oHoldRecord = null;
			for (var i = 0; i < this.getModel("Project").getProperty("/AsInputArray").length; i++) {
				// Update Rows
				//var oContext = oTable.getContextByIndex(i);
				// There is an apparent bug in SAPUI5.  The first time through, the final record seems unable to be read  We are less than the threshold.
				//if (oContext) {
				//var sPath = oContext.getPath();
				//var oRecord = this.getModel("Project").getProperty(sPath);
				var oRecord = this.getModel("Project").getProperty("/AsInputArray")[i];
				if (oRecord.Status === sFStatus && oRecord.ItemType !== "PT") {
					//GDH						oTable.addSelectionInterval(i, i);
					if (!oHoldRecord) {
						oHoldRecord = oRecord;
						i = this.getModel("Project").getData().AsInputArray.length;
					}
				}
				//}
			}
			if (oHoldRecord) {
				// Determine possible to statuses 
				var oConfig = {};
				var oUserData = this.getOwnerComponent().getModel("UserData");
				var sRole = oUserData.getProperty("/Role");
				if (oHoldRecord.Config && oHoldRecord.Config !== "") {
					oConfig = JSON.parse(oHoldRecord.Config);
					var aStatuses = oConfig.StatusList;
					var aSOptions = [];
					for (var m = 0; m < aStatuses.length; m++) {
						var sStatus = aStatuses[m].Status;
						var sDescription = aStatuses[m].Description;
						var bInclude = true;
						var aExclude = aStatuses[m].Exclude;
						if (sStatus === oHoldRecord.Status) {
							// They can't change the status back to what it is.
							bInclude = false;
						} else {
							for (var j = 0; j < aExclude.length; j++) {
								if (aExclude[j] === sRole) {
									bInclude = false;
								}
							}
						}
						if (bInclude) {
							aSOptions.push({
								Status: sStatus,
								Description: sDescription
							});
						}
					}
					this.getModel("projectView").setProperty("/oTStatus/Options", aSOptions);
					if (aSOptions.length > 0) {
						this.getModel("projectView").setProperty("/oTStatus/Enabled", true);
						this.getModel("projectView").setProperty("/oTStatus/Placeholder", this.getOwnerComponent().getModel("i18n").getResourceBundle()
							.getText(
								"S_P_tStatus", []));
					} else {
						this.getModel("projectView").setProperty("/oTStatus/Enabled", false);
						this.getModel("projectView").setProperty("/oTStatus/Placeholder", this.getOwnerComponent().getModel("i18n").getResourceBundle()
							.getText(
								"S_P_tStatus_n", []));
					}
				}
			}
		},
		onBudgetEdit: function(oEvent) {
			this.__setBudgetEditable(true);
		},
		onEdit: function(oEvent) {
			var oTableSelect = {};
			var aSelected = this.byId("Table").getSelectedIndices();
			if (aSelected.length === 1) {
				// Must update the geo model
				var sPath = this.byId("Table").getContextByIndex(aSelected[0]).getPath();
				oTableSelect = JSON.parse(JSON.stringify(this.getModel("Project").getProperty(sPath)));

				// First check if the record can be edited
				var bEditable = this._checkEditability(oTableSelect);
				if (!bEditable) {
					// Tell the user they can't edit
					MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_wrongStatusChange", []));
				} else {
					this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
					this.getOwnerComponent().getModel("masterShared").refresh(false);
					this.getOwnerComponent().getModel("masterShared").getData().oTableSelect = oTableSelect;
					this.getOwnerComponent().getModel("masterShared").getData().oTableSelectRaw = this.getModel("Project").getData().AsInputArray[
						oTableSelect.__index];
					if (oTableSelect.ItemType === "AT" || oTableSelect.ItemType === "SA") {
						this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent = this.getModel("Project").getData().AsInputArray[
							oTableSelect.__parentIndex];
					} else {
						this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent = {};
					}
					var that = this;
					setTimeout(function() {
						// GDH Navigate to Change Activity Screen
						var oRouter = that.getRouter();
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.initialize", "ChangeActivity", {});
						that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "NavToChangeActivity";
						oRouter.navTo("changeActivity", {
							objectId: "ChangeActivity"
						}, true);
					}, 200);
				}
			}
		},
		onDisplay: function(oEvent) {
			var oTableSelect = {};
			var aSelected = this.byId("Table").getSelectedIndices();
			if (aSelected.length === 1) {
				// Must update the geo model
				var sPath = this.byId("Table").getContextByIndex(aSelected[0]).getPath();
				oTableSelect = JSON.parse(JSON.stringify(this.getModel("Project").getProperty(sPath)));
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				this.getOwnerComponent().getModel("masterShared").refresh(false);
				this.getOwnerComponent().getModel("masterShared").getData().oTableSelect = oTableSelect;
				this.getOwnerComponent().getModel("masterShared").getData().oTableSelectRaw = this.getModel("Project").getData().AsInputArray[
					oTableSelect.__index];
				if (oTableSelect.ItemType === "AT" || oTableSelect.ItemType === "SA") {
					this.getOwnerComponent().getModel("masterShared").getData().oTableSelectParent = this.getModel("Project").getData().AsInputArray[
						oTableSelect.__parentIndex];
				}
				var that = this;
				setTimeout(function() {
					// GDH Navigate to Add Activity Screen
					var oRouter = that.getRouter();
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.initialize", "ChangeActivity", {});
					that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "NavToDisplayActivity";
					oRouter.navTo("displayActivity", {
						objectId: "DisplayActivity"
					}, true);
				}, 200);
			}
		},
		_checkEditability: function(oRecord) {
			var oUserData = this.getOwnerComponent().getModel("UserData");
			var sRole = oUserData.getProperty("/Role");
			var oConfig = {};
			var bError = false;
			if (oRecord.Config && oRecord.Config !== "") {
				oConfig = JSON.parse(oRecord.Config);
				var aExclude = oConfig.Edit.Exclude;
				for (var i = 0; i < aExclude.length; i++) {
					if (aExclude[i] === sRole) {
						bError = true;
					}
				}
			}
			return !bError;
		},
		_checkCapEditability: function(oRecord) {
			var oUserData = this.getOwnerComponent().getModel("UserData");
			var sUser = oUserData.getProperty("/Username");
			var aDelegates = oUserData.getProperty("/DelegateToUsers/results");
			var bEditable = false;
			if (sUser === oRecord.CreatedBy) {
				bEditable = true;
			}
			for (var i = 0; i < aDelegates.length; i++) {
				if (aDelegates[i].MainUser === oRecord.CreatedBy) {
					bEditable = true;
				}
			}
			return bEditable;
		},
		onCheck: function(oEvent) {
			ValidationUtils.completenessCheck(this);
		},
		// psutram Modified to add confirm delete
		onDelete: function(oEvent) {
			var that = this;
			sap.m.MessageBox.show(
				this.getModel("i18n").getResourceBundle().getText("B_T_confirmDelete_Body"), {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: this.getModel("i18n").getResourceBundle().getText("B_T_confirmDelete_Title"),
					actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.DELETE) {
							that.onDeleteConfirm();
						}
					}
				}
			);
		},

		// psutram: modified for Delete confirm functionality. method has been renamed from onDelete and parameter to method is different
		onDeleteConfirm: function() {
			this.oMessageManager.removeAllMessages();
			var aSelected = this.byId("Table").getSelectedIndices();
			var oData = this.getModel("Project").getData();
			var aAsInputArray = oData.AsInputArray;
			var oModel = this.getModel();
			var bAllowDelete = true;
			if (aSelected.length > 0) {
				for (var j = 0; j < aSelected.length; j++) {
					// Check if there are any chosen records which cannot be deleted.
					var sPath = this.byId("Table").getContextByIndex(aSelected[j]).getPath();
					var oDeletable = JSON.parse(aAsInputArray[this.getModel("Project").getProperty(sPath).__index].Config);
					if (!oDeletable.Delete) {
						bAllowDelete = false;
						j = aSelected.length;
					}
				}
				if (bAllowDelete) {
					this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
					this.getOwnerComponent().getModel("masterShared").refresh(false);
					var that = this;
					setTimeout(function() {
						var aKeys = Object.keys(aAsInputArray[0]);
						that.nTotalCurrentChanges = parseInt(aSelected.length);
						that.nChangeCount = parseInt(that.nTotalCurrentChanges);
						for (var i = 0; i < aSelected.length; i++) {
							var iIndex = that.getModel("Project").getProperty(that.byId("Table").getContextByIndex(aSelected[i]).getPath()).__index;
							var sPath = aAsInputArray[iIndex].__metadata.uri.substring(aAsInputArray[iIndex].__metadata.uri.lastIndexOf("/"));
							var that2 = that;
							oModel.remove(sPath, {
								success: function(oData, oResponse) {
									TimeoutUtils.onResetTimer(that2);
									that2.nChangeCount = parseInt(that2.nChangeCount) - 1;
									if (that2.nChangeCount === 0) {
										var oEventData = {};
										oEventData.oDataOrigin = "Delete";
										that2.nPendingChangeCount = 1;
										sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
									}
								},
								error: function(oError) {
									that2.nChangeCount = parseInt(that2.nChangeCount) - 1;
									if (that2.nChangeCount === 0) {
										oError.ErrorOrigin = "Delete";
										that2.nPendingChangeCount = 1;
										sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
									}
								},
								changeSetId: aAsInputArray[iIndex].Id
							});
						}
					}, 200);
				} else {
					var oEventData = {};
					oEventData.oDataOrigin = "NotAllowed";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
				}
			} else {
				var oEventData = {};
				oEventData.oDataOrigin = "NoChanges";
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
			}
		},

		// psutram modified Dec 15th 2016, to add refresh functionality
		onPressRefresh: function(oEvent) {
			this._onRefresh();
		},
		onPressCalculate: function(oEvent) {
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.activities", "RecalculateTotals", {});
		},
		// end of change

		//Added by Dipen on June 7, 2016
		onCopyActivity: function(oEvent) {
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			this.getOwnerComponent().getModel("masterShared").refresh(false);
			var aSelected = this.byId("Table").getSelectedIndices();
			var oTableSelect = {};
			var oModel = this.getModel("Project");
			var oData = oModel.getData();
			var oOrigData = oData.FromService;
			var oProject;
			var selectedProject = null;

			//Set the selected property to null to remove any previously selected items
			this.getModel("projectView").setProperty("/oCopySelection/Selected", null);
			if (aSelected.length > 1) {
				var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_AddActivity_2");
				MessageToast.show(sMessage);
				//oTableSelect = oTableSelectTemplate;
			} else {
				if (aSelected.length === 1) {
					// Must update the geo model
					var sPath = this.byId("Table").getContextByIndex(aSelected[0]).getPath();
					oTableSelect = JSON.parse(JSON.stringify(this.getModel("Project").getProperty(sPath)));
					//put the selected item as the value of Selected Property of project view
					this.getModel("projectView").setProperty("/oCopySelection/Selected", oTableSelect); //Added on May 23, 2016
					//need to access this Selected property from Copy View to render the table in that view
					//alert(oTableSelect.Guid);
					//alert(oOrigData[0]._projectCount);
					for (var i = 0; i < oOrigData[0]._projectCount; i++) {
						oProject = oOrigData[0][i];
						if (oTableSelect.Guid === oProject.Guid) {
							selectedProject = oProject;
							break;
						}
					}
					if (selectedProject === undefined || selectedProject === null) {

						if (oTableSelect.ItemType === "SA") {

							var iProjCount = 0;
							while (oOrigData[0][iProjCount] !== undefined) {
								var iActCount = 0;
								while (oOrigData[0][iProjCount][iActCount] !== undefined) {
									var iSubCount = 0;
									while (oOrigData[0][iProjCount][iActCount][iSubCount] !== undefined) {
										if (oOrigData[0][iProjCount][iActCount][iSubCount].Guid === oTableSelect.Guid) {
											selectedProject = oOrigData[0][iProjCount];
											selectedProject.isRowEditable = false;
											selectedProject.isCheckVisible = false;

											break;
										}
										iSubCount++;
									}
									iActCount++;
								}
								iProjCount++;

							}
							var iActCount = 0;
							while (selectedProject[iActCount] !== undefined) {
								var iSubActCount = 0;

								selectedProject[iActCount].isRowEditable = false;
								selectedProject[iActCount].isCheckVisible = false;

								while (selectedProject[iActCount][iSubActCount] !== undefined) {
									selectedProject[iActCount][iSubActCount].isCheckVisible = false;

									if (selectedProject[iActCount][iSubActCount].Guid === oTableSelect.Guid) {
										selectedProject[iActCount][iSubActCount].isRowEditable = true;
									} else {
										selectedProject[iActCount][iSubActCount].isRowEditable = false;
									}
									iSubActCount++;
								}
								iActCount++;
							}

						} else {
							selectedProject = oTableSelect;
							selectedProject.AmtBTot.toString();
							selectedProject.AmtATot.toString();

							// Begin of Changes - Khrystyne Williams - Nov 2016
							selectedProject.AmtLeTot.toString();
							// End of Changes - Khrystyne Williams - Nov 2016

							var iParIndex = selectedProject.__parentIndex;
							var oSelectedParent = new Object();
							for (var i = 0; i < oOrigData[0]._projectCount; i++) {

								if (iParIndex === oOrigData[0][i].__index) {
									oSelectedParent = oOrigData[0][i];
									oSelectedParent.isRowEditable = false;
									oSelectedParent.isCheckVisible = false;
									break;
								}
							}

							jQuery.each(oSelectedParent, function(i, val) {
								if ((typeof val === "object") && (val !== null)) {
									if (val.Guid !== selectedProject.Guid) // delete index
									{
										oSelectedParent[i].isRowEditable = false;
										oSelectedParent[i].isCheckVisible = false;
										var iCountf = 0;
										while (oSelectedParent[i][iCountf] !== undefined) {
											oSelectedParent[i][iCountf].isRowEditable = false;
											oSelectedParent[i][iCountf].isCheckVisible = false;
											iCountf++;
										}

									} else {
										oSelectedParent[i].isRowEditable = true;
										oSelectedParent[i].isCheckVisible = false;
										var iCount = 0;
										while (oSelectedParent[i][iCount] !== undefined) {
											oSelectedParent[i][iCount].isRowEditable = true;
											oSelectedParent[i][iCount].isCheckVisible = true;
											oSelectedParent[i][iCount].isSelected = true;
											iCount++;
										}

									}
								}

							});

							selectedProject = oSelectedParent;
						}
					} else {
						selectedProject.isRowEditable = true;
						selectedProject.isCheckVisible = false;
						jQuery.each(selectedProject, function(i, val) {
							if ((typeof val === "object") && (val !== null)) {
								selectedProject[i].isRowEditable = true;
								selectedProject[i].isCheckVisible = false;

								jQuery.each(selectedProject[i], function(j, val) {
									if ((typeof val === "object") && (val !== null)) {
										selectedProject[i][j].isRowEditable = true;
										selectedProject[i][j].isCheckVisible = false;

									}
								});

							}
						});

					}

					this.getModel("masterShared").getData().oTableSelect = JSON.parse(JSON.stringify(selectedProject));
					this.getModel("masterShared").getData().oRawActivities = this.getModel("Project").getProperty("/AsInputArray");
					this.getModel("masterShared").getData().oP13n = this.getModel("P13n").getData();

				}
			}
			//this.getModel("masterShared").getData().oTableSelect = oTableSelect; //Dipen May 24, 2016
			var that = this;
			setTimeout(function() {
				that._onCopyActivity(oEvent);
			}, 200);
			//this._onCopyActivity(oEvent); 
		},

		onStatusChange: function(oEvent) {
			this._onStatusChange(oEvent);
		},
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
					//GDH this._onMessageSelected(oEvent); Turn off Navigation
				}, this);
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
		},
		// onConfirmViewSettingsDialog: function(oEvent) {

		// 	var oView = this.getView();
		// 	var oTable = oView.byId("Table");

		// 	var mParams = oEvent.getParameters();
		// 	var oBinding = oTable.getBinding("items");

		// 	// apply sorter to binding
		// 	// (grouping comes before sorting)
		// 	var aSorters = [];
		// 	if (mParams.groupItem) {
		// 		var sPath = mParams.groupItem.getKey();
		// 		var bDescending = mParams.groupDescending;
		// 		var vGroup = this.mGroupFunctions[sPath];
		// 		sPath = "Project>" + sPath;
		// 		aSorters.push(new Sorter(sPath, bDescending, vGroup));
		// 	}
		// 	var sPath = mParams.sortItem.getKey();
		// 	var bDescending = mParams.sortDescending;
		// 	aSorters.push(new Sorter(sPath, bDescending));
		// 	oBinding.sort(aSorters);

		// 	// apply filters to binding
		// 	var aFilters = [];
		// 	jQuery.each(mParams.filterItems, function(i, oItem) {
		// 		var sKey = oItem.getKey();
		// 		if (sKey === "Filter1") {
		// 			var oFilter = new Filter("Budget", "LT", "0.01", "");
		// 			aFilters.push(oFilter);
		// 		}
		// 	});
		// 	oBinding.filter(aFilters);

		// 	// update filter bar
		// 	oView.byId("vsdFilterBar").setVisible(aFilters.length > 0);
		// 	oView.byId("vsdFilterLabel").setText(mParams.filterString);
		// },
		onClearAllFilters: function(oEvent) {
			this._onClearAllFilters(oEvent);
			//psutram: for clear filters
			//sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.event", "ClearFilter", {});
		},
		_onClearAllFilters: function(oEvent) {
			var oTable = this.byId("Table");
			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				oTable.filter(aColumns[i], null);
			}
			this.getModel("projectView").setProperty("/oTableControl/projectFilterPressed", false);
			this._getMyProjects(false);
		},
		onShowP13nScreen: function(oEvent) {
			this._openP13nDialog();
		},
		onP13nHandleClose: function(oEvent) {
			// Check if MaxTableRows has changed.
			if (this.getOwnerComponent().getModel("P13n_ActivitiesConfig").getProperty("/MaxTableRows") !== this.getOwnerComponent().getModel(
					"P13n_default").getProperty(
					"/OtherConfig/MaxTableRows") &&
				this.getOwnerComponent().getModel("P13n_ActivitiesConfig").getProperty("/MaxTableRows") !== this.getOwnerComponent().getModel(
					"P13n_Configuration").getProperty(
					"/ActivitiesConfig/MaxTableRows")) {
				PersonalizationUtils.p13nSave2(this, this.getOwnerComponent().getModel("P13n_ActivitiesConfig").getData(), "ActivitiesConfig",
					this.getOwnerComponent()
					.getModel(
						"i18n").getResourceBundle().getText("CP_rowsSaved"));
				this.getOwnerComponent().getModel("P13n_Configuration").setProperty("/ActivitiesConfig", this.getOwnerComponent().getModel(
					"P13n_ActivitiesConfig").getData());
				// Set the Visible Row Count
				var iTableRowCount = this.byId("Table").getBinding("rows").getLength();
				if (this.getOwnerComponent().getModel("P13n")) {
					var iMaxTableRows = parseInt(this.getOwnerComponent().getModel("P13n_ActivitiesConfig").getData().MaxTableRows);
					if (iTableRowCount > iMaxTableRows) {
						iTableRowCount = iMaxTableRows;
					}
					this.getModel("projectView").getData().oTableControl.visibleRowCount = iTableRowCount;
				}
				this.getModel("projectView").refresh(false);
			}
			// Now we must sort the columns in the table based on configuration
			this._syncConfigAndTable();
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.oPersonalizationDialog.close();
		},
		onP13nHandleCancel: function(oEvent) {
			// Go back to the values that were showing
			var oVariants = this.byId("Variant");
			var sSelectionKey = oVariants.getSelectionKey();
			if (sSelectionKey && sSelectionKey.substring(0, 7) === "Variant") {
				var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
				var iIndex = sSelectionKey.replace("Variant", "");
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(aVariants[iIndex].PersData));
			} else {
				// This is the default variant.
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(this.getOwnerComponent().getModel("P13n_default").getData(
					""))));
			}
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.oPersonalizationDialog.close();
			if (this.oPersonalizationDialog) {
				this.oPersonalizationDialog.destroy();
				this.oPersonalizationDialog = null;
			}
			this.__removeVariantChangedIndicator();
		},
		// onP13nHandleReset: function(oEvent) {
		// 	// In this case add back the default settings
		// 	var oDefaultModel = this.getOwnerComponent().getModel("P13n_default");
		// 	this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(oDefaultModel.getData())));
		// 	this._syncConfigAndTable();
		// 	this.getOwnerComponent().getModel("P13n").refresh(false);
		// 	this.oPersonalizationDialog.close();
		// 	this.__removeVariantChangedIndicator();
		// },
		onP13nHandleReload: function(oEvent) {
			// In this case add back the default settings
			var oVariants = this.byId("Variant");
			var sSelectionKey = oVariants.getSelectionKey();
			if (sSelectionKey.startsWith("Variant")) {
				var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
				var iIndex = sSelectionKey.replace("Variant", "");
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(aVariants[iIndex])));
			} else {
				// This is the default variant.
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(this.getOwnerComponent().getModel("P13n_default").getData(
					""))));
			}
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.oPersonalizationDialog.close();
			this.__removeVariantChangedIndicator();
		},
		onP13nAddColumnsItem: function(oEvent) {
			var sColumn = oEvent.getParameter("newItem").getProperty("columnKey");
			if (sColumn === "Project>Name") {
				oEvent.getParameter("newItem").setProperty("index", 0);
				oEvent.getParameter("newItem").setProperty("visible", true);
			} else if (oEvent.getParameter("newItem").getProperty("index") === 0) {
				oEvent.getParameter("newItem").setProperty("index", 1);
			}
			var sColumn = oEvent.getParameter("newItem").getProperty("columnKey");
			if (oEvent.getParameter("newItem").mProperties.hasOwnProperty("visible")) {
				var bVisible = oEvent.getParameters().newItem.mProperties.visible;
				var oData = this.getOwnerComponent().getModel("P13n").getData();
				for (var i = 0; i < oData.ColumnCollection.length; i++) {
					var oColumn = oData.ColumnCollection[i];
					var oFixedColumn = oData.FixedColumnConfig[oColumn.columnIndex];
					if (oColumn.path === sColumn) {
						oColumn.visible = bVisible;
						oFixedColumn.visible = bVisible;
						i = oData.ColumnCollection.length;
					}
				}
				this.getOwnerComponent().getModel("P13n").refresh(false);
			}
			this.__setVariantChangedIndicator();
		},
		onP13nSave: function(oEvent) {
			this._updateP13nConfigForColumnWidth();
			var oData = this.getOwnerComponent().getModel("P13n").getData();
			var sGuid = "";
			if (oEvent.getParameters().overwrite) {
				var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
				var iIndex = oEvent.getParameters().key.replace("Variant", "");
				sGuid = aVariants[iIndex].Guid;
			}
			var sDefaultVar = " ";
			if (oEvent.getParameters().def) {
				sDefaultVar = "X";
			}
			var sDescription = oEvent.getParameters().name;
			PersonalizationUtils.p13nVariantSave(this, oData, "PlanningVariants", sGuid, sDefaultVar, sDescription, oEvent.getParameters().overwrite);
			this.__removeVariantChangedIndicator();
		},
		onP13nChangeColumnsItem: function(oEvent) {
			var aItems = oEvent.getParameter("newItems");
			var aConfig = this.getOwnerComponent().getModel("P13n").getData().ColumnCollection;
			for (var i = 0; i < aItems.length; i++) {
				var sColumnKey = aItems[i].getColumnKey();
				if (aItems[i].mProperties.hasOwnProperty("index")) {
					var iNewIndex = aItems[i].mProperties.index;
					for (var j = 0; j < aConfig.length; j++) {
						var sHoldColumnKey = aConfig[j].path;
						if (sColumnKey === sHoldColumnKey) {
							var oHoldEntry = aConfig[j];
							if (iNewIndex > j) {
								// Moving Down
								for (var k = j; k < iNewIndex; k++) {
									aConfig[k] = aConfig[k + 1];
								}
							} else {
								// Moving Up
								for (var k = j; k > iNewIndex; k--) {
									aConfig[k] = aConfig[k - 1];
								}
							}
							aConfig[iNewIndex] = oHoldEntry;
							j = aConfig.length;
						}
					}
					var aIConfig = oEvent.getSource().getItems();
					for (var j = 0; j < aIConfig.length; j++) {
						if (sColumnKey === aIConfig[j].getColumnKey()) {
							var aNotVisible = [];
							var oHoldEntry = aIConfig[j];
							oEvent.getSource().removeItem(oHoldEntry);
							var aDisplayItems = oEvent.getSource().removeAllItems();
							for (var k = 0; k < aDisplayItems.length; k++) {
								if (k === iNewIndex) {
									oEvent.getSource().addItem(oHoldEntry);
								}
								if (aDisplayItems[k].getVisible()) {
									oEvent.getSource().addItem(aDisplayItems[k]);
								} else {
									aNotVisible.push(aDisplayItems[k]);
								}
							}
							for (var l = 0; l < aNotVisible.length; l++) {
								oEvent.getSource().addItem(aNotVisible[l]);
							}
							j = aIConfig.length;
						}
					}
					this.getOwnerComponent().getModel("P13n").refresh(false);
				} else {
					// Still move unchecked down to the bottom
					var aNotVisible = [];
					var aResult = [];
					for (var j = 0; j < aConfig.length; j++) {
						if (aConfig[j].visible) {
							aResult.push(aConfig[j]);
						} else {
							aNotVisible.push(aConfig[j]);
						}
					}
					for (var k = 0; k < aResult.length; k++) {
						aConfig[k] = aResult[k];
					}
					for (var k = 0; k < aNotVisible.length; k++) {
						aConfig[k + aResult.length] = aNotVisible[k];
					}
					// Make sure order is the same
					var aDisplayItems = oEvent.getSource().removeAllItems();
					for (var l = 0; l < aConfig.length; l++) {
						// Find the match in the display
						for (var m = 0; m < aDisplayItems.length; m++) {
							if (aConfig[l].path === aDisplayItems[m].getColumnKey()) {
								oEvent.getSource().addItem(aDisplayItems[m]);
								m = aDisplayItems.length;
							}
						}
					}
					this.getOwnerComponent().getModel("P13n").refresh(false);
					i = aItems.length;
				}
			}
			this.__setVariantChangedIndicator();
		},
		onColumnMove: function(oEvent) {
			var oConfig = this.getOwnerComponent().getModel("P13n").getData();
			var aColumnData = oConfig.ColumnCollection;
			//GDH 20170326 var sMovedColumn = oEvent.getParameter("column").getLabel().getText();
			var sMovedColumn = oEvent.getParameter("column").getId().split("--Column")[1];
			var iNewIndex = oEvent.getParameter("newPos");
			// Figure out where the column was before
			for (var i = 0; i < aColumnData.length; i++) {
				//GDH 20170326 if (aColumnData[i].text === sMovedColumn) {
				if (Number(aColumnData[i].columnIndex).toString() === sMovedColumn) {
					var oHoldEntry = aColumnData[i];
					if (iNewIndex > i) {
						// Moving Down
						for (var j = i; j < iNewIndex; j++) {
							aColumnData[j] = aColumnData[j + 1];
						}

					} else {
						// Moving Up
						for (var j = i; j > iNewIndex; j--) {
							aColumnData[j] = aColumnData[j - 1];
						}
					}
					aColumnData[iNewIndex] = oHoldEntry;
					i = aColumnData.length;
				}
			}
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onColumnFilter: function(oEvent) {
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.activities", "RecalculateTotals", {});
		},
		onShareEmailPress: function() {
			var oViewModel = this.getModel("projectView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/oDynText/shareSendEMailSubject"),
				oViewModel.getProperty("/oDynText/shareSendEMailMessage")
			);
		},

		// psutram: original method of onValidate
		onValidate: function(oEvent) {
			this.oMessageManager.removeAllMessages();
			var bDataValid = true;
			bDataValid = this._validateInput();
			var oModel = this.getModel("Project");
			var oOnScreen = oModel.getProperty("/OnScreen");
			if (oOnScreen.hasOwnProperty("0")) {
				var aRows = this.byId("Table").getRows();
				for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
					var oProject = oOnScreen[0][i];
					for (var j = 0; j < oProject._activityCount; j++) {
						var sPath = "/OnScreen/0/" + i + "/" + j;
						var oActivityRow = ValidationUtils.getTableRow(sPath, "Project", aRows);
						var oActivity = oProject[j];
						this._setupMessageManager(oActivityRow, oActivity);
						for (var k = 0; k < oActivity._subactivityCount; k++) {
							sPath = "/OnScreen/0/" + i + "/" + j + "/" + k;
							var oSubactivityRow = ValidationUtils.getTableRow(sPath, "Project", aRows);
							var oSubactivity = oActivity[k];
							this._setupMessageManager(oSubactivityRow, oSubactivity);
						}
					}
				}
				oModel.refresh(false);
			}
			return bDataValid;
		},

		onValidateFull: function(oEvent) {
			this.oMessageManager.removeAllMessages();
			var bDataValid = true;
			bDataValid = this._validateInput();
			var oModel = this.getModel("Project");
			var oOnScreen = oModel.getProperty("/OnScreen");
			if (oOnScreen.hasOwnProperty("0")) {
				var aRows = this.byId("Table").getRows();
				for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
					var oProject = oOnScreen[0][i];

					for (var j = 0; j < oProject._activityCount; j++) {
						var sPath = "/OnScreen/0/" + i + "/" + j;
						var oActivityRow = ValidationUtils.getTableRow(sPath, "Project", aRows);
						var oActivity = oProject[j];

						this._setupMessageManager(oActivityRow, oActivity);
						for (var k = 0; k < oActivity._subactivityCount; k++) {
							sPath = "/OnScreen/0/" + i + "/" + j + "/" + k;
							var oSubactivityRow = ValidationUtils.getTableRow(sPath, "Project", aRows);
							var oSubactivity = oActivity[k];
							this._setupMessageManager(oSubactivityRow, oSubactivity);
							var oRecord = this.getModel("Project").getProperty(sPath);

							var tATStartDt = new Date(oActivity.StartDt).getTime();
							var tATEndDt = new Date(oActivity.EndDt).getTime();
							var tSAStartDt = new Date(oSubactivity.StartDt).getTime();
							var tSAEndDt = new Date(oSubactivity.EndDt).getTime();

							if (tSAStartDt > tSAEndDt) {
								if (oSubactivity.FC_Editable_StartDt === true) {
									bDataValid = false;
									var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_StartDt_LT_EndDt_Error", [
										oSubactivity.Id
									]);

									oRecord["FC_ValueState_StartDt"] = sap.ui.core.ValueState.Error;
									oRecord["FC_ValueStateText_StartDt"] = sMessage;
									this.oMessageManager.addMessages(
										new sap.ui.core.message.Message({
											message: sMessage,
											description: "",
											type: oRecord["FC_ValueState_StartDt"],
											processor: this.oMessageProcessor
										})
									);
									//MessageToast.show(sMessage);
								}
							}
							if (tSAStartDt < tATStartDt || tSAStartDt > tATEndDt) {
								if (oSubactivity.FC_Editable_StartDt === true) {
									bDataValid = false;
									var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_StartDt_NOT_BTW_ActivityDt_Error", [
										oSubactivity.Id
									]);

									oRecord["FC_ValueState_StartDt"] = sap.ui.core.ValueState.Error;
									oRecord["FC_ValueStateText_StartDt"] = sMessage;
									this.oMessageManager.addMessages(
										new sap.ui.core.message.Message({
											message: sMessage,
											description: "",
											type: oRecord["FC_ValueState_StartDt"],
											processor: this.oMessageProcessor
										})
									);
									//MessageToast.show(sMessage);
								}
							}

							if (tSAEndDt < tATStartDt || tSAEndDt > tATEndDt) {

								if (oSubactivity.FC_Editable_StartDt === true) {
									bDataValid = false;
									var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_EndDt_NOT_BTW_ActivityDt_Error", [
										oSubactivity.Id
									]);

									oRecord["FC_ValueState_EndDt"] = sap.ui.core.ValueState.Error;
									oRecord["FC_ValueStateText_EndDt"] = sMessage;
									this.oMessageManager.addMessages(
										new sap.ui.core.message.Message({
											message: sMessage,
											description: "",
											type: oRecord["FC_ValueState_EndDt"],
											processor: this.oMessageProcessor
										})
									);
									//	MessageToast.show(sMessage);

								}
							}
							// end of changes
						}
					}
				}
				oModel.refresh(false);
			}
			return bDataValid;
		},

		_setStyleMode: function(mode) {
			var oPage = this.byId("page");
			var oBar = this.byId("page-intHeader");
			var sTitleExtension = "";
			var oInternalEvents = this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents;
			if (oBar) {
				if (mode === "Edit") {
					this.getOwnerComponent().getModel("masterShared").getData().oFilters.oExclude = {};
					oInternalEvents.currentMode = "Edit";
					oBar.removeStyleClass("ModeStatus");
					//					oBar.$().removeClass("ModeStatus");
					oBar.addStyleClass("ModeEdit");
					//					oBar.$().addClass("ModeEdit");
					sTitleExtension = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("A_M_Edit");
				} else if (mode === "Status") {
					// Begin of Addition - Khrystyne Williams - August 30, 2016
					this.getOwnerComponent().getModel("masterShared").getData().oFilters.oExclude = {};
					// End of Addition - Khrystyne Williams - August 30, 2016
					oInternalEvents.currentMode = "Status";
					oBar.addStyleClass("ModeStatus");
					oBar.removeStyleClass("ModeEdit");
					sTitleExtension = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("A_M_Status");
				} else if (mode === "Display") {
					this.getOwnerComponent().getModel("masterShared").getData().oFilters.oExclude = {};
					oInternalEvents.currentMode = "Display";
					oBar.removeStyleClass("ModeStatus");
					//					oBar.$().removeClass("ModeStatus");
					oBar.removeStyleClass("ModeEdit");
					//					oBar.$().removeClass("ModeEdit");
				}
			}
			// get side panel filters from this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect the descriptions of the side panel filters
			// get personalisation filters from this.getOwnerComponent().getModel("P13n").getData().FilterItems
			var oFilterDesc = this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect;
			var oExclude = this.getOwnerComponent().getModel("masterShared").getData().oFilters.oExclude;
			var sFilterExtension = "";
			var sDiv = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("HF_Div", []);
			var sHub = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("HF_Hub", []);
			var sSub = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("HF_Sub", []);
			var sAllDiv = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("HF_AllDiv", []);
			if (oFilterDesc.DivisionText !== "" && !oExclude.Division) {
				sFilterExtension = (" " + sDiv + " " + oFilterDesc.DivisionText);
			} else {
				sFilterExtension = (" " + sDiv + " " + sAllDiv);
			}
			if (oFilterDesc.HubText !== "" && !oExclude.Hub) {
				sFilterExtension = (sFilterExtension + " |" + sHub + " " + oFilterDesc.HubText);
			}
			if (oFilterDesc.SubText !== "" && !oExclude.Sub) {
				sFilterExtension = (sFilterExtension + " |" + sSub + " " + oFilterDesc.SubText);
			}
			var sFilterExtension2 = "";
			// Begin of Commenting - Khrystyne Williams - August 30, 2016
			// if (mode !== "Status") {
			if (this.getOwnerComponent().getModel("P13n")) {
				var aFilterItems = this.getOwnerComponent().getModel("P13n").getData().FilterItems;
				for (var i = 0; i < aFilterItems.length; i++) {
					var filterType = aFilterItems[i].operation;
					if (aFilterItems[i].hasOwnProperty("exclude") && aFilterItems[i].exclude) {
						filterType = "NE";
					}
					var value1 = "";
					var value2 = "";
					var value3 = "";
					if (aFilterItems[i].hasOwnProperty("value1")) {
						value1 = aFilterItems[i].value1;
					}
					if (aFilterItems[i].hasOwnProperty("value2")) {
						value2 = aFilterItems[i].value2;
					}
					if (aFilterItems[i].hasOwnProperty("path")) {
						value3 = aFilterItems[i].path;
					}
					sFilterExtension2 = (sFilterExtension2 + value3 + value1 + value2);
				}
			}
			// }
			// End of Commenting - Khrystyne Williams - August 30, 2016
			oPage.setTitle(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("activityOverview", [this.getOwnerComponent().getModel(
					"ASMConfig").getData().Properties.PlanningYear,
				this.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings/Currency"),
				sFilterExtension,
				sFilterExtension2,
				sTitleExtension
			]));
			// PSW End Change for Showing Filter Values May 16th 2016
		},
		_getBudgetObject: function() {
			var budget = {
				AmtB1: 0,
				AmtB2: 0,
				AmtB3: 0,
				AmtB4: 0,
				AmtB5: 0,
				AmtB6: 0,
				AmtB7: 0,
				AmtB8: 0,
				AmtB9: 0,
				AmtB10: 0,
				AmtB11: 0,
				AmtB12: 0,
				AmtA1: 0,
				AmtA2: 0,
				AmtA3: 0,
				AmtA4: 0,
				AmtA5: 0,
				AmtA6: 0,
				AmtA7: 0,
				AmtA8: 0,
				AmtA9: 0,
				AmtA10: 0,
				AmtA11: 0,
				AmtA12: 0
			};
			return budget;
		},
		// psutram: Jan 2017 : modified method
		_sumBudgetNumbers: function(oTotal, oRaw) {
			var i = 0;
			var recordTotal = parseFloat(0);
			var recordATotal = parseFloat(0);
			// Begin of Changes - Khrystyne Williams - Nov 2016
			var recordLeTotal = parseFloat(0);
			var currentdate = new Date();
			var currentmonth = currentdate.getMonth();
			// End of Changes - Khrystyne Williams - Nov 2016

			//Actuals and Plans // USERA04 // 2/28/17
			var currentYear = currentdate.getFullYear();
			var planYear = oRaw.PlanningYear;
			//END OF USERA04

			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sAColumnName = "AmtA" + i;
				var sValueState = "FC_ValueState_AmtB" + i;
				var sValueStateText = "FC_ValueStateText_AmtB" + i;
				// Begin of Changes - Khrystyne Williams - Nov 2016
				// Update the Actuals + Plan to Go
				oRaw[sValueState] = sap.ui.core.ValueState.None;
				oRaw[sValueStateText] = "";

				//psutram: Jan 2017 modified
				var amt = parseFloat(oRaw[sColumnName]);
				if (isNaN(amt)) {
					amt = 0;
					//psutram feb 6th
					oRaw[sColumnName] = 0;
				}
				var aAmt = parseFloat(oRaw[sAColumnName]);
				if (isNaN(aAmt)) {
					aAmt = 0;
					//psutram feb 6th
					oRaw[sAColumnName] = 0;
				}

				//psutram: Jan 2017 commented and modified
				// oTotal[sColumnName] = parseFloat(oTotal[sColumnName]) + parseFloat(oRaw[sColumnName]);
				// oTotal[sAColumnName] = parseFloat(oTotal[sAColumnName]) + parseFloat(oRaw[sAColumnName]);
				// recordTotal = parseFloat(recordTotal) + parseFloat(oRaw[sColumnName]);
				// recordATotal = parseFloat(recordATotal) + parseFloat(oRaw[sAColumnName]);
				// if (i < (currentmonth + 1)) {
				// 	recordLeTotal = parseFloat(recordLeTotal) + parseFloat(oRaw[sAColumnName]);
				// } else {
				// 	recordLeTotal = parseFloat(recordLeTotal) + parseFloat(oRaw[sColumnName]);
				// }
				oTotal[sColumnName] = parseFloat(oTotal[sColumnName]) + parseFloat(amt);
				oTotal[sAColumnName] = parseFloat(oTotal[sAColumnName]) + parseFloat(aAmt);

				recordTotal = parseFloat(recordTotal) + parseFloat(amt);
				recordATotal = parseFloat(recordATotal) + parseFloat(aAmt);
				if (i < (currentmonth + 1)) {
					recordLeTotal = parseFloat(recordLeTotal) + parseFloat(aAmt);
				} else {
					recordLeTotal = parseFloat(recordLeTotal) + parseFloat(amt);
				}
				//psutram: end of changes

			} while (i < 12);
			oRaw.AmtBTot = parseFloat(recordTotal);
			oRaw.AmtATot = parseFloat(recordATotal);

			// Begin of Changes - Khrystyne Williams - Nov 2016
			//oRaw.AmtLeTot = parseFloat(recordLeTotal);
			//Actuals and Plans // USERA04 // 2/28/17
			if (currentYear.toString() === planYear) {
				oRaw.AmtLeTot = parseFloat(recordLeTotal);
			} else if (currentYear.toString() > planYear) {
				oRaw.AmtLeTot = parseFloat(recordATotal);
			} else {
				oRaw.AmtLeTot = parseFloat(recordTotal);
			}
			//END OF USERA04

			// End of Changes - Khrystyne Williams - Nov 2016
		},
		_setTotals: function(oTotal, oRaw) {
			var i = 0;
			var recordTotal = parseFloat(0);
			var recordATotal = parseFloat(0);
			// Begin of Changes - Khrystyne Williams - Nov 2016
			var recordLeTotal = parseFloat(0);
			var currentdate = new Date();
			var currentmonth = currentdate.getMonth();
			// End of Changes - Khrystyne Williams - Nov 2016

			//Actuals and Plans // USERA04 // 2/28/17
			var currentYear = currentdate.getFullYear();
			var planYear = oRaw.PlanningYear;
			//END OF USERA04

			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sAColumnName = "AmtA" + i;
				// Begin of Changes - Khrystyne Williams - Nov 2016
				// Update the Actuals + Plan to Go
				var sAPTGColumnName = "AmtLeTot";
				oRaw[sColumnName] = parseFloat(oTotal[sColumnName]);
				oRaw[sAColumnName] = parseFloat(oTotal[sAColumnName]);
				// oRaw[sAPTGColumnName] = parseFloat(oTotal[sAPTGColumnName]);
				recordTotal = parseFloat(recordTotal) + parseFloat(oRaw[sColumnName]);
				recordATotal = parseFloat(recordATotal) + parseFloat(oRaw[sAColumnName]);
				if (i < (currentmonth + 1)) {
					recordLeTotal = parseFloat(recordLeTotal) + parseFloat(oRaw[sAColumnName]);
				} else {
					recordLeTotal = parseFloat(recordLeTotal) + parseFloat(oRaw[sColumnName]);
				}
				// End of Changes - Khrystyne Williams - Nov 2016
			} while (i < 12);

			//Actuals and Plans // USERA04 // 2/28/17
			if (!planYear) {
				oRaw.AmtLeTot = parseFloat(recordLeTotal);
			} else if (currentYear.toString() === planYear) {
				oRaw.AmtLeTot = parseFloat(recordLeTotal);
			} else if (currentYear.toString() > planYear) {
				oRaw.AmtLeTot = parseFloat(recordATotal);
			} else {
				oRaw.AmtLeTot = parseFloat(recordTotal);
			}
			oRaw.AmtBTot = recordTotal;
			oRaw.AmtATot = recordATotal;
			//END OF USERA04
		},
		_sumTotals: function(oTotal, oRaw) {
			var i = 0;
			// Begin of Changes - Khrystyne Williams - Nov 2016
			var currentdate = new Date();
			var currentmonth = currentdate.getMonth();

			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sAColumnName = "AmtA" + i;
				var sAPTGColumnName = "AmtLeTot";
				oRaw[sColumnName] = parseFloat(oRaw[sColumnName]) + parseFloat(oTotal[sColumnName]);
				oRaw[sAColumnName] = parseFloat(oRaw[sAColumnName]) + parseFloat(oTotal[sAColumnName]);
				if (i < (currentmonth + 1)) {
					oRaw[sAPTGColumnName] = parseFloat(oRaw[sAPTGColumnName]) + parseFloat(oRaw[sAColumnName]);
				} else {
					oRaw[sAPTGColumnName] = parseFloat(oRaw[sAPTGColumnName]) + parseFloat(oRaw[sColumnName]);
				}
				// End of Changes - Khrystyne Williams - Nov 2016
			} while (i < 12);

			//Actuals and Plans // USERA04 // 2/28/17
			var currentYear = currentdate.getFullYear();
			var planYear = oRaw.PlanningYear;

			if (!planYear) {
				oRaw.AmtLeTot = parseFloat(oRaw[sAPTGColumnName]);
			} else if (currentYear.toString() === planYear) {
				oRaw.AmtLeTot = parseFloat(oRaw[sAPTGColumnName]);
			} else if (currentYear.toString() > planYear) {
				oRaw.AmtLeTot = parseFloat(oRaw[sAColumnName]);
			} else {
				oRaw.AmtLeTot = parseFloat(oRaw[sColumnName]);
			}
			//END OF USERA04
		},
		_overallTotal: function(oRaw) {
			var i = 0;
			// Begin of Changes - Khrystyne Williams - Nov 2016
			var currentdate = new Date();
			var currentmonth = currentdate.getMonth();
			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sAColumnName = "AmtA" + i;
				oRaw._overallTotal = parseFloat(oRaw[sColumnName]) + parseFloat(oRaw._overallTotal);
				oRaw._overallATotal = parseFloat(oRaw[sAColumnName]) + parseFloat(oRaw._overallATotal);
				if (i < (currentmonth + 1)) {
					oRaw._overallAPTGTotal = parseFloat(oRaw._overallAPTGTotal) + parseFloat(oRaw[sAColumnName]);

				} else {
					oRaw._overallAPTGTotal = parseFloat(oRaw._overallAPTGTotal) + parseFloat(oRaw[sColumnName]);
				}
				// End of Changes - Khrystyne Williams - Nov 2016
			} while (i < 12);
			//Actuals and Plans // USERA04 // 2/28/17
			var currentYear = currentdate.getFullYear();
			var planYear = oRaw["0"].PlanningYear;

			if (currentYear.toString() === planYear) {
				oRaw._overallAPTGTotal = parseFloat(oRaw._overallAPTGTotal);
			} else if (currentYear.toString() > planYear) {
				oRaw._overallAPTGTotal = parseFloat(oRaw._overallATotal);
			} else if (currentYear.toString() < planYear) {
				oRaw._overallAPTGTotal = parseFloat(oRaw._overallTotal);
			}
			//End of USERA04
		},
		_checkForCapChanges: function(oNew, oOrig) {
			oNew._UPDCAP = false;
			var bReturn = false;
			if (parseFloat(oNew.MaxValueC) !== parseFloat(oOrig.MaxValueC)) {
				oNew.MaxValueC = oNew.MaxValueC.toString();
				oNew._UPDCAP = true;
				bReturn = true;
			}
			return bReturn;
		},
		_checkForChanges: function(oNew, oOrig) {
			var i = 0;
			var bReturn = false;
			oNew._UPDITEM = false;
			oNew._UPDFIN = false;

			//psutram: Added so we skip changes for activity
			if (oNew.ItemType === "AT") {
				return bReturn;
			}
			do {
				i++;
				var sColumnName = "AmtB" + i;
				if (parseFloat(oNew[sColumnName]) !== parseFloat(oOrig[sColumnName])) {
					oNew[sColumnName] = oNew[sColumnName].toString();
					oNew._UPDFIN = true;
					bReturn = true;
				}
			} while (i < 12);

			// psutram: Feb 2017 change : ignore the change if MaxValueB is from an ItemType of AT
			// if (parseFloat(oNew.MaxValueB) !== parseFloat(oOrig.MaxValueB) && (!oNew.ItemType === "AT")) {

			// 	oNew._UPDITEM = true;
			// 	bReturn = true;
			// }
			// if (parseFloat(oNew.MaxValueB) !== parseFloat(oOrig.MaxValueB)) {
			// 	oNew._UPDITEM = true;
			// 	bReturn = true;
			// }
			// psutram: end of change

			// Begin of Changes - Khrystyne Williams - Nov 2016
			// Not using Budget/Le anymore
			// if (parseFloat(oNew.MaxValueBo) !== parseFloat(oOrig.MaxValueBo)) {
			// 	oNew._UPDITEM = true;
			// 	bReturn = true;
			// }
			// End of Changes - Khrystyne Williams - Nov 2016
			if (oNew.StartDt !== oOrig.StartDt) {
				oNew._UPDITEM = true;
				bReturn = true;
			}
			if (oNew.EndDt !== oOrig.EndDt) {
				oNew._UPDITEM = true;
				bReturn = true;
			}
			return bReturn;
		},
		onBudgetChange: function(oEvent) {
			var oField = oEvent.getSource();
			var sCurrentValue = oEvent.getParameters().value;
			sCurrentValue = sCurrentValue.replace(/,/g, "");
			sCurrentValue = sCurrentValue.replace(/\./g, "");
			var oRecord = this.getModel("Project").getProperty(oField.getParent().getBindingContext("Project").sPath);
			var bNumber = /^-*[0-9,\.]+$/.test(sCurrentValue);
			// Allow negative numbers
			//if (sCurrentValue !== "" && (!bNumber || parseFloat(sCurrentValue) < 0.0)) {
			if (sCurrentValue !== "" && (!bNumber)) {
				if (sCurrentValue !== "-") {
					oField.setValue("0");
					oRecord[oField.getBindingInfo("valueState").binding.getPath()] = sap.ui.core.ValueState.Warning;
					oRecord[oField.getBindingInfo("valueStateText").binding.getPath()] = this.getOwnerComponent().getModel("i18n").getResourceBundle()
						.getText(
							"A_E_notValid", [sCurrentValue]);
				} else {
					oRecord[oField.getBindingInfo("value").parts[0].path] = 0;
					this._calculatePlanForDistribution(oRecord);
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.activities", "RecalculateTotals", {});
					this.getModel("Project").refresh(false);
				}
			} else {
				oRecord[oField.getBindingInfo("valueState").binding.getPath()] = sap.ui.core.ValueState.None;
				oRecord[oField.getBindingInfo("valueStateText").binding.getPath()] = "";
				if (oField.getId().includes("MaxValueB")) {
					this.byId("Table").addSelectionInterval(oField.getParent().getIndex(), oField.getParent().getIndex());
				} else if (oField.getId().includes("MaxValueC")) {
					if (oField.getValue() === "" || parseFloat(oField.getValue) <= parseFloat("0.0")) {
						oRecord[oField.getBindingInfo("valueState").binding.getPath()] = sap.ui.core.ValueState.Warning;
						oRecord[oField.getBindingInfo("valueStateText").binding.getPath()] = this.getOwnerComponent().getModel("i18n").getResourceBundle()
							.getText("AC_BudgetCapMissing", []);
					} else {
						oRecord[oField.getBindingInfo("valueState").binding.getPath()] = sap.ui.core.ValueState.None;
						oRecord[oField.getBindingInfo("valueStateText").binding.getPath()] = "";
					}
				} else {
					// Sum up plan values
					oRecord[oField.getBindingInfo("value").parts[0].path] = sCurrentValue;
					this._calculatePlanForDistribution(oRecord);
				}
			}
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.activities", "RecalculateTotals", {});
			this.getModel("Project").refresh(false);
		},
		_calculatePlanForDistribution: function(oRecord) {
			var i = 0;
			oRecord.MaxValueB = parseFloat(0);
			do {
				i++;
				var sColumnName = "AmtB" + i;
				oRecord.MaxValueB = parseFloat(oRecord.MaxValueB) + parseFloat(oRecord[sColumnName]);
			} while (i < 12);
		},
		onDistChange: function(oEvent) {
			var oField = oEvent.getSource();
			var sCurrentValue = oEvent.getParameters().value;
			var bNumber = /^-*[0-9,\.]+$/.test(sCurrentValue);
			if (!bNumber) {
				oField.setValue("");
				oField.setValueState(sap.ui.core.ValueState.Error);
				oField.setValueText(this.getOwnerComponent().getModel("i18n").getResourceBundle()
					.getText(
						"A_E_notValid", [sCurrentValue]));
			} else {
				oField.setValueState(sap.ui.core.ValueState.None);
				// $PSW Start Correction for Distribution entry errored on non numeric value June 13th 2016					
				oField.setValueStateText("");
				// $PSW End Correction for Distribution entry errored on non numeric value June 13th 2016					
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onMessageSelected: function(oEvent) {
			var sField = oEvent.getParameter("item").getDescription();
			if (sField && sField !== "") {
				// psutram: Feb 2017 same change as in ChangeActivity controller
				//this._messagePopover.close();
				var oErrored = this.byId(sField);
				oErrored.focus();
			} else {
				if (sField && sField === "") {
					MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("A_E_notOnScreen", []));
				}
			}
		},
		onSSave: function(oEvent) {
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.button.pressed", "SaveStatus", {});
		},
		onSCancel: function(oEvent) {
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.button.pressed", "CancelStatus", {});
		},
		// _onSSave: function() {
		// 	this.oMessageManager.removeAllMessages();
		// 	var aSelected = this.byId("Table").getSelectedIndices();
		// 	var oModel = this.getModel();
		// 	var bAllowSave = true;
		// 	var aAsInputArray = this.getModel("Project").getData().AsInputArray;
		// 	var sTStatus = this.getModel("projectView").getProperty("/oTStatus/Selected");
		// 	var sFStatus = this.getModel("projectView").getProperty("/oFStatus/Selected");
		// 	if (aSelected.length > 0) {
		// 		var selectedIndicies = [];
		// 		for (var l = 0; l < aSelected.length; l++) {
		// 			// Get Selected Indicies
		// 			var sPath = this.byId("Table").getContextByIndex(aSelected[l]).getPath();
		// 			var oRecord = this.getModel("Project").getProperty(sPath);
		// 			if (sFStatus !== oRecord.Status) {
		// 				j = aSelected.length;
		// 				bAllowSave = false;
		// 				var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusMismatch", []);
		// 				MessageToast.show(sMessage);
		// 			} else {
		// 				// Check to make sure that Status Progression is not violated.
		// 				selectedIndicies.push(oRecord.__index);
		// 			}
		// 		}
		// 		if (bAllowSave) {
		// 			for (var j = 0; j < aSelected.length; j++) {
		// 				// Check if there are any chosen records which cannot be deleted.
		// 				var sPath = this.byId("Table").getContextByIndex(aSelected[j]).getPath();
		// 				var oRecord = this.getModel("Project").getProperty(sPath);
		// 				if (sFStatus !== oRecord.Status) {
		// 					j = aSelected.length;
		// 					bAllowSave = false;
		// 					var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusMismatch", []);
		// 					MessageToast.show(sMessage);
		// 				} else {
		// 					// Determine if we are trying to promote or demote the status.
		// 					var bPromote = true;
		// 					var sASMConfig = this.getOwnerComponent().getModel("ASMConfig").getProperty("/Properties/Status");
		// 					var aStatusProgression = (JSON.parse(sASMConfig)).StatusProgression;
		// 					var iFStatus = -1;
		// 					var iTStatus = -1;
		// 					for (var i = 0; i < aStatusProgression.length; i++) {
		// 						if (aStatusProgression[i] === sTStatus) {
		// 							iTStatus = i;
		// 						}
		// 						if (aStatusProgression[i] === sFStatus) {
		// 							iFStatus = i;
		// 						}
		// 					}
		// 					if (iTStatus === -1 || iFStatus === -1) {
		// 						var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusConfigError", []);
		// 						MessageToast.show(sMessage);
		// 					} else {
		// 						if (iTStatus < iFStatus) {
		// 							bPromote = false;
		// 						} else {
		// 							bPromote = true;
		// 						}
		// 						if (oRecord.ItemType === "AT" && !bPromote) {
		// 							// Check whether any child has same level
		// 							for (var l = 0; l < oRecord._subactivityCount; l++) {
		// 								for (var k = 0; k < aStatusProgression.length; k++) {
		// 									if (aStatusProgression[k] === oRecord[l].Status) {
		// 										if (k > iFStatus) {
		// 											bAllowSave = false;
		// 											var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusConfigError", []);
		// 											MessageToast.show(sMessage);
		// 										} else if (k === iFStatus) {
		// 											var bChildSelected = false;
		// 											for (var m = 0; m < selectedIndicies.length; m++) {
		// 												if (selectedIndicies[m] === oRecord[l].__index) {
		// 													bChildSelected = true;
		// 													m = selectedIndicies.length;
		// 												}

		// 											}
		// 											if (!bChildSelected) {
		// 												var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusChildNotSelected", []);
		// 												MessageToast.show(sMessage);
		// 												bAllowSave = false;
		// 											}
		// 										}
		// 									}
		// 								}
		// 							}
		// 						} else if (oRecord.ItemType == "SA" && bPromote) {
		// 							var bParentSelected = false;
		// 							for (var l = 0; l < j; l++) {
		// 								var sPath = this.byId("Table").getContextByIndex(aSelected[l]).getPath();
		// 								var oPRecord = this.getModel("Project").getProperty(sPath);
		// 								if (oPRecord.__index === oRecord.__parentIndex) {
		// 									// Record is selected - Check for matching status
		// 									bParentSelected = true;
		// 									for (var k = 0; k < aStatusProgression.length; k++) {
		// 										if (aStatusProgression[k] === oPRecord.Status) {
		// 											if (k < iFStatus) {
		// 												bAllowSave = false;
		// 												var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusConfigError", []);
		// 												MessageToast.show(sMessage);
		// 											}
		// 										}
		// 									}
		// 								}
		// 							}
		// 							if (!bParentSelected) {
		// 								// Your status must be less than the parent's.
		// 								var iParentIndex = oRecord.__parentIndex;
		// 								var oParent = this.getModel("Project").getProperty("/AsInputArray")[iParentIndex];
		// 								for (var k = 0; k < aStatusProgression.length; k++) {
		// 									if (aStatusProgression[k] === oParent.Status) {
		// 										if (iFStatus >= k) {
		// 											bAllowSave = false;
		// 											var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusParentNotSelected", []);
		// 											MessageToast.show(sMessage);
		// 											k = aStatusProgression.length;
		// 										}
		// 									}
		// 								}
		// 							}
		// 						}
		// 					}
		// 				}
		// 			}
		// 			if (bAllowSave) {
		// 				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
		// 				this.getOwnerComponent().getModel("masterShared").refresh(false);
		// 				var that = this;
		// 				setTimeout(function() {
		// 					that.nTotalCurrentChanges = parseInt(aSelected.length);
		// 					that.nChangeCount = parseInt(that.nTotalCurrentChanges);
		// 					for (var i = 0; i < aSelected.length; i++) {
		// 						var iIndex = that.getModel("Project").getProperty(that.byId("Table").getContextByIndex(aSelected[i]).getPath()).__index;
		// 						var oRecord = aAsInputArray[iIndex];
		// 						var oItem = JSON.parse(JSON.stringify(oRecord));
		// 						// Remove fields that were added in extra.
		// 						var sPath = oItem.__metadata.uri.substring(oItem.__metadata.uri.lastIndexOf("/"));
		// 						delete oItem.__metadata;
		// 						oItem.StartDt = oItem.StartDt.replace("Z", "");
		// 						oItem.EndDt = oItem.EndDt.replace("Z", "");
		// 						oItem.CreatedTime = oItem.CreatedTime.replace("Z", "");
		// 						oItem.ChangedTime = oItem.ChangedTime.replace("Z", "");
		// 						oItem.Status = sTStatus;
		// 						var oConfig = {};
		// 						oConfig.UPDITEM = "X";
		// 						oItem.Config = JSON.stringify(oConfig);

		// 						var that2 = that;
		// 						oModel.update(sPath, oItem, {
		// 							success: function(oData, oResponse) {
		// 								// Add a Success toast and navigate back to the Project view and refresh the data.
		// 								if (oResponse.statusCode !== "204") {
		// 									oData.ErrorOrigin = "UpdateStatus";
		// 									sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oData);
		// 								} else {
		// 									that2.nChangeCount = parseInt(that2.nChangeCount) - 1;
		// 									if (that2.nChangeCount === 0) {
		// 										that2._onStatusChange(null);
		// 										var oEventData = {};
		// 										oEventData.oDataOrigin = "UpdateStatus";
		// 										that2.nPendingChangeCount = 1;
		// 										sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
		// 									}
		// 								}
		// 							},
		// 							error: function(oError) {
		// 								that2.nChangeCount = parseInt(that2.nChangeCount) - 1;
		// 								if (that2.nChangeCount === 0) {
		// 									oError.ErrorOrigin = "UpdateStatus";
		// 									that2.nPendingChangeCount = 1;
		// 									sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
		// 								}
		// 							},
		// 							changeSetId: oRecord.Id
		// 						});
		// 					}
		// 				}, 100);
		// 			}
		// 		}
		// 	} else {
		// 		var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_selectOneStatus", []);
		// 		MessageToast.show(sMessage);
		// 	}
		// },
		_onObjectMatched: function(oEvent) {
			if (this.getOwnerComponent().getModel("masterShared") && this.getOwnerComponent().getModel("masterShared").getData()) {
				if (this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.configurationLoaded === true &&
					this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.variantsLoaded === true &&
					!this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.activityPersonalizationInitialized) {
					this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.activityPersonalizationInitialized = true;
					this._p13nInitialize();
					this._setUpInitialVariant();
					this._onRefresh();
				}
			}
			this._confirmHeaderVisibilitySettings();
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
			var oViewModel = this.getModel("projectView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {},
					dataReceived: function() {}
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
				oViewModel = this.getModel("projectView");

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
			var oViewModel = this.getOwnerComponent().getModel("masterShared");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/oDetailBusy/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/oDetailBusy/busy", true);
			oViewModel.refresh(false);
		},
		_onButtonPressed: function(oEvent, oData) {
			if (oData) {
				if (oData.button === "Button2") {
					// GDH Add a Project
					this._onAddActivity(null);
				} else {
					alert("Project Button: " + oData.button);
				}
			}
		},
		_onAddActivity: function(oEvent) {
			// GDH Navigate to Add Activity Screen
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			this.getOwnerComponent().getModel("masterShared").refresh(false);
			var oRouter = this.getRouter();
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.initialize", "AddActivity", {});
			this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "NavToAddActivity";
			oRouter.navTo("addActivity", {
				objectId: "AddActivity"
			}, true);
		},
		//Added by Dipen on June 7, 2016
		_onCopyActivity: function(oEvent) {
			// var oInternalEvents = this.getModel("masterShared").getData().oInternalEvents;
			//alert(oInternalEvents.currentMode);
			var oRouter = this.getRouter();
			//oInternalEvents.lastAction = "NavToStatusChange";
			oRouter.navTo("copyActivity", {
				objectId: "copyActivity"
			}, true);
		},

		_onStatusChange: function(oEvent) {
			// Clear Errors
			ValidationUtils.removeErrorMessages(this);
			//Begin of Changes - Khrystyne Williams - August 30, 2016
			var oInternalEvents = this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents;
			if (oInternalEvents.currentMode !== "Status") {
				// Begin of Commenting - Khrystyne Williams - Nov 2016
				// this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				// End of Commenting - Khrystyne Williams - Nov 2016
				this.getOwnerComponent().getModel("masterShared").refresh(false);
				this._setStyleMode("Status");
				// Set Status Screen Changes
				// Begin of Changes - Khrystyne Williams - Nov 2016
				// this.getModel("projectView").setProperty("/oTableControl/bVariantVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bVariantVisible", true);
				// End of Changes - Khrystyne Williams - Nov 2016
				this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bSSaveVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bSCancelVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bAddVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bEditVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bCheckVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/eMailEnabled", false);
				this.getModel("projectView").setProperty("/oTableControl/sSaveEnabled", false);

				//Change Status // USERA04 // 2/21/17
				this.getModel("projectView").setProperty("/oTableControl/bClearVisible", false);
				// psutram modified for Calculate and Refresh functionality
				this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", false);

				// Begin of Commenting - Khrystyne Williams - Nov 2016
				// this.getModel("projectView").setProperty("/oTableControl/personalizeEnabled", false);
				this.getModel("projectView").setProperty("/oTableControl/personalizeEnabled", true);
				this.getModel("projectView").setProperty("/oTableControl/statusEnabled", true);
				// End of Commenting - Khrystyne Williams - Nov 2016
				// August 30
				// this._determineStatusVariant(); // GDH 5/23/2016 - Change to pick "StatusChange" from additional Config

				this.getModel("projectView").refresh(false);
				// Begin of Commenting - Khrystyne Williams - Nov 2016
				// Do not change the view to "Status View"
				// var oRouter = this.getRouter();
				// oInternalEvents.lastAction = "NavToStatusChange";
				// oRouter.navTo("statusChange", {
				// 	objectId: "statusChange"
				// }, true);
				// End of Commenting - Khrystyne Williams - Nov 2016
			} else {
				// Begin of Changes - Khrystyne Williams - Nov 2016
				// this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				// End of Changes - Khrystyne Williams - Nov 2016
				this.getOwnerComponent().getModel("masterShared").refresh(false);
				this._setStyleMode("Display");
				var oRouter = this.getRouter();
				//Undo Status Screen Changes
				this.getModel("projectView").setProperty("/oTableControl/bVariantVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bSSaveVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bSCancelVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bAddVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bEditVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bCheckVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/eMailEnabled", false);
				this.getModel("projectView").setProperty("/oTableControl/personalizeEnabled", true);
				this.getModel("projectView").setProperty("/oTableControl/statusEnabled", true);

				this.getModel("projectView").setProperty("/oTableControl/bClearVisible", true);
				//END OF Change Status // USERA04 // 2/21/17

				//psutram: modified for Refresh and Calculate functionality
				this.getModel("projectView").setProperty("/oTableControl/bCalculateVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", true);

				// Begin of Changes - Khrystyne Williams - Nov 2016
				// this._variantSwap(oInternalEvents.lastVariant);
				// End of Changes - Khrystyne Williams - Nov 2016

				oInternalEvents.lastAction = "NavToDisplay";
				// Next event will return to pre-existing selection.
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.event", "FilterChanged", {});
			}
		},
		_onRefresh: function(oData) {
			// Refresh the displayed projects.
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
			this.getOwnerComponent().getModel("masterShared").refresh(false);
			var that = this;
			setTimeout(function() {
				that._getItems(that._lastSelectionConfig);
			}, 200);
		},
		_getItems: function(oData) {
			if (this._allowGetItems) {
				// if (!this._GoogleAnalyticHidden) {
				// 	var tag = "#" + this.byId("GoogleTag").getId();
				// 	$(tag).attr("src","");
				// 	this._GoogleAnalyticHidden = true;
				// }
				if (this.getOwnerComponent().getModel("ASMConfig")) {
					this.byId("Table").clearSelection();
					this._confirmHeaderVisibilitySettings();
					if (oData) {
						this._lastSelectionConfig = oData;
						// Make initial OData calls that need further processing
						this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
						this.getOwnerComponent().getModel("masterShared").refresh(false);
						var oBaseModel = this.getModel();
						var sPath = "/Items";
						this.nPendingChangeCount = 1;
						var oExclude = {};
						var filters = [];
						var projectYear = {};

						if (oData.PlanningYear && oData.PlanningYear !== "") {
							filters.push(new sap.ui.model.Filter("PlanningYear", sap.ui.model.FilterOperator.EQ,
								oData.PlanningYear));
							projectYear = oData.PlanningYear; //INBHD02

						} else {
							filters.push(new sap.ui.model.Filter("PlanningYear", sap.ui.model.FilterOperator.EQ,
								this.getOwnerComponent().getModel(
									"ASMConfig").getData().Properties.PlanningYear));
							projectYear = this.getOwnerComponent().getModel("ASMConfig").getData().Properties.PlanningYear; //INBHD02
						}
						//INBHD02
						if (projectYear) {
							var oModel = this.getModel("projectView");
							oModel.getData().oTableControl.projectFilterYear = projectYear;

							oModel.refresh(false);
						}
						//INBHD02
						if (oData.DivisionKey && oData.DivisionKey !== "") {
							filters.push(new sap.ui.model.Filter("DivisionKey", sap.ui.model.FilterOperator.EQ,
								oData.DivisionKey));
						} else {
							oExclude.Division = true;
						}
						if (oData.HubKey && oData.HubKey !== "") {
							filters.push(new sap.ui.model.Filter("HubKey", sap.ui.model.FilterOperator.EQ,
								oData.HubKey));
						} else {
							oExclude.Hub = true;
						}
						if (oData.SubKey && oData.SubKey !== "") {
							filters.push(new sap.ui.model.Filter("SubKey", sap.ui.model.FilterOperator.EQ,
								oData.SubKey));
						} else {
							oExclude.Sub = true;
						}
						if (oData.Channel && oData.Channel !== "") {
							filters.push(new sap.ui.model.Filter("Channel", sap.ui.model.FilterOperator.EQ,
								oData.Channel));
						} else {
							oExclude.Channel = true;
						}
						if (oData.Function && oData.Function !== "") {
							filters.push(new sap.ui.model.Filter("Function", sap.ui.model.FilterOperator.EQ,
								oData.Function));
						} else {
							oExclude.Function = true;
						}
						// GDH 5/23/2016 - Updated in case blank
						if (oData.Category && oData.Category !== "") {
							filters.push(new sap.ui.model.Filter("CategoryKey", sap.ui.model.FilterOperator.EQ,
								oData.Category));
						} else {
							oExclude.Category = true;
						}
						if (oData.Subcategory && oData.Subcategory !== "") {
							filters.push(new sap.ui.model.Filter("SubcategoryKey", sap.ui.model.FilterOperator.EQ,
								oData.Subcategory));
						} else {
							oExclude.Subcategory = true;
						}
						if (oData.Brand && oData.Brand !== "") {
							filters.push(new sap.ui.model.Filter("BrandKey", sap.ui.model.FilterOperator.EQ,
								oData.Brand));
						} else {
							oExclude.Brand = true;
						}
						// Add in Currency
						var sCurrency = this.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings/Currency");
						if (sCurrency && sCurrency !== "") {
							filters.push(new sap.ui.model.Filter("Currency", sap.ui.model.FilterOperator.EQ, sCurrency));
						}
						//INBHD02
						if (this.getModel("projectView").getData().oTableControl.projectFilterPressed) {
							filters.push(new sap.ui.model.Filter("InternalConfig", sap.ui.model.FilterOperator.EQ, 'X'));
						} else {
							filters.push(new sap.ui.model.Filter("InternalConfig", sap.ui.model.FilterOperator.EQ, ''));
						}
						//INBHD02
						this.getOwnerComponent().getModel("masterShared").setProperty("/oFilters/oExclude", oExclude);
						this._setStyleMode(this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.currentMode);
						this.FieldControlUtils = FieldControlUtils;
						var that = this;
						oBaseModel.read(sPath, {
							//async: true,
							filters: filters,
							success: function(oDataIn, oResponse) {
								// Set up JSON data for editing
								TimeoutUtils.onStartTimer(that);
								var oModel = that.getModel("Project");
								var oData = oModel.getData();
								var aResults = that._preprocessTotalRecords(oDataIn.results);
								var aOptions = [];
								var oTree = {};
								oTree._projectCount = 0;
								var iProjectIndex = -1;
								var sProjectName = "";
								var sProjectASM = "";
								var iActivityIndex = -1;
								var sActivityName = "";
								var sActivityASM = "";
								var iSubactivityIndex = -1;
								var sSubactivityASM = "";
								var sProjectGuid = null;
								var sIPath = jQuery.sap.getModulePath("colgate.asm.planning.base");
								var oInternalEvents = that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents;
								var oStatus = {};
								for (var j = 0; j < aResults.length; j++) {
									var oOption = {};
									var oRecord = JSON.parse(JSON.stringify(aResults[j]));
									var oConfig = {};
									if (oRecord.Config && oRecord.Config !== "") {
										oConfig = JSON.parse(oRecord.Config);
									}
									var oInternalConfig = {};
									if (oRecord.InternalConfig && oRecord.InternalConfig !== "") {
										oInternalConfig = JSON.parse(oRecord.InternalConfig);
									}
									delete oRecord.__metadata;
									oRecord.MaxValueB = parseFloat(0);
									oRecord.__index = j;
									oRecord._myItem = oInternalConfig.myItem;
									that.FieldControlUtils.addFieldControl(oRecord);
									oOption.Key = oRecord.Guid;
									oOption.Id = oRecord.Id; // Address instant adding of record
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
									if (oRecord.ItemType === "PT") {
										iProjectIndex = iProjectIndex + 1;
										iActivityIndex = -1;
										iSubactivityIndex = -1;
										oTree[0]._projectCount = iProjectIndex + 1;
										oRecord._activityCount = 0;
										oRecord._iconPath = sIPath + "/img/Project-web.png";
										oTree[0][iProjectIndex] = oRecord;
										sProjectName = oRecord.Name;
										oOption.Key = oRecord.Guid;
										sProjectGuid = oRecord.Guid;
										oOption.Type = "AT";
										oOption.ProjectGuid = sProjectGuid;
										oOption.Description = sProjectName;
										aOptions.push(oOption);
										oRecord.__parentIndex = -1;
										oRecord._name = sProjectName;
										sProjectASM = oRecord.Id;
										oRecord._asmID = sProjectASM;
									} else if (oRecord.ItemType === "AT") {
										iActivityIndex = iActivityIndex + 1;
										iSubactivityIndex = -1;
										if (iProjectIndex < 0 || !oTree[0][iProjectIndex]) {
											console.log("Bad Data - Record:" + oRecord.Id);
											console.log("Data Failure - No Project: iProjectIndex " + iProjectIndex.toString());
										} else {
											oTree[0][iProjectIndex]._activityCount = iActivityIndex + 1;
											oRecord._subactivityCount = 0;
											oRecord._iconPath = sIPath + "/img/Activity-web.png";
											if (oConfig.StatusDesc) {
												oRecord._statusDesc = oConfig.StatusDesc;
											}
											oRecord.__parentIndex = oTree[0][iProjectIndex].__index;
											oTree[0][iProjectIndex][iActivityIndex] = oRecord;
											sActivityName = oRecord.Name;
											oOption.Key = oRecord.Guid;
											oOption.Type = "SA";
											oOption.ProjectGuid = sProjectGuid;
											oOption.ActivityGuid = oRecord.Guid;
											oOption.Description = sProjectName + " : " + sActivityName;
											oOption.__parentIndex = oRecord.__parentIndex;
											aOptions.push(oOption);
											if (oRecord.Status && oRecord.Status !== "") {
												oStatus[oRecord.Status] = oRecord._statusDesc;
											}
											oRecord._name = sProjectName + " " + sActivityName;
											sActivityASM = oRecord.Id;
											oRecord._asmID = sProjectASM + " " + sActivityASM;
										}
									} else if (oRecord.ItemType === "SA") {
										iSubactivityIndex = iSubactivityIndex + 1;
										oRecord._iconPath = sIPath + "/img/Sub-Activity-web.png";
										if (oConfig.StatusDesc) {
											oRecord._statusDesc = oConfig.StatusDesc;
										}
										if (iProjectIndex < 0 || iActivityIndex < 0 || !oTree[0] || !oTree[0][iProjectIndex] || !oTree[0][iProjectIndex][
												iActivityIndex
											]) {
											console.log("Bad Data - Record:" + oRecord.Id);
											console.log("Data Failure - No Activity:iProjectIndex " + iProjectIndex.toString() + "iActivityIndex " + iActivityIndex.toString());
										} else {
											oTree[0][iProjectIndex][iActivityIndex]._subactivityCount = iSubactivityIndex + 1;
											oRecord.__parentIndex = oTree[0][iProjectIndex][iActivityIndex].__index;
											oTree[0][iProjectIndex][iActivityIndex][iSubactivityIndex] = oRecord;
											if (oRecord.Status && oRecord.Status !== "") {
												oStatus[oRecord.Status] = oRecord._statusDesc;
											}
											oRecord._name = sProjectName + " " + sActivityName + " " + oRecord.Name;
											sSubactivityASM = oRecord.Id;
											oRecord._asmID = sProjectASM + " " + sActivityASM + " " + sSubactivityASM;
										}
									} else if (oRecord.ItemType === "TL") {
										oRecord._activityCount = 0;
										oRecord._iconPath = sIPath + "/img/Total-web.png";
										oRecord.__parentIndex = -1;
										oTree[0] = oRecord;
									}
								}
								var aKeys = Object.keys(oStatus);
								var aSOptions = [];
								for (var m = 0; m < aKeys.length; m++) {
									aSOptions.push({
										Status: aKeys[m],
										Description: oStatus[aKeys[m]]
									});
								}
								that.getModel("projectView").setProperty("/oTStatus/Selected", "");
								that.getModel("projectView").setProperty("/oFStatus/Selected", "");
								that.getModel("projectView").setProperty("/oTableControl/selMatchEnabled", false);
								that.getModel("projectView").getData().oFStatus.Options = aSOptions;
								// Update table personalization
								//						that._p13nInitialize();
								//						that._setUpInitialVariant();

								that.getOwnerComponent().getModel("masterShared").getData().aAddOptions = aOptions;
								oData.OnScreen = oTree;
								oData.AsInputArray = aResults;
								oData.FromService = JSON.parse(JSON.stringify(oTree));
								that.onValidate(null);
								// Add in default
								that._getMyProjects(that.getModel("projectView").getProperty("/oTableControl/projectFilterPressed"));
								oModel.refresh(false);
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.spinner", "StopSpinner", {});
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "ApplyStyles", {});
								// Begin of Changes - Khrystyne Williams - Nov 2016
								that.byId("Table").expandToLevel(1);
								// End of Changes - Khrystyne Williams - Nov 2016
							},
							error: function(oError) {
								oError.ErrorOrigin = "Initial";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
							}
						});
					}
				}
			} else if (oData) {
				this._lastSelectionConfig = oData;
			}
		},
		_preprocessTotalRecords: function(sResults) {
			var aResults = JSON.parse(JSON.stringify(sResults));
			if (aResults.length > 0) {
				var oRecord = JSON.parse(JSON.stringify(aResults[0]));
				// Clear out all data from your template
				var aKeys = Object.keys(oRecord);
				for (var i = 0; i < aKeys.length; i++) {
					oRecord[aKeys[i]] = "";
				}
				oRecord.Currency = aResults[0].Currency;
				oRecord.ItemType = "TL";
				aResults.splice(0, 0, oRecord);
			}
			return aResults;
		},
		_handleODataErrors: function(oDataIn) {
			this.nPendingChangeCount = this.nPendingChangeCount - 1;
			var sOrigin = oDataIn.ErrorOrigin;
			// Begin of Changes - Khrystyne Williams - Nov 2016
			// if (this.nPendingChangeCount == 0) {
			if (this.nPendingChangeCount === 0) {
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.spinner", "StopSpinner", {});
			}
			if (sOrigin === 'UpdateStatus') {
				var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_Error", []);
				// MessageToast.show(sMessage);
				this.oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: sMessage,
						description: "",
						type: sap.ui.core.ValueState.Error,
						processor: this.oMessageProcessor
					})
				);
			}
			// End of Changes - Khrystyne Williams - Nov 2016
		},
		_handleODataSuccess: function(oDataIn) {
			this.nPendingChangeCount = this.nPendingChangeCount - 1;
			var sOrigin = oDataIn.oDataOrigin;
			// 			if (sOrigin === "Projects") {
			// 				// Set up JSON data for editing
			// 				var oModel = this.getModel("Project");
			// 				var oData = oModel.getData();
			// 				//				oData.FromService = oDataIn.__batchResponses[0].data.results;
			// 				oData.OnScreen = JSON.parse(JSON.stringify(oDataIn.results)); // Clone all data
			// 				for (var i = 0; i < oData.OnScreen.length; i++) {
			// 					// Add the index to the record
			// 					oData.OnScreen[i].__index = i;
			// 				}
			// 				// Add in default
			// 				oModel.refresh(false);
			// 			} else 
			if (sOrigin === "SaveBudget") {
				if (this.nPendingChangeCount === 0) {
					this.__setBudgetEditable(false);
					var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_updates", [this.nTotalCurrentChanges]);
					MessageToast.show(sMessage);
					this._getItems(this._lastSelectionConfig);
				}
			} else if (sOrigin === "Delete") {
				if (this.nPendingChangeCount === 0) {
					this.__setBudgetEditable(false);
					var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_deletes", [this.nTotalCurrentChanges]);
					MessageToast.show(sMessage);
					this._getItems(this._lastSelectionConfig);
				}
			} else if (sOrigin === "UpdateStatus") {
				if (this.nPendingChangeCount === 0) {
					this.__setBudgetEditable(false);

					// Begin of Changes - Khrystyne Williams - Nov 2016
					var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_updates", [this.nTotalCurrentChanges]);
					// var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_mergeupdates", [this.nTotalCurrentChanges]);
					this.onSelectNone(null);
					MessageToast.show(sMessage);
					this._getItems(this._lastSelectionConfig);
					// End of Changes - Khrystyne Williams - Nov 2016
				}
			} else if (sOrigin === "NotAllowed") {
				var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_notAllowed");
				MessageToast.show(sMessage);
			} else if (sOrigin === "NoChanges") {
				var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("C_S_nochanges");
				MessageToast.show(sMessage);
				this.__setBudgetEditable(false);
			}
			if (this.nPendingChangeCount === 0) {
				sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.spinner", "StopSpinner", {});

			}
		},
		_refreshBudget: function(oDataIn) {
			var aData = oDataIn.OnScreen;
			for (var i = 0; i < aData.length; i++) {
				aData[i].Budget_valueState = sap.ui.core.ValueState.None;
				aData[i].Budget_valueStateText = "";
			}
		},

		//psutram: Jan 2017: new method added to calculate totals from SubActivity and set to Activity
		// psutram: Feb 2017: modified to similfy calculation
		_sumBudgetSubActivity: function(oActivityTotals, oActivity) {
			var i = 0;
			var totalAmt = 0;
			var totalAAmt = 0;
			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sAColumnName = "AmtA" + i;
				oActivity[sColumnName] = parseFloat(oActivityTotals[sColumnName]);
				oActivity[sAColumnName] = parseFloat(oActivityTotals[sAColumnName]);

				totalAmt = parseFloat(totalAmt) + parseFloat(oActivity[sColumnName]);
				totalAAmt = parseFloat(totalAAmt) + parseFloat(oActivity[sAColumnName]);

			} while (i < 12)
			oActivity.AmtTot = parseFloat(totalAmt);
			oActivity.AmtATot = parseFloat(totalAAmt); // Actuals
			oActivity.MaxValueB = parseFloat(0);

			// psutram feb 2017, commented out the rest of the method
			// var oTotals = this._getBudgetObject();
			// for (var k = 0; k < oActivity._subactivityCount; k++) {
			// 	var oSubactivity = oActivity[k];
			// 	var i = 0;
			// 	do {
			// 		i++;
			// 		var sColumnName = "AmtB" + i;
			// 		var sAColumnName = "AmtA" + i;

			// 		var amt = parseFloat(oSubactivity[sColumnName]);
			// 		if (isNaN(amt)) {
			// 			amt = 0;
			// 		}
			// 		var aAmt = parseFloat(oSubactivity[sAColumnName]);
			// 		if (isNaN(aAmt)) {
			// 			aAmt = 0;
			// 		}

			// 		oTotals[sColumnName] = parseFloat(oTotals[sColumnName]) + parseFloat(amt);
			// 		oTotals[sAColumnName] = parseFloat(oTotals[sAColumnName]) + parseFloat(aAmt);

			// 		oActivity[sColumnName] = parseFloat(oTotals[sColumnName]);
			// 		oActivity[sAColumnName] = parseFloat(oTotals[sAColumnName]);
			// 	} while (i < 12)

			// 	i = 0;
			// 	var totalAmt = 0;
			// 	var totalAAmt = 0;
			// 	do {
			// 		i++;
			// 		var sColumnName = "AmtB" + i;
			// 		var sAColumnName = "AmtA" + i;

			// 		totalAmt = parseFloat(totalAmt) + parseFloat(oActivity[sColumnName]);
			// 		totalAAmt = parseFloat(totalAAmt) + parseFloat(oActivity[sAColumnName]);

			// 		totalAAmt += oActivity[sAColumnName];

			// 	} while (i < 12)
			// 	oActivity.AmtTot = parseFloat(totalAmt);
			// 	oActivity.AmtATot = parseFloat(totalAAmt); // Actualts
			// 	//psutram
			// 	oActivity.MaxValueB = parseFloat(totalAmt); // set the Plan total to the Plan Amount
			// }

		},

		_validateInput: function() {
			var bAllSuccessful = true;
			this.oMessageManager.removeAllMessages();
			var oOnScreen = this.getModel("Project").getProperty("/OnScreen");
			var oBinding = this.byId("Table").getBinding("rows");
			var iLength = oBinding.filterInfo.aFilteredContexts.length;
			var iFilters = oBinding.aFilters.length;
			if (oBinding.aAllFilters) {
				iFilters = oBinding.aAllFilters.length;
			}
			if (oOnScreen.hasOwnProperty("0")) {
				var oTotals = oOnScreen[0];
				var oTotalsEmpty = this._getBudgetObject();
				this._setTotals(oTotalsEmpty, oTotals);
				oTotals._overallTotal = 0;
				oTotals._overallATotal = 0;
				oTotals._overallAPTGTotal = 0;
				if (iLength === 0 || iFilters === 0) {
					for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
						var oProject = oOnScreen[0][i];
						var oTotalProjectBudget = this._getBudgetObject();
						for (var j = 0; j < oProject._activityCount; j++) {
							var oActivity = oProject[j];
							var oTotalActivityBudget = this._getBudgetObject();
							for (var k = 0; k < oActivity._subactivityCount; k++) {
								var oSubactivity = oActivity[k];
								this._sumBudgetNumbers(oTotalActivityBudget, oSubactivity);
							}
							this._sumBudgetSubActivity(oTotalActivityBudget, oActivity);
							this._sumBudgetNumbers(oTotalProjectBudget, oActivity);
						}
						this._setTotals(oTotalProjectBudget, oProject);
						this._sumTotals(oTotalProjectBudget, oTotals);
					}
				} else {
					// Limit selections by bindings
					var aPaths = [];
					for (var l = 0; l < iLength; l++) {
						aPaths.push(oBinding.filterInfo.aFilteredContexts[l].getPath());
					}
					for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
						var bContinue = false;
						var sPath = "/OnScreen/0/" + i;
						for (var m = 0; m < aPaths.length; m++) {
							if (sPath === aPaths[m]) {
								bContinue = true;
								m = aPaths.length;
							}
						}
						if (bContinue) {
							var oProject = oOnScreen[0][i];
							var oTotalProjectBudget = this._getBudgetObject();
							for (var j = 0; j < oProject._activityCount; j++) {
								bContinue = false;
								sPath = "/OnScreen/0/" + i + "/" + j;
								for (var n = 0; n < aPaths.length; n++) {
									if (sPath === aPaths[n]) {
										bContinue = true;
										n = aPaths.length;
									}
								}
								if (bContinue) {
									var oActivity = oProject[j];
									var oTotalActivityBudget = this._getBudgetObject();
									for (var k = 0; k < oActivity._subactivityCount; k++) {
										bContinue = false;
										sPath = "/OnScreen/0/" + i + "/" + j + "/" + k;
										for (var p = 0; p < aPaths.length; p++) {
											if (sPath === aPaths[p]) {
												bContinue = true;
												n = aPaths.length;
											}
										}
										if (bContinue) {
											var oSubactivity = oActivity[k];
											this._sumBudgetNumbers(oTotalActivityBudget, oSubactivity);
										}
									}
									this._sumBudgetSubActivity(oTotalActivityBudget, oActivity);
									this._sumBudgetNumbers(oTotalProjectBudget, oActivity);
								}
							}
							this._setTotals(oTotalProjectBudget, oProject);
							this._sumTotals(oTotalProjectBudget, oTotals);
						}
					}
				}
				this._overallTotal(oTotals);
				// var sFormattedValue = CustomCurrencyType.prototype.formatValue.apply(new CustomCurrencyType({
				// 	showMeasure: false,
				// 	minFractionDigits: 0,
				// 	maxFractionDigits: 0
				// }), [
				// 	[oTotals._overallTotal, oTotals.Currency], "string"
				// ]);
				//oTotals.Name = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("T_Heading", [sFormattedValue]);
				oTotals.Name = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("T_HeadingT");
				if (!bAllSuccessful) {
					// Begin of Changes - Khrystyne Williams - Nov 2016
					// var sMessage = this.getModel("i18n").getResourceBundle().getText("AC_E_BudgetErrors");
					// MessageToast.show(sMessage);
					// End of Changes - Khrystyne Williams - Nov 2016
				}
				oTotals.AmtBTot = oTotals._overallTotal;
				oTotals.AmtATot = oTotals._overallATotal;
				// Begin of Commenting - Khrystyne Williams - Nov 2016
				oTotals.AmtLeTot = oTotals._overallAPTGTotal;
				// End of Commenting - Khrystyne Williams - Nov 2016
				this.getModel("Project").refresh(false);
			}
			return bAllSuccessful;
		},
		_setupMessageManager: function(oRow, oRecord) {
			var i = 0;
			var bOffTable = true;
			if (oRow) {
				var aCells = oRow.getCells();
				bOffTable = false;
			}
			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sFieldEditable = "FC_Editable_AmtB" + i;
				if (!bOffTable) {
					for (var j = 0; j < aCells.length; j++) {
						if (aCells[j].getMetadata()._sClassName === "sap.m.Input" && oRecord[sFieldEditable] === true) {
							var sPath = aCells[j].getBindingInfo("value").parts[0].path;
							if (sPath === sColumnName) {
								var sValueStateText = "FC_ValueStateText_AmtB" + i;
								var sValueState = "FC_ValueState_AmtB" + i;
								if (oRecord.hasOwnProperty(sValueState) && oRecord[sValueState] !== sap.ui.core.ValueState.None) {
									this.oMessageManager.addMessages(
										new sap.ui.core.message.Message({
											message: oRecord[sValueStateText],
											//description: aCells[j].getId(),  // This was changed by request to not navigate
											description: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_E_ErroredRecord", [oRecord.Id]),
											type: oRecord[sValueState],
											processor: this.oMessageProcessor
										})
									);
								}
								j = aCells.length;
							}
						}
					}
				} else {
					var sValueStateText = "FC_ValueStateText_AmtB" + i;
					var sValueState = "FC_ValueState_AmtB" + i;
					if (oRecord.hasOwnProperty(sValueState) && oRecord[sValueState] !== sap.ui.core.ValueState.None) {
						this.oMessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: oRecord[sValueStateText],
								description: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_E_ErroredRecord", [oRecord.Id]),
								type: oRecord[sValueState],
								processor: this.oMessageProcessor
							})
						);

					}
				}
			} while (i < 12);
			if (!bOffTable) {
				for (var j = 0; j < aCells.length; j++) {
					if (aCells[j].getMetadata()._sClassName === "sap.m.Input" && oRecord.FC_Editable_MaxValueB === true) {
						var sPath = aCells[j].getBindingInfo("value").parts[0].path;
						if (sPath === "MaxValueB") {
							if (oRecord.hasOwnProperty("FC_ValueState_MaxValueB") && oRecord.FC_ValueState_MaxValueB !== sap.ui.core.ValueState.None) {
								this.oMessageManager.addMessages(
									new sap.ui.core.message.Message({
										message: oRecord.FC_ValueStateText_MaxValueB,
										// GDH description: aCells[j].getId(), // No navigation to target object
										description: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_E_ErroredRecord", [oRecord.Id]),
										type: oRecord.FC_ValueState_MaxValueB,
										processor: this.oMessageProcessor
									})
								);
							}
							j = aCells.length;
						}
					}
				}
			} else {
				if (oRecord.hasOwnProperty("FC_ValueState_MaxValueB") && oRecord.FC_ValueState_MaxValueB !== sap.ui.core.ValueState.None) {
					this.oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: oRecord.FC_ValueStateText_MaxValueB,
							description: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_E_ErroredRecord", [oRecord.Id]),
							type: oRecord.FC_ValueState_MaxValueB,
							processor: this.oMessageProcessor
						})
					);
				}
			}
		},
		_saveBudget: function() {
			SpinnerUtils.startDetailSpinner(this);
			var oData = this.getModel("Project").getData();
			var aChangedRows = [];
			var aChangedCaps = [];
			var oOrigData = oData.FromService;
			var oCurrData = oData.OnScreen;
			var bAllowSave = true;
			for (var i = 0; i < oCurrData[0]._projectCount; i++) {
				var oProject = oCurrData[0][i];
				var nCap = parseFloat(oProject.MaxValueC);
				var nPlan = parseFloat(oProject.MaxValueCb);
				var nPlanAdjustment = parseFloat("0.0");
				var bProjectChanged = false;
				if (this._checkForCapChanges(oProject, oOrigData[0][i])) {
					aChangedCaps.push(oProject);
					bProjectChanged = true;
				}
				for (var j = 0; j < oProject._activityCount; j++) {
					var oActivity = oProject[j];
					if (this._checkForChanges(oActivity, oOrigData[0][i][j])) {
						var aSelected = this.byId("Table").getSelectedIndices();
						aChangedRows.push(oActivity);
						bProjectChanged = true;
					}
					for (var k = 0; k < oActivity._subactivityCount; k++) {
						var oSubactivity = oActivity[k];
						var oOrig = oOrigData[0][i][j][k];
						if (this._checkForChanges(oSubactivity, oOrigData[0][i][j][k])) {
							aChangedRows.push(oSubactivity);
							bProjectChanged = true;
							if (nCap > parseFloat("0.0")) {
								nPlanAdjustment = parseFloat(nPlanAdjustment) +
									parseFloat(oSubactivity.AmtB1) - parseFloat(oOrig.AmtB1) +
									parseFloat(oSubactivity.AmtB2) - parseFloat(oOrig.AmtB2) +
									parseFloat(oSubactivity.AmtB3) - parseFloat(oOrig.AmtB3) +
									parseFloat(oSubactivity.AmtB4) - parseFloat(oOrig.AmtB4) +
									parseFloat(oSubactivity.AmtB5) - parseFloat(oOrig.AmtB5) +
									parseFloat(oSubactivity.AmtB6) - parseFloat(oOrig.AmtB6) +
									parseFloat(oSubactivity.AmtB7) - parseFloat(oOrig.AmtB7) +
									parseFloat(oSubactivity.AmtB8) - parseFloat(oOrig.AmtB8) +
									parseFloat(oSubactivity.AmtB9) - parseFloat(oOrig.AmtB9) +
									parseFloat(oSubactivity.AmtB10) - parseFloat(oOrig.AmtB10) +
									parseFloat(oSubactivity.AmtB11) - parseFloat(oOrig.AmtB11) +
									parseFloat(oSubactivity.AmtB12) - parseFloat(oOrig.AmtB12);
							}
						}
					}
				}
				if (nCap > parseFloat("0.0") && bProjectChanged) {
					var nRemaining = nCap - nPlan - nPlanAdjustment + parseFloat("5.0"); // The 5 is a buffer to avoid rounding issues.
					if (nRemaining < parseFloat("0.0")) {
						// Set error
						bAllowSave = false;
						var sMessage = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_E_OverAllocated", [Math.round(Math.abs(
							nRemaining)), this.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings/Currency")]);
						for (var j = 0; j < oProject._activityCount; j++) {
							var oActivity = oProject[j];
							for (var k = 0; k < oActivity._subactivityCount; k++) {
								var oSubactivity = oActivity[k];
								oSubactivity.FC_ValueState_MaxValueB = sap.ui.core.ValueState.Error;
								oSubactivity.FC_ValueStateText_MaxValueB = sMessage;
							}
						}
					} else {
						for (var j = 0; j < oProject._activityCount; j++) {
							var oActivity = oProject[j];
							for (var k = 0; k < oActivity._subactivityCount; k++) {
								var oSubactivity = oActivity[k];
								oSubactivity.FC_ValueState_MaxValueB = sap.ui.core.ValueState.None;
								oSubactivity.FC_ValueStateText_MaxValueB = "";
							}
						}
					}
				}
			}
			if (bAllowSave) {
				if (aChangedRows.length > 0 || aChangedCaps.length > 0) {
					var aPromises = [];
					this.nTotalCurrentChanges = aChangedRows.length + aChangedCaps.length;
					if (aChangedCaps.length > 0) {
						var oPromise = OverlayUtils.updateOverlay(this, this.getOwnerComponent().getModel("P13n_Configuration").getProperty(
							"/CurrencySettings/Currency"), aChangedCaps);
						aPromises.push(oPromise);
					}
					if (aChangedRows.length > 0) {
						var oUPromise = OverlayUtils.updatePlan(this, aChangedRows);
						aPromises.push(oUPromise);
					}
					var oAllPromises = Promise.all(aPromises);
					oAllPromises.then(function(oData) {
						var oEventData = {};
						oEventData.oDataOrigin = "SaveBudget";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
					}).catch(function(oError) {
						oError.ErrorOrigin = "SaveBudget";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
					});
				} else {
					SpinnerUtils.stopSpinner(this);
					var oEventData = {};
					oEventData.oDataOrigin = "NoChanges";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
				}
			} else {
				this.getModel("Project").refresh(false);
				SpinnerUtils.stopSpinner(this);
				MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_E_POverAllocated", []));
			}
		},
		_clearUnused: function(oRaw) {
			oRaw.AmtBTot = "0";
			oRaw.AmtATot = "0";
			oRaw.AmtCTot = "0";
			oRaw.AmtCbTot = "0";
			oRaw.MaxValueB = "0";
			// Begin of Changes - Khrystyne Williams - Nov 2016
			oRaw.AmtLeTot = "0";
			// End of Changes - Khrystyne Williams - Nov 2016
			delete oRaw._UPDFIN;
			delete oRaw._UPDITEM;
		},
		_p13nInitialize: function() {
			var oColumns = ColumnCatalog.getColumnCatalog(this);
			var oActivitiesConfig = {
				MaxTableRows: 15
			};
			var iMaxTableRows = this.getOwnerComponent().getModel("P13n_Configuration").getProperty("/ActivitiesConfig/MaxTableRows");
			if (iMaxTableRows > 0) {
				oActivitiesConfig.MaxTableRows = iMaxTableRows;
			}
			var oDefaultModel = new sap.ui.model.json.JSONModel(oColumns);
			oDefaultModel.setSizeLimit(50000);
			this.getOwnerComponent().setModel(oDefaultModel, "P13n_default");
			oDefaultModel = new sap.ui.model.json.JSONModel(oActivitiesConfig);
			this.getOwnerComponent().setModel(oDefaultModel, "P13n_ActivitiesConfig");
			var oVariants = this.byId("Variant");
			var sSelectionKey = oVariants.getSelectionKey();
			if (sSelectionKey && sSelectionKey.substring(0, 7) === "Variant") {
				var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
				var iIndex = sSelectionKey.replace("Variant", "");
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(aVariants[iIndex])));
				this._syncConfigAndTable();
			} else {
				var oModel = new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oColumns)));
				this.getOwnerComponent().setModel(oModel, "P13n");
			}
			this.__removeVariantChangedIndicator();
		},
		_openP13nDialog: function() {
			// associate controller with the fragment
			if (!this.oPersonalizationDialog) {
				this.oPersonalizationDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.ProjectsPersonalizationDialog", this);
				this.getView().addDependent(this.oPersonalizationDialog);
				var oP13nFilterPanel = sap.ui.getCore().byId("oP13nProjectFilterPanel");
				oP13nFilterPanel.setIncludeOperations([
					sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.Contains, sap.m.P13nConditionOperation.StartsWith, sap.m.P13nConditionOperation
					.EndsWith
				]);
				oP13nFilterPanel.setExcludeOperations([
					sap.m.P13nConditionOperation.EQ
				]);
			}

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oPersonalizationDialog);
			this.oPersonalizationDialog.open();
		},
		_syncConfigAndTable: function() {
			var oConfig = this.getOwnerComponent().getModel("P13n").getData();
			var oProjectView = this.getModel("projectView").getData();
			var oTable = this.byId("Table");
			var aColumns = oTable.removeAllColumns();
			if (!oProjectView.aRenderedColumnSet && aColumns.length > 0) {
				oProjectView.aRenderedColumnSet = aColumns;
			}
			if (oProjectView.aRenderedColumnSet) {
				aColumns = oProjectView.aRenderedColumnSet;
			}
			var aColumnData = oConfig.ColumnCollection;
			for (var i = 0; i < aColumnData.length; i++) {
				for (var j = 0; j < aColumns.length; j++) {
					if (Number(aColumnData[i].columnIndex).toString() === aColumns[j].getId().split("--Column")[1]) {
						//GDH 20170326 if (aColumnData[i].text === aColumns[j].getLabel().getText()) {
						oTable.addColumn(aColumns[j]);
						j = aColumns.length;
					}
				}
			}
			// August 30
			this._applySort();
			this._applyFilter();
		},
		_updateP13nConfigForColumnWidth: function() {
			var oConfig = this.getOwnerComponent().getModel("P13n").getData();
			var oTable = this.byId("Table");
			var aColumns = oTable.getColumns();
			var aColumnData = oConfig.FixedColumnConfig;
			for (var i = 0; i < aColumns.length; i++) {
				for (var j = 0; j < aColumnData.length; j++) {
					if (Number(aColumnData[j].columnIndex).toString() === aColumns[i].getId().split("--Column")[1]) {
						//GDH 20170326 if (aColumnData[j].text === aColumns[i].getLabel().getText()) {
						var sWidth = aColumns[i].getWidth();
						if (sWidth && sWidth !== "") {
							aColumnData[j].width = sWidth;
						}
						j = aColumnData.length;
					}
				}
			}
		},
		_applySort: function() {
			var aConfig = this.getOwnerComponent().getModel("P13n").getData().SortItems;
			var oTableBinding = this.byId("Table").getBinding("rows");
			var aColumns = this.byId("Table").getColumns();
			var sorters = [];
			for (var i = 0; i < aConfig.length; i++) {
				var bDescending = (aConfig[i].operation === "Descending") ? true : false;
				var sorter = new Sorter(aConfig[i].columnKey, bDescending);
				sorters.push(sorter);
			}
			oTableBinding.sort(sorters);
			// Turn off the sort indicator
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
		},
		_applyFilter: function() {
			var aConfig = this.getOwnerComponent().getModel("P13n").getData().FilterItems;
			var oTableBinding = this.byId("Table").getBinding("rows");
			var aColumns = this.byId("Table").getColumns();
			var filters = [];
			for (var i = 0; i < aConfig.length; i++) {
				var filterType = aConfig[i].operation;
				if (aConfig[i].hasOwnProperty("exclude") && aConfig[i].exclude) {
					filterType = "NE";
				}
				var value1 = "";
				var value2 = "";
				if (aConfig[i].hasOwnProperty("value1")) {
					value1 = aConfig[i].value1;
				}
				if (aConfig[i].hasOwnProperty("value2")) {
					value2 = aConfig[i].value2;
				}
				var filter = new Filter(aConfig[i].columnKey.substring(aConfig[i].columnKey.lastIndexOf(">") + 1), filterType, value1,
					value2);
				filters.push(filter);
			}
			oTableBinding.filter(filters);
			// Turn adjust filter indicator
			for (var i = 0; i < aColumns.length; i++) {
				var bFiltered = false;
				for (var j = 0; j < aConfig.length; j++) {
					if (aConfig[j].columnKey.substring(aConfig[j].columnKey.lastIndexOf(">") + 1) === aColumns[i].mProperties.filterProperty) {
						bFiltered = true;
						j = aConfig.length;
					}
				}
				aColumns[i].setFiltered(bFiltered);
			}

			// PSW Start change to Page Title to add filters from personalisation
			this._setStyleMode(this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.currentMode);
			// PSW End change to Page Title to add filters from personalisation
		},
		onP13nAddSortItem: function(oEvent) {
			PersonalizationUtils.p13nAddSortItem(oEvent.getParameter("sortItemData"), this.getOwnerComponent().getModel("P13n").getData().SortItems);
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onP13nUpdateSortItem: function(oEvent) {
			PersonalizationUtils.p13nUpdateSortItem(oEvent.getParameter("sortItemData"), this.getOwnerComponent().getModel("P13n").getData().SortItems,
				oEvent.getParameter(
					"index"));
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onP13nRemoveSortItem: function(oEvent) {
			PersonalizationUtils.p13nRemoveSortItem(oEvent.getParameter("sortItemData"), this.getOwnerComponent().getModel("P13n").getData().SortItems,
				oEvent.getParameter(
					"index"));
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onP13nAddFilterItem: function(oEvent) {
			PersonalizationUtils.p13nAddFilterItem(oEvent.getParameter("filterItemData"), this.getOwnerComponent().getModel("P13n").getData().FilterItems);
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onP13nUpdateFilterItem: function(oEvent) {
			PersonalizationUtils.p13nUpdateFilterItem(oEvent.getParameter("filterItemData"), this.getOwnerComponent().getModel("P13n").getData()
				.FilterItems,
				oEvent.getParameter(
					"index"));
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onP13nRemoveFilterItem: function(oEvent) {
			PersonalizationUtils.p13nRemoveFilterItem(oEvent.getParameter("filterItemData"), this.getOwnerComponent().getModel("P13n").getData()
				.FilterItems,
				oEvent.getParameter(
					"index"));
			this.getOwnerComponent().getModel("P13n").refresh(false);
			this.__setVariantChangedIndicator();
		},
		onEnter: function(oEvent) {
			var oField = oEvent.getSource();
			var sId = oField.getId();
			var bFocusSet = false;
			var aCells = oField.getParent().getCells();
			var sFieldName = oField.getBindingInfo("value").parts[0].path;
			var bFieldFound = false;
			for (var i = 0; i < aCells.length; i++) {
				if (bFieldFound) {
					if (aCells[i].getMetadata()._sClassName === "sap.m.Input" &&
						aCells[i].getBindingInfo("editable") &&
						this.getModel("Project").getProperty(oField.getParent().getBindingContext("Project").sPath)[aCells[i].getBindingInfo(
							"editable").parts[0].path]) {
						aCells[i].focus();
						bFocusSet = true;
						i = aCells.length;
					}
				}
				if (!bFieldFound && aCells[i].getMetadata()._sClassName === "sap.m.Input" &&
					aCells[i].getBindingInfo("value") &&
					aCells[i].getBindingInfo("value").parts[0] &&
					aCells[i].getBindingInfo("value").parts[0].path ===
					sFieldName) {
					bFieldFound = true;
				}
			}
			if (!bFocusSet) {
				// Add in progress to the next row.
				var oRow = oField.getParent();
				var oTable = oRow.getParent();
				var aRows = oTable.getRows();
				var iRowIndex = 0;
				for (var j = 0; j < aRows.length; j++) {
					if (aRows[j] === oRow) {
						iRowIndex = j + 1;
						j = aRows.length;
					}
				}
				for (var k = iRowIndex; k < aRows.length; k++) {
					if (this.getModel("Project").getProperty(aRows[k].getBindingContext("Project").sPath).ItemType !== "PT") {
						var aRowCells = aRows[k].getCells();
						for (var l = 0; l < aRowCells.length; l++) {
							if (aRowCells[l].getMetadata()._sClassName === "sap.m.Input" &&
								aRowCells[l].getBindingInfo("editable") &&
								this.getModel("Project").getProperty(aRows[k].getBindingContext("Project").sPath)[aRowCells[l].getBindingInfo("editable").parts[
									0].path]) {
								aRowCells[l].focus();
								l = aRowCells.length;
								bFocusSet = true;
							}
						}
						if (bFocusSet) {
							k = aRows.length;
						}
					}
				}
			}
		},
		onSelectNone: function(oEvent) {
			var oTable = this.byId("Table");
			oTable.clearSelection();
			this.getModel("projectView").setProperty("/oTStatus/Selected", "");
			this.getModel("projectView").setProperty("/oFStatus/Selected", "");
			// Begin of Changes - Khrystyne Williams - Nov 2016
			this.getModel("projectView").setProperty("/oTStatus/Enabled", false);
			this.getModel("projectView").setProperty("/oTableControl/selMatchEnabled", false);
			// End of Changes - Khrystyne Williams - Nov 2016
		},
		onSSelectMatch: function(oEvent) {
			// Check all table entries that match
			var oTable = this.byId("Table");
			var sSelectedKey = this.getModel("projectView").getProperty("/oFStatus/Selected");
			oTable.clearSelection();
			for (var i = 0; i < this.getModel("Project").getData().AsInputArray.length; i++) {
				// Update Rows
				var oContext = oTable.getContextByIndex(i);
				// There is an apparent bug in SAPUI5.  The first time through, the final record seems unable to be read  We are less than the threshold.
				if (oContext) {
					var sPath = oContext.getPath();
					var oRecord = this.getModel("Project").getProperty(sPath);
					if (oRecord.Status === sSelectedKey && oRecord.ItemType !== "PT") {
						oTable.addSelectionInterval(i, i);
					}
				}
			}
		},
		onVariantManage: function(oEvent) {
			var aRenamed = oEvent.getParameters().renamed;
			var aDeleted = oEvent.getParameters().deleted;
			var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
			var aDeletedIndicies = [];
			var oVariants = this.byId("Variant");
			var oSelectedKey = oVariants.getSelectionKey();
			var iSelectedIndex = oSelectedKey.replace("Variant", "");
			var bDeletedCurrent = false;
			for (var i = 0; i < aDeleted.length; i++) {
				var iIndex = aDeleted[i].replace("Variant", "");
				if (iIndex === iSelectedIndex) {
					bDeletedCurrent = true;
				}
				aDeletedIndicies.push(iIndex);
				PersonalizationUtils.p13nVariantDelete(this, aVariants[iIndex].PersData, "PlanningVariants", aVariants[iIndex].Guid, aVariants[
					iIndex].Description, aVariants[iIndex].__metadata.uri.substring(aVariants[iIndex].__metadata.uri.indexOf("/Variants")));
			}
			aDeletedIndicies.sort(function(a, b) {
				return b - a;
			});
			for (var k = 0; k < aDeletedIndicies.length; k++) {
				aVariants.splice(aDeletedIndicies[k], 1);
			}
			if (bDeletedCurrent) {
				this._variantSwap("*standard*");
			}
			for (var j = 0; j < aRenamed.length; j++) {
				var iIndex = aRenamed[j].key.replace("Variant", "");
				aVariants[iIndex].Description = aRenamed[j].name;
				PersonalizationUtils.p13nVariantSave(this, JSON.parse(aVariants[iIndex].PersData), "PlanningVariants", aVariants[iIndex].Guid,
					aVariants[iIndex]
					.DefaultVar, aRenamed[j].name, true);
			}
			if (oEvent.getParameters().def !== this.getOwnerComponent().getModel("P13n_Variants").getData().DefaultVariant) {
				this.getOwnerComponent().getModel("P13n_Variants").getData().DefaultVariant = oEvent.getParameters().def;
				if (oEvent.getParameters().def !== "*standard*" && oEvent.getParameters().def.indexOf("Variant") !== -1) {
					var iIndex = oEvent.getParameters().def.replace("Variant", "");
					aVariants[iIndex].DefaultVar = 'X';
					PersonalizationUtils.p13nVariantSave(this, JSON.parse(aVariants[iIndex].PersData), "PlanningVariants", aVariants[iIndex].Guid,
						aVariants[iIndex]
						.DefaultVar, aVariants[iIndex].Description, true);
				}
			}
		},

		onVariantSelect: function(oEvent) {
			var sKey = oEvent.getParameters().key;
			var iIndex = sKey.replace("Variant", "");
			this._variantSwap(iIndex);
			this.__removeVariantChangedIndicator();
			if (this.oPersonalizationDialog) {
				this.oPersonalizationDialog.destroy();
				this.oPersonalizationDialog = null;
			}
			this._getMyProjects(this.getModel("projectView").getProperty("/oTableControl/projectFilterPressed"));

			this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastVariant = iIndex;
		},
		_determineStatusVariant: function() { // GDH 5/23/2016
			// Determine which variant is the Status Variant
			var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
			var iIndex = 0;
			for (var i = 0; i < aVariants.length; i++) {
				var sAddConfig = aVariants[i].AddConfig;
				if (sAddConfig && sAddConfig !== "") {
					var oStatusChange = JSON.parse(aVariants[i].AddConfig);
					if (oStatusChange && oStatusChange.StatusChange === "X") {
						iIndex = i;
						i = aVariants.length;
					}
				}
			}
			this._variantSwap(iIndex);
		},
		_variantSwap: function(iIndex) {
			if (iIndex === "*standard*") {
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(this.getOwnerComponent().getModel("P13n_default").getData())));
			} else {
				var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
				this.getOwnerComponent().getModel("P13n").setData(JSON.parse(aVariants[iIndex].PersData));
			}
			this._syncConfigAndTable();
			this._applyFilter();
			this._applySort();
		},
		_setUpInitialVariant: function() {
			var oVariants = this.byId("Variant");
			this.byId("Variant-popover-popover").attachBeforeOpen({}, function(oEvent) {
				var oVariants = this.byId("Variant");
				var oSelectionKey = oVariants.getSelectionKey();
				if (!oSelectionKey || oSelectionKey === "*standard*") {
					this.byId("Variant-mainsave").setEnabled(false);
				} else {
					var iIndex = oSelectionKey.replace("Variant", "");
					var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
					if (aVariants[iIndex] && aVariants[iIndex].hasOwnProperty("AccessOptions") && aVariants[iIndex].AccessOptions === "R") {
						this.byId("Variant-mainsave").setEnabled(false);
					} else {
						this.byId("Variant-mainsave").setEnabled(true);
					}
				}
			}, this);
			this.getOwnerComponent().getModel("P13n").setData(JSON.parse(JSON.stringify(this.getOwnerComponent().getModel("P13n_default").getData())));
			oVariants.setStandardItemText(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("A_default"));
			var sLabelId = oVariants.getIdForLabel();
			var oLabel = this.byId(sLabelId);
			oLabel.oVariantText.setText(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("A_default"));
			var aVariants = this.getOwnerComponent().getModel("P13n_Variants").getData().Variants;
			for (var i = 0; i < aVariants.length; i++) {
				var bReadOnly = false;
				if (aVariants[i].AccessOptions === "R") {
					bReadOnly = true;
				}
				var oVariant = new sap.ui.comp.variants.VariantItem("Variant" + i, {
					global: false,
					labelReadOnly: bReadOnly,
					readOnly: bReadOnly,
					text: aVariants[i].Description,
					key: "Variant" + i
				});
				oVariants.addVariantItem(oVariant);
				if (aVariants[i].DefaultVar === "X") {
					oVariants.setInitialSelectionKey("Variant" + i);
					this.getOwnerComponent().getModel("P13n").setData(JSON.parse(aVariants[i].PersData));
					this.byId("Variant-mainsave").setEnabled(!bReadOnly);
				}
			}
			this._syncConfigAndTable();

		},
		__setVariantChangedIndicator: function() {
			var oLabel = this.byId(this.byId("Variant").getIdForLabel());
			var sText = oLabel.oVariantText.getText();
			if (sText.substring(sText.length - 1) !== "*") {
				oLabel.oVariantText.setText(oLabel.oVariantText.getText() + "*");
			} else {
				oLabel.oVariantText.setText(oLabel.oVariantText.getText());
			}
		},
		__removeVariantChangedIndicator: function() {
			var oLabel = this.byId(this.byId("Variant").getIdForLabel());
			var sText = oLabel.oVariantText.getText();
			if (sText.substring(sText.length - 1) === "*") {
				oLabel.oVariantText.setText(oLabel.oVariantText.getText().substring(0, sText.length - 1));
			} else {
				oLabel.oVariantText.setText(oLabel.oVariantText.getText());
			}
			// PSW End Change to Text on View Label May 16th
		},
		_setRowStyle: function() {
			var oTable = this.byId("Table");
			var rowCount = oTable.getVisibleRowCount(); //number of visible rows  
			var rowStart = oTable.getFirstVisibleRow(); //starting Row index  
			var numRows = oTable.getRows().length;
			var currentRowContext;
			if (numRows >= rowCount) {
				for (var i = 0; i < rowCount; i++) {
					currentRowContext = oTable.getContextByIndex(rowStart + i); //content  
					if (currentRowContext && currentRowContext !== "") {
						// Remove Style class else it will overwrite  
						oTable.getRows()[i].$().removeClass("Totals");
						oTable.getRows()[i].$().removeClass("Project");
						oTable.getRows()[i].$().removeClass("Activity");
						oTable.getRows()[i].$().removeClass("SubActivity");
						var itemType = this.getModel("Project").getProperty("ItemType", currentRowContext); // Get Amount  
						// Set Row color conditionally  
						if (itemType === "PT") {
							oTable.getRows()[i].$().addClass("Project");
						} else if (itemType === "AT") {
							oTable.getRows()[i].$().addClass("Activity");
						} else if (itemType === "SA") {
							oTable.getRows()[i].$().addClass("SubActivity");
						} else if (itemType === "TL") {
							oTable.getRows()[i].$().addClass("Totals");
						}
						var sValueState = this.getModel("Project").getProperty("_ValueState", currentRowContext);
						if (sValueState && sValueState === "Error") {
							oTable.getRows()[i].$().removeClass("sapUiTableRowSel");
							oTable.getRows()[i].$().removeClass("WarningState");
							oTable.getRows()[i].$().addClass("ErrorState");
						} else if (sValueState && sValueState === "Warning") {
							oTable.getRows()[i].$().removeClass("sapUiTableRowSel");
							oTable.getRows()[i].$().removeClass("ErrorState");
							oTable.getRows()[i].$().addClass("WarningState");
						} else {
							oTable.getRows()[i].$().removeClass("ErrorState");
							oTable.getRows()[i].$().removeClass("WarningState");
							// Re-Add if row is selected
							var aSelected = oTable.getSelectedIndices();
							for (var j = 0; j < aSelected.length; j++) {
								if ((rowStart + i) === aSelected[j]) {
									oTable.getRows()[i].$().addClass("sapUiTableRowSel");
									j = aSelected.length;
								}
							}
						}
					}
				}
			}
		},
		__setBudgetEditable: function(bEdit) {
			ValidationUtils.removeErrorMessages(this);
			if (bEdit) {
				this._setStyleMode("Edit");
			} else {
				this._setStyleMode("Display");
			}
			var oOnScreen = this.getModel("Project").getProperty("/OnScreen");
			for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
				var oProject = oOnScreen[0][i];
				this.__setRowEditable(bEdit, oProject);
				for (var j = 0; j < oProject._activityCount; j++) {
					var oActivity = oProject[j];
					this.__setRowEditable(bEdit, oActivity);
					for (var k = 0; k < oActivity._subactivityCount; k++) {
						var oSubactivity = oActivity[k];
						this.__setRowEditable(bEdit, oSubactivity);
					}
				}
			}
			this.getModel("Project").refresh(false);
			if (bEdit) {
				this.getModel("projectView").setProperty("/oTableControl/bAddVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bEditVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/statusEnabled", false);
				this.getModel("projectView").setProperty("/oTableControl/bValidateVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bDistributeVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bSaveVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bCancelVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bSCancelVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bSSaveVisible", false);
				//psutram modified for Refresh and Calculate functionality
				this.getModel("projectView").setProperty("/oTableControl/bCalculateVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", false);

				//Clear Filter // USERA04 // 2/21/2017
				this.getModel("projectView").setProperty("/oTableControl/bClearVisible", false);

			} else {
				this.getModel("projectView").setProperty("/oTableControl/bEditVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bAddVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bValidateVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bDistributeVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bSaveVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bCancelVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/statusEnabled", true);
				this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", true);
				//psutram modified for Refresh and Calculate functionality
				this.getModel("projectView").setProperty("/oTableControl/bCalculateVisible", false);
				this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", true);
				this.getModel("projectView").setProperty("/oTableControl/bClearVisible", true);
				//END OF // Clear Filter // USERA04 // 2/21/2017

			}
			this.getModel("projectView").refresh(false);
			// Begin of Changes - Khrystyne Williams - Nov 2016
			// this.byId("Table").expandToLevel(1);
			// End of Changes - Khrystyne Williams - Nov 2016 
		},

		// psutram: Jan 2017 function modified
		__setRowEditable: function(bEdit, oData) {
			var iStart = oData.StartDt.substring(5, 7);
			var iEnd = oData.EndDt.substring(5, 7);
			var bSEdit = this._checkEditability(oData);
			oData.FC_Editable_AmtB1 = false;
			oData.FC_Editable_AmtB2 = false;
			oData.FC_Editable_AmtB3 = false;
			oData.FC_Editable_AmtB4 = false;
			oData.FC_Editable_AmtB5 = false;
			oData.FC_Editable_AmtB6 = false;
			oData.FC_Editable_AmtB7 = false;
			oData.FC_Editable_AmtB8 = false;
			oData.FC_Editable_AmtB9 = false;
			oData.FC_Editable_AmtB10 = false;
			oData.FC_Editable_AmtB11 = false;
			oData.FC_Editable_AmtB12 = false;
			oData.FC_Editable_MaxValueB = false;
			oData.FC_Editable_MaxValueC = false;
			oData.FC_Editable_StartDt = false;
			oData.FC_Editable_EndDt = false;
			oData.FC_Editable_MaxValueBo = false;

			//psutram: Jan 2017 Added  && oData.ItemType !== "AT" to ensure Activity Budget entries are not editable
			// if (oData.ItemType !== "PT" && bEdit && bSEdit) 
			if (oData.ItemType === "PT" && bEdit && this._checkCapEditability(oData)) {
				oData.FC_Editable_MaxValueC = true;
				// GDH The warning for the Project Cap is not needed anymore.
				// if (oData.MaxValueC === "" || parseFloat(oData.MaxValueC) <= parseFloat("0.0")) {
				// 	oData.FC_ValueState_MaxValueC = sap.ui.core.ValueState.Warning;
				// 	oData.FC_ValueStateText_MaxValueC = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("AC_BudgetCapMissing", []);
				// }
			} else if (oData.ItemType === "PT" && !bEdit) {
				oData.FC_ValueState_MaxValueC = sap.ui.core.ValueState.None;
				oData.FC_ValueStateText_MaxValueC = "";
			}
			if (oData.ItemType !== "PT" && bEdit && bSEdit && oData.ItemType !== "AT") {
				// Begin of Changes - Khrystyne Williams - Feb 2017
				// if (oData.Status !== "9013") { // Plan Approved
				if (iStart <= 1 && iEnd >= 1) {
					oData.FC_Editable_AmtB1 = true;
				} else {
					oData.AmtB1 = "0.0";
				}
				if (iStart <= 2 && iEnd >= 2) {
					oData.FC_Editable_AmtB2 = true;
				} else {
					oData.AmtB2 = "0.0";
				}
				if (iStart <= 3 && iEnd >= 3) {
					oData.FC_Editable_AmtB3 = true;
				} else {
					oData.AmtB3 = "0.0";
				}
				if (iStart <= 4 && iEnd >= 4) {
					oData.FC_Editable_AmtB4 = true;
				} else {
					oData.AmtB4 = "0.0";
				}
				if (iStart <= 5 && iEnd >= 5) {
					oData.FC_Editable_AmtB5 = true;
				} else {
					oData.AmtB5 = "0.0";
				}
				if (iStart <= 6 && iEnd >= 6) {
					oData.FC_Editable_AmtB6 = true;
				} else {
					oData.AmtB6 = "0.0";
				}
				if (iStart <= 7 && iEnd >= 7) {
					oData.FC_Editable_AmtB7 = true;
				} else {
					oData.AmtB7 = "0.0";
				}
				if (iStart <= 8 && iEnd >= 8) {
					oData.FC_Editable_AmtB8 = true;
				} else {
					oData.AmtB8 = "0.0";
				}
				if (iStart <= 9 && iEnd >= 9) {
					oData.FC_Editable_AmtB9 = true;
				} else {
					oData.AmtB9 = "0.0";
				}
				if (iStart <= 10 && iEnd >= 10) {
					oData.FC_Editable_AmtB10 = true;
				} else {
					oData.AmtB10 = "0.0";
				}
				if (iStart <= 11 && iEnd >= 11) {
					oData.FC_Editable_AmtB11 = true;
				} else {
					oData.AmtB11 = "0.0";
				}
				if (iStart <= 12 && iEnd >= 12) {
					oData.FC_Editable_AmtB12 = true;
				} else {
					oData.AmtB12 = "0.0";
				}
				oData.FC_Editable_MaxValueB = true;
				if (bEdit) {
					this._calculatePlanForDistribution(oData);
				} else {
					oData.MaxValueB = "0.0";
				}
				oData.FC_Editable_StartDt = true;
				oData.FC_Editable_EndDt = true;
				// } else {
				// 	// Only for Plan Approved
				// 	oData.FC_Editable_MaxValueBo = true;
				// }
				// End of Changes - Khrystyne Williams - Feb 2017
			} else {
				oData.MaxValueB = "0.0";
			}
			oData.FC_PlaceHolder_AmtB1 = "";
			oData.FC_ValueState_AmtB1 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB1 = "";
			oData.FC_PlaceHolder_AmtB2 = "";
			oData.FC_ValueState_AmtB2 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB2 = "";
			oData.FC_PlaceHolder_AmtB3 = "";
			oData.FC_ValueState_AmtB3 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB3 = "";
			oData.FC_PlaceHolder_AmtB4 = "";
			oData.FC_ValueState_AmtB4 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB4 = "";
			oData.FC_PlaceHolder_AmtB5 = "";
			oData.FC_ValueState_AmtB5 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB5 = "";
			oData.FC_PlaceHolder_AmtB6 = "";
			oData.FC_ValueState_AmtB6 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB6 = "";
			oData.FC_PlaceHolder_AmtB7 = "";
			oData.FC_ValueState_AmtB7 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB7 = "";
			oData.FC_PlaceHolder_AmtB8 = "";
			oData.FC_ValueState_AmtB8 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB8 = "";
			oData.FC_PlaceHolder_AmtB9 = "";
			oData.FC_ValueState_AmtB9 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB9 = "";
			oData.FC_PlaceHolder_AmtB10 = "";
			oData.FC_ValueState_AmtB10 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB10 = "";
			oData.FC_PlaceHolder_AmtB11 = "";
			oData.FC_ValueState_AmtB11 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB11 = "";
			oData.FC_PlaceHolder_AmtB12 = "";
			oData.FC_ValueState_AmtB12 = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_AmtB12 = "";
			oData.FC_PlaceHolder_MaxValueB = "";
			oData.FC_ValueState_MaxValueB = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_MaxValueB = "";
			oData.FC_PlaceHolder_MaxValueC = "";
			oData.FC_PlaceHolder_StartDt = "";
			oData.FC_ValueState_StartDt = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_StartDt = "";
			oData.FC_PlaceHolder_EndDt = "";
			oData.FC_ValueState_EndDt = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_EndDt = "";
			oData.FC_PlaceHolder_MaxValueBo = "";
			oData.FC_ValueState_MaxValueBo = sap.ui.core.ValueState.None;
			oData.FC_ValueStateText_MaxValueBo = "";
		},
		//GK 05/26/2016 – Start of Change to distribute budget numbers		
		onDistribute: function(oEvent) {
			var oTableSelect = {};
			var aSelected = this.byId("Table").getSelectedIndices();
			var iDivider = 0;
			var bWarned = false;
			var bStatusWarned = false;
			if (aSelected.length > 0) {
				for (var i = 0; i < aSelected.length; i++) {
					// Must update the geo model
					var sPath = this.byId("Table").getContextByIndex(aSelected[i]).getPath();
					oTableSelect = this.getModel("Project").getProperty(sPath);
					var fAmount = parseFloat(oTableSelect.MaxValueB);

					// First check if the record can be edited
					var bEditable = this._checkEditability(oTableSelect);
					if (!bEditable) {
						// Tell the user they can't edit
						if (!bStatusWarned) {
							bStatusWarned = true;
							MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_wrongStatusChange", []));
						}
					} else {
						// Get the number of columns to be updated
						var oCount = this._getRowEditCount(oTableSelect);
						iDivider = oCount.NumberOfCells;
						if (oCount.ExistingValues && !bWarned) {
							bWarned = true;
							var that = this;
							sap.m.MessageBox.show(
								this.getModel("i18n").getResourceBundle().getText("B_T_confirmDistribute_Body"), {
									icon: sap.m.MessageBox.Icon.WARNING,
									title: this.getModel("i18n").getResourceBundle().getText("B_T_confirmDistribute"),
									actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
									onClose: function(oAction) {
										if (oAction === sap.m.MessageBox.Action.YES) {
											for (var j = 0; j < aSelected.length; j++) {
												var sPath = that.byId("Table").getContextByIndex(aSelected[j]).getPath();
												oTableSelect = that.getModel("Project").getProperty(sPath);
												var fAmount = parseFloat(oTableSelect.MaxValueB);

												// First check if the record can be edited
												var bEditable = that._checkEditability(oTableSelect);
												if (bEditable) {
													var oCount = that._getRowEditCount(oTableSelect);
													iDivider = oCount.NumberOfCells;
													//Calculate the the amount to be distributed to each editable column
													var fDistAmt = parseFloat(fAmount / iDivider);
													// Begin of Changes - Khrystyne Williams - Nov 2016
													fDistAmt = Math.floor(fDistAmt);
													var newBalance = fAmount - (fDistAmt * iDivider);
													// that._setDistAmt(oTableSelect, fDistAmt);
													var lmo = that._setDistAmt(oTableSelect, fDistAmt);
													var dColumnName = "AmtB" + lmo;
													oTableSelect[dColumnName] = fDistAmt + newBalance;
													// End of Changes - Khrystyne Williams - Nov 2016
													that.getModel("Project").refresh(false);
												}
											}
										}

									}
								}
							);
						}
					}
				}
				if (!bWarned) {
					//Execute the actions
					for (var j = 0; j < aSelected.length; j++) {
						var sPath = this.byId("Table").getContextByIndex(aSelected[j]).getPath();
						oTableSelect = this.getModel("Project").getProperty(sPath);
						var fAmount = parseFloat(oTableSelect.MaxValueB);

						// First check if the record can be edited
						var bEditable = this._checkEditability(oTableSelect);
						if (bEditable) {
							var oCount = this._getRowEditCount(oTableSelect);
							iDivider = oCount.NumberOfCells;
							//Calculate the the amount to be distributed to each editable column
							var fDistAmt = parseFloat(fAmount / iDivider);
							// Begin of Changes - Khrystyne Williams - Nov 2016
							fDistAmt = Math.floor(fDistAmt);
							var newBalance = fAmount - (fDistAmt * iDivider);
							// that._setDistAmt(oTableSelect, fDistAmt);
							var lmo = this._setDistAmt(oTableSelect, fDistAmt);
							var dColumnName = "AmtB" + lmo;
							oTableSelect[dColumnName] = fDistAmt + newBalance;
							// End of Changes - Khrystyne Williams - Nov 2016
							this.getModel("Project").refresh(false);
						}
					}
				}
				// Begin of Addition - Khrystyne Williams - September
				var oTable = this.byId("Table");
				oTable.clearSelection();
				// End of Addition - Khrystyne Williams - September
			}
		},
		_getRowEditCount: function(oData) {
			var i = 0;
			var iCounter = 0;
			var bExistingValues = false;
			do {
				i++;
				var sColumnName = "FC_Editable_AmtB" + i;
				if (oData[sColumnName]) {
					var sAColumnName = "AmtB" + i;
					iCounter++;
					if (parseFloat(oData[sAColumnName]) > 0.0) {
						bExistingValues = true;
					}
				}
			} while (i < 12);
			var oReturn = {};
			oReturn.ExistingValues = bExistingValues;
			oReturn.NumberOfCells = iCounter;
			return oReturn;
		},
		_setDistAmt: function(oData, fAmt) {
			// Begin of Changes - Khrystyne Williams - Nov 2016
			// var i = 0;
			// do {
			// 	i++;
			// 	var sColumnName = "FC_Editable_AmtB" + i;
			// 	if (oData[sColumnName]) {
			// 		var sAColumnName = "AmtB" + i;
			// 		oData[sAColumnName] = parseFloat(fAmt);
			// 	}
			// } while (i < 12);
			var i = 0;
			var lastmonth = 12;
			do {
				i++;
				var sColumnName = "FC_Editable_AmtB" + i;
				if (oData[sColumnName]) {
					var sAColumnName = "AmtB" + i;
					oData[sAColumnName] = parseFloat(fAmt);
					lastmonth = i;
				}
			} while (i < 12);
			return lastmonth;
			// End of Changes - Khrystyne Williams - Nov 2016
		},
		_generateFilterString: function() {
			var sFilters = "";
			var oFilterDesc = this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect;
			var oExclude = this.getOwnerComponent().getModel("masterShared").getData().oFilters.oExclude;
			if (oFilterDesc.DivisionText !== "" && !oExclude.Division) {
				sFilters = (" Div: " + oFilterDesc.DivisionText);
			}
			if (oFilterDesc.HubText !== "" && !oExclude.Hub) {
				sFilters = sFilters + " |Hub: " + oFilterDesc.HubText;
			}
			if (oFilterDesc.SubText !== "" && !oExclude.Sub) {
				sFilters = sFilters + " |Sub: " + oFilterDesc.SubText;
			}
			return sFilters;
		},
		_confirmHeaderVisibilitySettings: function() {
			var sLastAction = this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction;
			if (sLastAction === "ChangedYear") {
				if (this.getOwnerComponent().getModel("masterShared") && this.getOwnerComponent().getModel("masterShared").getProperty(
						"/oInternalEvents/displayOnlyMode") === true) {
					this._setupDisplayOnlyMode();
				} else {
					this._setupDefaultMode();
				}
			}
		},
		_setupDisplayOnlyMode: function() {
			this.getModel("projectView").setProperty("/oTableControl/bAddVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bEditVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bCheckVisible", false);

			//psutram modified for Refresh and Calculate functionality
			this.getModel("projectView").setProperty("/oTableControl/bCalculateVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", true);

			this.byId("Table").clearSelection();
		},
		_setupDefaultMode: function() {
			this.getModel("projectView").setProperty("/oTableControl/bAddVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bEditVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bCopyVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bDeleteVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bDisplayVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bStatusVisible", true);
			this.getModel("projectView").setProperty("/oTableControl/bCheckVisible", true);

			//psutram modified for Refresh and Calculate functionality
			this.getModel("projectView").setProperty("/oTableControl/bCalculateVisible", false);
			this.getModel("projectView").setProperty("/oTableControl/bRefreshVisible", true);

			this.byId("Table").clearSelection();
		},
		onMonthHelp: function(oEvent) {
			MonthPicker._getMonthPicker(oEvent, this);
		},
		onCollapse: function() {
			var oTreeTable = this.getView().byId("Table");
			oTreeTable.collapseAll();
			oTreeTable.expandToLevel(1);
			this._setRowStyle();
		},
		onExpand: function() {
			var oTreeTable = this.getView().byId("Table");
			oTreeTable.expandToLevel(5);
			this._setRowStyle();
		}
	});
});