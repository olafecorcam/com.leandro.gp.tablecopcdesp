sap.ui.table.Table
		.extend(
				"com.leandro.gp.tablecopcdesp.TableCOPCDESP",
				{
					metadata : { // Not to be confused with the Data Source
						// metadata property
						properties : {
							"name" : "string",
							"data" : null,
							"tamanhoCols" : null,
							"linhasVisiveis" : null,
							"topBT" : null

						}
					},
					setTopBT : function(value) {
						this.topBT = value;
					},
					getTopBT : function() {
						return this.topBT;
					},
					setLinhasVisiveis : function(value) {
						this.linhasVisiveis = value;
					},
					getLinhasVisiveis : function() {
						return this.linhasVisiveis;
					},
					setTamanhoCols : function(value) {
						if (value)
							this._tamanhoCols = value.split(";");
						for ( var i = 0; i < this._tamanhoCols.length; i++) {
							if (this._tamanhoCols[i].indexOf("px") == -1
									&& this._tamanhoCols[i].indexOf("%") == -1) {
								alert("O tamanho set colunas está incorreto,"
										+ "/ncada membro entre os ';' deve ser"
										+ "/nseguido por 'px' ou '%'");
								return;
							}
						}
						this.tamanhoCols = value;
					},
					getTamanhoCols : function() {
						return this.tamanhoCols;
					},
					setData : function(value) {
						this.data = value;
						var that = this;
						this.addEventDelegate( {
							onAfterRendering : function(evt) {
								that.styleThisBich();
							}
						});
						if(this.data == "")
							this.unbindRows();
						
						if (this.data) {
							this.destroyColumns();

							this.numCols = 0;
							this.numRows = 0;
							this.numColTuples = 0;
							this.numRowTuples = 0;
							this.numColsOfData = 0;
							this.numRowsOfData = 0;

							this.computeTableLayout();

							this.arrColspan = this.newArray(this.numCols,
									this.numRows);
							this.arrRowspan = this.newArray(this.numCols,
									this.numRows);
							this.arrText = this.newArray(this.numCols,
									this.numRows);
							this.arrType = this.newArray(this.numCols,
									this.numRows);

							this.applyTopLeftCorner();
							this.applyColumnHeaders();
							this.applyRowHeaders();
							this.applyData();
							this.tabaliza();
							this.setVisibleRowCount(this.linhasVisiveis);
							this.mountColunas();
							var oModel = new sap.ui.model.json.JSONModel();
							this.doCalculations();
							if (this.topBT == "BOTTOM") {
								this.table.sort(function(a, b) {
									return a.sortField - b.sortField;
								});
							} else {
								this.table.sort(function(a, b) {
									return b.sortField - a.sortField;
								});

							}
							var top10 = new Array();
							var count = 0;
							for ( var y = 0; y < this.table.length; y++) {
								if (count >= 10 || !this.table[y])
									continue;
								top10.push(this.table[y]);
								count++;
							}
							oModel.setData( {
								modelData : top10
							});
							this.setModel(oModel);
							this.bindRows("/modelData");

						}

					},
					tabaliza : function() {
						this.table = new Array();
						for ( var i = (this.arrText.length - 1); i >= 0; i--) {
							var dados = this.arrText[i];
							// here i'll hold the last valid item, since the
							// logic that SAP created
							// if the item is the same, it will skip it on the
							// arrtext variable
							// since no hierarchy is needed here, i keep the
							// last valid to insert it
							// on all levels
							var lastValid = null;

							// here i add one to the i, so that it gets the
							// right
							// dimension, since inside the loop i have to do a
							// minus one
							var text = this.getDimensionName(i + 1);
							// here starts at one because the 0 holds the data
							// for the
							// current level
							for ( var z = 1; z < dados.length; z++) {
								var current = null;
								if (!this.table[z])
									current = new Object();
								else
									current = this.table[z];
								if (dados[z]) {
									// if the corrent item is an object, i only
									// carry the text of it
									if (dados[z].text) {
										current[text] = dados[z].text;
										lastValid = dados[z].text;
										// if its not, than i carry the only
										// thing i have, the text =D
									} else {
										current[text] = dados[z];
										lastValid = dados[z];
									}
								} else {
									current[text] = lastValid;
								}

								this.table[z] = current;
							}
						}
					},
					doCalculations : function() {
						var arr = new Array();
						for ( var i = 0; i < this.table.length; i++) {
							var current = this.table[i];
							if (!current)
								continue;
							// here is where i do the extra calculations and
							// format the number
							var montPlan = current["Montante Planejado"] ? current["Montante Planejado"]
									: 0;
							var montReal = current["Montante Real"] ? current["Montante Real"]
									: 0;
							var dife = montReal - montPlan;
							var varia = montPlan == 0 ? 0 : montReal / montPlan;

							current["sortField"] = dife;
							current["diferenca"] = numeral(
									dife == null || isNaN(dife) ? 0 : dife)
									.format(dife < 0 ? "-0,000.00" : "0,000.00");
							current["varia"] = numeral(
									varia == null || isNaN(varia) ? 0 : varia)
									.format(
											varia < 0 ? "-0,000.00%"
													: "0,000.00%");
							current["Montante Real"] = numeral(
									montReal == null || isNaN(montReal) ? 0
											: montReal).format(
									montReal < 0 ? "-0,000.00" : "0,000.00");
							current["Montante Planejado"] = numeral(
									montPlan == null || isNaN(montPlan) ? 0
											: montPlan).format(
									montPlan < 0 ? "-0,000.00" : "0,000.00");

							arr.push(current);
						}
						this.table = arr;
					},
					getDimensionName : function(indice) {
						var numMeasures = this.numColsOfData;
						var numDimensions = this.numRowTuples;
						var dimNumber = indice - numMeasures;
						if (indice > numDimensions) {
							return this.data.dimensions[0].members[dimNumber].text;
						} else
							return this.data.dimensions[indice].text;

					},
					applyTopLeftCorner : function() {
						this.markSpannedCellRectangle(0, 0, this.numRowTuples,
								this.numColTuples);

						this.arrColspan[0][0] = this.numRowTuples;
						this.arrRowspan[0][0] = this.numColTuples;
						this.arrText[0][0] = "";
						this.arrType[0][0] = "topleft";
					},
					markSpannedCellRectangle : function(arrCol, arrRow,
							colspan, rowspan) {
						for ( var i = arrRow; i < arrRow + rowspan; i++) {
							for ( var j = arrCol; j < arrCol + colspan; j++) {
								this.arrColspan[j][i] = -1;
								this.arrRowspan[j][i] = -1;
							}
						}
					},
					getData : function() {
						return this.data;
					},
					mountColunas : function() {
						var color = "green";
						if (this.topBT == "BOTTOM")
							color = "red";

						var redDot = new sap.ui.core.HTML(
								"html1",
								{
									// the static content as a long string
									// literal
									content : "<div style='position:relative;background-color:"
											+ color
											+ ";border-radius:50%;width:16px;height:16px;'>",
									preferDOM : false
								// use the afterRendering event for 2 purposes

								});

						this.addColumn(new sap.ui.table.Column( {
							label : "",
							template : redDot,
							width : this._tamanhoCols[0]
						}));

						var txtCusto = this.getDimensionName(1);
						var txtReal = this.getDimensionName(2);
						var txtPlan = this.getDimensionName(3);

						var textCusto = new sap.ui.commons.TextView()
								.bindProperty("text", txtCusto);
						textCusto.setTextAlign(sap.ui.core.TextAlign.Left);
						var headerCusto = new sap.ui.commons.TextView();
						headerCusto.setTextAlign(sap.ui.core.TextAlign.Center);
						headerCusto.setText("Conta Contábil");
						this.addColumn(new sap.ui.table.Column( {
							label : headerCusto,
							template : textCusto,
							width : this._tamanhoCols[1]
						}));

						var textOrcado = new sap.ui.commons.TextView()
								.bindProperty("text", txtPlan);
						textOrcado.setTextAlign(sap.ui.core.TextAlign.Right);
						var headerOrcado = new sap.ui.commons.TextView();
						headerOrcado.setTextAlign(sap.ui.core.TextAlign.Center);
						headerOrcado.setText("Orçado");
						this.addColumn(new sap.ui.table.Column( {
							label : headerOrcado,
							template : textOrcado,
							width : this._tamanhoCols[2]
						}));

						var textReal = new sap.ui.commons.TextView()
								.bindProperty("text", txtReal);
						textReal.setTextAlign(sap.ui.core.TextAlign.Right);
						var headerReal = new sap.ui.commons.TextView();
						headerReal.setTextAlign(sap.ui.core.TextAlign.Center);
						headerReal.setText("Real");
						this.addColumn(new sap.ui.table.Column( {
							label : headerReal,
							template : textReal,
							width : this._tamanhoCols[3]
						}));

						var textDife = new sap.ui.commons.TextView()
								.bindProperty("text", "diferenca");
						textDife.setTextAlign(sap.ui.core.TextAlign.Right);
						var headerDife = new sap.ui.commons.TextView();
						headerDife.setTextAlign(sap.ui.core.TextAlign.Center);
						headerDife.setText("Diferença");
						this.addColumn(new sap.ui.table.Column( {
							label : headerDife,
							template : textDife,
							width : this._tamanhoCols[4]
						}));

						var textVar = new sap.ui.commons.TextView()
								.bindProperty("text", "varia");
						textVar.setTextAlign(sap.ui.core.TextAlign.Right);
						var headerVar = new sap.ui.commons.TextView();
						headerVar.setTextAlign(sap.ui.core.TextAlign.Center);
						headerVar.setText("Var%");
						this.addColumn(new sap.ui.table.Column( {
							label : headerVar,
							template : textVar,
							width : this._tamanhoCols[5]
						}));

					},
					computeTableLayout : function() {
						var colAxis = this.data.axis_columns;
						this.numColsOfData = colAxis.length;

						var rowAxis = this.data.axis_rows;
						this.numRowsOfData = rowAxis.length;

						this.numColTuples = 0;
						var sampleColAxisTuple = colAxis[0];
						for ( var i = 0; i < sampleColAxisTuple.length; i++) {
							if (sampleColAxisTuple[i] > -1) {
								this.numColTuples++;
							}
						}
						this.numRowTuples = sampleColAxisTuple.length
								- this.numColTuples;

						this.numCols = this.numRowTuples + this.numColsOfData;
						this.numRows = this.numColTuples + this.numRowsOfData;
					},
					newArray : function(x, y) {
						var array = new Array(x);
						for ( var i = 0; i < x; i++) {
							array[i] = new Array(y);
						}
						return array;
					},
					applyColumnHeaders : function() {
						var OFFSET_COLS = this.numRowTuples;
						for ( var row = 0; row < this.numColTuples; row++) {
							for ( var col = 0; col < this.numColsOfData; col++) {
								if (this.isCellHiddenBySpan(OFFSET_COLS + col,
										row) == false) {
									var colspan = this.computeColHeaderColspan(
											col, row);
									var rowspan = this.computeColHeaderRowspan(
											col, row);
									this.markSpannedCellRectangle(OFFSET_COLS
											+ col, row, colspan, rowspan);

									var colMember = this.data.dimensions[row].members[this.data.axis_columns[col][row]];
									var text = colMember;
									var type = colMember.type;
									this.arrColspan[OFFSET_COLS + col][row] = colspan;
									this.arrRowspan[OFFSET_COLS + col][row] = rowspan;
									this.arrText[OFFSET_COLS + col][row] = text;
									this.arrType[OFFSET_COLS + col][row] = (type == "RESULT") ? "header-bold"
											: "header";

									col += colspan - 1;
								}
							}
						}
					},
					isCellHiddenBySpan : function(arrCol, arrRow) {
						var colspan = this.arrColspan[arrCol][arrRow];
						if (colspan == -1) {
							return true;
						}
						var rowspan = this.arrRowspan[arrCol][arrRow];
						if (rowspan == -1) {
							return true;
						}
						return false;
					},
					computeColHeaderRowspan : function(col, row) {
						var rowspan = 1;
						var colMember = this.data.dimensions[row].members[this.data.axis_columns[col][row]];
						if (colMember.type == "RESULT") {
							for ( var i = row + 1; i < numColTuples; i++) {
								var colMemberToCompare = this.data.dimensions[i].members[this.data.axis_columns[col][i]];
								if (colMemberToCompare.type == "RESULT") {
									rowspan++;
								} else {
									break;
								}
							}
						}
						return rowspan;
					},
					computeColHeaderColspan : function(col, row) {
						var colspan = 1;
						var index = this.data.axis_columns[col][row];
						for ( var i = col + 1; i < this.data.axis_columns.length; i++) {
							var nextIndex = this.data.axis_columns[i][row];
							if (index == nextIndex) {
								// end colspan if "parent" tuples of next column
								// are not the same
								for ( var j = 0; j < row; j++) {
									var parentIndex = this.data.axis_columns[col][j];
									var parentIndexToCompare = this.data.axis_columns[i][j];
									if (parentIndex != parentIndexToCompare) {
										return colspan;
									}
								}
								colspan++;
							} else {
								break;
							}
						}
						return colspan;
					},
					applyRowHeaders : function() {
						var DIM_OFFSET = this.numColTuples;
						var OFFSET_ROWS = this.numColTuples;
						for ( var col = 0; col < this.numRowTuples; col++) {
							for ( var row = 0; row < this.numRowsOfData; row++) {
								if (this.isCellHiddenBySpan(col, OFFSET_ROWS
										+ row) == false) {
									var colspan = this.computeRowHeaderColspan(
											col, row);
									var rowspan = this.computeRowHeaderRowspan(
											col, row);
									this
											.markSpannedCellRectangle(col,
													OFFSET_ROWS + row, colspan,
													rowspan);

									var rowMember = this.data.dimensions[DIM_OFFSET
											+ col].members[this.data.axis_rows[row][DIM_OFFSET
											+ col]];
									var text = rowMember;
									var type = rowMember.type;

									this.arrColspan[col][OFFSET_ROWS + row] = colspan;
									this.arrRowspan[col][OFFSET_ROWS + row] = rowspan;
									this.arrText[col][OFFSET_ROWS + row] = text;
									this.arrType[col][OFFSET_ROWS + row] = (type == "RESULT") ? "header-bold"
											: "header";

									row += rowspan - 1;
								}
							}
						}
					},
					computeRowHeaderRowspan : function(col, row) {
						var DIM_OFFSET = this.numColTuples;
						var rowspan = 1;
						var index = this.data.axis_rows[row][DIM_OFFSET + col];
						for ( var i = row + 1; i < this.data.axis_rows.length; i++) {
							var nextIndex = this.data.axis_rows[i][DIM_OFFSET
									+ col];
							if (index == nextIndex) {
								// end rowspan if "parent" tuples of next row
								// are not the same
								for ( var j = 0; j < col; j++) {
									var parentIndex = this.data.axis_rows[row][DIM_OFFSET
											+ j];
									var nextParentIndex = this.data.axis_rows[i][DIM_OFFSET
											+ j];
									if (parentIndex != nextParentIndex) {
										return rowspan;
									}
								}
								rowspan++;
							} else {
								break;
							}
						}
						return rowspan;
					},
					computeRowHeaderColspan : function(col, row) {
						var DIM_OFFSET = this.numColTuples;
						var colspan = 1;
						var rowMember = this.data.dimensions[DIM_OFFSET + col].members[this.data.axis_rows[row][DIM_OFFSET
								+ col]];
						if (rowMember.type == "RESULT") {
							for ( var i = col + 1; i < this.numRowTuples; i++) {
								var rowMemberToCompare = this.data.dimensions[DIM_OFFSET
										+ i].members[this.data.axis_rows[row][DIM_OFFSET
										+ i]];
								if (rowMemberToCompare.type == "RESULT") {
									colspan++;
								} else {
									break;
								}
							}
						}
						return colspan;
					},
					applyData : function() {
						var OFFSET_COLS = this.numRowTuples;
						var OFFSET_ROWS = this.numColTuples;
						var dataIndex = 0;
						for ( var row = 0; row < this.numRowsOfData; row++) {
							for ( var col = 0; col < this.numColsOfData; col++) {
								this.arrColspan[OFFSET_COLS + col][OFFSET_ROWS
										+ row] = 1;
								this.arrRowspan[OFFSET_COLS + col][OFFSET_ROWS
										+ row] = 1;
								this.arrText[OFFSET_COLS + col][OFFSET_ROWS
										+ row] = this.formatValue(
										this.data.data[dataIndex],
										this.data.tuples[dataIndex]);
								dataIndex++;
							}
						}
					},
					formatValue : function(value, tuple) {
						if (value === null) {
							return "";
						}
						return value;
						for ( var i = 0; i < this.data.dimensions.length; i++) {
							var strFormat = this.data.dimensions[i].members[tuple[i]].formatString;
							if (strFormat) {
								sap.common.globalization.NumericFormatManager
										.setPVL(this.data.locale);
								return sap.common.globalization.NumericFormatManager
										.format(value, strFormat);
							}
						}
						return val;
					},
					arrayToObj : function(dado, arr) {
						for ( var i = 0; i < arr.length; i++) {
							dado[i] = arr[i];
						}
						return dado;
					},
					styleThisBich : function() {

						var elements = $('div.sapUiTableCell');
						elements.each(function() {
							$(this).children("span").each(function() {
								var col = $(this).attr("data-sap-ui");
								if (!col)
									return;

								col = col.split("-");
								col = col[1].replace("col", "");
								col = parseInt(col);

								if (col >= 2) {
									$(this).css("font-weight", "bold");
									var texto = $(this).text();
									if (texto.indexOf("-") > -1)
										$(this).css("color", "red");
									else
										$(this).css("color", "black");
								}

							});
						});
					},
					// SAPUI5 Renderer, we can leave it aloneS
					renderer : {

					// render : function(rm, oControl) {
					// }
					},
					// Called by sap.designstudio.sdkui5.Handler
					// (sdkui5_handler.js)
					initDesignStudio : function() {
						try {
							if (!!sap.ui.Device.browser.webkit
									&& !document.width) {
								jQuery.sap.require("sap.ui.core.ScrollBar");
								var fnOrg = sap.ui.core.ScrollBar.prototype.onAfterRendering;
								sap.ui.core.ScrollBar.prototype.onAfterRendering = function() {
									document.width = window.outerWidth;
									fnOrg.apply(this, arguments);
									document.width = undefined;
								};
							}
							/*
							 * var that = this; this.attachChange(function() {
							 * that.setSelectedKey(that.getSelectedItemId());
							 * that.setSelectedValue(that.getValue());
							 * that.fireDesignStudioPropertiesChanged( [
							 * "selectedValue", "selectedKey" ]);
							 * that.fireDesignStudioEvent("onchange"); });
							 */
						} catch (e) {
							alert(e); // Aw snap
						}

					}

				});