sap.ui.define([
	'sap/m/MessageToast'
], function(MessageToast) {
	"use strict";
	return {
		isNumeric: function(obj) {
			return !jQuery.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
		},
		getTableRow: function(sPath, sBindingContext, aRows) {
			var oRow = null;
			for (var i = 0; i < aRows.length; i++) {
				if (aRows[i].getBindingContext(sBindingContext)) {
					if (sPath === aRows[i].getBindingContext(sBindingContext).getPath()) {
						oRow = aRows[i];
						i = aRows.length;
					}
				}
			}
			return oRow;
		},
		checkBudgetOverAllocate: function(oContext, oTotal, oRaw) {
			var bAllSuccessful = true;
			var i = 0;
			do {
				i++;
				var sColumnName = "AmtB" + i;
				var sFieldEditable = "FC_Editable_AmtB" + i;
				if (parseFloat(oTotal[sColumnName]) > parseFloat(oRaw[sColumnName])) {
					var sValueState = "FC_ValueState_AmtB" + i;
					var sValueStateText = "FC_ValueStateText_AmtB" + i;
					if (oRaw[sFieldEditable] === true) {
						// Begin of Changes - Khrystyne Williams - Nov 2016
						// oRaw[sValueState] = sap.ui.core.ValueState.Error;
						oRaw[sValueState] = sap.ui.core.ValueState.Warning;
						// End of Changes - Khrystyne Williams - Nov 2016
						oRaw[sValueStateText] = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText(
							"A_E_subTooMuch", []);
					} else {
						for (var j = 0; j < oRaw._SubactivityCount; j++) {
							if (oRaw[j][sFieldEditable] === true) {
								// Begin of Changes - Khrystyne Williams - Nov 2016
								// oRaw[j][sValueState] = sap.ui.core.ValueState.Error;
								oRaw[j][sValueState] = sap.ui.core.ValueState.Warning;
								// End of Changes - Khrystyne Williams - Nov 2016
								oRaw[j][sValueStateText] = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText(
									"A_E_subTooMuch", []);
								j = oRaw._SubactivityCount;
							}
						}
					}
					bAllSuccessful = false;
				}
			} while (i < 12);
			return bAllSuccessful;
		},
		checkMaxValueOverAllocate: function(oContext, oRaw) {
			var bAllSuccessful = true;
			if (parseFloat(oRaw.MaxValueB) > parseFloat(0)) {
				if (parseFloat(oRaw.AmtBTot) > parseFloat(oRaw.MaxValueB)) {
					var sValueState = "FC_ValueState_MaxValueB";
					var sValueStateText = "FC_ValueStateText_MaxValueB";
					oRaw[sValueState] = sap.ui.core.ValueState.Error;
					oRaw[sValueStateText] = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText(
						"A_E_BTooMuch", []);
					bAllSuccessful = false;
				}
			}
			return bAllSuccessful;
		},
		completenessCheck: function(oContext) {
			this.removeErrorMessages(oContext);
			var aDraftRecords = [];
			var aPublishedRecords = [];
			var aPlanApprovedRecords = [];
			var aSelected = oContext.byId("Table").getSelectedIndices();
			if (aSelected.length > 0) {
				for (var i = 0; i < aSelected.length; i++) {
					var sPath = oContext.byId("Table").getContextByIndex(aSelected[i]).getPath();
					var oRecord = oContext.getModel("Project").getProperty(sPath);
					if (oRecord.Status === '9002') {
						aDraftRecords.push(aSelected[i]);
					} else if (oRecord.Status === '9012') {
						aPublishedRecords.push(aSelected[i]);
					} else if (oRecord.Status === '9013') {
						aPlanApprovedRecords.push(aSelected[i]);
					}
				}
			} else {
				var oOnScreen = oContext.getModel("Project").getProperty("/OnScreen");
				if (oOnScreen && oOnScreen[0]) {
					for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
						var oProject = oOnScreen[0][i];
						for (var j = 0; j < oProject._activityCount; j++) {
							var oActivity = oProject[j];
							if (oActivity.Status === '9002') {
								aDraftRecords.push(aSelected[i]);
							} else if (oActivity.Status === '9012') {
								aPublishedRecords.push(aSelected[i]);
							} else if (oActivity.Status === '9013') {
								aPlanApprovedRecords.push(aSelected[i]);
							}
							for (var k = 0; k < oActivity._subactivityCount; k++) {
								var oSubactivity = oActivity[k];
								if (oSubactivity.Status === '9002') {
									aDraftRecords.push(aSelected[i]);
								} else if (oSubactivity.Status === '9012') {
									aPublishedRecords.push(aSelected[i]);
								} else if (oSubactivity.Status === '9013') {
									aPlanApprovedRecords.push(aSelected[i]);
								}
							}
						}
					}
				}
			}
			var bNoReleaseErrors = this.cc_ReleaseCheck(oContext, aPlanApprovedRecords);
			var bNoPlanApproveErrors = this.cc_PlanApprovedCheck(oContext, aPublishedRecords);
			var bNoPublishErrors = this.cc_PublishCheck(oContext, aDraftRecords);
			if (!bNoReleaseErrors || !bNoPublishErrors || !bNoPlanApproveErrors) {
				oContext._setRowStyle();
				var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_LookAtErrors", []);
				MessageToast.show(sMessage);
			}
		},
		cc_ReleaseCheck: function(oContext, aSelected) {
			var bSuccess = true;
			for (var j = 0; j < aSelected.length; j++) {
				var oRowContext = oContext.byId("Table").getContextByIndex(aSelected[j]);
				// Begin of Changes - Khrystyne Williams - Dec 2016
				// var oRecord = oContext.getModel("Project").getProperty(sPath);
				// if (oRecord.ItemType === 'SA') {
				// 	// Do not allow freezes or unallocations to be released
				// }
				// End of Changes - Khrystyne Williams - Dec 2016
				if (oRowContext) {
					var sPath = oContext.byId("Table").getContextByIndex(aSelected[j]).getPath();
					var oRecord = oContext.getModel("Project").getProperty(sPath);
					if (oRecord.ItemType === 'SA') {
						if (!oRecord.CategoryKey || oRecord.CategoryKey === '') {
							oRecord._ValueState = "Error";
							bSuccess = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoCat", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}

						if (!oRecord.SubcategoryKey || oRecord.SubcategoryKey === '') {
							oRecord._ValueState = "Error";
							bSuccess = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubCat", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check Brand
						if (!oRecord.BrandKey || oRecord.BrandKey === '') {
							oRecord._ValueState = "Error";
							bSuccess = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoBrand", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check Subbrand
						if (!oRecord.SubbrandKey || oRecord.SubbrandKey === '') {
							oRecord._ValueState = "Error";
							bSuccess = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubBrand", [oRecord.Name]);
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
					// Check if plan is empty
					if (oRecord.ItemType === 'SA' && (oRecord.Agency === "" || oRecord.Agency === "0000000000")) {
						// Add in logic for putting a warning on these records
						oRecord._ValueState = "Warning";
						var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("VU_W_NoAgency", [oRecord.Name]);
						bSuccess = false;
						oContext.oMessageManager.addMessages(
							new sap.ui.core.message.Message({
								message: sMessage,
								description: "",
								type: sap.ui.core.ValueState.Warning,
								processor: oContext.oMessageProcessor
							})
						);
					}
				}
			}
			return bSuccess;
		},
		cc_PublishCheck: function(oContext, aSelected) {
			var bAllowSave = true;
			for (var j = 0; j < aSelected.length; j++) {
				var oRowContext = oContext.byId("Table").getContextByIndex(aSelected[j]);
				if (oRowContext) {
					var sPath = oRowContext.getPath();
					var oRecord = oContext.getModel("Project").getProperty(sPath);
					oRecord._ValueState = "None";
					if (oRecord.ItemType === 'AT') {
						// Must already contain Sub and Brand
						// Begin of Commenting - Khrystyne Williams - Nov 2016
						// if (!oRecord.SubKey || oRecord.SubKey === '') {
						// 	bAllowSave = false;
						// 	var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_NoSub", [oRecord.Name]);
						// 	if (!oRecord.CHasChildren || oRecord.CHasChildren === ' ') {
						// 		oRecord._ValueState = "Error";
						// 		oContext.oMessageManager.addMessages(
						// 			new sap.ui.core.message.Message({
						// 				message: sMessage,
						// 				description: "",
						// 				type: sap.ui.core.ValueState.Error,
						// 				processor: oContext.oMessageProcessor
						// 			})
						// 		);
						// 	};
						// }
						// End of Commenting - Khrystyne Williams - Nov 2016

						// Begin of Commenting - Khrystyne Williams - August 26, 2016
						// Remove the check for Brand and budget total match check
						// if (!oRecord.BrandKey || oRecord.BrandKey === '') {
						// 	bAllowSave = false;
						// 	var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_NoBrand", [oRecord.Name]);
						// 	if (!oRecord.CHasChildren || oRecord.CHasChildren === ' ') {
						// 		oRecord._ValueState = "Error";
						// 		oContext.oMessageManager.addMessages(
						// 			new sap.ui.core.message.Message({
						// 				message: sMessage,
						// 				description: "",
						// 				type: sap.ui.core.ValueState.Error,
						// 				processor: oContext.oMessageProcessor
						// 			})
						// 		);
						// 	}
						// }

						// Begin of Changes and Uncommenting - Khrystyne Williams - Nov 2016
						// If the activity does not have a sub-activity, the user is not allowed to promote to Published
						if (oRecord.CHasChildren !== 'X') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubAct", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						if (bAllowSave) {
							// Begin of Commenting - Khrystyne Williams - Feb 2017
							// Since we are only entering plans at the subactivity level, there is no need to check against activity numbers
							// Check all children to make sure they match the value of the parent
							// var oTotalSubactivityBudget = oContext._getBudgetObject();
							// for (var k = 0; k < aSelected.length; k++) {
							// 	var sSubPath = oContext.byId("Table").getContextByIndex(aSelected[k]).getPath();
							// 	var oSubactivity = oContext.getModel("Project").getProperty(sSubPath);
							// 	for (var w = 0; w < oSubactivity._subactivityCount; w++) {
							// 		if (oSubactivity[w].ItemType === 'SA' && oSubactivity[w].ActivityGuid === oRecord.Guid) {
							// 			// This one is a child of Activity that was chosen
							// 			oContext._sumBudgetNumbers(oTotalSubactivityBudget, oSubactivity[w]);
							// 		}
							// 	}
							// }
							// // Begin of Changes - Khrystyne Williams - Dec 2016
							// // var bMatch = this._matchBudget(oRecord, oTotalSubactivityBudget);
							// var bMatch = this._matchTotalBudget(oRecord, oTotalSubactivityBudget);
							// // End of Changes - Khrystyne Williams - Dec 2016

							// if (!bMatch) {
							// 	oRecord._ValueState = "Error";
							// 	bAllowSave = false;
							// 	var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_ANoMatch", [oRecord.Name]);
							// 	oContext.oMessageManager.addMessages(
							// 		new sap.ui.core.message.Message({
							// 			message: sMessage,
							// 			description: "",
							// 			type: sap.ui.core.ValueState.Error,
							// 			processor: oContext.oMessageProcessor
							// 		})
							// 	);
							// }
							// End of Commenting - Khrystyne Williams - Feb 2017
						}
						// End of Commenting - Khrystyne Williams - August 26, 2016
					} else if (oRecord.ItemType === 'SA') {
						// Check Subsidiary
						if (!oRecord.SubKey || oRecord.SubKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSub", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Begin of Commenting - Khrystyne Williams - August 26, 2016
						// Begin of Changes and Uncommenting - Khrystyne Williams - Nov 2016
						// Check Category, Sub-category, Brand and Sub-Brand on Status Change

						if (!oRecord.CategoryKey || oRecord.CategoryKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoCat", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}

						if (!oRecord.SubcategoryKey || oRecord.SubcategoryKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubCat", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check Brand
						if (!oRecord.BrandKey || oRecord.BrandKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoBrand", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check Subbrand
						if (!oRecord.SubbrandKey || oRecord.SubbrandKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubBrand", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check if plan is empty
						var nTotalPlan = parseFloat(oRecord.AmtB1) + parseFloat(oRecord.AmtB2) + parseFloat(oRecord.AmtB3) +
							parseFloat(oRecord.AmtB4) + parseFloat(oRecord.AmtB5) + parseFloat(oRecord.AmtB6) +
							parseFloat(oRecord.AmtB7) + parseFloat(oRecord.AmtB8) + parseFloat(oRecord.AmtB9) +
							parseFloat(oRecord.AmtB10) + parseFloat(oRecord.AmtB11) + parseFloat(oRecord.AmtB12);
						if (nTotalPlan <= parseFloat("0.0") && !oRecord._EmptyPlanWarning) {
							oRecord._EmptyPlanWarning = true;
							if (oRecord._ValueState === "None") {
								oRecord._ValueState = "Warning";
							}
							bAllowSave = false;
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoPlan", [oRecord.Name]),
									description: "",
									type: sap.ui.core.ValueState.Warning,
									processor: oContext.oMessageProcessor
								})
							);
						} else {
							oRecord._EmptyPlanWarning = false;
						}
					}
				}
			}
			return bAllowSave;
		},
		cc_PlanApprovedCheck: function(oContext, aSelected) {
			var bAllowSave = true;
			for (var j = 0; j < aSelected.length; j++) {
				var oRowContext = oContext.byId("Table").getContextByIndex(aSelected[j]);
				if (oRowContext) {
					var sPath = oRowContext.getPath();
					var oRecord = oContext.getModel("Project").getProperty(sPath);
					if (oRecord.ItemType === 'AT') {
						// If the activity does not have a sub-activity, the user is not allowed to promote to Plan Approved
						if (oRecord.CHasChildren === 'X') {
							// Nothing further to do at this time
						} else {
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubAct", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
					} else if (oRecord.ItemType === 'SA') {
						if (!oRecord.CategoryKey || oRecord.CategoryKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoCat", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}

						if (!oRecord.SubcategoryKey || oRecord.SubcategoryKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubCat", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check Brand
						if (!oRecord.BrandKey || oRecord.BrandKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoBrand", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						// Check Subbrand
						if (!oRecord.SubbrandKey || oRecord.SubbrandKey === '') {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							var sMessage = oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SANoSubBrand", [oRecord.Name]);
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						}
						var nTotalPlan = parseFloat(oRecord.AmtB1) + parseFloat(oRecord.AmtB2) + parseFloat(oRecord.AmtB3) +
							parseFloat(oRecord.AmtB4) + parseFloat(oRecord.AmtB5) + parseFloat(oRecord.AmtB6) +
							parseFloat(oRecord.AmtB7) + parseFloat(oRecord.AmtB8) + parseFloat(oRecord.AmtB9) +
							parseFloat(oRecord.AmtB10) + parseFloat(oRecord.AmtB11) + parseFloat(oRecord.AmtB12);
						if (nTotalPlan === parseFloat("0.0")) {
							oRecord._ValueState = "Error";
							bAllowSave = false;
							oContext.oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SCU_E_SARNoPlan", [oRecord.Name]),
									description: "",
									type: sap.ui.core.ValueState.Error,
									processor: oContext.oMessageProcessor
								})
							);
						} else {
							oRecord._ValueState = "None";
						}
					}
				}
			}
			return bAllowSave;
		},
		// End of Addition - Khrystyne Williams - Nov 2016

		removeErrorMessages: function(oContext) {
			oContext.oMessageManager.removeAllMessages();
			// Clear errors
			var oOnScreen = oContext.getModel("Project").getProperty("/OnScreen");
			if (oOnScreen && oOnScreen[0]) {
				for (var i = 0; i < oOnScreen[0]._projectCount; i++) {
					var oProject = oOnScreen[0][i];
					delete oProject._ValueState;
					for (var j = 0; j < oProject._activityCount; j++) {
						var sPath = "/OnScreen/0/" + i + "/" + j;
						var oActivity = oProject[j];
						delete oActivity._ValueState;
						for (var k = 0; k < oActivity._subactivityCount; k++) {
							sPath = "/OnScreen/0/" + i + "/" + j + "/" + k;
							var oSubactivity = oActivity[k];
							delete oSubactivity._ValueState;
						}
					}
				}
			}
			oContext._setRowStyle();
		},
		_matchBudget: function(oRecordA, oRecordB) {
			var i = 0;
			do {
				i++;
				var sColumnName = "AmtB" + i;
				if (Math.floor(parseFloat(oRecordA[sColumnName])) !== Math.floor(parseFloat(oRecordB[sColumnName]))) {
					return false;
				}
			} while (i < 12);
			return true;
		},
		// Begin of Changes - Khrystyne Williams - Dec 2016
		_matchTotalBudget: function(oRecordA, oRecordB) {
				var i = 0;
				var sColumnName = "";
				var sRecordBTotal = 0;
				do {
					i++;
					sColumnName = "AmtB" + i;
					sRecordBTotal = parseFloat(sRecordBTotal) + parseFloat(oRecordB[sColumnName]);
				} while (i < 12);
				if (Math.floor(parseFloat(oRecordA["AmtBTot"])) !== Math.floor(parseFloat(sRecordBTotal))) {
					return false;
				}
				return true;
			}
			// End of Changes - Khrystyne Williams - Dec 2016
	};
});