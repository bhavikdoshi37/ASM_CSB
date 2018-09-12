sap.ui.define([
	"colgate/asm/planning/base/model/formatter"
], function(formatter) {
	"use strict";
	return {
		getColumnCatalog: function(oContext) {
			var oColumns = {
				"ColumnCollection": [{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_project"),
					"path": "Project>Name",
					"visible": true,
					"columnIndex": 0
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_type"),
					"path": "Project>ActivityTypeDesc",
					"visible": true,
					"columnIndex": 1
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_status"),
					"path": "Project>_statusDesc",
					"visible": true,
					"columnIndex": 69
				},  {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_id"),
					"path": "Project>Id",
					"visible": true,
					"columnIndex": 63
				},  {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_division"),
					"path": "Project>DivisionDesc",
					"visible": true,
					"columnIndex": 2
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_hub"),
					"path": "Project>HubDesc",
					"visible": true,
					"columnIndex": 3
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_sub"),
					"path": "Project>SubDesc",
					"visible": true,
					"columnIndex": 4
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_category"),
					"path": "Project>CategoryDesc",
					"visible": true,
					"columnIndex": 5
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_pscategory"),
					"path": "Project>SubcategoryDesc",
					"visible": true,
					"columnIndex": 6
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_brand"),
					"path": "Project>BrandDesc",
					"visible": true,
					"columnIndex": 7
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_subbrand"),
					"path": "Project>SubbrandDesc",
					"visible": true,
					"columnIndex": 8
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_priority"),
					"path": "Project>PriorityDesc",
					"visible": true,
					"columnIndex": 9
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_function"),
					"path": "Project>FunctionDesc",
					"visible": true,
					"columnIndex": 10
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_channel"),
					"path": "Project>ChannelDesc",
					"visible": true,
					"columnIndex": 11
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_longText"),
					"path": "Project>LongText",
					"visible": true,
					"columnIndex": 12
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_startDt"),
					"path": "Project>StartDt",
					"visible": true,
					"columnIndex": 13
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_endDt"),
					"path": "Project>EndDt",
					"visible": true,
					"columnIndex": 14
				}, 
				// Begin of Commenting - Khrystyne Williams - Nov 2016
				// Maestro is no longer needed for this application   
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maestroBrief"),
				// 	"path": "Project>MaestroBrief",
				// 	"visible": true,
				// 	"columnIndex": 63
				// }, 
				// End of Commenting - Khrystyne Williams - Nov 2016
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_agency"),
					"path": "Project>Agency",
					"visible": true,
					"columnIndex": 64
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_retailer"),
					"path": "Project>Retailer",
					"visible": true,
					"columnIndex": 65
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_costcenter"),
					"path": "Project>CostcenterDesc",
					"visible": true,
					"columnIndex": 66
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_glAccount"),
					"path": "Project>GlAccount",
					"visible": true,
					"columnIndex": 67
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_po"),
					"path": "Project>PO",
					"visible": true,
					"columnIndex": 68
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_btotals"),
					"path": "Project>AmtBTot",
					"visible": true,
					"columnIndex": 70
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_atotals"),
					"path": "Project>AmtATot",
					"visible": true,
					"columnIndex": 71
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_ctotals"),
					"path": "Project>AmtCTot",
					"visible": true,
					"columnIndex": 72
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_cbtotals"),
					"path": "Project>AmtCbTot",
					"visible": true,
					"columnIndex": 73
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtB1",
					"visible": true,
					"columnIndex": 15
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtA1",
					"visible": true,
					"columnIndex": 16
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
				// 	"path": "Project>AmtC1",
				// 	"visible": true,
				// 	"columnIndex": 17
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
				// 	"path": "Project>AmtCb1",
				// 	"visible": true,
				// 	"columnIndex": 18
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtB2",
					"visible": true,
					"columnIndex": 19
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtA2",
					"visible": true,
					"columnIndex": 20
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
				// 	"path": "Project>AmtC2",
				// 	"visible": true,
				// 	"columnIndex": 21
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
				// 	"path": "Project>AmtCb2",
				// 	"visible": true,
				// 	"columnIndex": 22
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtB3",
					"visible": true,
					"columnIndex": 23
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtA3",
					"visible": true,
					"columnIndex": 24
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
				// 	"path": "Project>AmtC3",
				// 	"visible": true,
				// 	"columnIndex": 25
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
				// 	"path": "Project>AmtCb3",
				// 	"visible": true,
				// 	"columnIndex": 26
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtB4",
					"visible": true,
					"columnIndex": 27
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtA4",
					"visible": true,
					"columnIndex": 28
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
				// 	"path": "Project>AmtC4",
				// 	"visible": true,
				// 	"columnIndex": 29
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
				// 	"path": "Project>AmtCb4",
				// 	"visible": true,
				// 	"columnIndex": 30
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtB5",
					"visible": true,
					"columnIndex": 31
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtA5",
					"visible": true,
					"columnIndex": 32
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
				// 	"path": "Project>AmtC5",
				// 	"visible": true,
				// 	"columnIndex": 33
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
				// 	"path": "Project>AmtCb5",
				// 	"visible": true,
				// 	"columnIndex": 34
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtB6",
					"visible": true,
					"columnIndex": 35
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtA6",
					"visible": true,
					"columnIndex": 36
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
				// 	"path": "Project>AmtC6",
				// 	"visible": true,
				// 	"columnIndex": 37
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
				// 	"path": "Project>AmtCb6",
				// 	"visible": true,
				// 	"columnIndex": 38
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtB7",
					"visible": true,
					"columnIndex": 39
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtA7",
					"visible": true,
					"columnIndex": 40
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
				// 	"path": "Project>AmtC7",
				// 	"visible": true,
				// 	"columnIndex": 41
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
				// 	"path": "Project>AmtCb7",
				// 	"visible": true,
				// 	"columnIndex": 42
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtB8",
					"visible": true,
					"columnIndex": 43
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtA8",
					"visible": true,
					"columnIndex": 44
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
				// 	"path": "Project>AmtC8",
				// 	"visible": true,
				// 	"columnIndex": 45
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
				// 	"path": "Project>AmtCb8",
				// 	"visible": true,
				// 	"columnIndex": 46
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtB9",
					"visible": true,
					"columnIndex": 47
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtA9",
					"visible": true,
					"columnIndex": 48
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
				// 	"path": "Project>AmtC9",
				// 	"visible": true,
				// 	"columnIndex": 49
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
				// 	"path": "Project>AmtCb9",
				// 	"visible": true,
				// 	"columnIndex": 50
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtB10",
					"visible": true,
					"columnIndex": 51
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtA10",
					"visible": true,
					"columnIndex": 52
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
				// 	"path": "Project>AmtC10",
				// 	"visible": true,
				// 	"columnIndex": 53
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
				// 	"path": "Project>AmtCb10",
				// 	"visible": true,
				// 	"columnIndex": 54
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtB11",
					"visible": true,
					"columnIndex": 55
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtA11",
					"visible": true,
					"columnIndex": 56
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
				// 	"path": "Project>AmtC11",
				// 	"visible": true,
				// 	"columnIndex": 57
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
				// 	"path": "Project>AmtCb11",
				// 	"visible": true,
				// 	"columnIndex": 58
				// }, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtB12",
					"visible": true,
					"columnIndex": 59
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtA12",
					"visible": true,
					"columnIndex": 60
				}, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
				// 	"path": "Project>AmtC12",
				// 	"visible": true,
				// 	"columnIndex": 61
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
				// 	"path": "Project>AmtCb12",
				// 	"visible": true,
				// 	"columnIndex": 62
				// },
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_createdBy"),
				// 	"path": "Project>CreatedBy",
				// 	"visible": true,
				// 	"columnIndex": 74
				// }, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_createdByName"),
					"path": "Project>CreatedByName",
					"visible": true,
					"columnIndex": 75
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_createdTime"),
					"path": "Project>CreatedTime",
					"visible": true,
					"columnIndex": 76
				}, 
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_changedBy"),
				// 	"path": "Project>ChangedBy",
				// 	"visible": true,
				// 	"columnIndex": 77
				// },
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_changedByName"),
					"path": "Project>ChangedByName",
					"visible": true,
					"columnIndex": 78
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_changedTime"),
					"path": "Project>ChangedTime",
					"visible": true,
					"columnIndex": 79
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxc"),
					"path": "Project>MaxValueC",
					"visible": true,
					"columnIndex": 82
				},  {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxb"),
					"path": "Project>MaxValueB",
					"visible": true,
					"columnIndex": 80
				},
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxa"),
				// 	"path": "Project>MaxValueA",
				// 	"visible": true,
				// 	"columnIndex": 81
				// }, 
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bototals"),
				// 	"path": "Project>AmtBoTot",
				// 	"visible": true,
				// 	"columnIndex": 110
				// },
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxcb"),
				// 	"path": "Project>MaxValueCb",
				// 	"visible": true,
				// 	"columnIndex": 83
				// }, 
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
				// 	"path": "Project>AmtLe1",
				// 	"visible": true,
				// 	"columnIndex": 84
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
				// 	"path": "Project>AmtLe2",
				// 	"visible": true,
				// 	"columnIndex": 85
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
				// 	"path": "Project>AmtLe3",
				// 	"visible": true,
				// 	"columnIndex": 86
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
				// 	"path": "Project>AmtLe4",
				// 	"visible": true,
				// 	"columnIndex": 87
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
				// 	"path": "Project>AmtLe5",
				// 	"visible": true,
				// 	"columnIndex": 88
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
				// 	"path": "Project>AmtLe6",
				// 	"visible": true,
				// 	"columnIndex": 89
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
				// 	"path": "Project>AmtLe7",
				// 	"visible": true,
				// 	"columnIndex": 90
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
				// 	"path": "Project>AmtLe8",
				// 	"visible": true,
				// 	"columnIndex": 91
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
				// 	"path": "Project>AmtLe9",
				// 	"visible": true,
				// 	"columnIndex": 92
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
				// 	"path": "Project>AmtLe10",
				// 	"visible": true,
				// 	"columnIndex": 93
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
				// 	"path": "Project>AmtLe11",
				// 	"visible": true,
				// 	"columnIndex": 94
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
				// 	"path": "Project>AmtLe12",
				// 	"visible": true,
				// 	"columnIndex": 95
				// }, 
				// Begin of Changes - Khrystyne Williams - Nov 2016
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxbo"),
				// 	"path": "Project>MaxValueBo",
				// 	"visible": true,
				// 	"columnIndex": 111
				// }, 
				// End of Changes - Khrystyne Williams - Nov 2016
				// {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
				// 	"path": "Project>AmtBo1",
				// 	"visible": true,
				// 	"columnIndex": 98
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
				// 	"path": "Project>AmtBo2",
				// 	"visible": true,
				// 	"columnIndex": 99
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
				// 	"path": "Project>AmtBo3",
				// 	"visible": true,
				// 	"columnIndex": 100
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
				// 	"path": "Project>AmtBo4",
				// 	"visible": true,
				// 	"columnIndex": 101
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
				// 	"path": "Project>AmtBo5",
				// 	"visible": true,
				// 	"columnIndex": 102
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
				// 	"path": "Project>AmtBo6",
				// 	"visible": true,
				// 	"columnIndex": 103
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
				// 	"path": "Project>AmtBo7",
				// 	"visible": true,
				// 	"columnIndex": 104
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
				// 	"path": "Project>AmtBo8",
				// 	"visible": true,
				// 	"columnIndex": 105
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
				// 	"path": "Project>AmtBo9",
				// 	"visible": true,
				// 	"columnIndex": 106
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
				// 	"path": "Project>AmtBo10",
				// 	"visible": true,
				// 	"columnIndex": 107
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
				// 	"path": "Project>AmtBo11",
				// 	"visible": true,
				// 	"columnIndex": 108
				// }, {
				// 	"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
				// 		oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
				// 	"path": "Project>AmtBo12",
				// 	"visible": true,
				// 	"columnIndex": 109
				// }, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_letotals"),
					"path": "Project>AmtLeTot",
					"visible": true,
					"columnIndex": 96
				}, 
				// {
				// 	"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxle"),
				// 	"path": "Project>MaxValueLe",
				// 	"visible": true,
				// 	"columnIndex": 97
				// },
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_demo"),
					"path": "Project>DemographicsDesc",
					"visible": true,
					"columnIndex": 112
				}],
				"SortItems": [{
					"columnKey": "Project>Name",
					"operation": "Ascending"
				}],
				"FilterItems": [],
				"FixedColumnConfig": [{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_project"),
					"path": "Project>Name",
					// Begin of Changes - Khrystyne Williams - Nov 2016
					// "width": "18rem",
					"width": "22rem",
					// End of Changes - Khrystyne Williams - Nov 2016
					"visible": true,
					"columnIndex": 0
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_type"),
					"path": "Project>ActivityTypeDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 1
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_division"),
					"path": "Project>DivisionDesc",
					"width": "8rem",
					"visible": true,
					"columnIndex": 2
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_hub"),
					"path": "Project>HubDesc",
					"width": "8rem",
					"visible": true,
					"columnIndex": 3
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_sub"),
					"path": "Project>SubDesc",
					"width": "8rem",
					"visible": true,
					"columnIndex": 4
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_category"),
					"path": "Project>CategoryDesc",
					"width": "8rem",
					"visible": true,
					"columnIndex": 5
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_pscategory"),
					"path": "Project>SubcategoryDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 6
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_brand"),
					"path": "Project>BrandDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 7
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_subbrand"),
					"path": "Project>SubbrandDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 8
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("C_L_priority"),
					"path": "Project>PriorityDesc",
					"width": "12rem",
					"visible": true,
					"columnIndex": 9
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_function"),
					"path": "Project>FunctionDesc",
					"width": "12rem",
					"visible": true,
					"columnIndex": 10
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_channel"),
					"path": "Project>ChannelDesc",
					"width": "12rem",
					"visible": true,
					"columnIndex": 11
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_longText"),
					"path": "Project>LongText",
					"width": "12rem",
					"visible": true,
					"columnIndex": 12
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_startDt"),
					"path": "Project>StartDt",
					"width": "6rem",
					"visible": true,
					"columnIndex": 13
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_endDt"),
					"path": "Project>EndDt",
					"width": "6rem",
					"visible": true,
					"columnIndex": 14
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtB1",
					"width": "7rem",
					"visible": true,
					"columnIndex": 15
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtA1",
					"width": "7rem",
					"visible": true,
					"columnIndex": 16
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtC1",
					"width": "7rem",
					"visible": true,
					"columnIndex": 17
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtCb1",
					"width": "7rem",
					"visible": true,
					"columnIndex": 18
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtB2",
					"width": "7rem",
					"visible": true,
					"columnIndex": 19
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtA2",
					"width": "7rem",
					"visible": true,
					"columnIndex": 20
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtC2",
					"width": "7rem",
					"visible": true,
					"columnIndex": 21
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtCb2",
					"width": "7rem",
					"visible": true,
					"columnIndex": 22
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtB3",
					"width": "7rem",
					"visible": true,
					"columnIndex": 23
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtA3",
					"width": "7rem",
					"visible": true,
					"columnIndex": 24
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtC3",
					"width": "7rem",
					"visible": true,
					"columnIndex": 25
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtCb3",
					"width": "7rem",
					"visible": true,
					"columnIndex": 26
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtB4",
					"width": "7rem",
					"visible": true,
					"columnIndex": 27
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtA4",
					"width": "7rem",
					"visible": true,
					"columnIndex": 28
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtC4",
					"width": "7rem",
					"visible": true,
					"columnIndex": 29
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtCb4",
					"width": "7rem",
					"visible": true,
					"columnIndex": 30
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtB5",
					"width": "7rem",
					"visible": true,
					"columnIndex": 31
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtA5",
					"width": "7rem",
					"visible": true,
					"columnIndex": 32
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtC5",
					"width": "7rem",
					"visible": true,
					"columnIndex": 33
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtCb5",
					"width": "7rem",
					"visible": true,
					"columnIndex": 34
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtB6",
					"width": "7rem",
					"visible": true,
					"columnIndex": 35
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtA6",
					"width": "7rem",
					"visible": true,
					"columnIndex": 36
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtC6",
					"width": "7rem",
					"visible": true,
					"columnIndex": 37
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtCb6",
					"width": "7rem",
					"visible": true,
					"columnIndex": 38
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtB7",
					"width": "7rem",
					"visible": true,
					"columnIndex": 39
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtA7",
					"width": "7rem",
					"visible": true,
					"columnIndex": 40
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtC7",
					"width": "7rem",
					"visible": true,
					"columnIndex": 41
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtCb7",
					"width": "7rem",
					"visible": true,
					"columnIndex": 42
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtB8",
					"width": "7rem",
					"visible": true,
					"columnIndex": 43
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtA8",
					"width": "7rem",
					"visible": true,
					"columnIndex": 44
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtC8",
					"width": "7rem",
					"visible": true,
					"columnIndex": 45
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtCb8",
					"width": "7rem",
					"visible": true,
					"columnIndex": 46
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtB9",
					"width": "7rem",
					"visible": true,
					"columnIndex": 47
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtA9",
					"width": "7rem",
					"visible": true,
					"columnIndex": 48
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtC9",
					"width": "7rem",
					"visible": true,
					"columnIndex": 49
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtCb9",
					"width": "7rem",
					"visible": true,
					"columnIndex": 50
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtB10",
					"width": "7rem",
					"visible": true,
					"columnIndex": 51
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtA10",
					"width": "7rem",
					"visible": true,
					"columnIndex": 52
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtC10",
					"width": "7rem",
					"visible": true,
					"columnIndex": 53
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtCb10",
					"width": "7rem",
					"visible": true,
					"columnIndex": 54
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtB11",
					"width": "7rem",
					"visible": true,
					"columnIndex": 55
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtA11",
					"width": "7rem",
					"visible": true,
					"columnIndex": 56
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtC11",
					"width": "7rem",
					"visible": true,
					"columnIndex": 57
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtCb11",
					"width": "7rem",
					"visible": true,
					"columnIndex": 58
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_budget"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtB12",
					"width": "7rem",
					"visible": true,
					"columnIndex": 59
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_actuals"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtA12",
					"width": "7rem",
					"visible": true,
					"columnIndex": 60
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_committed"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtC12",
					"width": "7rem",
					"visible": true,
					"columnIndex": 61
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("A_uncommitted"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtCb12",
					"width": "7rem",
					"visible": true,
					"columnIndex": 62
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_id"),
					"path": "Project>Id",
					"width": "8rem",
					"visible": true,
					"columnIndex": 63
				},
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_agency"),
					"path": "Project>Agency",
					"width": "10rem",
					"visible": true,
					"columnIndex": 64
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_retailer"),
					"path": "Project>Retailer",
					"width": "10rem",
					"visible": true,
					"columnIndex": 65
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_costcenter"),
					"path": "Project>CostcenterDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 66
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_glAccount"),
					"path": "Project>GlAccount",
					"width": "10rem",
					"visible": true,
					"columnIndex": 67
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_po"),
					"path": "Project>PO",
					"width": "10rem",
					"visible": true,
					"columnIndex": 68
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_status"),
					"path": "Project>_statusDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 69
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_btotals"),
					"path": "Project>AmtBTot",
					"width": "7rem",
					"visible": true,
					"columnIndex": 70
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_atotals"),
					"path": "Project>AmtATot",
					"width": "7rem",
					"visible": true,
					"columnIndex": 71
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_ctotals"),
					"path": "Project>AmtCTot",
					"width": "7rem",
					"visible": true,
					"columnIndex": 72
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_cbtotals"),
					"path": "Project>AmtCbTot",
					"width": "7rem",
					"visible": true,
					"columnIndex": 73
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_createdBy"),
					"path": "Project>CreatedBy",
					"width": "7rem",
					"visible": false,
					"columnIndex": 74
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_createdByName"),
					"path": "Project>CreatedByName",
					"width": "10rem",
					"visible": true,
					"columnIndex": 75
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_createdTime"),
					"path": "Project>CreatedTime",
					"width": "10rem",
					"visible": true,
					"columnIndex": 76
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_changedBy"),
					"path": "Project>ChangedBy",
					"width": "7rem",
					"visible": false,
					"columnIndex": 77
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_changedByName"),
					"path": "Project>ChangedByName",
					"width": "10rem",
					"visible": true,
					"columnIndex": 78
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_changedTime"),
					"path": "Project>ChangedTime",
					"width": "10rem",
					"visible": true,
					"columnIndex": 79
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxb"),
					"path": "Project>MaxValueB",
					"width": "7rem",
					"visible": true,
					"columnIndex": 80
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxa"),
					"path": "Project>MaxValueA",
					"width": "7rem",
					"visible": true,
					"columnIndex": 81
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxc"),
					"path": "Project>MaxValueC",
					"width": "7rem",
					"visible": true,
					"columnIndex": 82
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxcb"),
					"path": "Project>MaxValueCb",
					"width": "7rem",
					"visible": true,
					"columnIndex": 83
				},{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtLe1",
					"width": "7rem",
					"visible": false,
					"columnIndex": 84
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtLe2",
					"width": "7rem",
					"visible": false,
					"columnIndex": 85
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtLe3",
					"width": "7rem",
					"visible": false,
					"columnIndex": 86
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtLe4",
					"width": "7rem",
					"visible": false,
					"columnIndex": 87
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtLe5",
					"width": "7rem",
					"visible": false,
					"columnIndex": 88
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtLe6",
					"width": "7rem",
					"visible": false,
					"columnIndex": 89
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtLe7",
					"width": "7rem",
					"visible": false,
					"columnIndex": 90
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtLe8",
					"width": "7rem",
					"visible": false,
					"columnIndex": 91
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtLe9",
					"width": "7rem",
					"visible": true,
					"columnIndex": 92
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtLe10",
					"width": "7rem",
					"visible": false,
					"columnIndex": 93
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtLe11",
					"width": "7rem",
					"visible": false,
					"columnIndex": 94
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_le"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtLe12",
					"width": "7rem",
					"visible": false,
					"columnIndex": 95
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_letotals"),
					"path": "Project>AmtLeTot",
					"width": "7rem",
					"visible": true,
					"columnIndex": 96
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxle"),
					"path": "Project>MaxValueLe",
					"width": "7rem",
					"visible": true,
					"columnIndex": 97
				}, 
				{
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jan")),
					"path": "Project>AmtBo1",
					"width": "7rem",
					"visible": false,
					"columnIndex": 98
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_feb")),
					"path": "Project>AmtBo2",
					"width": "7rem",
					"visible": false,
					"columnIndex": 99
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_mar")),
					"path": "Project>AmtBo3",
					"width": "7rem",
					"visible": false,
					"columnIndex": 100
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_apr")),
					"path": "Project>AmtBo4",
					"width": "7rem",
					"visible": false,
					"columnIndex": 101
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_may")),
					"path": "Project>AmtBo5",
					"width": "7rem",
					"visible": false,
					"columnIndex": 102
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jun")),
					"path": "Project>AmtBo6",
					"width": "7rem",
					"visible": false,
					"columnIndex": 103
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_jul")),
					"path": "Project>AmtBo7",
					"width": "7rem",
					"visible": false,
					"columnIndex": 104
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_aug")),
					"path": "Project>AmtBo8",
					"width": "7rem",
					"visible": false,
					"columnIndex": 105
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_sep")),
					"path": "Project>AmtBo9",
					"width": "7rem",
					"visible": false,
					"columnIndex": 106
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_oct")),
					"path": "Project>AmtBo10",
					"width": "7rem",
					"visible": false,
					"columnIndex": 107
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_nov")),
					"path": "Project>AmtBo11",
					"width": "7rem",
					"visible": false,
					"columnIndex": 108
				}, {
					"text": formatter.columnHeader(oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bo"),
						oContext.getOwnerComponent().getModel("i18n").getProperty("A_dec")),
					"path": "Project>AmtBo12",
					"width": "7rem",
					"visible": false,
					"columnIndex": 109
				}, {
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_bototals"),
					"path": "Project>AmtBoTot",
					"width": "7rem",
					"visible": true,
					"columnIndex": 110
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maxbo"),
					"path": "Project>MaxValueBo",
					"width": "7rem",
					"visible": true,
					"columnIndex": 111
				}, 
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_demo"),
					"path": "Project>DemographicsDesc",
					"width": "10rem",
					"visible": true,
					"columnIndex": 112
				} ,
				{
					"text": oContext.getOwnerComponent().getModel("i18n").getProperty("AC_maestroBrief"),
					"path": "Project>MaestroBrief",
					"width": "10rem",
					"visible": true,
					"columnIndex": 113
				}
				],
				OtherConfig: {
					MaxTableRows: 15
				}
			};
			return oColumns;
		}
	};
});