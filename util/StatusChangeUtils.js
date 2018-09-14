sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast',
	'colgate/asm/planning/base/util/ValidationUtils',
	'colgate/asm/planning/base/util/VendorUtils',
	'colgate/asm/planning/base/util/TimeoutUtils'
], function(Dialog, MessageToast, ValidationUtils, VendorUtils, TimeoutUtils) {
	"use strict";
	return {
		onSave: function(oContext) {
			ValidationUtils.removeErrorMessages(oContext);
			var aSelected = oContext.byId("Table").getSelectedIndices();
			var oModel = oContext.getModel();
			var bAllowSave = true;
			var aAsInputArray = oContext.getModel("Project").getData().AsInputArray;
			var sTStatus = oContext.getModel("projectView").getProperty("/oTStatus/Selected");
			var sFStatus = oContext.getModel("projectView").getProperty("/oFStatus/Selected");
			// If Parent is at the same status as the selected item, make sure it is selected too.
			for (var l = 0; l < aSelected.length; l++) {
				var iParentIndex = -1;
				var iParentPath = "";
				var bAddIndex = false;
				var bAlreadySelected = false;
				var sPath = oContext.byId("Table").getContextByIndex(aSelected[l]).getPath();
				var oRecord = oContext.getModel("Project").getProperty(sPath);
				if (oRecord.ItemType === "SA") {
					var aFilterRows = oContext.byId("Table").getBinding("rows").filterInfo.aFilteredContexts;
					for (var i = 0; i < aFilterRows.length; i++) {
						var sPPath = aFilterRows[i].getPath();
						if (sPPath) {
							var oPRecord = oContext.getModel("Project").getProperty(sPPath);
							if (oPRecord.ItemType === "AT") {
								if (oRecord.__parentIndex === oPRecord.__index) {
									//iParentIndex = oPRecord._index;
									iParentIndex = i;
									iParentPath = sPPath;
									if (oRecord.Status === oPRecord.Status) {
										bAddIndex = true;
									}
									i = aFilterRows.length;
								}
							}
						}
					}
					if (bAddIndex) {
						for (var m = 0; m < l; m++) {
							var sPPath = oContext.byId("Table").getContextByIndex(aSelected[m]).getPath();
							var oPRecord = oContext.getModel("Project").getProperty(sPPath);
							if (oPRecord.__index === iParentIndex) {
								bAlreadySelected = true;
								m = l;
							}
						}
						if (!bAlreadySelected) {
							for (var n = 0; n < oContext.byId("Table").getBinding("rows").getLength(); n++) {
								if (oContext.byId("Table").getContextByIndex(n).getPath() === iParentPath) {
									oContext.byId("Table").addSelectionInterval(n, n);
									n = oContext.byId("Table").getBinding("rows").getLength();
								}
							}
						}
					}
				}
			}
			aSelected = oContext.byId("Table").getSelectedIndices();
			if (aSelected.length > 0) {
				var selectedIndicies = [];
				for (var l = 0; l < aSelected.length; l++) {
					// Get Selected Indicies
					var sPath = oContext.byId("Table").getContextByIndex(aSelected[l]).getPath();
					var oRecord = oContext.getModel("Project").getProperty(sPath);
					// psutram: modfied 2017.01.04 to check if GLAccount is 9 and the targeted status is Released, then that row cannot be released
					// Released status code is 9014
					if (sTStatus === "9014" && oRecord.GlAccount === "9") {
						oRecord._ValueState = "Error";
						var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_W_statusCannotRelease", [oRecord.Name]);
						oContext.oMessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: sMessage,
								description: "",
								type: sap.ui.core.ValueState.Error,
								processor: oContext.oMessageProcessor
							})
						);
						bAllowSave = false;
					}
					// end of modification
					if (sFStatus !== oRecord.Status) {
						// The status of the item in the selected row differs from the From Status selected
						j = aSelected.length;
						bAllowSave = false;
						oRecord._ValueState = "Error";
						var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusMismatch", []);
						oContext.oMessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: sMessage,
								description: "",
								type: sap.ui.core.ValueState.Error,
								processor: oContext.oMessageProcessor
							})
						);
					} else {
						// Check to make sure that Status Progression is not violated.
						selectedIndicies.push(oRecord.__index);
					}
				}
				if (bAllowSave) {
					for (var j = 0; j < aSelected.length; j++) {
						// Check if there are any chosen records which cannot be deleted.
						var sPath = oContext.byId("Table").getContextByIndex(aSelected[j]).getPath();
						var oRecord = oContext.getModel("Project").getProperty(sPath);
						if (sFStatus !== oRecord.Status) {
							// Status of the item selected does not match the from status selected
							j = aSelected.length;
							bAllowSave = false;
							oRecord._ValueState = "Error";
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusMismatch", []);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						} else {
							// Determine if we are trying to promote or demote the status.
							var bPromote = true;
							var sASMConfig = oContext.getOwnerComponent().getModel("ASMConfig").getProperty("/Properties/Status");
							var aStatusProgression = (JSON.parse(sASMConfig)).StatusProgression;
							var iFStatus = -1;
							var iTStatus = -1;
							for (var i = 0; i < aStatusProgression.length; i++) {
								if (aStatusProgression[i] === sTStatus) {
									iTStatus = i;
								}
								if (aStatusProgression[i] === sFStatus) {
									iFStatus = i;
								}
							}
							if (iTStatus === -1 || iFStatus === -1) {
								var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusConfigError", []);
								bAllowSave = false;
								oRecord._ValueState = "Error";
								oContext.oMessageManager.addMessages(
									new sap.ui.core.message.Message({
										message: sMessage,
										description: "",
										type: sap.ui.core.ValueState.Error,
										processor: oContext.oMessageProcessor
									})
								);
							} else {
								if (iTStatus < iFStatus) {
									bPromote = false;
								} else {
									bPromote = true;
								}
								if (oRecord.ItemType === "AT" && !bPromote) {
									// Check whether any child has same level
									for (var l = 0; l < oRecord._subactivityCount; l++) {
										for (var k = 0; k < aStatusProgression.length; k++) {
											if (aStatusProgression[k] === oRecord[l].Status) {
												if (k > iFStatus) {
													bAllowSave = false;
													oRecord._ValueState = "Error";
													var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusConfigError", []);
													oContext.oMessageManager.addMessages(
														new sap.ui.core.message.Message({
															message: sMessage,
															description: "",
															type: sap.ui.core.ValueState.Error,
															processor: oContext.oMessageProcessor
														})
													);
												} else if (k === iFStatus) {
													var bChildSelected = false;
													for (var m = 0; m < selectedIndicies.length; m++) {
														if (selectedIndicies[m] === oRecord[l].__index) {
															bChildSelected = true;
															m = selectedIndicies.length;
														}

													}
													if (!bChildSelected) {
														var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusChildNotSelected", []);
														oContext.oMessageManager.addMessages(
															new sap.ui.core.message.Message({
																message: sMessage,
																description: "",
																type: sap.ui.core.ValueState.Error,
																processor: oContext.oMessageProcessor
															})
														);
														oRecord._ValueState = "Error";
														bAllowSave = false;
													}
												}
											}
										}
									}
								} else if (oRecord.ItemType == "SA" && bPromote) {
									var bParentSelected = false;
									for (var l = 0; l < j; l++) {
										var sPath = oContext.byId("Table").getContextByIndex(aSelected[l]).getPath();
										var oPRecord = oContext.getModel("Project").getProperty(sPath);
										if (oPRecord.__index === oRecord.__parentIndex) {
											// Record is selected - Check for matching status
											bParentSelected = true;
											for (var k = 0; k < aStatusProgression.length; k++) {
												if (aStatusProgression[k] === oPRecord.Status) {
													if (k < iFStatus) {
														bAllowSave = false;
														oRecord._ValueState = "Error";
														var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusConfigError", []);
														oContext.oMessageManager.addMessages(
															new sap.ui.core.message.Message({
																message: sMessage,
																description: "",
																type: sap.ui.core.ValueState.Error,
																processor: oContext.oMessageProcessor
															})
														);
													}
												}
											}
										}
									}
									if (!bParentSelected) {
										// Your status must be less than the parent's.
										var iParentIndex = oRecord.__parentIndex;
										var oParent = oContext.getModel("Project").getProperty("/AsInputArray")[iParentIndex];
										for (var k = 0; k < aStatusProgression.length; k++) {
											if (aStatusProgression[k] === oParent.Status) {
												if (iFStatus >= k) {
													bAllowSave = false;
													oRecord._ValueState = "Error";
													var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_statusParentNotSelected", []);
													oContext.oMessageManager.addMessages(
														new sap.ui.core.message.Message({
															message: sMessage,
															description: "",
															type: sap.ui.core.ValueState.Error,
															processor: oContext.oMessageProcessor
														})
													);
													k = aStatusProgression.length;
												}
											}
										}
									}
								}
							}
						}
					}
					// Now add in special checks for data completeness if moving to published.
					if (bAllowSave && sTStatus === '9012') { // Moving to Published
						// Root check is that Sub and Brand is known when published.
						bAllowSave = ValidationUtils.cc_PublishCheck(oContext, aSelected);
					}
					// Now add in special checks for data when moving to Approved for Planning.
					if (bAllowSave && sTStatus === '9013') { // Moving to Approved for Planning
						bAllowSave = ValidationUtils.cc_PlanApprovedCheck(oContext, aSelected);
					}
					if (bAllowSave && sTStatus === '9014') { // Moving to Released
						var bNeedAgency = false;
						var aVendorsNeeded = [];
						// Added a check for PH and plan values	- Khrystyne 10.04.2018					
						bAllowSave = ValidationUtils.cc_PublishCheck(oContext, aSelected);
						if (bAllowSave) {
						// Added a check for PH and plan values	- Khrystyne 10.04.2018												
							for (var j = 0; j < aSelected.length; j++) {
								var sPath = oContext.byId("Table").getContextByIndex(aSelected[j]).getPath();
								var oRecord = oContext.getModel("Project").getProperty(sPath);
								if (oRecord.ItemType === 'SA' && (oRecord.Agency === "" || oRecord.Agency === "0000000000")) {
									bNeedAgency = true;
									aVendorsNeeded.push(oRecord);
								}
							}
							//if (!bNeedAgency) {  // GDH Removed to push vendor down to Execution
							this._changeStatus(oContext);
						} else {
							oContext._setRowStyle();
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_LookAtErrors", []);
							MessageToast.show(sMessage);
						}
						//} else {
						//	this.getAgency(oContext, aVendorsNeeded);
						//}
					} else if (bAllowSave) {
						this._changeStatus(oContext);
					} else {
						oContext._setRowStyle();
						var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_LookAtErrors", []);
						MessageToast.show(sMessage);
					}
				}
			} else {
				// Selections have been selected for from and to status but no row was selected
				var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("S_E_selectOneStatus", []);
				// Begin of Changes - Khrystyne Williams - Nov 2016
				oContext.oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: sMessage,
						description: "",
						type: sap.ui.core.ValueState.Error,
						processor: oContext.oMessageProcessor
					})
				);
				// MessageToast.show(sMessage);
				// End of Changes - Khrystyne Williams - Nov 2016
			}
		},
		_changeStatusWithAgency: function(oContext) {
			var aSelected = oContext.byId("Table").getSelectedIndices();
			var aAsInputArray = oContext.getModel("Project").getData().AsInputArray;
			for (var i = 0; i < aSelected.length; i++) {
				var oScreenRecord = oContext.getModel("Project").getProperty(oContext.byId("Table").getContextByIndex(aSelected[i]).getPath());
				var iIndex = oScreenRecord.__index;
				var oRecord = aAsInputArray[iIndex];
				if (oScreenRecord.Agency && oScreenRecord.Agency !== "" && oScreenRecord.Agency !== "0000000000") {
					oRecord.Agency = oScreenRecord.Agency;
				}
			}
			this._changeStatus(oContext);
		},
		_changeStatus: function(oContext) {
			oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
			oContext.getOwnerComponent().getModel("masterShared").refresh(false);
			var oModel = oContext.getModel();
			var aSelected = oContext.byId("Table").getSelectedIndices();
			var aAsInputArray = oContext.getModel("Project").getData().AsInputArray;
			var sTStatus = oContext.getModel("projectView").getProperty("/oTStatus/Selected");
			var that = oContext;
			setTimeout(function() {
				that.nTotalCurrentChanges = parseInt(aSelected.length);
				that.nChangeCount = parseInt(that.nTotalCurrentChanges);
				for (var i = 0; i < aSelected.length; i++) {
					var oScreenRecord = that.getModel("Project").getProperty(that.byId("Table").getContextByIndex(aSelected[i]).getPath());
					var iIndex = oScreenRecord.__index;
					var oRecord = aAsInputArray[iIndex];
					var oItem = JSON.parse(JSON.stringify(oRecord));
					// Remove fields that were added in extra.
					var sPath = oItem.__metadata.uri.substring(oItem.__metadata.uri.lastIndexOf("/"));
					delete oItem.__metadata;
					oItem.StartDt = oItem.StartDt.replace("Z", "");
					oItem.EndDt = oItem.EndDt.replace("Z", "");
					oItem.CreatedTime = oItem.CreatedTime.replace("Z", "");
					oItem.ChangedTime = oItem.ChangedTime.replace("Z", "");
					oItem.Status = sTStatus;
					var oConfig = {};
					oConfig.UPDITEM = "S";
					// The only thing that will be updated is the status.  All
					// other entries will stay the same.  (This is a change from earlier design.)
					oItem.Config = JSON.stringify(oConfig);

					var that2 = that;
					oModel.update(sPath, oItem, {
						success: function(oData, oResponse) {
							TimeoutUtils.onResetTimer(that);
							// Add a Success toast and navigate back to the Project view and refresh the data.
							if (oResponse.statusCode !== "204") {
								oData.ErrorOrigin = "UpdateStatus";
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oData);
							} else {
								that2.nChangeCount = parseInt(that2.nChangeCount) - 1;
								if (that2.nChangeCount === 0) {
									that2._onStatusChange(null);
									var oEventData = {};
									oEventData.oDataOrigin = "UpdateStatus";
									that2.nPendingChangeCount = 1;
									sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Success", oEventData);
								}
							}
						},
						error: function(oError) {
							that2.nChangeCount = parseInt(that2.nChangeCount) - 1;
							if (that2.nChangeCount === 0) {
								oError.ErrorOrigin = "UpdateStatus";
								that2.nPendingChangeCount = 1;
								sap.ui.getCore().getEventBus().publish("colgate.asm.planning.project", "Errors", oError);
							}
						},
						changeSetId: oRecord.Id
					});
				}
			}, 100);
		},
		getAgency: function(oContext, aVendorsNeeded) {
			this._getAgencies(oContext, aVendorsNeeded);
		},

		_getAgencyDialog: function(oContext) {
			var that = oContext;
			var that2 = this;

			var oModel = that.getModel("StatusChangeUtils");
			var oData = oModel.getData();
			if (!oData.VendorMissing) {
				oData.VendorMissing = {};
			}

			var dialog = new Dialog("scu_agency", {
				title: oContext.getModel("i18n").getResourceBundle().getText("SCU_T_MissingAgency"),
				type: 'Message',
				content: [
					new sap.m.VBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Start,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.m.Text({
								text: oContext.getModel("i18n").getResourceBundle().getText("SCU_B_MissingVendor")
							}),
							//psutram: add Table
							new sap.m.Table("idRandomDataTable", {
								headerToolbar: new sap.m.Toolbar({
									content: [new sap.m.Label({
										text: oContext.getModel("i18n").getResourceBundle().getText("SCU_B_TableTitle")
									})]
								}),
								columns: [new sap.m.Column({
									width: "2em",
									header: new sap.m.Label({
										text: oContext.getModel("i18n").getResourceBundle().getText("SCU_B_Name")
									})
								}), new sap.m.Column({
									width: "2em",
									header: new sap.m.Label({
										text: oContext.getModel("i18n").getResourceBundle().getText("SCU_B_Agency")
									})
								})],
								items: {
									path: "StatusChangeUtils>/VendorMissing",
									template: new sap.m.ColumnListItem({
										cells: [
											new sap.m.Text({
												text: "{StatusChangeUtils>Name}"
											}),
											new sap.m.FlexBox({
												items: [
													new sap.m.ComboBox({
														items: {
															path: "StatusChangeUtils>PossibleAgencies",
															templateSharable: false,
															template: new sap.ui.core.ListItem({
																key: "{StatusChangeUtils>Key}",
																text: "{StatusChangeUtils>Description}"
															})
														},
														selectedKey: "{StatusChangeUtils>Agency}",
														enabled: false,
														showButton: false
													}),
													new sap.m.Button({
														icon: "sap-icon://sys-cancel",
														press: function(oEvent) {
															VendorUtils.onClear(oEvent, oEvent.getSource().getParent().getItems()[0]);
														}
													}),
													new sap.m.Button({
														icon: "sap-icon://search",
														press: function(oEvent) {
															var oModel = this.getModel("HoldAgencies");
															if (!oModel) {
																var oData = {
																	Agency: {
																		Current: []
																	}
																};
																oModel = new sap.ui.model.json.JSONModel(oData);
															}
															oData = oModel.getData();
															oData.Agency.Current = this.getModel("StatusChangeUtils").getProperty(oEvent.getSource().getParent().getItems()[
																0].getBindingContext("StatusChangeUtils").getPath()).PossibleAgencies;
															VendorUtils.onShow(oEvent, oModel, this.getModel("i18n"), oEvent.getSource().getParent().getItems()[0]);
														}
													})
												]
											})
										]
									})
								}
							})
						]
					})
				],
				beginButton: new sap.m.Button({
					text: oContext.getModel("i18n").getResourceBundle().getText("SCU_release"),
					press: function() {
						var oModel = this.getModel("StatusChangeUtils");
						var oData = oModel.getData();
						var bAgencyMissing = false;
						for (var i = 0; i < oData.VendorMissing.length; i++) {
							var tRecord = oData.VendorMissing[i];
							var sAgency = tRecord.Agency;
							if (!sAgency || sAgency === "" || sAgency === "0000000000") {
								bAgencyMissing = true;
								var sMessage = this.getModel("i18n").getResourceBundle().getText("SCU_E_NoAgency");
								MessageToast.show(sMessage);
							}
						}

						if (!bAgencyMissing) {
							var aSelected = that.byId("Table").getSelectedIndices();
							if (aSelected.length > 0) {

								for (var l = 0; l < aSelected.length; l++) {
									// Get Selected Indicies
									var sPath = oContext.byId("Table").getContextByIndex(aSelected[l]).getPath();
									var oRecord = oContext.getModel("Project").getProperty(sPath);
									// Begin of Changes - Khrystyne Williams - Feb 2017
									// if (!oRecord.Agency || oRecord.Agency === "" || oRecord.Agency === "0000000000") {
									if (!oRecord.Agency || oRecord.Agency === "" || oRecord.Agency === "0000000000") {
										// End of Changes - Khrystyne Williams - Feb 2017
										// psutram: modified to set different value for each row
										// oRecord.Agency = sAgency;
										for (var i = 0; i < oData.VendorMissing.length; i++) {
											var tRecord = oData.VendorMissing[i];
											if (oRecord.Id === tRecord.Id) {
												oRecord.Agency = tRecord.Agency;
												i = oData.VendorMissing.size;
											}
										}
									}

								}
							}
							dialog.close();
							that2._changeStatusWithAgency(oContext);
						}

					}
				}),
				endButton: new sap.m.Button({
					text: oContext.getModel("i18n").getResourceBundle().getText("CP_cancel"),
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			// var aSelected = that.byId("Table").getSelectedIndices();
			// var selectedBlankRows = [];
			// if (aSelected.length > 0) {
			// 	for (var l = 0; l < aSelected.length; l++) {
			// 		// Get Selected Indicies
			// 		var sPath = oContext.byId("Table").getContextByIndex(aSelected[l]).getPath();
			// 		var oRecord = oContext.getModel("Project").getProperty(sPath);
			// 		// psutram: Adjusted to only evaluate sub-activities
			// 		if (oRecord.ItemType === "SA" && (!oRecord.Agency || oRecord.Agency === "" || oRecord.Agency === "0000000000")) {
			// 			//add selected row into
			// 			selectedBlankRows.push({
			// 				"Name": oRecord.Name,
			// 				"Id": oRecord.Id,
			// 				"Agency": oRecord.Agency
			// 			});
			// 		}
			// 	}
			// 	oData.VendorMissing = selectedBlankRows;
			// }

			// oModel.refresh(false);
			// dialog.setModel (oModel, "StatusChangeUtils");
			dialog.setModel(oContext.getModel("StatusChangeUtils"), "StatusChangeUtils");
			dialog.open();
		},
		// _getAgencyDialog: function(oContext) {
		// 	var that = oContext;
		// 	var that2 = this;
		// 	var dialog = new Dialog("scu_agency", {
		// 		// Begin of Changes - Alex
		// 		// title: oContext.getModel("i18n").getResourceBundle().getText("SCU_T_MissingAgency"),
		// 		title: oContext.getModel("i18n").getResourceBundle().getText("SCU_T_MissingVendor"),
		// 		// End of Change - Alex
		// 		type: 'Message',
		// 		content: [
		// 			new sap.m.VBox({
		// 				fitContainer: true,
		// 				alignItems: sap.m.FlexAlignItems.Start,
		// 				justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
		// 				items: [
		// 					new sap.m.Text({
		// 						text: oContext.getModel("i18n").getResourceBundle().getText("SCU_B_MissingVendor")
		// 					}),
		// 					new sap.m.ComboBox("scu_cb_agency", {
		// 						items: {
		// 							path: "StatusChangeUtils>/Agency/Current",
		// 							template: new sap.ui.core.ListItem({
		// 								key: "{StatusChangeUtils>Key}",
		// 								text: "{StatusChangeUtils>Description}"
		// 							})
		// 						},
		// 						placeholder: "{StatusChangeUtils>/Placeholders/Agency}",
		// 						selectedKey: "{StatusChangeUtils>/Input/Agency}"
		// 					})
		// 				]
		// 			})
		// 		],
		// 		beginButton: new sap.m.Button({
		// 			text: oContext.getModel("i18n").getResourceBundle().getText("SCU_release"),
		// 			press: function() {
		// 				var sAgency = sap.ui.getCore().byId("scu_cb_agency").getSelectedKey();
		// 				if (!sAgency || sAgency === "" || sAgency === "0000000000") {
		// 					var sMessage = this.getModel("i18n").getResourceBundle().getText("SCU_E_NoAgency");
		// 					MessageToast.show(sMessage);
		// 				} else {
		// 					var aSelected = that.byId("Table").getSelectedIndices();
		// 					if (aSelected.length > 0) {
		// 						for (var l = 0; l < aSelected.length; l++) {
		// 							// Get Selected Indicies
		// 							var sPath = oContext.byId("Table").getContextByIndex(aSelected[l]).getPath();
		// 							var oRecord = oContext.getModel("Project").getProperty(sPath);
		// 							if (!oRecord.Agency || oRecord.Agency === "" || oRecord.Agency === "0000000000") {
		// 								oRecord.Agency = sAgency;
		// 							}
		// 						}
		// 					}
		// 				}
		// 				dialog.close();
		// 				that2._changeStatusWithAgency(oContext);
		// 			}
		// 		}),
		// 		endButton: new sap.m.Button({
		// 			text: oContext.getModel("i18n").getResourceBundle().getText("CP_cancel"),
		// 			press: function() {
		// 				dialog.close();
		// 			}
		// 		}),
		// 		afterClose: function() {
		// 			dialog.destroy();
		// 		}
		// 	});
		// 	dialog.setModel(oContext.getModel("StatusChangeUtils"), "StatusChangeUtils");
		// 	dialog.open();
		// },
		_getAgencies: function(oContext, aVendorsNeeded) {
			// Get the Vendors (Agencies)
			this.nTotalCurrentChanges = parseInt(aVendorsNeeded.length);
			this.nChangeCount = parseInt(this.nTotalCurrentChanges);
			var oModel = oContext.getModel("StatusChangeUtils");
			if (!oModel) {
				oModel = this._createStatusChangeUtils(oContext);
			}
			var oData = oModel.getData();
			oData.VendorMissing = aVendorsNeeded;
			var oAModel = oContext.getModel("Agency");
			if (!oAModel) {
				var sServiceUrl = oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/mainService");
				oAModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
				oAModel.setSizeLimit(50000);
				oAModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				oContext.setModel(oAModel, "Agency");
			}
			for (var i = 0; i < aVendorsNeeded.length; i++) {
				var filters = [];
				var oRecord = aVendorsNeeded[i];
				var sAdditionalData = "{ SUB:'" + oRecord.SubKey + "', KEY:'" + parseInt(i) + "'}";
				filters.push(new sap.ui.model.Filter("AdditionalData", sap.ui.model.FilterOperator.EQ, sAdditionalData));
				var sPath = "/VHAgencies";
				oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true); // Start Spinner
				var that = this;
				oAModel.read(sPath, {
					async: true,
					filters: filters,
					success: function(oData, oResponse) {
						TimeoutUtils.onResetTimer(that);
						that._setAgencies(oData, oContext);
						that.nChangeCount = parseInt(that.nChangeCount) - 1;
						if (that.nChangeCount === 0) {
							var oModel = oContext.getModel("StatusChangeUtils");
							oModel.refresh(false);
							oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false); // Stop Spinner
							that._getAgencyDialog(oContext);
						}
					},
					error: function(oError) {
						oError.ErrorOrigin = "Agency";
						sap.ui.getCore().getEventBus().publish("colgate.asm.planning.detail", "Errors", oError);
					}
				});
			}
		},
		_setAgencies: function(oDataIn, oContext) {
			var oModel = oContext.getModel("StatusChangeUtils");
			if (!oModel) {
				oModel = this._createStatusChangeUtils(oContext);
			}
			var oData = oModel.getData();
			var i = parseInt(oDataIn.results[0].AdditionalData);
			if (oData.VendorMissing[i] && !oData.VendorMissing[i].PossibleAgencies) {
				oData.VendorMissing[i].PossibleAgencies = {};
			}
			oData.VendorMissing[i].PossibleAgencies = oDataIn.results;
			if (oData.VendorMissing[i].PossibleAgencies.length === 0) {
				oData.Placeholders.Agency = oContext.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency_n");
			} else {
				oData.Placeholders.Agency = oContext.getOwnerComponent().getModel("i18n").getProperty("AC_P_agency_e");
			}
		},
		_createStatusChangeUtils: function(oContext) {
			// Set up the initial selections
			var oData = {};
			oData.Input = {};
			oData.Placeholders = {};
			oData.Agency = {};
			var oModel = new sap.ui.model.json.JSONModel(oData);
			oModel.setSizeLimit(50000);
			oContext.setModel(oModel, "StatusChangeUtils");
			return oModel;
		},
		_setRowTotal: function(oRow) {
			var i = 0;
			var recordTotal = parseFloat(0);
			do {
				i++;
				var sColumnName = "AmtB" + i;
				recordTotal = parseFloat(recordTotal) + parseFloat(oRow[sColumnName]);
			} while (i < 12);
			oRow.MaxValueBo = (recordTotal).toString();
		}
	};
});