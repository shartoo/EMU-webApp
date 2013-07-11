EmuLabeller.Drawer = {
    defaultParams: {
        waveColor: '#333',
        progressColor: '#777',
        cursorWidth: 1,
        loadingColor: '#333',
        loadingBars: 20,
        barHeight: 1,
        barMargin: 10,
        mainFont : '12px Verdana'
    },

    init: function(params) {
        var my = this;
        this.params = Object.create(params);
        Object.keys(this.defaultParams).forEach(function(key) {
            if (!(key in params)) {
                params[key] = my.defaultParams[key];
            }
        });

        // osci drawer
        this.osciDrawer = Object.create(EmuLabeller.Drawer.OsciDrawer);
        this.osciDrawer.init();

        // TODO spectrogram drawer
        // Spectrogram
        this.spectogramDrawer = Object.create(EmuLabeller.spectogramDrawer);
        this.spectogramDrawer.init({
            specCanvas: params.specCanvas,
            drawer: this
        });

        // SSFF drawer
        this.SSFFDrawer = Object.create(EmuLabeller.Drawer.SSFFDrawer);
        this.SSFFDrawer.init();

        // tier drawer
        this.tierDrawer = Object.create(EmuLabeller.Drawer.TierDrawer);
        this.tierDrawer.init();

        this.osciCanvas = params.osciCanvas;
        this.specCanvas = params.specCanvas;
        this.scrollCanvas = params.scrollCanvas;


        this.osciWidth = this.osciCanvas.width;
        this.osciHeight = this.osciCanvas.height;
        this.start = 0;
        this.end = this.osciWidth;
        this.mainFont = params.mainFont;

        this.specWidth = this.specCanvas.width;
        this.specHeight = this.specCanvas.height;

        this.scrollWidth = this.scrollCanvas.width;
        this.scrollHeight = 8; //this.scrollCanvas.clientHeight;

        //create offline canvas for minimap
        // this.sTmpCanvas = document.createElement("canvas");
        // this.sTmpCtx = this.sTmpCanvas.getContext("2d");
        // this.sTmpCanvas.width = this.scrollWidth;
        // this.sTmpCanvas.height = this.scrollCanvas.clientHeight;

        this.inMemoryMiniMapCanvas = document.createElement("canvas");
        // this.sTmpCtx = this.sTmpCanvas.getContext("2d");
        this.inMemoryMiniMapCanvas.width = this.scrollWidth;
        this.inMemoryMiniMapCanvas.height = this.scrollCanvas.clientHeight;

        // this.toRetinaRatio(this.sTmpCanvas, this.sTmpCtx);


        this.cc = this.osciCanvas.getContext('2d');
        this.scc = this.specCanvas.getContext('2d');
        this.scrollcc = this.scrollCanvas.getContext('2d');

        this.tierInfos = params.tierInfos;

        this.cacheImage = new Image();

        this.tierInfos.contexts = [];

        for (var i = 0; i <= this.tierInfos.canvases.length - 1; i++) {
            this.tierInfos.contexts.push(this.tierInfos.canvases[i].getContext('2d'));
            // this.toRetinaRatio(this.tierInfos.canvases[i], this.tierInfos.contexts[i]);
        }

        //console.log(this.tierInfos);

        // this.toRetinaRatio(this.osciCanvas, this.cc);
        // this.toRetinaRatio(this.specCanvas, this.scc);
        // this.toRetinaRatio(this.scrollCanvas, this.scrollcc);

        if (params.image) {
            this.loadImage(params.image, this.drawImage.bind(this));
        }

        if (!this.osciWidth || !this.osciHeight) {
            console.error('Canvas size is zero.');
        }
    },

    addTier: function(canv) {
        var newContext = canv.getContext('2d');
        this.tierInfos.contexts.push(newContext);
        // this.toRetinaRatio(canv, newContext);
    },


    // getPeaks: function (buffer, vP) {
    //     //console.log(vP);

    //     //var k = buffer.getChannelData(0).length / this.osciWidth;
    //     //console.log(buffer.getChannelData(0).length);

    //     var k = (vP.eS-vP.sS)/ this.osciWidth; // PCM Samples per new pixel

    //     this.peaks = [];
    //     this.minPeak = Infinity;
    //     this.maxPeak = -Infinity;

    //     var chan = buffer.getChannelData(c);
    //     // console.log(chan);
    //     var relData = chan.subarray(vP.sS, vP.eS);

    //     if(k<=1){
    //         // console.log("over sample exact!!!");
    //         relData = chan.subarray(vP.sS, vP.eS+1);
    //         this.minPeak = Math.min.apply(Math, relData);
    //         this.maxPeak = Math.max.apply(Math, relData);
    //         this.peaks = Array.prototype.slice.call(relData);
    //     }else{


    //     for (var i = 0; i < this.osciWidth; i++) {
    //         var sum = 0;
    //         for (var c = 0; c < buffer.numberOfChannels; c++) {

    //             var vals = relData.subarray(i * k, (i + 1) * k);
    //             var peak = -Infinity;

    //             var av = 0;
    //             for (var p = 0, l = vals.length; p < l; p++){
    //                 //console.log(p);
    //                 if (vals[p] > peak){
    //                     peak = vals[p];
    //                 }
    //                 av += vals[p];
    //             }
    //             //sum += peak;
    //             sum += av/vals.length;
    //         }

    //         this.peaks[i] = sum;
    //         if (sum > this.maxPeak) {
    //             this.maxPeak = sum;
    //         }
    //     }
    // }//else
    // },

    uiDrawUpdate: function(vP, buffer, tierInfos, ssffInfos) {

        console.log("uiDrawUpdate called");
        // my.vP = vP;
        this.osciDrawer.drawCurOsciOnCanvas(buffer, this.osciCanvas, vP);
        this.osciDrawer.drawVpOsciMarkup(buffer, this.osciCanvas, vP);
        this.spectogramDrawer.uiDrawUpdate(emulabeller.backend.getPlayedPercents(), vP, emulabeller.backend.currentBuffer.length);

        // this.osciDrawer.drawCursor();

        //map percents to viewPort
        // var sInB = percents*bufferLength;
        // this.cursorPos = ~~(this.osciWidth*(sInB-vP.sS)/(vP.eS-vP.sS));

        // console.log(percents)
        // this.redraw(vP);
        // this.drawTimeLine(vP);

        // this.drawTiers(vP);

        //console.log(vP);
        // if(ssffInfos){
        //     if(ssffInfos.data.length > 0){
        //         this.drawSSFF(ssffInfos, vP);
        //     }
        // }
    },

    drawBuffer: function(buffer, vP, isInitDraw, ssffInfos) {

        // draw osci canvas with vP markup
        this.osciDrawer.redrawOsciOnCanvas(buffer, this.osciCanvas, vP);
        this.osciDrawer.drawVpOsciMarkup(buffer, this.osciCanvas, vP);

        // TODO draw spectrogram here

        // TODO draw SSFF canvases here


        // draw tiers
        this.tierDrawer.drawTiers(this.tierInfos, vP);

        // this.progress(0, vP, buffer.length-1, ssffInfos);
        if (isInitDraw) {
            this.osciDrawer.redrawOsciOnCanvas(buffer, this.inMemoryMiniMapCanvas, vP);
            // this.osciDrawer.drawVpOsciMarkup(buffer, vP, this.inMemoryMiniMapCanvas);
        }

        this.osciDrawer.drawScrollMarkup(vP, this.scrollCanvas, this.inMemoryMiniMapCanvas, buffer.length - 1);
        this.spectogramDrawer.uiDraw(buffer, vP);
        // this.drawTimeLine(vP);
    },


    drawTimeLine: function(vP) {
        var my = this;
        //console.log(vP);
        this.cc.strokeStyle = this.params.waveColor;

        //this.cc.fillRect(x, y, w, h);
        this.cc.beginPath();
        this.cc.moveTo(0, 0);
        this.cc.lineTo(5, 5);
        this.cc.moveTo(this.osciWidth, 0);
        this.cc.lineTo(this.osciWidth - 5, 5);
        this.cc.moveTo(0, this.osciHeight / 2);
        this.cc.lineTo(this.osciWidth, this.osciHeight / 2);

        this.cc.closePath();
        this.cc.stroke();

        if (vP) {
            this.cc.font = defaultParams.mainFont;
            var metrics = this.cc.measureText(Math.floor(vP.eS));
            this.cc.strokeText(Math.floor(vP.sS), 5, 5 + 8);
            this.cc.strokeText(Math.floor(vP.eS), this.osciWidth - metrics.width - 5, 5 + 8);
        }
        //draw vPselected
        if (vP.selectS !== 0 && vP.selectE !== 0) {
            var all = vP.eS - vP.sS;
            var fracS = vP.selectS - vP.sS;
            var procS = fracS / all;
            var posS = this.osciWidth * procS;

            var fracE = vP.selectE - vP.sS;
            var procE = fracE / all;
            var posE = this.osciWidth * procE;

            this.cc.fillStyle = "rgba(0, 0, 255, 0.2)";
            this.cc.fillRect(posS, 0, posE - posS, this.osciHeight);

            this.cc.strokeStyle = "rgba(0, 255, 0, 0.5)";
            this.cc.beginPath();
            this.cc.moveTo(posS, 0);
            this.cc.lineTo(posS, this.osciHeight);
            this.cc.moveTo(posE, 0);
            this.cc.lineTo(posE, this.osciHeight);
            this.cc.closePath();
            this.cc.stroke();

            this.cc.strokeStyle = this.params.waveColor;
            if (vP.selectS == vP.selectE) {
                this.cc.strokeText(Math.floor(vP.selectS), posS + 5, 10);
            } else {
                var tW = this.cc.measureText(Math.floor(vP.selectS)).width;
                this.cc.strokeText(Math.floor(vP.selectS), posS - tW - 4, 10);
                this.cc.strokeText(Math.floor(vP.selectE), posE + 5, 10);

            }
        }

    }

    /**
     * Redraws the entire canvas on each audio frame.
     */
    // redraw: function (vP) {
    //     //this.resizeCanvases();
    //     var my = this;
    //     this.clear();

    //     var k = (vP.eS-vP.sS)/ this.osciWidth; // PCM Samples per new pixel
    //     // Draw WebAudio buffer peaks using draw frame
    //     if (this.peaks && k >= 1) {
    //         this.peaks.forEach(function (peak, index) {
    //             if (index!==0){
    //                 my.drawFrame(index, peak, my.maxPeak, my.peaks[index-1]);
    //             }
    //         });
    //     // over sample exact
    //     } else if (k < 1) {
    //         this.cc.strokeStyle = this.params.waveColor;
    //         this.cc.beginPath();
    //         this.cc.moveTo(0,(this.peaks[0]-my.minPeak)/(my.maxPeak-my.minPeak)*this.osciHeight);
    //         for (var i = 1; i < this.peaks.length; i++) {
    //             this.cc.lineTo(i/k,(this.peaks[i]-my.minPeak)/(my.maxPeak-my.minPeak)*this.osciHeight);
    //         }
    //         this.cc.lineTo(this.osciWidth,(this.peaks[i]-my.minPeak)/(my.maxPeak-my.minPeak)*this.osciHeight);// SIC SIC SIC tail
    //         this.cc.stroke();
    //     }

    //     this.drawCursor();
    // },

    // clear: function () {
    //     var my = this;
    //     this.cc.clearRect(0, 0, this.osciWidth, this.osciHeight);
    //     //this.scc.clearRect(0, 0, this.specWidth, this.specHeight);
    // },

    // drawFrame: function (index, value, max, prevPeak) {
    //     //cur
    //     var w = 1;
    //     var h = Math.round(value * (this.osciHeight / max)); //rel to max
    //     var x = index * w;
    //     var y = Math.round((this.osciHeight - h)/2);

    //     //prev
    //     var prevW = 1;
    //     var prevH = Math.round(prevPeak * (this.osciHeight / max));
    //     var prevX = (index-1) * w;
    //     var prevY =  Math.round((this.osciHeight - prevH) / 2);


    //     if (this.cursorPos >= x) {
    //         this.cc.fillStyle = this.params.progressColor;
    //         this.cc.strokeStyle = this.params.progressColor;
    //     } else {
    //         this.cc.fillStyle = this.params.waveColor;
    //         this.cc.strokeStyle = this.params.waveColor;
    //     }

    //     this.cc.beginPath();
    //     this.cc.moveTo(prevX,prevY);
    //     this.cc.lineTo(x,y);
    //     //this.cc.closePath();
    //     this.cc.stroke();


    // },

    // drawCursor: function() {
    //     var w = this.params.cursorWidth;
    //     var h = this.osciHeight;

    //     var x = Math.min(this.cursorPos, this.osciWidth - w);
    //     var y = 0;

    //     this.cc.fillStyle = this.params.cursorColor;
    //     if (x > 0) {
    //         this.cc.fillRect(x, y, w, h);
    //     }
    // },

    // toRetinaRatio: function (canvas, context) {
    //     var backingStoreRatio, ratio;
    //     var devicePixelRatio = window.devicePixelRatio || 1, backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1, ratio = devicePixelRatio / backingStoreRatio;

    //     if (devicePixelRatio !== backingStoreRatio) {

    //         //waveCanvas
    //         var oldWidth = canvas.clientWidth;
    //         var oldHeight = canvas.clientHeight;

    //         canvas.width = oldWidth * ratio;
    //         canvas.height = oldHeight * ratio;

    //         canvas.style.width = oldWidth + 'px';
    //         canvas.style.height = oldHeight + 'px';

    //         // now scale the context to counter
    //         // the fact that we've manually scaled
    //         // our canvas element
    //         context.scale(ratio, ratio);
    //     }
    // }

    // drawTiers: function(vP) {
    //     // console.log(this.tierInfos.contexts.length);
    //     //console.log(vP);
    //     var markColor = "rgba(255, 255, 0, 0.7)";

    //     var curcc;
    //     var curCanv;
    //     for (var i =0; i<=this.tierInfos.contexts.length - 1 ; i++) {
    //         //console.log("here");
    //         curCanv = this.tierInfos.canvases[i];
    //         curcc = this.tierInfos.contexts[i];
    //         var curCanHeight = curCanv.height;
    //         var curCanWidth = curCanv.width;
    //         curcc.clearRect(0, 0, curCanWidth, curCanHeight);

    //         //highlight selected tier 
    //         if(vP.selTier == i){
    //             curcc.fillStyle = "rgba(255, 255, 255, 0.07)";
    //             curcc.fillRect(0, 0, curCanv.width, curCanv.height);
    //             curcc.fillStyle = "rgb(0, 0, 0)";
    //         }
    //         // console.log("------------");
    //         // console.log(vP.selTier);
    //         // console.log(vP.selSegment);

    //         var all = vP.eS-vP.sS;
    //         var fracS = vP.selectS-vP.sS;
    //         var procS = fracS/all;
    //         var posS = this.osciWidth*procS;

    //         var fracE = vP.selectE-vP.sS;
    //         var procE = fracE/all;
    //         var posE = this.osciWidth*procE;

    //         curcc.strokeStyle = "rgba(0, 255, 0, 0.5)";
    //         curcc.beginPath();
    //         curcc.moveTo(posS,0);
    //         curcc.lineTo(posS,curCanHeight);
    //         curcc.moveTo(posE,0);
    //         curcc.lineTo(posE,curCanHeight);
    //         curcc.stroke();

    //         //cirle with diam 5 for clicking range
    //         if(vP.selectS == vP.selectE){
    //             curcc.beginPath();
    //             curcc.arc(posS, 5, 5, 0, 2 * Math.PI, false);
    //             curcc.stroke();
    //         }

    //         // draw name of tier
    //         curcc.strokeStyle = this.params.waveColor;
    //         curcc.font="12px Verdana";
    //         curcc.strokeText(this.tierInfos.tiers[i].TierName, 5, 5+8);
    //         curcc.strokeText("(" + this.tierInfos.tiers[i].type +")", 5, 20+8);

    //         var cI = this.tierInfos.tiers[i];

    //         var ev, perc, tW, prevPerc;
    //         if (cI.type == "seg"){
    //             curcc.fillStyle = this.params.waveColor;
    //             //draw seg
    //             for (curEv = 0; curEv < cI.events.length; curEv++) {
    //                 if(cI.events[curEv].time > vP.sS ) { //&& cI.events[curEv].time < vP.eS){
    //                     perc = (cI.events[curEv].time-vP.sS)/(vP.eS-vP.sS);
    //                     curcc.fillRect(curCanWidth*perc, 0, 1, curCanHeight);
    //                     // mark selected segment with markColor == yellow
    //                     if(vP.segmentsLoaded && vP.selectedSegments[i][curEv]){
    //                         prevPerc = (cI.events[curEv-1].time-vP.sS)/(vP.eS-vP.sS);                        
    //                         curcc.fillStyle = markColor;
    //                         curcc.fillRect(curCanWidth*prevPerc+1, 0, curCanWidth*perc-curCanWidth*prevPerc-1, curCanHeight);
    //                         curcc.fillStyle = this.params.waveColor;
    //                     }
    //                     else if(vP.segmentsLoaded && curEv>0 && emulabeller.isSelectNeighbour(i,curEv)) {
    //                         prevPerc = (cI.events[curEv-1].time-vP.sS)/(vP.eS-vP.sS);                        
    //                         curcc.fillStyle = "rgba(255, 0, 0, 0.1)";
    //                         curcc.fillRect(curCanWidth*prevPerc+1, 0, curCanWidth*perc-curCanWidth*prevPerc-1, curCanHeight);
    //                         curcc.fillStyle = this.params.waveColor;

    //                     }
    //                     //console.log(cI.TierName+":"+vP.curMouseTierName);
    //                     // mark boundary closest to mouse red (only checks first element in selBoundries for now)

    //                     if(curEv == vP.selBoundaries[0] && i == vP.selTier ){
    //                         if(vP.segmentsLoaded && emulabeller.internalMode !=  emulabeller.EDITMODE.LABEL_MOVE) {
    //                             if( vP.selectedSegments[i][curEv] != vP.selectedSegments[i][curEv+1]  ) {
    //                                 curcc.fillStyle = "rgba(255, 0, 0, 1)";
    //                                 curcc.fillRect(Math.ceil(curCanWidth*perc)-1, 0, 2, curCanHeight);
    //                                 curcc.fillStyle = this.params.waveColor;
    //                             }
    //                         }
    //                     }
    //                     // draw label 
    //                     if(cI.events[curEv].label != 'H#'){
    //                         tW = curcc.measureText(cI.events[curEv].label).width;
    //                         curcc.strokeText(cI.events[curEv].label, curCanWidth*perc-tW-10, curCanHeight/2);
    //                     }
    //                 }
    //                 if(cI.events[curEv].end > vP.sS && cI.events[curEv].end < vP.eS){
    //                     perc = (cI.events[curEv].end-vP.sS)/(vP.eS-vP.sS);
    //                     curcc.fillRect(curCanWidth*perc, 0, 1, curCanHeight);
    //                 }
    //             }

    //         }else if(cI.type =="point"){
    //             curcc.fillStyle = this.params.waveColor;
    //             for (curEv = 0; curEv < cI.events.length; curEv++) {
    //                 if(cI.events[curEv].time > vP.sS && cI.events[curEv].time < vP.eS){
    //                      // mark boundary closest to mouse red (only checks first element in selBoundries for now)
    //                     if(curEv == vP.selBoundaries[0] && cI.TierName == vP.curMouseTierID){
    //                         curcc.fillStyle = "red";
    //                     }else{
    //                         curcc.fillStyle = this.params.waveColor;
    //                     }
    //                     perc = (cI.events[curEv].time-vP.sS)/(vP.eS-vP.sS);
    //                     curcc.fillRect(curCanWidth*perc, 0, 1, curCanHeight/2-curCanHeight/10);

    //                     tW = curcc.measureText(cI.events[curEv].label).width;
    //                     curcc.strokeText(cI.events[curEv].label, curCanWidth*perc-tW/2+1, curCanHeight/2);

    //                     curcc.fillRect(curCanWidth*perc, curCanHeight/2+curCanHeight/10, 1, curCanHeight/2-curCanHeight/10);
    //                 }
    //             }
    //         }

    //     }
    // },

    // drawSSFF: function (ssffInfos, vP){

    //     // if (ssffInfos.data[0].Columns[0].name !="F0") {
    //     //     alert("not F0 column->not supported");
    //     // }

    //     var curContext = ssffInfos.canvases[0].getContext("2d");

    //     if(!ssffInfos.data[0].maxF0){
    //         // this.toRetinaRatio(ssffInfos.canvases[0], curContext);
    //         console.log("calculating max f0");
    //         ssffInfos.data[0].maxF0 = -Infinity;
    //         for (var i = 0; i < ssffInfos.data[0].Columns[0].values.length; i++) {
    //             // console.log(ssffInfos.data[0].Columns[0].values[i][0]);
    //             // f0array.push(ssffInfos.data[0].Columns[0].values[i][0]);

    //             if(ssffInfos.data[0].Columns[0].values[i][0] > ssffInfos.data[0].maxF0){
    //                 ssffInfos.data[0].maxF0 = ssffInfos.data[0].Columns[0].values[i][0];
    //             }
    //         }
    //     }

    //     var origFreq = 1/ssffInfos.data[0].Record_Freq; //time between samples not hz

    //     var start_time = ssffInfos.data[0].Start_Time;
    //     var maxF0 = ssffInfos.data[0].maxF0;
    //     // maxF0 = 300;

    //     var h = ssffInfos.canvases[0].clientHeight;
    //     var w = ssffInfos.canvases[0].clientWidth;

    //     // console.log(w);
    //     curContext.clearRect(0, 0, w, h);

    //     // samples per pixel has to be greater than 1 (for now...)
    //     var ratio1 = (vP.eS-vP.sS)/this.osciWidth;

    //     // start_time + (? * origFreq);
    //     var f0sS = Math.floor((vP.sS/44100)/origFreq)+1; //SIC SIC SIC check Sample + one to avoid drawing problems... bä

    //     var f0eS = Math.ceil((vP.eS/44100)/origFreq); // SIC check Sample

    //     var zoomRatio = (f0eS-f0sS)/this.osciWidth; // SIC not osci width

    //     curContext.strokeStyle = this.params.waveColor;
    //     curContext.font="12px Verdana";
    //     curContext.strokeText(ssffInfos.data[0].Columns[0].name, 5, 5+8);

    //     curContext.strokeStyle = "rgba(0,0,255,0.5)";
    //     curContext.fillStyle = "rgba(0,0,255,0.5)";
    //     // console.log(i/f0sS);
    //     for (var i = 1; i < f0eS-f0sS; i++) {
    //         curContext.beginPath();
    //         curContext.moveTo((i-1)/zoomRatio, h-ssffInfos.data[0].Columns[0].values[f0sS+i-1][0]/maxF0*h);
    //         curContext.lineTo(i/zoomRatio, h-ssffInfos.data[0].Columns[0].values[f0sS+i][0]/maxF0*h);
    //         curContext.stroke();
    //         //draw a circle
    //         curContext.beginPath();
    //         curContext.arc(i/zoomRatio, h-ssffInfos.data[0].Columns[0].values[f0sS+i][0]/maxF0*h, 1, 0, Math.PI*2, true);
    //         curContext.closePath();
    //         curContext.fill();
    //     }
    // }
};