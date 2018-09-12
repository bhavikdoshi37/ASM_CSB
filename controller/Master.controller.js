/*global history */
sap.ui.define([
	"colgate/asm/planning/base/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"colgate/asm/planning/base/model/formatter",
	"colgate/asm/planning/base/model/grouper",
	"colgate/asm/planning/base/model/GroupSortState",
	"colgate/asm/planning/base/util/TimeoutUtils",
	"colgate/asm/planning/base/util/DropdownUtils"
], function(BaseController, JSONModel, Filter, FilterOperator, GroupHeaderListItem, Device, formatter, grouper, GroupSortState,
	TimeoutUtils, DropdownUtils) {
	"use strict";

	return BaseController.extend("colgate.asm.planning.base.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {
			// Control state model
			this.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", true);
			this.getOwnerComponent().getModel("masterShared").refresh(false);
			//var oList = this.byId("list");
			var oViewModel = this._createViewModel();
			// Put down master list's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the master list is
			// taken care of by the master list itself.
			//var	iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			// Create main model
			// Begin of Commenting - Khrystyne Williams - Nov
			// var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			// var oBaseModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
			// this.setModel(oBaseModel);
			// End of Commenting - Khrystyne Williams - Nov

			this._oGroupSortState = new GroupSortState(oViewModel, grouper.groupUnitNumber(this.getResourceBundle()));

			//GDH - Receive events when screen is shown 
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe("colgate.asm.planning.master", "Errors", function(sChannelId, sEventId, oData) {
				this._handleODataErrors(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.master", "ButtonsSet", function(sChannelId, sEventId, oData) {
				this._handleButtonsSet(oData);
			}, this);
			oEventBus.subscribe("colgate.asm.planning.master.event", "UserDataLoaded", function(sChannelId, sEventId, oData) {
				this._initializeGeo();
			}, this);
			oEventBus.subscribe("colgate.asm.planning.master.event", "FilterChanged", function(sChannelId, sEventId, oData) {
				this.onFilterChange(null);
			}, this);

			oEventBus.subscribe("colgate.asm.planning.master.event", "ConfigurationLoaded", function(sChannelId, sEventId, oData) {
				this.onYearChange(null);
			}, this);

			//psutram modified 2017.01.07 to clear filters 
			oEventBus.subscribe("colgate.asm.planning.master.event", "ClearFilter", function(sChannelId, sEventId, oData) {
				this.onClearFilter(null);
			}, this);

			//this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};

			this.getOwnerComponent().setModel(oViewModel, "masterView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			// oList.attachEventOnce("updateFinished", function() {
			// 	// Restore original busy indicator delay for the list
			// 	oViewModel.setProperty("/delay", iOriginalBusyDelay);
			// });

			// this.getView().addEventDelegate({
			// 	onBeforeFirstShow: function() {
			// 		this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
			// 	}.bind(this)
			// });

			// Set up the initial selections
			var oData = {};
			oData.OnScreen = [];
			var oModel = new sap.ui.model.json.JSONModel(oData);
			oModel.setSizeLimit(50000);
			this.getOwnerComponent().setModel(oModel, "Locations");
			oData = {};
			oData.Placeholders = {
				Hub: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub"),
				Sub: this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub")
			};
			// PSW Start to add fields for description May 16th
			oData.Input = {};
			oData.Input.DivisionKey = "";
			oData.Input.DivisionText = "";
			oData.Input.HubKey = "";
			oData.Input.HubText = "";
			oData.Input.SubKey = "";
			oData.Input.SubText = "";
			oData.Input.Function = "";
			oData.Input.FunctionText = "";
			oData.Input.Channel = "";
			oData.Input.ChannelText = "";
			oData.Input.Category = "";
			oData.Input.CategoryText = "";
			oData.Input.Subcategory = "";
			oData.Input.SubcategoryText = "";
			oData.Input.Brand = "";
			oData.Input.BrandText = "";
			oData.Input.PlanningYear = "";
			oData.PlanningYear = {};
			oData.PlanningYear.Current = [];
			oData.Brand = {};
			oData.Brand.Current = [];
			oModel = new sap.ui.model.json.JSONModel(oData);
			this.getOwnerComponent().setModel(oModel, "GeoFilter");

			if (this.getOwnerComponent().getModel("masterShared").getProperty("/oInternalEvents/configurationLoaded") === true) {
				this._setPlanningYearInfo();
			}
			DropdownUtils.getBrands(this, this.byId("Brand"), "", "", "", oModel, "/Brand", null, "/Brand/Current");
			// Begin of Commenting - Khrystyne Williams - May 24, 2016
			// Removing the User Image from the master view
			// 			this.byId("UserImage").addStyleClass("img-circle");
			// End of Commenting - Khrystyne Williams - May 24, 2016

			//this._getLocationList();

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			//			this.byId("pullToRefresh").hide();
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("Title", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			//			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the sorter selection.
		 * @param {sap.ui.base.Event} oEvent the select event
		 * @public
		 */
		onSort: function(oEvent) {
			// var sKey = oEvent.getSource().getSelectedItem().getKey(),
			// 	aSorters = this._oGroupSortState.sort(sKey);

			// this._applyGroupSort(aSorters);
		},

		/**
		 * Event handler for the grouper selection.
		 * @param {sap.ui.base.Event} oEvent the search field event
		 * @public
		 */
		onGroup: function(oEvent) {
			// var sKey = oEvent.getSource().getSelectedItem().getKey(),
			// 	aSorters = this._oGroupSortState.group(sKey);

			// this._applyGroupSort(aSorters);
		},

		/**
		 * Event handler for the filter button to open the ViewSettingsDialog.
		 * which is used to add or remove filters to the master list. This
		 * handler method is also called when the filter bar is pressed,
		 * which is added to the beginning of the master list when a filter is applied.
		 * @public
		 */
		onOpenViewSettings: function() {
			if (!this._oViewSettingsDialog) {
				this._oViewSettingsDialog = sap.ui.xmlfragment("colgate.asm.planning.base.view.ViewSettingsDialog", this);
				this.getView().addDependent(this._oViewSettingsDialog);
				// forward compact/cozy style into Dialog
				this._oViewSettingsDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
			this._oViewSettingsDialog.open();
		},

		/**
		 * Event handler called when ViewSettingsDialog has been confirmed, i.e.
		 * has been closed with 'OK'. In the case, the currently chosen filters
		 * are applied to the master list, which can also mean that the currently
		 * applied filters are removed from the master list, in case the filter
		 * settings are removed in the ViewSettingsDialog.
		 * @param {sap.ui.base.Event} oEvent the confirm event
		 * @public
		 */
		onConfirmViewSettingsDialog: function(oEvent) {
			var aFilterItems = oEvent.getParameters().filterItems,
				aFilters = [],
				aCaptions = [];

			// update filter state:
			// combine the filter array and the filter string
			aFilterItems.forEach(function(oItem) {
				switch (oItem.getKey()) {
					case "Filter1":
						aFilters.push(new Filter("ItemBudgetFrcstTotal", FilterOperator.LE, 100));
						break;
					case "Filter2":
						aFilters.push(new Filter("ItemBudgetFrcstTotal", FilterOperator.GT, 100));
						break;
					default:
						break;
				}
				aCaptions.push(oItem.getText());
			});

			this._oListFilterState.aFilter = aFilters;
			this._updateFilterBar(aCaptions.join(", "));
			this._applyFilterSearch();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail();
		},
		onFilterChange: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail();
		},
		onYearChange: function(oEvent) {
			this.getOwnerComponent().getModel("masterShared").getData().oInternalEvents.lastAction = "ChangedYear";
			this._setPlanningYearInfo();
			this._showDetail();
		},
		onGeoSelectionChange: function(oEvent) {
			this.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", true);
			this.getOwnerComponent().getModel("masterShared").refresh(false);
			var sChanged = oEvent.getSource().getId();
			var aParts = sChanged.split("--");
			sChanged = aParts[aParts.length - 1];
			this._setGeoValues(sChanged);
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			//this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page
		 * @override
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#Shell-home"
					}
				});
			}
		},

		onButtonPress: function(oEvent) {
			var oEventBus = sap.ui.getCore().getEventBus();
			var aNames = oEvent.getSource().getId().split("--");
			var oData = {};
			oData.button = aNames[aNames.length - 1];
			// Check if spinner should be started
			var sName = oData.button.replace("Button", "");
			var iCount = sName - 1;
			var sPath = "/aMasterButtons/" + iCount + "/startSpinner";
			if (this.getOwnerComponent().getModel("masterShared").getProperty(sPath)) {
				this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
				this.getOwnerComponent().getModel("masterShared").refresh(false);
				var sCurrentDetailView = this.getOwnerComponent().getModel("masterShared").getProperty("/currentDetailView");
				setTimeout(function() {
					oEventBus.publish("colgate.asm.planning.master.button.pressed", sCurrentDetailView,
						oData);
				}, 200);
			} else {
				oEventBus.publish("colgate.asm.planning.master.button.pressed", this.getOwnerComponent().getModel("masterShared").getProperty(
						"/currentDetailView"),
					oData);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		// psutram. Modified 2017.01.06 
		onClearFilter: function() {
			var oModel = this.getOwnerComponent().getModel("GeoFilter");
			var oData = oModel.getData();
			oData.Input.Division = "";
			oData.Input.DivisionKey = "";
			oData.Input.DivisionText = "";
			oData.Input.Hub = "";
			oData.Input.HubKey = "";
			oData.Input.HubText = "";
			oData.Input.Sub = "";
			oData.Input.SubKey = "";
			oData.Input.SubText = "";
			oData.Input.Function = "";
			oData.Input.FunctionText = "";
			oData.Input.Channel = "";
			oData.Input.ChannelText = "";
			oData.Input.Category = "";
			oData.Input.CategoryText = "";
			oData.Input.Subcategory = "";
			oData.Input.SubcategoryText = "";
			oData.Input.Brand = "";
			oData.Input.BrandText = "";
			oModel.refresh(true);
			this._initializeGeo();
		},
		// end of code changes

		_getLocationList: function() {
			// First check to make sure the user data model is loaded
			// Make initial OData calls that need further processing
			this.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", true); // Start Spinner
			var oBaseModel = this.getModel();
			var sPath = "/Locations";
			var filters = [];
			var oDivision = this.byId("Division");
			var oHub = this.byId("Hub");
			var oSub = this.byId("Sub");
			filters.push(new sap.ui.model.Filter("DivisionKey", sap.ui.model.FilterOperator.EQ,
				oDivision.getSelectedKey()));
			filters.push(new sap.ui.model.Filter("HubKey", sap.ui.model.FilterOperator.EQ,
				oHub.getSelectedKey()));
			filters.push(new sap.ui.model.Filter("SubKey", sap.ui.model.FilterOperator.EQ,
				oSub.getSelectedKey()));
			var that = this;
			oBaseModel.read(sPath, {
				async: true,
				filters: filters,
				success: function(oDataIn, oResponse) {
					TimeoutUtils.onResetTimer(that);
					// Set up JSON data for editing
					var oModel = that.getOwnerComponent().getModel("Locations");
					var oData = oModel.getData();
					oData.OnScreen = JSON.parse(JSON.stringify(oDataIn.results)); // Clone all data
					for (var i = 0; i < oData.OnScreen.length; i++) {
						// Add the index to the record
						oData.OnScreen[i].__index = i;
						// Set the icon
						var sIPath = jQuery.sap.getModulePath("colgate.asm.planning.base");
						if (oData.OnScreen[i].Type && oData.OnScreen[i].Type === "D") {
							oData.OnScreen[i].Icon = sIPath + "/img/Div-web.png";
						} else if (oData.OnScreen[i].Type && oData.OnScreen[i].Type === "H") {
							oData.OnScreen[i].Icon = sIPath + "/img/Hub-web.png";
						} else if (oData.OnScreen[i].Type && oData.OnScreen[i].Type === "S") {
							oData.OnScreen[i].Icon = sIPath + "/img/Sub-web.png";
						}
					}
					// Add in default
					oModel.refresh(false);
					// Now Set the selected entry.
					//that.byId("list").setSelectedItemById(that.byId("list").getItems()[0].getId());
					that._showDetail();
					if (!that._firedStartEventComplete) {
						that._firedStartEventComplete = true;
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.app.event", "StartEventComplete", {
							Location: "LocationList"
						});
					}
				},
				error: function(oError) {
					oError.ErrorOrigin = "Initial";
					sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
				}
			});
		},
		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				busy: true,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "SubDesc",
				groupBy: "DivisionKey"
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function() {
			// this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
			// 	function(mParams) {
			// 		if (mParams.list.getMode() === "None") {
			// 			return;
			// 		}
			// 		var sObjectId = mParams.firstListitem.getBindingContext("list").getProperty("GeoKey") + "-" + mParams.firstListitem.getBindingContext(
			// 			"list").getProperty("Level");
			// 		this.getRouter().navTo("object", {
			// 			objectId: sObjectId
			// 		}, true);
			// 	}.bind(this),
			// 	function(mParams) {
			// 		if (mParams.error) {
			// 			return;
			// 		}
			// 		this.getRouter().getTargets().display("detailNoObjectsAvailable");
			// 	}.bind(this)
			// );
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function() {
			//GDH - Receive events when screen is shown 
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("activities", {
				objectId: "Activities"
			}, bReplace);
			//var sPath = oItem.getBindingContext("Locations").sPath;
			//var iIndex = sPath.substring(sPath.lastIndexOf("/") + 1);
			//var oTile = this.getOwnerComponent().getModel("Locations").getData().OnScreen[iIndex];
			var oTile = {};
			var oInput = this.getOwnerComponent().getModel("GeoFilter").getData().Input;
			var oData = {};
			// PSW Start to add description for selection May 16th 2016
			var oItem = this.byId("Division").getSelectedItem();

			if (oItem) {
				oData.DivisionKey = oItem.getKey();
				oData.DivisionText = oItem.getText();
			} else {
				// Begin of Addition - Khrystyne Vaughan - Jan 18, 2018
				// Adding in this else statement to mitigate the issue of not always having a selected Item available
				// This issue needs to be further investigated and cleaned up when time permits
				var selectedKey = this.byId("Division").getSelectedKey();
				if (selectedKey) {
					oData.DivisionKey = selectedKey;
					var oDItem = this.getModel("Division").getProperty("/VHDivision(Type='D',GeoKey='" + selectedKey + "')");
					if (oDItem) {
						oData.DivisionText = oDItem.Desc;
					} else {
						oData.DivisionText = "";
					}
				} else {
					oData.DivisionKey = "";
					oData.DivisionText = "";
				}
				// End of Addition - Khrystyne Vaughan - Jan 18, 2018
			}
			
			oItem = this.byId("Hub").getSelectedItem();
			if (oItem) {
				oData.HubKey = oItem.getKey();
				oData.HubText = oItem.getText();
			} else {
				// Begin of Addition - Khrystyne Vaughan - Jan 18, 2018
				// Adding in this else statement to mitigate the issue of not always having a selected Item available
				// This issue needs to be further investigated and cleaned up when time permits
				var selectedHKey = this.byId("Hub").getSelectedKey();
				if (selectedHKey) {
					oData.HubKey = selectedHKey;
					var oHItem = this.getModel("Hub").getProperty("/VHHubs(Type='H',GeoKey='" + selectedHKey + "')");
					if (oHItem) {
						oData.HubText = oHItem.Desc;
					} else {
						oData.HubText = "";
					}
				} else {
					oData.HubKey = "";
					oData.HubText = "";
				}
				// End of Addition - Khrystyne Vaughan - Jan 18, 2018
			}
			oItem = this.byId("Sub").getSelectedItem();
			if (oItem) {
				oData.SubKey = oItem.getKey();
				oData.SubText = oItem.getText();
			} else {
				// Begin of Addition - Khrystyne Vaughan - Jan 18, 2018
				// Adding in this else statement to mitigate the issue of not always having a selected Item available
				// This issue needs to be further investigated and cleaned up when time permits
				var selectedSKey = this.byId("Sub").getSelectedKey();
				if (selectedSKey) {
					oData.SubKey = selectedSKey;
					var oSItem = this.getModel("Sub").getProperty("/VHSubs(Type='S',GeoKey='" + selectedSKey + "')");
					if (oSItem) {
						oData.SubText = oSItem.Desc;
					} else {
						oData.SubText = "";
					}
				} else {
					oData.SubKey = "";
					oData.SubText = "";
				}
				// End of Addition - Khrystyne Vaughan - Jan 18, 2018
			}
			oData.Function = oInput.Function;
			if (oInput.Function && oInput.Function !== "" && this.byId("Function").getSelectedItem()) {
				oData.FunctionText = this.byId("Function").getSelectedItem().getText();
			}
			oData.Channel = oInput.Channel;
			if (oInput.Channel && oInput.Channel !== "" && this.byId("Channel").getSelectedItem()) {
				oData.ChannelText = this.byId("Channel").getSelectedItem().getText();
			}
			oData.Category = oInput.Category;
			if (oInput.Category && oInput.Category !== "" && this.byId("Category").getSelectedItem()) {
				oData.CategoryText = this.byId("Category").getSelectedItem().getText();
			}
			oData.Subcategory = oInput.Subcategory;
			if (oInput.Subcategory && oInput.Subcategory !== "" && this.byId("Subcategory").getSelectedItem()) {
				oData.SubcategoryText = this.byId("Subcategory").getSelectedItem().getText();
			}
			oData.Brand = oInput.Brand;
			if (oInput.Brand && oInput.Brand !== "" && this.byId("Brand").getSelectedItem()) {
				oData.BrandText = this.byId("Brand").getSelectedItem().getText();
			}
			this.getOwnerComponent().getModel("masterShared").getData().oMasterSelect = oData;
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("colgate.asm.planning.master.listItemSelected", "Activities", oData);
			// PSW End to add description for se May 16th
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			//var sTitle;
			// only update the counter if the length is final
			// if (this._oList.getBinding("items").isLengthFinal()) {
			// 	sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
			// 	this.getOwnerComponent().getModel("masterView").setProperty("/title", sTitle);
			// }
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getOwnerComponent().getModel("masterView");
			//this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
		 * @private
		 */
		_applyGroupSort: function(aSorters) {
			//this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getOwnerComponent().getModel("masterView");
			//oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},
		_handleODataErrors: function(oDataIn) {
			var sOrigin = oDataIn.ErrorOrigin;
			if (sOrigin === "User") {
				alert("Error Occurred");
			}
			this.getOwnerComponent().getModel("masterShared").setProperty("/oMasterBusy/busy", false); // Stop Spinner
		},
		_initializeGeo: function() {
			// The success for this one handles itself, but you should set the initial division data.
			var oDivision = this.byId("Division");
			var oHub = this.byId("Hub");
			var oSub = this.byId("Sub");
			var oUserData = this.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sDivision = oUserData.getProperty("/DivisionKey");
				if (sDivision && sDivision !== "") {
					oDivision.setSelectedKey(sDivision);
					oDivision.setEnabled(false);
					var sHub = oUserData.getProperty("/HubKey");
					if (sHub && sHub !== "") {
						this._setGeoValues("Division");
						oHub.setSelectedKey(sHub);
						oHub.setEnabled(false);
						var sSub = oUserData.getProperty("/SubKey");
						if (sSub && sSub !== "") {
							this._setGeoValues("Hub");
							oSub.setSelectedKey(sSub);
							oSub.setEnabled(false);
						} else {
							this._setGeoValues("Hub");
						}
					} else {
						this._setGeoValues("Division");
					}
				} else {
					this._setGeoValues("Division");
				}
				this._initializeOthers();
				// Begin of Addition - Khrystyne Williams - May 24, 2016
				// Adding new call for initialization for PH Filter fields
				this._initializePH();
				// End of Addition - Khrystyne Williams - May 24, 2016
			} else {
				this._setGeoValues("Division");
			}
		},
		_initializeOthers: function() {
			var oFunction = this.byId("Function");
			var oChannel = this.byId("Channel");
			var oUserData = this.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sFunction = oUserData.getProperty("/Function");
				var sChannel = oUserData.getProperty("/Channel");
				if (sFunction && sFunction !== "") {
					oFunction.setSelectedKey(sFunction);
					oFunction.setEnabled(false);
				} else {
					oFunction.setSelectedKey("");
				}
				if (sChannel && sChannel !== "") {
					oChannel.setSelectedKey(sChannel);
					oChannel.setEnabled(false);
				} else {
					oFunction.setSelectedKey("");
				}
			}
		},
		// Begin of Addition - Khrystyne Williams - May 24, 2016
		// Adding initialization for PH Filter fields
		_initializePH: function() {
			var oCategory = this.byId("Category");
			var oSubcategory = this.byId("Subcategory");
			var oBrand = this.byId("Brand");
			var oUserData = this.getOwnerComponent().getModel("UserData");
			if (oUserData) {
				var sCategory = oUserData.getProperty("/Category");
				if (sCategory && sCategory !== "") {
					oCategory.setSelectedKey(sCategory);
					oCategory.setEnabled(false);
					var sSubcategory = oUserData.getProperty("/SubCategory");
					if (sSubcategory && sSubcategory !== "") {
						this._setGeoValues("Category");
						oSubcategory.setSelectedKey(sSubcategory);
						oSubcategory.setEnabled(false);
						var sBrand = oUserData.getProperty("/Brand");
						if (sBrand && sBrand !== "") {
							this._setGeoValues("Subcategory");
							oBrand.setSelectedKey(sBrand);
							//oBrand.setEnabled(false);
						} else {
							this._setGeoValues("Subcategory");
						}
					} else {
						this._setGeoValues("Category");
					}
				} else {
					this._setGeoValues("Category");
				}
			} else {
				this._setGeoValues("Category");
			}

		},
		// End of Addition - Khrystyne Williams - May 24, 2016
		_setGeoValues: function(sChanged) {
			var oDivision = this.byId("Division");
			var oHub = this.byId("Hub");
			var oSub = this.byId("Sub");
			// 			Begin of Addition - Khrystyne Williams - May 24, 2016
			var oCategory = this.byId("Category");
			var oSubcategory = this.byId("Subcategory");
			var oBrand = this.byId("Brand");
			oBrand.setEnabled(true);
			// 			End of Addition - Khrystyne Williams - May 24, 2016
			var oACModel = this.getOwnerComponent().getModel("GeoFilter");
			var oACData = oACModel.getData();
			var sServiceUrl = this.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
			oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_f");
			if (sChanged === "Division") {
				// First clear the keys

				var model = this.getOwnerComponent().getModel("Division");
				if (!model) {
					model = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
					model.setSizeLimit(50000);
					this.getOwnerComponent().setModel(model, "Division");
				}
				var sSelected = oDivision.getSelectedKey();
				if (!sSelected || sSelected === "") {
					// var filters = [];
					// filters.push(new sap.ui.model.Filter("GeoKey", sap.ui.model.FilterOperator.EQ, oDivision.getSelectedKey()));
					// var sPath = "/VHDivision";
					// model.read(sPath, {
					// 	async: false,
					// 	filters: filters,
					// 	error: function() {
					// 		alert("Error Occurred");
					// 	}
					// });
					if (oACData.Input.Hub) {
						oACData.Input.Hub = "";
					}
					if (oACData.Input.Sub) {
						oACData.Input.Sub = "";
					}
					oHub.setEnabled(false);
					oSub.setEnabled(false);
					oACData.Placeholders.Hub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub");
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub");
					this._getLocationList();
				} else {
					// Check if you already have these values stored
					var combinedKey = oDivision.getSelectedKey();
					// First clear out old values
					if (oACData.Input.Hub) {
						oACData.Input.Hub = "";
					}
					if (oACData.Input.Sub) {
						oACData.Input.Sub = "";
					}
					if (oACData.Hub && oACData.Hub[combinedKey]) {
						// You don't need to select - we already have the data
						oACData.Hub.Current = oACData.Hub[combinedKey];
						this._getLocationList();
					} else {
						var bmodel = this.getOwnerComponent().getModel("Hub");
						if (!bmodel) {
							bmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
							bmodel.setSizeLimit(50000);
							bmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							this.getOwnerComponent().setModel(bmodel, "Hub");
						}
						var filters = [];
						filters.push(new sap.ui.model.Filter("GeoKey", sap.ui.model.FilterOperator.EQ, oHub.getSelectedKey()));
						filters.push(new sap.ui.model.Filter("DivisionKey", sap.ui.model.FilterOperator.EQ, oDivision.getSelectedKey()));
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
					oHub.setEnabled(true);
					oACData.Placeholders.Hub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_hub_f");
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub_he");
				}
				oSub.setEnabled(false);
			} else if (sChanged === "Hub") {
				// First clear out old values
				if (oHub.getSelectedKey() && oHub.getSelectedKey() !== "") {
					if (oACData.Input.Sub) {
						oACData.Input.Sub = "";
					}
					var sbmodel = this.getOwnerComponent().getModel("Sub");
					if (!sbmodel) {
						sbmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
						sbmodel.setSizeLimit(50000);
						sbmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
						this.getOwnerComponent().setModel(sbmodel, "Sub");
					}
					var filters = [];
					filters.push(new sap.ui.model.Filter("GeoKey", sap.ui.model.FilterOperator.EQ, oSub.getSelectedKey()));
					filters.push(new sap.ui.model.Filter("HubKey", sap.ui.model.FilterOperator.EQ, oHub.getSelectedKey()));
					filters.push(new sap.ui.model.Filter("DivisionKey", sap.ui.model.FilterOperator.EQ, oDivision.getSelectedKey()));
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
					oSub.setEnabled(true);
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub_f");
				} else {
					// Reset Sub
					oSub.setEnabled(false);
					if (oACData.Input.Sub) {
						oACData.Input.Sub = "";
					}
					oACData.Placeholders.Sub = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_sub_he");
					this._getLocationList();
				}
			} else if (sChanged === "Sub") {
				this._getLocationList();
				// Begin of Addition - Khrystyne Williams - May 24, 2016
				// Adding the setting of the Category, SubCategory, and Brand
			} else if (sChanged === "Category") {
				// First clear the keys
				var cmodel = this.getOwnerComponent().getModel("Category");
				if (!cmodel) {
					cmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
					cmodel.setSizeLimit(50000);
					this.getOwnerComponent().setModel(cmodel, "Category");
				}
				var cSelected = oCategory.getSelectedKey();
				if (!cSelected || cSelected === "") {
					oSubcategory.setEnabled(false);
					//oBrand.setEnabled(false);
					if (oACData.Input.Subcategory) {
						oACData.Input.Subcategory = "";
					}
					// if (oACData.Input.Brand) {
					// 	oACData.Input.Brand = "";
					// }
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_pscategory");
					//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand");
					this._showDetail(); //GDH
				} else {
					// Check if you already have these values stored
					var catcombinedKey = oCategory.getSelectedKey();
					// First clear out old values
					if (oACData.Input.Subcategory) { // GDH
						oACData.Input.Subcategory = "";
					}
					// if (oACData.Input.Brand) {
					// 	oACData.Input.Brand = "";
					// }
					if (oACData.Subcategory && oACData.Subcategory[catcombinedKey]) {
						// You don't need to select - we already have the data
						oACData.Subcategory.Current = oACData.Subcategory[catcombinedKey];
					} else {
						var dmodel = this.getOwnerComponent().getModel("Subcategory");
						if (!dmodel) {
							dmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
							dmodel.setSizeLimit(50000);
							dmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
							this.getOwnerComponent().setModel(dmodel, "Subcategory");
						}
						var cfilters = [];
						cfilters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oCategory.getSelectedKey()));
						var cPath = "/VHSubcategories";
						this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
						var holder = this;
						dmodel.read(cPath, {
							async: true,
							filters: cfilters,
							success: function(oData, oResponse) {
								TimeoutUtils.onResetTimer(holder);
								holder._setSubcategory(oData);
							},
							error: function(oError) {
								oError.ErrorOrigin = "Category";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
							}
						});
					}
					oSubcategory.setEnabled(true);
					oACData.Placeholders.Subcategory = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_pscategory_f");
					//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_se");
				}
				DropdownUtils.getBrands(this, oBrand, oCategory.getSelectedKey(), oSubcategory.getSelectedKey(), oBrand.getSelectedKey(),
					this.getOwnerComponent().getModel("GeoFilter"), "/Brand", null, "/Brand/Current");
				//oBrand.setEnabled(false);
			} else if (sChanged === "Subcategory") {
				// First clear out old values
				DropdownUtils.getBrands(this, oBrand, oCategory.getSelectedKey(), oSubcategory.getSelectedKey(), oBrand.getSelectedKey(),
					this.getOwnerComponent().getModel("GeoFilter"), "/Brand", null, "/Brand/Current");
				this._showDetail();
				//if (oSubcategory.getSelectedKey() && oSubcategory.getSelectedKey() !== "") {
				// if (oACData.Input.Brand) {
				// 	oACData.Input.Brand = "";
				// }
				// GDH Brand Adjustments
				// var brmodel = this.getOwnerComponent().getModel("Brand");
				// if (!brmodel) {
				// 	brmodel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				// 	brmodel.setSizeLimit(50000);
				// 	brmodel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				// 	this.getOwnerComponent().setModel(brmodel, "Brand");
				// }
				// var sbfilters = [];
				// sbfilters.push(new sap.ui.model.Filter("PSubCategory", sap.ui.model.FilterOperator.EQ, oSubcategory.getSelectedKey()));
				// sbfilters.push(new sap.ui.model.Filter("Category", sap.ui.model.FilterOperator.EQ, oCategory.getSelectedKey()));
				// if (oBrand.getSelectedKey() && oBrand.getSelectedKey() !== "") {
				// 	sbfilters.push(new sap.ui.model.Filter("Brand", sap.ui.model.FilterOperator.EQ, oBrand.getSelectedKey()));
				// }
				// var brPath = "/VHBrands";
				// this.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				// var brholder = this;
				// brmodel.read(brPath, {
				// 	async: true,
				// 	filters: sbfilters,
				// 	success: function(oData, oResponse) {
				// 		TimeoutUtils.onResetTimer(brholder);
				// 		brholder._setBrand(oData);
				// 	},
				// 	error: function(oError) {
				// 		oError.ErrorOrigin = "Brand";
				// 		sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
				// 	}
				// });
				//oBrand.setEnabled(true);
				//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_f");
				//} else {
				// Reset Brand
				// oBrand.setEnabled(false);
				// if (oACData.Input.Brand) { // GDH
				// 	oACData.Input.Brand = "";
				// }
				//oACData.Placeholders.Brand = this.getOwnerComponent().getModel("i18n").getProperty("AC_P_brand_se");
				//this._showDetail();
				//}
			} else if (sChanged === "Brand") {
				this._showDetail();
			}
			//   End of Addition - Khrystyne Williams - May 24, 2016
		},
		_setHubs: function(oDataIn) {
			var oModel = this.getOwnerComponent().getModel("GeoFilter");
			var oData = oModel.getData();
			if (!oData.Hub) {
				oData.Hub = {};
			}
			oData.Hub.Current = oDataIn.results;
			var oDivision = this.byId("Division");
			var combinedKey = oDivision.getSelectedKey();
			oData.Hub[combinedKey] = oDataIn.results;
			oModel.refresh(false);
			this._getLocationList();
		},
		_setSubs: function(oDataIn) {
			var oModel = this.getOwnerComponent().getModel("GeoFilter");
			var oData = oModel.getData();
			if (!oData.Sub) {
				oData.Sub = {};
			}
			oData.Sub.Current = oDataIn.results;
			oModel.refresh(false);
			this._getLocationList();
		},
		// Begin of Addition - Khrystyne Williams - May 24, 2016
		// Setting the Sub-Category and Brand
		_setSubcategory: function(oDataIn) {
			var oModel = this.getOwnerComponent().getModel("GeoFilter");
			var oData = oModel.getData();
			if (!oData.Subcategory) {
				oData.Subcategory = {};
			}
			oData.Subcategory.Current = oDataIn.results;
			oModel.refresh(false);
			this._showDetail();
		},
		// GDH Brand Adjustment
		// _setBrand: function(oDataIn) {
		// 	var oModel = this.getOwnerComponent().getModel("GeoFilter");
		// 	var oData = oModel.getData();
		// 	if (!oData.Brand) {
		// 		oData.Brand = {};
		// 	}
		// 	oData.Brand.Current = oDataIn.results;
		// 	oModel.refresh(false);
		// 	this._showDetail();
		// },
		// End of Addition - Khrystyne Williams - May 24, 2016
		_handleButtonsSet: function(oDataIn) {
			// if(!this.byId("list").getSelectedItem()){
			// 	var aItems = this.byId("list").getItems();
			// 	var sId = "";
			// 	var sCurrentView = this.getOwnerComponent().getModel("masterShared").getProperty("/currentDetailView");
			// 	if (sCurrentView==="Finance") {
			// 		sId = aItems[0].getId();
			// 	} else if (sCurrentView==="Media"){
			// 		sId = aItems[1].getId();
			// 	} else if (sCurrentView==="Projects"){
			// 		sId = aItems[2].getId();
			// 	}
			// 	this.byId("list").setSelectedItemById(sId);
			// }
		},
		_setPlanningYearInfo: function() {
			var oConfig = JSON.parse(this.getOwnerComponent().getModel("ASMConfig").getData().Properties.PlanningYearConfig);
			var currentPlanningYear = this.getOwnerComponent().getModel("GeoFilter").getProperty("/Input/PlanningYear");
			var configDefaultPlanningYear = this.getOwnerComponent().getModel("GeoFilter").getProperty("/PlanningYear/Default");
			if (!currentPlanningYear || currentPlanningYear === "") {
				var aPlanningYears = this.getOwnerComponent().getModel("GeoFilter").getProperty("/PlanningYear/Current");
				var sPlanningYear = "2016";
				if (!aPlanningYears || aPlanningYears.length === 0) {
					aPlanningYears = [];
					for (var i = 0; i < oConfig.length; i++) {
						var oPlanningYearRecord = {};
						oPlanningYearRecord.Key = oConfig[i].Year;
						oPlanningYearRecord.Text = oConfig[i].Year;
						oPlanningYearRecord.DisplayOnly = oConfig[i].DisplayOnly;
						if (oConfig[i].Default === true) {
							configDefaultPlanningYear = oConfig[i].Year;
							this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/displayOnlyMode", oConfig[i].DisplayOnly);
							currentPlanningYear = configDefaultPlanningYear;
							this.getOwnerComponent().getModel("GeoFilter").setProperty("/Input/PlanningYear", oConfig[i].Year);
							this.getOwnerComponent().getModel("GeoFilter").setProperty("/PlanningYear/Default", oConfig[i].Year);
						}
						aPlanningYears.push(oPlanningYearRecord);
					}
					this.getOwnerComponent().getModel("GeoFilter").setProperty("/PlanningYear/Current", aPlanningYears);
				}
			}
			var aPlanningYears = this.getOwnerComponent().getModel("GeoFilter").getProperty("/PlanningYear/Current");
			for (var i = 0; i < aPlanningYears.length; i++) {
				if (oConfig[i].Year === currentPlanningYear) {
					this.getOwnerComponent().getModel("masterShared").setProperty("/oInternalEvents/displayOnlyMode", oConfig[i].DisplayOnly);
				}
			}
			this.getOwnerComponent().getModel("ASMConfig").getData().Properties.PlanningYear = currentPlanningYear;
			this.getOwnerComponent().getModel("GeoFilter").refresh(false);
		},
		onClearAllFilters: function(oEvent) {
			sap.ui.getCore().getEventBus().publish("colgate.asm.planning.master.event", "ClearFilter", {});
		}
	});

});