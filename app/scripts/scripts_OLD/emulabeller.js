/**
 * Main Object of emuLVC
 * it acts as the controller of the web app
 * and primarily delegates methods to the drawer/audio-backend and
 * several other components
 */
var EmuLabeller = {

    /**
     * init function has to be called on object
     * to instantiate all its needed objects
     * @param params is an object containing multiple
     * init vars (see main.js for details)
     */
    init: function(params) {
        'use strict';
        var my = this;

        // define external Application mode Server or Standalone
        my.USAGEMODE = {

            // show server menu, load external ressources
            SERVER: {
                value: 0,
                name: "Server"
            },

            // show file menu, load local ressources
            STANDALONE: {
                value: 1,
                name: "Standalone"
            },

            // alert an error if not configures in main.js
            NOT_CONFIGURED: {
                value: 2,
                name: "NotConfigured"
            }
        };
        
        
        // define internal File State Modes that may not interfere
        my.FILESTATE = {

            // nothing is loaded
            CLEAN: {
                value: 0,
                name: "Clean"
            },

            // Wave File is loaded and Basename is set
            BASENAME: {
                value: 1,
                name: "Basename"
            },

            // Tiers are loaded
            TIERS: {
                value: 2,
                name: "Tiers"
            }
        };

        // define internal Applications Modes that may not interfere
        my.EDITMODE = {
            // EDITMODE at the beginning
            STANDARD: {
                value: 0,
                name: "StandardMode"
            }, // standard key bindings form main.js

            // EDITMODE when editing tiers
            LABEL_RENAME: {
                value: 1,
                name: "LabelRenameMode"
            }, // no keybindings exept enter -> save

            // EDITMODE when editing tiers
            TIER_RENAME: {
                value: 2,
                name: "TierRenameMode"
            }, // no keybindings exept enter -> save

            // EDITMODE when editing tiers
            LABEL_MOVE: {
                value: 3,
                name: "LabelRenameMode"
            },

            // when draging in a tier / multiple tiers
            LABEL_RESIZE: {
                value: 4,
                name: "DragingTierMode"
            },

            // when draging in the timeline (wave & spectro)
            DRAGING_TIMELINE: {
                value: 5,
                name: "DragingTimelineMode"
            },

            // when draging in the minimap
            DRAGING_MINIMAP: {
                value: 6,
                name: "DragingMinimapMode"
            },

            // when draging the timeline resize bar
            DRAGING_BAR: {
                value: 7,
                name: "DragingBarMode"
            },

            // when draging the timeline resize bar
            DRAGING_TIER: {
                value: 8,
                name: "DragingTierMode"
            },

            // when showing modal
            MODAL: {
                value: 9,
                name: "ModalMode"
            }
        };

        // set internal & external Modes

        // internal standard at the beginning
        this.internalMode = my.EDITMODE.STANDARD;
        
        // internal filestate at the beginning
        this.fileState = my.FILESTATE.CLEAN;

        // default is not configured
        this.externalMode = my.USAGEMODE.NOT_CONFIGURED;

        // if parameter in main.js is set to server
        if (params.mode === "server") {
            this.externalMode = my.USAGEMODE.SERVER;
        }

        // if parameter in main.js is set to standalone     
        if (params.mode === "standalone") {
            this.externalMode = my.USAGEMODE.STANDALONE;
        }


        // set main.js parameters
        this.fileSelect = params.fileSelect;
        this.menuLeft = params.menuLeft;
        this.menuMain = params.menuMain;
        this.draggableBar = params.draggableBar;
        this.timeline = params.timeline;
        this.tiers = params.tiers;
        this.showLeftPush = params.showLeftPush;
        this.osciCanvas = params.osciCanvas;
        this.initLoad = params.initLoad;


        // Object Classes
        // Viewport
        this.viewPort = Object.create(EmuLabeller.ViewPort);

        // Backed
        this.backend = Object.create(EmuLabeller.WebAudio);
        this.backend.init(params);

        // Drawer
        this.drawer = Object.create(EmuLabeller.Drawer);
        this.drawer.init(params);


        // Parser
        this.labParser = Object.create(EmuLabeller.LabFileParser);
        // this.tgParser = Object.create(EmuLabeller.TextGridParser);

        // IOhandler
        this.iohandler = Object.create(EmuLabeller.IOhandler);
        this.iohandler.init(44100, this.externalMode);


        // ssff Parser
        this.ssffParser = Object.create(EmuLabeller.SSFFparser);
        this.ssffParser.init();

        // json validator
        this.JSONval = Object.create(EmuLabeller.JSONvalidator);
        this.JSONval.init();

        // json validator
        this.tierHandler = Object.create(EmuLabeller.tierHandler);
        this.tierHandler.init(params);


        // other used variables
        this.subMenuOpen = false;

        this.dragingStart = 0;
        this.resizeTierStart = 0;
        this.relativeY = 0;
        this.newFileType = -1; // 0 = wav, 1 = lab, 2 = F0, 3 = TextGrid
        this.playMode = "vP"; // can be "vP", "sel" or "all"
        this.clickedOn = 0;
        this.selectedSegments = [];
        this.lastX = 0;
        this.dragStart = -1;
        this.curLoadedBaseName = ''; // set to base name of audio file
        this.exportData = null;
        this.oBottom = 0;
        this.oTop = 0;
        this.oTimeline = 0;

        // infos filled by ssff/lab/textgrid parsers
        this.ssffInfos = {
            data: [],
            canvases: []
        };
        // key value list of file names loaded
        this.fileNames = {
            'audioFile': ''
        };
        
        this.german = Object.create(EmuLabeller.German);
        this.english = Object.create(EmuLabeller.English);
        
        if     (params.language=="de") this.language = this.german;
        else if(params.language=="us") this.language = this.english;

        // Initial Usage Mode Configuration

        switch (my.externalMode) {
            case my.USAGEMODE.STANDALONE:
                my.showLeftPush.style.display = "none";
                break;
            case my.USAGEMODE.SERVER:
                my.fileSelect.style.display = "none";
                break;
            default:
                alert(this.language.ALERTS.USAGEMODE.value);
                console.log(this.language.ALERTS.USAGEMODE.value);
                my.fileSelect.style.display = "none";
                my.showLeftPush.style.display = "none";
                break;
        }

        // bind progress callback of audio-backend
        this.backend.bindUpdate(function() {
            if (!my.backend.isPaused()) my.onAudioProcess();
        });

        // All left mouse down Functions  
        document.addEventListener('mousedown', function(e) {

            if (null !== my.getElement(e))
                var cOn = my.getElement(e).id;
            
            if(emulabeller.internalMode != emulabeller.EDITMODE.MODAL)
            switch (cOn) {
                case params.showLeftPush.id:
                    my.openSubmenu();
                    break;

                case "cmd_addTierSeg":
                    my.tierHandler.addTier();
                    break;

                case "cmd_addTierPoint":
                    my.tierHandler.addTier(true);
                    break;

                case "cmd_about":
                    window.scrollTo(0, 0);
                    $("#popup").dialog('option', 'position', ["center",10]);
                    $('#popup').dialog('open');
                    break;

                case "cmd_download":
                    var myName = emulabeller.curLoadedBaseName + ".TextGrid";
                    var myData = emulabeller.iohandler.toTextGrid(emulabeller.tierHandler.getTiers());
                    my.tierHandler.downloadDialog(myName, myData);
                    break;

                case "cmd_doDownload":
                    my.tierHandler.doDownload();
                    break;

                case "cmd_viewZoomAll":
                    my.setView(-Infinity, Infinity);
                    break;

                case "cmd_viewZoomIn":
                    my.zoomViewPort(1);
                    break;

                case "cmd_viewZoomOut":
                    my.zoomViewPort(0);
                    break;

                case "cmd_viewMoveLeft":
                    my.shiftViewP(0);
                    break;

                case "cmd_viewMoveRight":
                    my.shiftViewP(1);
                    break;

                case "cmd_viewZoomSelect":
                    my.zoomSel();
                    break;

                case "cmd_playPause":
                    my.playPauseInView();
                    break;

                case "cmd_playSelected":
                    my.playInMode('sel');
                    break;

                case "cmd_playAll":
                    my.playInMode('all');
                    break;

                case "cmd_changeLabel":
                    my.editLabel();
                    break;

                case "cmd_dropBoxOpen":
                    my.iohandler.dropBoxOpen();
                    break;

                case "cmd_renameTierPoint":
                    emulabeller.tierHandler.removeLabelDoubleClick();
                    if(emulabeller.viewPort.getSelectTier()!="")
                        emulabeller.tierHandler.renameTierDialog(emulabeller.viewPort.getSelectTier(), emulabeller.viewPort.getSelectTier());
                    else
                        emulabeller.alertUser(emulabeller.language.ALERTS.SELECT_TIER_FIRST.title,emulabeller.language.ALERTS.SELECT_TIER_FIRST.value);   
                    break;

                case "cmd_resizeWave":
                    emulabeller.tierHandler.resizeSpectroWave(true);
                    break;

                case "cmd_resizeSpectro":
        			emulabeller.tierHandler.resizeSpectroWave(false);
                    break;

                case "cmd_disconnect":
                    my.iohandler.disconnect();
                    break;

                case "cmd_specSettings":
                    window.scrollTo(0, 0);
                    $("#specDialog").dialog('option', 'position', ["center",10]);
                    $('#specDialog').dialog('open');
                    break;

                case params.scrollCanvas.id:
                    emulabeller.internalMode = emulabeller.EDITMODE.DRAGING_MINIMAP;
                    emulabeller.tierHandler.removeLabelDoubleClick();
                    var bL = my.backend.currentBuffer.length;
                    var posInB = my.getX(e) * bL;
                    var len = (my.viewPort.eS - my.viewPort.sS);
                    my.setView(posInB - len / 2, posInB + len / 2);
                    break;

                case params.osciCanvas.id:
                case params.specCanvas.id:
                    emulabeller.internalMode = emulabeller.EDITMODE.DRAGING_TIMELINE;
                    emulabeller.tierHandler.removeLabelDoubleClick();
                    my.dragStart = Math.round(my.viewPort.sS + (my.viewPort.eS - my.viewPort.sS) * my.getX(e));
                    my.viewPort.selectS = my.dragStart;
                    my.viewPort.selectE = my.dragStart;
                    $("*").css("cursor", "ew-resize");
                    e.preventDefault();
                    my.drawer.uiDrawUpdate();
                    break;

                case params.draggableBar.id:
                    emulabeller.internalMode = emulabeller.EDITMODE.DRAGING_BAR;
                    emulabeller.tierHandler.removeLabelDoubleClick();
                    $("*").css("cursor", "s-resize");
                    break;


                default:
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                    break;
            }
        });

        // All mouse up Functions  
        document.addEventListener('mouseup', function(e) {
            if (emulabeller.internalMode == emulabeller.EDITMODE.DRAGING_TIMELINE) {
                my.dragStart = -1;
                my.drawer.uiDrawUpdate();
            } else if (emulabeller.internalMode == emulabeller.EDITMODE.DRAGING_BAR) {
                my.dragingStartY = event.clientY;
                my.offsetTimeline = my.timeline.offsetHeight;
                my.offsetTiers = my.tiers.offsetHeight;
            } else if (emulabeller.internalMode == emulabeller.EDITMODE.DRAGING_MINIMAP) {
                var bL = my.backend.currentBuffer.length;
                var posInB = my.getX(e) * bL;
                var len = (my.viewPort.eS - my.viewPort.sS);
                my.setView(posInB - len / 2, posInB + len / 2);
            }
            if(!emulabeller.inEditingMode()) {
               emulabeller.internalMode = emulabeller.EDITMODE.STANDARD;
               $("*").css("cursor", "auto");
            }            
        });

        // All mouse move Functions  
        document.addEventListener('mousemove', function(e) {
            if (e.which == 1) { // if left mouse button is pressed
                if (my.internalMode == my.EDITMODE.DRAGING_TIMELINE) {
                    var newSamp = Math.round(my.viewPort.sS + (my.viewPort.eS - my.viewPort.sS) * my.getX(e));
                    if (newSamp >= my.dragStart) {
                        my.viewPort.selectE = newSamp;
                        my.viewPort.selectS = my.dragStart;

                    } else {
                        my.viewPort.selectS = newSamp;
                        my.viewPort.selectE = my.dragStart;

                    }
                    my.drawer.uiDrawUpdate();
                }
                if (my.internalMode == my.EDITMODE.DRAGING_MINIMAP) {
                    var bL = my.backend.currentBuffer.length;
                    var posInB = my.getX(e) * bL;
                    var len = (my.viewPort.eS - my.viewPort.sS);
                    my.setView(posInB - len / 2, posInB + len / 2);
                    my.drawer.uiDrawUpdate();
                }
                if (my.internalMode == my.EDITMODE.DRAGING_BAR) {
                    var offset = $("#menu-bottom").offset(); 
                    var height = $("#menu-bottom").height();
                    console.log(offset.top-height );
                    if (event.clientY <= offset.top-height){
                        $("*").css("cursor", "s-resize");
                        $('#wave').css("height",event.clientY/2 + "px");
                        $('#spectrogram').css("height", event.clientY/2+ "px");
                        $('#timeline').css("height", 10 + $('#wave').height() + $('#spectrogram').height() + "px");
                        $('#spacer').height(($('#timeline').height() + 64) + "px");
                    }
                    
                    //my.dragingStartY = event.clientY;
                }
            } else {
                my.lastX = my.getX(e);
                if(!emulabeller.inEditingMode()) {
                    emulabeller.internalMode = emulabeller.EDITMODE.STANDARD;
                    $("*").css("cursor", "auto");
                } 
            }
        });

        // All Right Mouse Button Functions  
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        $(window).resize(function() {
            my.tierHandler.removeLabelDoubleClick();
        });

        $("#popup").dialog({
            bgiframe: true,
            draggable: false,
            resizable: false,
            modal: true,
            autoOpen: false,
            width: 500,
            height: 500,
            show: {
                effect: "fade",
                duration: 175
            },
            hide: {
                effect: "fade",
                duration: 175
            },
            position: ['center', 10],
            open: function(event, ui) {
                emulabeller.internalMode = emulabeller.EDITMODE.MODAL;
                window.onscroll = function() {
                    window.scrollTo(0, 0);
                };
            },
            beforeClose: function(event, ui) {
                emulabeller.internalMode = emulabeller.EDITMODE.STANDARD;
                window.onscroll = function() {};
            }
        });

        $("#alertDialog").dialog({
            bgiframe: true,
            modal: true,
            autoOpen: false,
            draggable: false,
            resizable: false,
            width: 500,
            height: "auto",
            show: {
                effect: "fade",
                duration: 175
            },
            hide: {
                effect: "fade",
                duration: 175
            },
            position: ['center', 10],
			buttons: {
				"OK": function() {
					$(this).dialog('close');
				}
			},            
            open: function(event, ui) {
                emulabeller.internalMode = emulabeller.EDITMODE.MODAL;
                window.onscroll = function() {
                    window.scrollTo(0, 0);
                };
            },
            beforeClose: function(event, ui) {
                emulabeller.internalMode = emulabeller.EDITMODE.STANDARD;
                window.onscroll = function() {};
            }
        });        
        $("#popup").dialog('option', 'position', ["center", 10]);
        
        this.dpr = 1;
        if(window.devicePixelRatio !== undefined) this.dpr = window.devicePixelRatio;
        document.getElementById("wave").width = 2048 * this.dpr;
        document.getElementById("wave").height = 224 * this.dpr;
        document.getElementById("spectrogram").width = 1024 * this.dpr;
        document.getElementById("spectrogram").height = 128 * this.dpr;
        $('#wave').css("height", "80px");
        $('#spectrogram').css("height", "80px");
        

        
        $('#cans').sortable({
            tolerance: 'pointer',
            cursor: 'move',
            delay: 5,
            dropOnEmpty: true,
            //connectWith: '.myTest',
            start: function(event, ui) {
                my.internalMode = my.EDITMODE.DRAGING_TIER;
                my.tierHandler.removeLabelDoubleClick();
            },
            stop: function(event, ui) {
                my.internalMode = my.EDITMODE.STANDARD;
            }
        });
        $("#cans").disableSelection();
        
        // Set Language on MAIN Menu
        $('#fileSelect').text(my.language.MENU.FILE_OPEN.title);
        $('#fileSelect').attr("data-tooltip" ,my.language.MENU.FILE_OPEN.value);
        $('#serverSelect').text(my.language.MENU.SERVER_OPEN.title);
        $('#serverSelect').attr("data-tooltip" ,my.language.MENU.SERVER_OPEN.value);
        $('#cmd_addTierSeg').text(my.language.MENU.ADD_TIER_SEG.title);
        $('#cmd_addTierSeg').attr("data-tooltip" ,my.language.MENU.ADD_TIER_SEG.value);
        $('#cmd_addTierPoint').text(my.language.MENU.ADD_TIER_POINT.title);
        $('#cmd_addTierPoint').attr("data-tooltip" ,my.language.MENU.ADD_TIER_POINT.value);
        $('#cmd_renameTierPoint').text(my.language.MENU.RENAME_TIER.title);
        $('#cmd_renameTierPoint').attr("data-tooltip" ,my.language.MENU.RENAME_TIER.value);
        $('#cmd_download').text(my.language.MENU.DOWNLOAD_TEXTGRID.title);
        $('#cmd_download').attr("data-tooltip" ,my.language.MENU.DOWNLOAD_TEXTGRID.value);
        $('#cmd_specSettings').text(my.language.MENU.SPECTROGRAM_SETTINGS.title);
        $('#cmd_specSettings').attr("data-tooltip" ,my.language.MENU.SPECTROGRAM_SETTINGS.value);
        
        // Set Language on SUB Menu
        $('#cmd_viewZoomAll').text(my.language.SUBMENU.ZOOM_ALL.title);
        $('#cmd_viewZoomAll').attr("data-tooltip" ,my.language.SUBMENU.ZOOM_ALL.value);
        $('#cmd_viewZoomIn').text(my.language.SUBMENU.ZOOM_IN.title);
        $('#cmd_viewZoomIn').attr("data-tooltip" ,my.language.SUBMENU.ZOOM_IN.value);
        $('#cmd_viewZoomOut').text(my.language.SUBMENU.ZOOM_OUT.title);
        $('#cmd_viewZoomOut').attr("data-tooltip" ,my.language.SUBMENU.ZOOM_OUT.value);
        $('#cmd_viewMoveLeft').text(my.language.SUBMENU.LEFT.title);
        $('#cmd_viewMoveLeft').attr("data-tooltip" ,my.language.SUBMENU.LEFT.value);
        $('#cmd_viewMoveRight').text(my.language.SUBMENU.RIGHT.title);
        $('#cmd_viewMoveRight').attr("data-tooltip" ,my.language.SUBMENU.RIGHT.value);
        $('#cmd_viewZoomSelect').text(my.language.SUBMENU.SELECTED.title);
        $('#cmd_viewZoomSelect').attr("data-tooltip" ,my.language.SUBMENU.SELECTED.value);
        $('#cmd_playPause').text(my.language.SUBMENU.PLAY_VIEW.title);
        $('#cmd_playPause').attr("data-tooltip" ,my.language.SUBMENU.PLAY_SELECTED.value);
        $('#cmd_playSelected').text(my.language.SUBMENU.PLAY_VIEW.title);
        $('#cmd_playSelected').attr("data-tooltip" ,my.language.SUBMENU.PLAY_ENTIRE.value);
        $('#cmd_playAll').text(my.language.SUBMENU.PLAY_VIEW.title);
        $('#cmd_playAll').attr("data-tooltip" ,my.language.SUBMENU.PLAY_ENTIRE.value);
        
        

    },


    /**
     *
     */
    alertUser: function(title,msg) {
        window.scrollTo(0, 0);
        $("#alertDialog").dialog('option', 'position', ["center",10]);
		$("#alertDialog").dialog('option', 'title', title);
		$('#alertContent').html(msg);        
        $('#alertDialog').dialog('open');
    },

    /**
     *
     */
    confirmUser: function(title,msg,onSuccessFunction, functionArg) {
        window.scrollTo(0, 0);
        $("#confirmDialog").dialog({
            bgiframe: true,
            modal: true,
            autoOpen: false,
            width: 500,
            height: "auto",
            show: {
                effect: "fade",
                duration: 175
            },
            hide: {
                effect: "fade",
                duration: 175
            },
            position: 'center',
			buttons: {
				"OK": function() {
				    onSuccessFunction(functionArg);
					$(this).dialog('close');
				},
				"Cancel": function() {
					$(this).dialog('close');
				}
			},            
            open: function(event, ui) {
                emulabeller.internalMode = emulabeller.EDITMODE.MODAL;
                window.onscroll = function() {
                    window.scrollTo(0, 0);
                };
            },
            beforeClose: function(event, ui) {
                emulabeller.internalMode = emulabeller.EDITMODE.STANDARD;
                window.onscroll = function() {};
            }
        }); 
        $("#confirmDialog").dialog('option', 'position', ["center",10]);
		$("#confirmDialog").dialog('option', 'title', title);
		$('#confirmContent').html(msg);            		    
        $('#confirmDialog').dialog('open');
    },

    /**
     *
     */
    start: function() {
        var my = this;
        switch (my.externalMode) {
            case my.USAGEMODE.STANDALONE:
                // 
                break;
            case my.USAGEMODE.SERVER:

                this.iohandler.onConnected(function(evt) {
                    my.connected(evt);
                });
                this.iohandler.onUtteranceList(function(utteranceList) {
                    my.availableUtterances(utteranceList);
                });

                this.iohandler.start();
                break;
            default:
                break;
        }

    },

    /**
     *
     */
    connected: function(evt) {
        //this.hideModalDialog();
        console.log("Connected to emuSX");
    },
    

    /**
     * Called on receive of utterance list from emuSX server
     */
    availableUtterances: function(ul) {
        var my = this;
        if (ul.length == 1) {
            // one selected utterance
            // open directly
            var utt = ul[0];
            var uttCode = utt.code;
            console.log("Request utterance ", uttCode, " from emuSX server");
            this.iohandler.websocketLoad(uttCode);
        } else {
            // list utterances in sub menu
            var CMD_PREFIX = 'cmd_load_utterance_';
            var le = $('#utteranceList');
            var ulHtml = '';
            for (var i = 0; i < ul.length; i++) {
                var u = ul[i];
                var uttCode = u['code'];
                ulHtml = ulHtml + "<a id=\"" + CMD_PREFIX + uttCode + "\" href=\"#\">" + uttCode + "</a>";
                // if wrapped with <li> elements the items do not show. check the CSS.
                //ulHtml=ulHtml + "<li>"+u.code+"</li>";
            }
            // and add event listeners respectively
            le.html(ulHtml);
            for (var i = 0; i < ul.length; i++) {
                var u = ul[i];
                var uttCode = u['code'];
                $('#' + CMD_PREFIX + uttCode).click(uttCode, function(evt) {
                    var trgEl = evt.target;
                    var trgId = trgEl.id;

                    my.iohandler.websocketLoad(evt.data);
                    my.openSubmenu();
                });
            }

            console.log('Update of available utterances');
            this.openSubmenu();
        }
    },

    /**
     * delegates draw buffer event
     * to drawer objects
     *
     * @param isNewlyLoaded bool to say if first time
     * buffer is displayed (see newlyLoadedBufferReady)
     */
    drawBuffer: function() {
        this.drawer.uiDrawUpdate();
    },


    /**
     * callback for audio-backend
     * it is used to delegate an update event
     * to the drawer objects
     */
    onAudioProcess: function() {
        var my = this;

        var percRel = 0;
        var percPlayed = this.backend.getPlayedPercents();
        this.viewPort.curCursorPosInPercent = percPlayed;

        if (this.playMode == "sel") {
            percRel = this.viewPort.selectE / this.backend.currentBuffer.length;
        }
        if (this.playMode == "vP") {
            if (this.backend.currentBuffer) {
                percRel = this.viewPort.eS / this.backend.currentBuffer.length;
            }
        }
        if (this.playMode == "all") {
            percRel = 1.0;
        }

        if (!this.backend.isPaused()) {
            my.drawer.uiDrawUpdate();
        }
        if (percPlayed > percRel) {
            my.drawer.uiDrawUpdate();
            this.pause();
        }
    },

    /**
     * play audio in certain EDITMODE
     * playMode can be vP, sel, all
     */
    playInMode: function(playMode) {
        var percS, percE;

        if (playMode == "vP" || playMode === null) {
            this.playMode = "vP";
            percS = this.viewPort.sS / this.backend.currentBuffer.length;
            percE = this.viewPort.eS / this.backend.currentBuffer.length;
            this.backend.play(this.backend.getDuration() * percS, this.backend.getDuration() * percE);
        }
        if (playMode == "sel" || playMode === null) {
            this.playMode = "sel";
            percS = this.viewPort.selectS / this.backend.currentBuffer.length;
            percE = this.viewPort.selectE / this.backend.currentBuffer.length;
            this.backend.play(this.backend.getDuration() * percS, this.backend.getDuration() * percE);

        }
        if (playMode == "all" || playMode === null) {
            this.playMode = "all";
            this.backend.play(0, this.backend.getDuration());

        }
    },

    /**
     * delegate pause to backend
     */
    pause: function() {
        this.backend.pause();
    },

    /**
     * toggles play in view mode
     * is called by play in view button
     * binding (default = space)
     */
    playPauseInView: function() {
        if (this.backend.paused) {
            this.playInMode("vP");
        } else {
            this.pause();
        }
    },


    /**
     * method called after backend
     * has loaded+decoded audio file
     * that was loaded via fileAPI/websocket/xhr
     */
    newlyLoadedBufferReady: function() {

        if (this.initLoad) {
            this.initLoad = false;
        }
        this.viewPort.init(0, this.backend.currentBuffer.length - 1, this.backend.currentBuffer.length,this.backend.currentBuffer.sampleRate);
        // this.viewPort.init(10365, 18660, this.backend.currentBuffer.length); // for development

        this.drawer.uiWaveDrawUpdate();
        this.drawer.uiSpectroDrawUpdate();
        this.drawer.uiMiniMapDraw();
        this.drawer.uiAllTierDrawUpdate();

        // emulabeller.iohandler.toTextGrid(emulabeller.tierHandler.getTiers()); // for testing toTextGrid
        // emulabeller.iohandler.toESPS(emulabeller.tierHandler.getTiers()["Phonetic"]); // for testing toESPS
    },


    /**
     * set view port to start and end sample
     * (with several out-of-bounds like checks)
     *
     * @param sSample start sample of view
     * @param sSample end sample of view
     */
    setView: function(sSample, eSample) {

        var oldStart = this.viewPort.sS;
        var oldEnd = this.viewPort.eS;
        if (sSample !== undefined) {
            this.viewPort.sS = Math.round(sSample);
        }
        if (eSample !== undefined) {
            this.viewPort.eS = Math.round(eSample);
        }

        // check if moving left or right is not out of bounds -> prevent zooming on edge when moving left/right
        if (oldStart > this.viewPort.sS && oldEnd > this.viewPort.eS) {
            //moved left
            if (this.viewPort.sS < 0) {
                this.viewPort.sS = 0;
                this.viewPort.eS = oldEnd + Math.abs(this.viewPort.sS);
            }
        }
        if (oldStart < this.viewPort.sS && oldEnd < this.viewPort.eS) {
            //moved right
            if (this.viewPort.eS > this.backend.currentBuffer.length - 1) {
                this.viewPort.sS = oldStart;
                this.viewPort.eS = this.backend.currentBuffer.length - 1;
            }
        }

        // check if viewPort in range
        if (this.viewPort.sS < 0) {
            this.viewPort.sS = 0;
        }
        if (this.viewPort.eS > this.backend.currentBuffer.length - 1) {
            this.viewPort.eS = this.backend.currentBuffer.length - 1;
        }
        if (this.viewPort.eS - this.viewPort.sS < 4) {
            this.viewPort.sS = oldStart;
            this.viewPort.eS = oldEnd;
        }
        this.drawBuffer();
    },

    /**
     * set view port to start and end sample
     * (with several out-of-bounds like checks)
     *
     * @param zoomIn bool to specify zooming direction
     * if set to true -> zoom in
     * if set to false -> zoom out
     */
    zoomViewPort: function(zoomIn) {

        this.tierHandler.removeLabelDoubleClick();
        var newStartS, newEndS;
        var d1 = this.viewPort.curMouseMoveSegmentStart - this.viewPort.sS;
        var d2 = this.viewPort.eS - this.viewPort.curMouseMoveSegmentStart;
        var d = this.viewPort.eS - this.viewPort.sS;

        if (zoomIn) {
            if (this.viewPort.curMouseMoveSegmentStart) { //check if in view
                newStartS = this.viewPort.sS + d1 * 0.5;
                newEndS = this.viewPort.eS - d2 * 0.5;
            } else {
                newStartS = this.viewPort.sS + ~~(d / 4);
                newEndS = this.viewPort.eS - ~~(d / 4);
            }
        } else {
            if (this.viewPort.curMouseMoveSegmentStart) { //check if in view
                newStartS = this.viewPort.sS - d1 * 0.5;
                newEndS = this.viewPort.eS + d2 * 0.5;
            } else {
                newStartS = this.viewPort.sS - ~~(d / 4);
                newEndS = this.viewPort.eS + ~~(d / 4);
            }
        }
        this.setView(newStartS, newEndS);
    },

    /**
     * moves view port to the right or to the left
     * without changing the zoom
     *
     * @param shiftRight bool to specify direction
     * if set to true -> shift right
     * if set to falce -> shift left
     */
    shiftViewP: function(shiftRight) {
        // my.removeLabelDoubleClick();
        var newStartS, newEndS;
        if (shiftRight) {
            newStartS = this.viewPort.sS + ~~((this.viewPort.eS - this.viewPort.sS) / 4);
            newEndS = this.viewPort.eS + ~~((this.viewPort.eS - this.viewPort.sS) / 4);
        } else {
            newStartS = this.viewPort.sS - ~~((this.viewPort.eS - this.viewPort.sS) / 4);
            newEndS = this.viewPort.eS - ~~((this.viewPort.eS - this.viewPort.sS) / 4);
        }

        this.setView(newStartS, newEndS);
    },

    /**
     * zoom into selected part of signal
     */
    zoomSel: function() {
        this.setView(this.viewPort.selectS, this.viewPort.selectE);
    },

    /**
     * get x position in according element
     * that creates the event
     *
     * @param e is event that initiated the get
     * @return x position in element
     */
    getX: function(e) {
        var relX = e.offsetX;
        if (null === relX) {
            relX = e.layerX;
        }
        return relX / e.srcElement.clientWidth;
    },

    /**
     * get y position in according element
     * that creates the event
     *
     * @param e is event that initiated the get
     * @return y position in element
     */
    getY: function(e) {
        var relY = e.offsetY;
        if (null === relY) {
            relX = e.layerY;
        }
        return relY / e.srcElement.clientHeight;
    },

    /**
     * get tier ID of the according (tier) element
     * that created the event
     *
     * @param e is event that initiated the get
     * @return tier ID
     */
    getTierID: function(e) {
        return document.getElementById(e.srcElement.id).getAttribute("tier-id");
    },

    /**
     * get tier name of the according (tier) element
     * that created the event
     *
     * @param e is event that initiated the get
     * @return tier name
     */
    getTierName: function(e) {
        return e.srcElement.id;
    },

    /**
     * get element of the according element
     * that created the event
     *
     * @param e is event that initiated the get
     * @return element
     */
    getElement: function(e) {
        return document.getElementById(e.srcElement.id);
    },

    /**
     */
    keyBindingAllowed: function(c) {

        if(c==9 || c==13) { //special case for tab(9) / enter(13) in modal mode
            return true;
        }
        if (emulabeller.inEditingMode()) {
                return false;
        }
        return true;
    },
    
    /**
     * checks if Application is in editing mode (modal/label_rename/tier_rename)
     * emulabeller.inEditingMode()
     *
     * @return true if in editing mode
     * 
     */    
    inEditingMode: function() {
        if (emulabeller.internalMode == emulabeller.EDITMODE.TIER_RENAME  ||
            emulabeller.internalMode == emulabeller.EDITMODE.LABEL_RENAME ||
            emulabeller.internalMode == emulabeller.EDITMODE.MODAL) {
                return true;
        }
        return false;
    },

    /**
     * delegates the parsing of different file types
     * after they have been loaded
     *
     * @param readerRes ArrayBuffer containing the base64 encoded
     * loaded file from fileAPI/websocket/xhr load
     */
    parseNewFile: function(readerRes) {
        var my = this;
        var ft = emulabeller.newFileType;
        console.log(my.fileState);
        if (ft === 0) {
            if(my.fileState.value > my.FILESTATE.CLEAN.value) 
                emulabeller.confirmUser(emulabeller.language.ALERTS.NEW_BASENAME.title,emulabeller.language.ALERTS.NEW_BASENAME.value, my.parseNewFileConfirm, readerRes);
            else 
                my.parseNewFileConfirm(readerRes);
                
        } else if (ft == 1) {
            if(my.fileState == my.FILESTATE.CLEAN) {
                emulabeller.alertUser(emulabeller.language.ALERTS.SET_BASENAME.title,emulabeller.language.ALERTS.SET_BASENAME.value);
            }
            else {        
                my.fileState = my.FILESTATE.TIERS;
                var newTiers = emulabeller.labParser.parseFile(readerRes, emulabeller.tierHandler.getLength());
                this.tierHandler.addLoadedTiers(newTiers[0]);
            }
        } else if (ft == 2) {
            if(my.fileState == my.FILESTATE.CLEAN) {
                emulabeller.alertUser(emulabeller.language.ALERTS.SET_BASENAME.title,emulabeller.language.ALERTS.SET_BASENAME.value);
            }
            else {        
                var sCanName = "F0";
                my.fileState = my.FILESTATE.TIERS;
                my.tierHandler.addTiertoHtml(sCanName, "-1", "tierSettings", "#signalcans");
                var ssffData = emulabeller.ssffParser.parseSSFF(readerRes);
                emulabeller.ssffInfos.data.push(ssffData);
                emulabeller.ssffInfos.canvases.push($("#" + sCanName)[0]);
            }
        } else if (ft == 3) {
            if(my.fileState == my.FILESTATE.CLEAN) {
                emulabeller.alertUser(emulabeller.language.ALERTS.SET_BASENAME.title,emulabeller.language.ALERTS.SET_BASENAME.value);
            }
            else {
                my.fileState = my.FILESTATE.TIERS;
                var parserRes = emulabeller.iohandler.parseTextGrid(readerRes);
                this.tierHandler.addLoadedTiers(parserRes);
            } 
        }
    },
    
    parseNewFileConfirm: function(readerRes) {
        var my = emulabeller;
        my.fileState = my.FILESTATE.BASENAME;
        my.backend.loadData(
            readerRes,
            my.newlyLoadedBufferReady.bind(my)
        );
    },


    /**
     * called from hidden input type="file" element
     * to handle the file once loaded (normal callback mech.)
     * and set the according current newFileType param of this class
     * (that i still find a bit strange... )
     *
     * @param event of input element
     */
    fileAPIread: function(evt) {
        var my = this;

        var file = evt.target.files[0];

        // Create a new FileReader Object
        var reader = new FileReader();
        // Set an onload handler because we load files into it asynchronously
        reader.onload = function(e) {
            // The response contains the Data-Uri, which we can then load into the canvas
            emulabeller.parseNewFile(reader.result);
        };

        if (file.type.match('audio.*')) {
            console.log("is audio");
            emulabeller.newFileType = 0;
            reader.readAsArrayBuffer(file);
            // } else if (file.name.match(".*lab") || file.name.match(".*tone")) {
            //     console.log("is lab file");
            //     emulabeller.newFileType = 1;
            //     reader.readAsText(file);
            // } else if (file.name.match(".*f0") || file.name.match(".*fms")) {
            //     console.log("is f0");
            //     emulabeller.newFileType = 2;
            //     reader.readAsArrayBuffer(file);
        } else if (file.name.match(".*TextGrid")) {
            console.log("is TextGrid");
            emulabeller.newFileType = 3;
            reader.readAsText(file);
        } else {
            emulabeller.alertUser(emulabeller.language.ALERTS.FILE_READ_ERROR.title,emulabeller.language.ALERTS.FILE_READ_ERROR.value);
        }
    },

    /**
     * opens list of utterances on left side of window
     * (done via css)
     */
    openSubmenu: function() {
        if (this.subMenuOpen) {
            this.subMenuOpen = false;
            $("#serverSelect").html("Open Menu");
            $("#menuLeft").removeClass("cbp-spmenu-open");
            $("#timeline").css("left","0px");
            $("#tierPush").css("left","0px");
            //$("#tierPush").removeClass("cbp-spmenu-push-toright");
            //$("#menu-bottom").removeClass("cbp-spmenu-push-toright");
        } else {
            this.subMenuOpen = true;
            $("#serverSelect").html("Close Menu");
            $("#menuLeft").addClass("cbp-spmenu-open");
            $("#timeline").css("left","240px");
            $("#tierPush").css("left","240px");
        
            //$("#menu-bottom").addClass("cbp-spmenu-push-toright");
        }
    },

    /**
     */
    countSelected: function(row) {
        var count = 0;
        if (this.viewPort.length === 0) return 0;
        if (this.viewPort.selectedSegments.length === 0) return 0;
        if (null === row) {
            row = 0;
            $.each(this.viewPort.selectedSegments, function() {
                ++row;
                $.each(this.viewPort.selectedSegments[row], function() {
                    ++count;
                });
            });
        } else {
            if (this.viewPort.selectedSegments.length === 0) return 0;
            if (this.viewPort.selectedSegments[row].length === 0) return 0;
            $.each(this.viewPort.selectedSegments[row], function() {
                ++count;
            });
        }
        return count;
    },

    /**
     */
    getSelectedSegmentDoubleClick: function(row) {
        return this.viewPort.selectedSegments[row].indexOf(true);
    },

    /**
     */
    sendTierinfosToServer: function() {
        var sT = this.tierHandler.tierInfos.tiers[this.viewPort.selTier];
        var data = {
            'bob': 'foo',
            'paul': 'dog'
        };
        $.ajax({
            url: "http://127.0.0.1:8001/",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(sT),
            dataType: 'json'
        });
    },

    /**
     * delegation method to validate tier infos (broken due to changes)
     */
    validateTierInfos: function() {
        this.JSONval.validateTierInfos(this.tierHandler.tierInfos);
    },

    /**
     * generates dataURI to download the current
     * tierInfos as a TextGrid formated text file. This dataURI
     * will then be presented as a link in the top menu
     */
    prepDownload: function() {
        try { 
            var blob = new Blob([emulabeller.iohandler.textGridHandler.toTextGrid(emulabeller.tierHandler.tierInfos.tiers)], {
                "type": "text\/plain"
            });
        } catch (e) { // Backwards-compatibility
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            blob.append(emulabeller.iohandler.textGridHandler.toTextGrid(emulabeller.tierHandler.tierInfos.tiers));
            blob = blob.getBlob();
        }
        var textGridName = emulabeller.iohandler.fileNames.label[emulabeller.iohandler.fileNames.label.length - 1];
        $("#saveAsFileName").val(textGridName);
        this.exportData = blob;



        /*
        var MIME_TYPE = 'text/plain';
        //var output = document.querySelector('#downLinkDiv');
        // window.URL = window.webkitURL || window.URL;
        // var prevLink;
        // try {
        //     prevLink = output.querySelector('a');
        // } catch (err) {
        //     console.log("no link");
        // }

        // if (prevLink) {
        //     window.URL.revokeObjectURL(prevLink.href);
        //     output.innerHTML = '';
        // }
        var textGridName = emulabeller.iohandler.fileNames.label[emulabeller.iohandler.fileNames.label.length - 1];

        var bb = new Blob([emulabeller.iohandler.textGridHandler.toTextGrid(emulabeller.tierHandler.tierInfos.tiers)], {
            type: MIME_TYPE
        });
        
        return bb;
       
        console.log(bb);

        var a = document.createElement('a');
        a.download = textGridName;
        a.href = window.URL.createObjectURL(bb);
        a.textContent = 'Download ready';

        // a.dataset.downloadurl = [MIME_TYPE, a.download, a.href].join(':');
        // a.draggable = true; // Don't really need, but good practice.
        // a.classList.add('dragout');

        // output.innerHTML = '';
        output.appendChild(a);

        a.onclick = function(e) {
            //     if ('disabled' in this.dataset) {
            //         return false;
            //     }
            a.textContent = 'Downloaded';
            // a.dataset.disabled = true;
            // cleanUp(this);
        };*/
    },



    /**
    * use socketIOhandler to request something from server
    *
    * @param message sting containing request statement from
    server "getUtts" and "stopServer" work for now
    */
    requestFromServer: function(message) {

        console.log("sending message: ", message);
        this.socketIOhandler.doSend(message);

        if (message == "stopServer") {
            window.close();
        }
    }
};