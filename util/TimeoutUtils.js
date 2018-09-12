sap.ui.define([
	'sap/m/Dialog',
	'sap/m/MessageToast'
], function(Dialog, MessageToast) {
	"use strict";
	return {
		iTimeout: 1700000,
		iWarningTimeout: 30000,
		// iTimeout: 6000,
		// iWarningTimeout: 3000,
		bStarted: false,
		oNotification: {
			Variables: {
				OriginalTitle: document.title,
				OriginalImg: $("link[rel='shortcut icon']").attr("href"),
				Interval: null
			},
			On: function(sNotification, sNewIcon, iSpeed) {
				var that = this;
				that.Variables.Interval = setInterval(function() {
					if (document.title === that.Variables.OriginalTitle) {
						document.title = sNotification;
						$("link[rel='shortcut icon']").attr("href", sNewIcon);
					} else {
						document.title = that.Variables.OriginalTitle;
						$("link[rel='shortcut icon']").attr("href", that.Variables.OriginalImg);
					}
				}, (iSpeed) ? iSpeed : 1000);
			},
			Off: function() {
				clearInterval(this.Variables.Interval);
				document.title = this.Variables.OriginalTitle;
				$("link[rel='shortcut icon']").attr("href", this.Variables.OriginalImg);
			}
		},
		onStartTimer: function(oContext) {
			this._oContext = oContext;
			if (this._oTimer) {
				clearTimeout(this._oTimer);
			}
			this._oTimer = setTimeout(this._showRunningOutOfTime.bind(this), this.iTimeout);
			this.bStarted = true;
		},
		onResetTimer: function(oContext) {
			clearTimeout(this._oTimer);
			if (this.bStarted) {
				this.onStartTimer(oContext);
			}
		},
		_startLogoutTimer: function() {
			if (this._oTimer) {
				clearTimeout(this._oTimer);
			}
			this._oTimer = setTimeout(this._logoutUser.bind(this), this.iWarningTimeout);
		},
		_goToLaunchpad: function() {
			var sTarget = '/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-theme=ZASM_Theme@/sap/public/bc/themes/~client-321#Shell-home';
			sap.m.URLHelper.redirect(sTarget, false);
		},
		_logoutUser: function() {
			//sap.ushell.Container.logout(); // GDH Changing to going to the launchpad
			this._goToLaunchpad();
			//sap.ui.getCore().getElementById("logoutBtn").firePress();
			//this._oTimer = setTimeout(this._pressOK.bind(this), this.iPause);
			// $.ajax({
			// 	type: "GET",
			// 	url: "/sap/public/bc/icf/logoff", //Clear SSO cookies: SAP Provided service to do that
			// 	error: function(jqXHR, ajaxOptions, thrownError) {
			// 		MessageToast.show(jqXHR.status);
			// 		MessageToast.show(thrownError);
			// 	},
			// 	success: function(data, textStats, jqXHR) {
			// 		MessageToast.show(jqXHR.status);
			// 	}
			// }).done(function(data) { //Now clear the authentication header stored in the browser
			// 	// if (!document.execCommand("ClearAuthenticationCache")) {
			// 	// 	//"ClearAuthenticationCache" will work only for IE. Below code for other browsers
			// 	// 	$.ajax({
			// 	// 		type: "GET",
			// 	// 		url: "/sap/bc/ui5_ui5/ui2/ushell/shells/abap/Fiorilaunchpad.html", //any URL to a Gateway service
			// 	// 		username: 'dummy', //dummy credentials: when request fails, will clear the authentication header
			// 	// 		password: 'dummy',
			// 	// 		statusCode: {
			// 	// 			401: function() {
			// 	// 				//This empty handler function will prevent authentication pop-up in chrome/firefox
			// 	// 			}
			// 	// 		},
			// 	// 		error: function(jqXHR, exception) {
			// 	// 			alert('reached error of wrong username password');
			// 	// 		}
			// 	// 	});
			// 	// }
			// });
		},
		_showRunningOutOfTime: function() {
			var that = this;
			var dialog = new Dialog("timeout", {
				title: that._oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("TO_Title"),
				type: 'Message',
				content: [
					new sap.m.VBox({
						fitContainer: true,
						alignItems: sap.m.FlexAlignItems.Start,
						justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
						items: [
							new sap.m.Text({
								text: that._oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("TO_30s")
							})
						]
					})
				],
				beginButton: new sap.m.Button({
					text: that._oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("TO_Continue"),
					press: function() {
						that._oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", true);
						var sServiceUrl = that._oContext.getOwnerComponent().getModel("masterShared").getProperty("/oServiceUrls/userService");
						var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, false);
						oModel.setSizeLimit(50000);
						var sUser = sap.ushell.Container.getService("UserInfo").getId().toUpperCase();
						var sPath = "/Users('" + sUser + "')";
						oModel.read(sPath, {
							async: false,
							success: function(oData, oResponse) {
								that._oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
								that.onResetTimer(that._oContext);
								that.oNotification.Off();
								dialog.close();
							},
							error: function(oError) {
								that.oNotification.Off();
								dialog.close();
								that._oContext.getOwnerComponent().getModel("masterShared").setProperty("/oDetailBusy/busy", false);
								that._logoutUser();

							}
						});
					}
				}),
				endButton: new sap.m.Button({
					text: that._oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("TO_Logout"),
					press: function() {
						that._logoutUser();
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
			that._startLogoutTimer();
			var sIPath = jQuery.sap.getModulePath("colgate.asm.planning.base") + "/img/Warning.png";
			that.oNotification.On(that._oContext.getOwnerComponent().getModel("i18n").getResourceBundle().getText("TO_Title"), sIPath);
		}
	};
});