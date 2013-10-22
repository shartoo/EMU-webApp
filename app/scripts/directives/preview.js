'use strict';


angular.module('emulvcApp')
	.directive('preview', function() {
		return {
			templateUrl: 'views/preview.html',
			restrict: 'E',
			link: function postLink(scope, element, attrs) {
				// select the needed DOM elements from the template
				var canvas = element.find("canvas")[0];
				var myid = element[0].id;			
				
				scope.$watch('vs.curViewPort', function(newValue, oldValue) {
					if (!$.isEmptyObject(scope.shs.currentBuffer)) {
						// check for changed zoom
						if(oldValue.sS != newValue.sS || oldValue.sE != newValue.sE || newValue.selectS == -1){ // SIC -1 check not that clean...
							var allPeakVals = scope.dhs.calculatePeaks(scope.vs, canvas, scope.shs.currentBuffer.getChannelData(0));
							scope.dhs.osciPeaks = allPeakVals;
							
						}
						freshRedrawDrawOsciOnCanvas(scope.vs, canvas, scope.dhs.osciPeaks, scope.shs.currentBuffer, scope.config);
						drawVpOsciMarkup(scope.vs, canvas, scope.config);						
					}
				}, true);			
				


				/**
				 * @param cps color provider service
				 */

				function freshRedrawDrawOsciOnCanvas(viewState, canvas, allPeakVals, buffer, config) {
					var ctx = canvas.getContext("2d");
					ctx.clearRect(0, 0, canvas.width, canvas.height);

					if (allPeakVals.peaks && allPeakVals.samplePerPx >= 1) {
						allPeakVals.peaks.forEach(function(peak, index) {
							if (index !== 0) {
								drawFrame(viewState, index, peak, allPeakVals.maxPeak, allPeakVals.peaks[index - 1], canvas, config);
							}
						});

					} else if (allPeakVals.samplePerPx < 1) {
						// console.log("at 0 over sample exact")
						var hDbS = (1 / allPeakVals.samplePerPx) / 2; // half distance between samples
						var sNr = viewState.curViewPort.sS;
						// over sample exact
						ctx.strokeStyle = config.vals.colors.osciColor;
						ctx.fillStyle = config.vals.colors.osciColor;
						// ctx.beginPath();
						var i;
						if (viewState.curViewPort.sS === 0) {
							ctx.moveTo(hDbS, (allPeakVals.peaks[0] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height);
							for (i = 0; i < allPeakVals.peaks.length; i++) {
								ctx.lineTo(i / allPeakVals.samplePerPx + hDbS, (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height);
							}
							ctx.stroke();
							// draw sample dots
							for (i = 0; i < allPeakVals.peaks.length; i++) {
								ctx.beginPath();
								ctx.arc(i / allPeakVals.samplePerPx + hDbS, (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height - 3, 4, 0, 2 * Math.PI, false);
								ctx.stroke();
								ctx.fill();
								if (false) { // SIC !!!
									ctx.strokeText(sNr, i / allPeakVals.samplePerPx + hDbS, (allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height - 10);
									sNr = sNr + 1;
								}
							}
						} else {
							//draw lines
							ctx.moveTo(-hDbS, canvas.height - ((allPeakVals.peaks[0] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height));
							for (i = 1; i < allPeakVals.peaks.length; i++) {
								ctx.lineTo(i / allPeakVals.samplePerPx - hDbS, canvas.height - ((allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height + 3));
							}
							ctx.stroke();
							// draw sample dots
							for (i = 1; i < allPeakVals.peaks.length; i++) {
								ctx.beginPath();
								ctx.arc(i / allPeakVals.samplePerPx - hDbS, canvas.height - ((allPeakVals.peaks[i] - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height) - 3, 4, 0, 2 * Math.PI, false);
								ctx.stroke();
								ctx.fill();
								if (false) { // SIC !!! 
									sNr = sNr + 1;
								}
							}

						}
					}
					if (true) { // SIC !!!
						// draw zero line
						ctx.strokeStyle = config.vals.colors.zeroLineColor;
						ctx.fillStyle = config.vals.colors.wwzeroLineColor;
						// see if Chrome ->dashed line
						if (navigator.vendor == "Google Inc.") {
							ctx.setLineDash([5]);
						}
						if (allPeakVals.samplePerPx >= 1) {
							ctx.strokeRect(0, canvas.height / 2, canvas.width, 2);
						} else {
							ctx.strokeRect(0, canvas.height - ((0 - allPeakVals.minPeak) / (allPeakVals.maxPeak - allPeakVals.minPeak) * canvas.height), canvas.width, 1);
						}
						// see if Chrome ->dashed line
						if (navigator.vendor == "Google Inc.") {
							ctx.setLineDash([0]);
						}
					}
				}

				/**
				 * drawing method to draw single line between two
				 * envelope points. Is used by drawOsciOnCanvas if
				 * envelope drawing is done
				 * @param index
				 * @param value
				 * @param max
				 * @param prevPeak
				 * @param canvas
				 */

				function drawFrame(viewState, index, value, max, prevPeak, canvas, config) {

					var ctx = canvas.getContext("2d");

					//calculate sample of cur cursor position

					//calc cursor pos
					var all = viewState.curViewPort.eS - viewState.curViewPort.sS;
					var fracC = viewState.curCursorPosInPercent * viewState.bufferLength - viewState.curViewPort.sS;
					var procC = fracC / all;
					var posC = canvas.width * procC;

					//cur
					var w = 1;
					var h = Math.round(value * (canvas.height / max)); //rel to max
					var x = index * w;
					var y = Math.round((canvas.height - h) / 2);

					//prev
					var prevW = 1;
					var prevH = Math.round(prevPeak * (canvas.height / max));
					var prevX = (index - 1) * w;
					var prevY = Math.round((canvas.height - prevH) / 2);


					if (posC >= x) {
						ctx.fillStyle = config.vals.colors.playProgressColor;
						ctx.strokeStyle = config.vals.colors.playProgressColor;
					} else {
						ctx.fillStyle = config.vals.colors.osciColor;
						ctx.strokeStyle = config.vals.colors.osciColor;
					}

					ctx.beginPath();
					ctx.moveTo(prevX, prevY);
					ctx.lineTo(x, y);
					ctx.stroke();

				}

				/**
				 * draws markup of osci according to
				 * the information that is specified in
				 * the viewport
				 */

				function drawVpOsciMarkup(viewState, canvas, config) {

					var ctx = canvas.getContext("2d");

					ctx.strokeStyle = config.vals.colors.labelColor;
					ctx.fillStyle = config.vals.colors.labelColor;
					ctx.font = (config.vals.colors.fontPxSize + "px" + " " + config.vals.colors.fontType);

					// lines to corners
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(5, 5);
					ctx.moveTo(canvas.width, 0);
					ctx.lineTo(canvas.width - 5, 5);
					ctx.closePath();
					ctx.stroke();

					var sTime;
					var eTime;
					if (viewState.curViewPort) {
						//draw time and sample nr
						sTime = viewState.round(viewState.curViewPort.sS / 44100, 6); //SIC hardcoded sample rate
						eTime = viewState.round(viewState.curViewPort.eS / 44100, 6); //SIC hardcoded sample rate
						ctx.fillText(viewState.curViewPort.sS, 5, config.vals.colors.fontPxSize);
						ctx.fillText(sTime, 5, config.vals.colors.fontPxSize * 2);
						var metrics = ctx.measureText(sTime);
						ctx.fillText(viewState.curViewPort.eS, canvas.width - ctx.measureText(viewState.curViewPort.eS).width - 5, config.vals.colors.fontPxSize);
						ctx.fillText(eTime, canvas.width - metrics.width - 5, config.vals.colors.fontPxSize * 2);
					}
				}
			}
		};
	});