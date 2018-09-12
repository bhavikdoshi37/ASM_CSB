sap.ui.define([
	"colgate/asm/planning/base/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"colgate/asm/planning/base/util/PersonalizationUtils",
	"colgate/asm/planning/base/util/CurrencyUtils",
	"colgate/asm/planning/base/util/ColumnCatalog"
], function(BaseController, JSONModel, PersonalizationUtils, CurrencyUtils, ColumnCatalog) {
	"use strict";

	return BaseController.extend("colgate.asm.planning.base.controller.App", {

		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				oListSelector = this.getOwnerComponent().oListSelector,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			var oData = {};
			oData.busy = true;
			oData.delay = 0;
			var oSettings = {};
			oSettings.mode = "HideMode";
			oData.settings = oSettings;
			oViewModel = new JSONModel(oData);
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded()
				.then(fnSetAppNotBusy);

			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			oListSelector.attachListSelectionChange(function() {
				this.byId("idAppControl").hideMaster();
			}, this);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// Initialize main models
			this._createSharedModel();
			//GDH - Setup User Info    - Moved to App level
			this._setupUserInfo();

			//GDH - Initialize App data
			this._initializeAppData();

			//GDH - Receive events when screen is shown 
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("colgate.asm.planning.app.spinner", "StopSpinner", function(sChannelId, sEventId, oData) {
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
				this.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", false); // Stop Spinner
				this.getOwnerComponent().getModel("masterShared").refresh(false);
			}, this);

			oEventBus.subscribe("colgate.asm.planning.master.event", "ConfigurationLoaded", function(sChannelId, sEventId, oData) {
				// Update table personalization
				this._performRoleOverlay(oData);
			}, this);

			oEventBus.subscribe("colgate.asm.planning.personalization", "VariantsSet", function(sChannelId, sEventId, oData) {
				// Update table personalization
				this._performRoleOverlay(oData);
			}, this);

			oEventBus.subscribe("colgate.asm.planning.master.event", "UserDataLoaded", function(sChannelId, sEventId, oData) {
				// Update table personalization
				this._performRoleOverlay(oData);
			}, this);
		},
		_createSharedModel: function() {
			// Create Shared Model
			var oSharedModel = new JSONModel({
				aMasterButtons: [{
					icon: "",
					text: "",
					visible: false,
					startSpinner: false
				}, {
					icon: "",
					text: "",
					visible: false,
					startSpinner: false
				}, {
					icon: "",
					text: "",
					visible: false,
					startSpinner: false
				}],
				oInternalEvents: {
					configurationLoaded: false,
					variantsLoaded: false,
					userDataLoaded: false,
					activityPersonalizationInitialized: false,
					roleOverlayInitialized: false,
					displayOnlyMode: false,
					noAuthorizationMode: false,
					lastAction: "",
					lastVariant: "*standard*",
					currentMode: "Display"
				},
				oServiceUrls: {
					//				    mainService:jQuery.sap.getModulePath("colgate.asm.planning.base") + this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["mainService"].uri,
					//				    userService:jQuery.sap.getModulePath("colgate.asm.planning.base") + this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["userService"].uri
					mainService: this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["mainService"].uri,
					userService: this.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources["userService"].uri
				},
				previousAction: "",
				oDetailBusy: {
					busy: true,
					delay: 0
				},
				oMasterBusy: {
					busy: true,
					delay: 0
				},
				oBusy: {
					busy: true,
					delay: 0,
					skipStop: false
				},
				oUser: {},
				aAddOptions: [],
				oMasterSelect: {},
				oTableSelect: {},
				oParentSelect: {},
				oFilters: {
					oExclude: {}
				}
			});
			oSharedModel.setSizeLimit(50000);
			this.getOwnerComponent().setModel(oSharedModel, "masterShared");
		},
		onCurrencySettings: function() {
			CurrencyUtils.getCurrency(this);
		},
		onGlobalPersonalization: function(oEvent) {
			if (!this._oGPDialog) {
				this._oGPDialog = sap.ui.xmlfragment("colgate.asm.planning.base.fragment.GlobalSettings", this);
				this._oGPDialog.setModel(this.getModel("i18n"), "i18n");
				this._oGPDialog.setModel(this.getModel("appView"), "appView");
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oGPDialog);
			this._oGPDialog.open();
			var currentMode = this.getModel("appView").getData().settings.mode;
			if (currentMode === "ShowHideMode") {
				sap.ui.getCore().byId("GS_hideMaster").setSelectedButton("NO");
			} else if (currentMode === "HideMode") {
				sap.ui.getCore().byId("GS_hideMaster").setSelectedButton("YES");
			}
		},

		onGPConfirm: function(oEvent) {
			var sName = sap.ui.getCore().byId("GS_hideMaster").getSelectedButton();
			if (sName === "YES") {
				this.getModel("appView").getData().settings.mode = "HideMode";
			} else if (sName === "NO") {
				this.getModel("appView").getData().settings.mode = "ShowHideMode";
			}
			this.getModel("appView").refresh(false);
			PersonalizationUtils.p13nSave(this, this.getModel("appView").getData().settings, "GlobalSettings");
		},
		_setupUserInfo: function() {
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/userService");
			var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
			oModel.setSizeLimit(50000);
			this.getOwnerComponent().setModel(oModel, "User");
			var oResultModel = new sap.ui.model.json.JSONModel({});
			oResultModel.setSizeLimit(50000);
			this.getOwnerComponent().setModel(oResultModel, "P13n_Configuration");
			oResultModel = new sap.ui.model.json.JSONModel({});
			oResultModel.setSizeLimit(50000);
			this.getOwnerComponent().setModel(oResultModel, "P13n_Variants");
			var sUser = sap.ushell.Container.getService("UserInfo").getId().toUpperCase();
			var sPath = "/Personalizations";
			var that = this;

			oModel.read(sPath, {
				async: true,
				success: function(oDataIn, oResponse) {
					var aData = oDataIn.results;
					var oData = {};
					for (var i = 0; i < aData.length; i++) {
						oData[aData[i].PersKey] = JSON.parse(aData[i].PersData);
					}
					that.getOwnerComponent().getModel("P13n_Configuration").setData(oData, true);
					// Check to make sure currency exists
					var sCurrency = that.getOwnerComponent().getModel("P13n_Configuration").getProperty("/CurrencySettings");
					if (!sCurrency || sCurrency === "") {
						var oCurrency = {};
						oCurrency.Currency = "EUR"; // Default Currency is Euro
						that.getOwnerComponent().getModel("P13n_Configuration").setProperty("/CurrencySettings", oCurrency);
					}
					// Set Application Data
					if (oData.GlobalSettings) {
						that.getModel("appView").getData().settings = oData.GlobalSettings;
					}
					that.getModel("appView").refresh(false);
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.personalization", "Set", oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Personalization";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master", "Errors", oError);
				}
			});

			sPath = "/Variants";
			var filters = [];
			filters.push(new sap.ui.model.Filter("PersKey", sap.ui.model.FilterOperator.EQ, "PlanningVariants"));
			oModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oDataIn, oResponse) {
					var aData = oDataIn.results;
					var oData = {};
					// Start GDH 20170327 - Reset Texts - In case old values stored in configuration
					// Note: For this to work, the default column collection must never remove entries -
					// The entries must always be the same number.
					var oColumns = ColumnCatalog.getColumnCatalog(that);
					var aDefaultColumnData = oColumns.FixedColumnConfig;
					for (var k = 0; k < aData.length; k++) {
						var oConfig = JSON.parse(aData[k].PersData);
						var aColumnData = oConfig.FixedColumnConfig;
						var aColumnCollection = oConfig.ColumnCollection;
						for (var l = 0; l < aColumnCollection.length; l++) {
							aColumnCollection[l].text = aDefaultColumnData[aColumnCollection[l].columnIndex].text;
						}
						for (var j = 0; j < aColumnData.length; j++) {
							aColumnData[j].text = aDefaultColumnData[aColumnData[j].columnIndex].text;
						}
						aData[k].PersData = JSON.stringify(oConfig);
					}
					// End GDH 20170327 - Reset Texts - In case old values stored in configuration
					oData.Variants = aData;
					oData.DefaultVariant = "*standard*";
					for (var i = 0; i < aData.length; i++) {
						if (aData[i].DefaultVar === "X") {
							oData.DefaultVariant = "Variant" + i;
						}
					}
					that.getOwnerComponent().getModel("P13n_Variants").setData(oData, true);
					that.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.variantsLoaded = true;
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.personalization", "VariantsSet", oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Personalization";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master", "Errors", oError);
				}
			});

			sPath = "/Users('" + sUser + "')";
			oModel.read(sPath, {
				async: false,
				urlParameters: {
						"$expand": "DelegateToUsers"
				},
				success: function(oData, oResponse) {
					oData.oDataOrigin = "User";
					that._handleODataSuccess(oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "User";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master", "Errors", oError);
				}
			});
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
		},
		_setupHeader: function() {
			//GDH - Add new button to the Fiori Header Proof
			var oShell = sap.ui.getCore().getElementById("shell").getHeader();
			// Check if global entries already exist
			var aHeadEndItems = oShell.getHeadEndItems();
			for (var i = 0; i < aHeadEndItems.length; i++) {
				var sText = aHeadEndItems[i].getProperty("text");
				// if (!sText || sText !== "Search") {
				// 	oShell.removeHeadEndItem(aHeadEndItems[i]);
				// 	aHeadEndItems[i].destroy(false);
				// } else 
				if (sText && sText === "Search") {
					aHeadEndItems[i].setVisible(false);
					i = aHeadEndItems.length;
				}
			}
			var aHeadItems = oShell.getHeadItems();
			for (var j = 0; j < aHeadItems.length; j++) {
				if (aHeadItems[j].getIcon().includes("home")) {
					var sTarget = 'FioriLaunchpad.html?sap-theme=ZASM_Theme@/sap/public/bc/themes/~client-321#Shell-home';
					aHeadItems[j].setTarget(sTarget);
					aHeadItems[j].attachPress(function(oEvent) {
						//GDH - Add new button to the Fiori Header Proof
						var oShell = sap.ui.getCore().getElementById("shell").getHeader();
						// Check if global entries already exist
						var aHeadEndItems = oShell.getHeadEndItems();
						for (var i = 0; i < aHeadEndItems.length; i++) {
							var sText = aHeadEndItems[i].getProperty("text");
							if (sText && sText === "Search") {
								aHeadEndItems[i].setVisible(true);
								i = aHeadEndItems.length;
							}
						}
					});
				}
			}
			var oCurrencyButton = new sap.ushell.ui.shell.ShellHeadItem(this.createId("globalASMSettings"));
			oCurrencyButton.setTooltip(this.getOwnerComponent().getModel("i18n").getProperty("GS_globalizationSettings"));
			oCurrencyButton.setIcon("sap-icon://action-settings");
			oCurrencyButton.attachPress(function(oEvent) {
				var oButton = oEvent.getSource();
				// create action sheet only once
				if (!this._actionSheet) {
					this._actionSheet = sap.ui.xmlfragment(
						"colgate.asm.planning.base.view.Settings",
						this
					);
					this.getView().addDependent(this._actionSheet);
				}

				this._actionSheet.openBy(oButton);
			}, this);
			oShell.insertHeadEndItem(oCurrencyButton, 0);
			var sPath = jQuery.sap.getModulePath("colgate.asm.planning.base");
			// Begin of Changes - Khrystyne Williams - Nov 2016
			// oShell.setLogo(sPath + "/img/ColgateLogo.png");
			oShell.setLogo(sPath + "/img/ASM_logo_Large.jpg");
			// End of Changes - Khrystyne Williams - Nov 2016
		},
		_initializeAppData: function() {
			// Begin of Changes - Khrystyne Williams - Nov
			// var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			// var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
			var oModel = this.getOwnerComponent().getModel();
			// End of Changes - Khrystyne Williams - Nov
			oModel.setSizeLimit(50000);
			var sPath = "/VHConfiguration";
			var filters = [];
			filters.push(new sap.ui.model.Filter("Field", sap.ui.model.FilterOperator.EQ, 'Set'));
			filters.push(new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, 'Planning'));
			var that = this;
			oModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oData, oResponse) {
					that._setConfigurationModel(oData);
				},
				error: function(oError) {
					oError.ErrorOrigin = "Initial";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master", "Errors", oError);
				}
			});
		},
		_handleODataSuccess: function(oDataIn) {
			var sOrigin = oDataIn.oDataOrigin;
			if (sOrigin === "User") {
				//GDH - Set user photo - must be updated to real source
				var oShell = sap.ui.getCore().getElementById("shell").getHeader();
				//gga removed 2/15/17 oUser isn't used, causes issues in UI5 1.40 oUser = oShell.getUser();
				var sUser = sap.ushell.Container.getService("UserInfo").getId().toUpperCase();
				var sPath = "Users('" + sUser + "')";
				//GDH - Set Data in User Card
				this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel(oDataIn), "UserData");
				var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/userService");
				// This was added just to resolve a path issue in the SAP Web IDE - It can be removed now
				//var sMPath = jQuery.sap.getModulePath("colgate.asm.planning.base");
				//if (sMPath.endsWith("webapp")) {
				sPath = sServiceUrl + "UserPhotos(ContentType='USR',Username='" + sUser + "')/$value";
				//} else {
				//	sPath = sMPath + sServiceUrl + "UserPhotos(ContentType='USR',Username='" + sUser + "')/$value";
				//}
				// Begin of Commenting - Khrystyne Williams - Nov 2016
				// oUser.setImage(sPath);
				// End of Commenting - Khrystyne Williams - Nov 2016
				var sName = oDataIn.FirstName + " " + oDataIn.LastName;
				//gga removed 2/15/17 oUser isn't used, causes issues in UI5 1.40  oUser.setUsername(sName);
				this.getOwnerComponent().getModel("masterShared").setProperty("/oUser/name", sName);
				this.getOwnerComponent().getModel("masterShared").setProperty("/oUser/position", oDataIn.PositionTitle);
				this.getOwnerComponent().getModel("masterShared").setProperty("/oUser/userImage", sPath);
				this._setupHeader();
			}
			this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/userDataLoaded", true);
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.event", "UserDataLoaded", {});
			this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
		},
		_setConfigurationModel: function(oDataIn) {
			var oModel = this.getOwnerComponent().getModel("ASMConfig");
			var oData = {};
			if (!oModel) {
				oModel = new sap.ui.model.json.JSONModel(oData);
				oModel.setSizeLimit(50000);
				this.getOwnerComponent().setModel(oModel, "ASMConfig");
			}
			oData = oModel.getData();
			if (!oData.Properties) {
				oData.Properties = {};
			}
			var aResults = oDataIn.results;
			for (var i = 0; i < aResults.length; i++) {
				oData.Properties[aResults[i].Field] = aResults[i].Value;
			}
			this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/configurationLoaded", true);
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.event", "ConfigurationLoaded", {});
		},
		_performRoleOverlay: function(oDataIn) {
			if (this.getOwnerComponent().getModel("masterShared") && this.getOwnerComponent().getModel("masterShared").getData()) {
				if (this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/configurationLoaded") === true &&
					this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/variantsLoaded") === true &&
					this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/userDataLoaded") === true &&
					this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/roleOverlayInitialized") !== true) {
					// Do any necessary role overlays
					this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/roleOverlayInitialized", true);
					var oUserData = this.getOwnerComponent().getModel("UserData");
					var sRole = oUserData.getProperty("/Role");
					if (!sRole || sRole === "") {
						sap.ushell.Container.logout();
						this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/noAuthorizationMode", true);
					} else {
						var oConfiguration = this.getOwnerComponent().getModel("ASMConfig");
						var aReplacements = JSON.parse(oConfiguration.getProperty("/Properties/RoleReplacement")).Replacements;
						for (var i = 0; i < aReplacements.length; i++) {
							var oReplacementRecord = aReplacements[i];
							for (var j = 0; j < oReplacementRecord.FromRoles.length; j++) {
								if (sRole === oReplacementRecord.FromRoles[j]) {
									oUserData.setProperty("/Role", oReplacementRecord.ToRole);
									sRole = oReplacementRecord.ToRole;
									j = oReplacementRecord.FromRoles.length;
									i = aReplacements.length;
								}
							}
						}
						// Check if the app is supposed to be display only
						var aDisplayOnly = JSON.parse(oConfiguration.getProperty("/Properties/RoleConfiguration")).DisplayOnly;
						var bRoleFound = false;
						for (var k = 0; k < aDisplayOnly.length; k++) {
							if (sRole === aDisplayOnly[k]) {
								bRoleFound = true;
								this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/displayOnlyMode", true);
							}
						}
						var aAdvanced = JSON.parse(oConfiguration.getProperty("/Properties/RoleConfiguration")).Advanced;
						for (var l = 0; l < aAdvanced.length; l++) {
							if (sRole === aAdvanced[l]) {
								bRoleFound = true;
							}
						}
						if (!bRoleFound) {
							this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/noAuthorizationMode", true);
						} else {
							sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.event", "InitializationComplete", {});
						}
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.event", "StartEventComplete", {
							Location: "RoleOverlay"
						});
					}
				}
			}
		},
		onExit: function() {
			//GDH - Add new button to the Fiori Header Proof
			var oShell = sap.ui.getCore().getElementById("shell").getHeader();
			// Check if global entries already exist
			var aHeadEndItems = oShell.getHeadEndItems();
			for (var i = 0; i < aHeadEndItems.length; i++) {
				var sText = aHeadEndItems[i].getProperty("text");
				if (!sText || sText !== "Search") {
					oShell.removeHeadEndItem(aHeadEndItems[i]);
					aHeadEndItems[i].destroy(false);
				}
			}
		}
	});

});