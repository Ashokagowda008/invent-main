sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/format/DateFormat",
    'sap/m/library',
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, DateFormat, mobileLibrary, MessageBox, MessageToast,Fragment) {
    "use strict";
    var URLHelper = mobileLibrary.URLHelper;
    return Controller.extend("chatuimodule.controller.chatview", {

        onInit: function () {
            // this.welcomePopup()
            let appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            let appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            this.isListOfQns = false;
            this.prepareViewModel();
            var recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-IN';
            this.recognition = recognition;
            this.recordingStarted = false;
           

        },
        onStartRecording: function (oEvent) {
            var final_transcript = '';
            var that = this;
            if (!this.recordingStarted) {
                oEvent.getSource().setBackgroundColor('Accent2');
                oEvent.getSource().addStyleClass('ftrMicButton');
                this.recordingStarted = true;
                this.recognition.start();
                MessageToast.show("Speak Now");
                this.recognition.onerror = function (event) {
                    console.log("error");
                }
                this.recognition.onend = function (event) {
                    // that.onPostMessage("", that.getView().byId("newMessageInput").getValue());
                    that.getView().byId("newMessageInput").setValue("");
                    that.getView().byId("microPhoneId").setBackgroundColor('Accent8');
                    that.getView().byId("microPhoneId").removeStyleClass('ftrMicButton');
                    that.recordingStarted = false;
                    that.recognition.stop();
                    MessageToast.show("Recording stoped");
                }
                this.recognition.onresult = function (event) {
                    var interim_transcript = "";
                    for (var i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final_transcript += event.results[i][0].transcript;
                            that.onPostMessage("", that.getView().byId("newMessageInput").getValue());
                            that.getView().byId("newMessageInput").setValue("");
                            setTimeout(function () {
                                that.getView().byId("microPhoneId").setBackgroundColor('Accent8');
                                that.getView().byId("microPhoneId").removeStyleClass('ftrMicButton');
                                that.recordingStarted = false;
                                that.recognition.stop();
                                MessageToast.show("Recording stoped");
                            }, 3000);
                        } else {
                            interim_transcript = interim_transcript + event.results[i][0].transcript;
                            console.log(event.results[i][0].transcript);
                        }
                    }
                    if (interim_transcript) {
                        that.getView().byId("newMessageInput").setValue(final_transcript + "" + interim_transcript);

                    }
                }
            }
            else {
                that.getView().byId("microPhoneId").setBackgroundColor('Accent8');
                that.getView().byId("microPhoneId").removeStyleClass('ftrMicButton');
                that.recordingStarted = false;
                that.recognition.stop();
                MessageToast.show("Recording stoped");
            }
        },
        onAfterRendering: function () {
            var that = this;
            this.getView().byId("feedList").attachUpdateFinished(function () {
                // if (that.isListOfQns) {
                //     that.isListOfQns = false;
                    that.addEventListenFn();
                // }
            })
            this.getView().byId("insightBtn").addStyleClass('myInsightBtn');
            

            this.getView().byId("newMessageInput").attachBrowserEvent("keyup", function (oEvent) {
                if (oEvent.keyCode === 13) {
                    this.onPostMessage("", oEvent.target.value);
                    this.getView().byId("newMessageInput").setValue("");

                }

            }.bind(this));
             var  oInput = this.getView().byId('newMessageInput');
             if(oInput){
                setTimeout(function(){
                    oInput.focus();
                },0)
             }
            // this.getView().byId('dummyBtnTovideo').firePress()
       },
        ondummyBtnTovideo: function(){
             document.getElementById('myVidclp').play();
        },
       addEventListenFn: function () {
            let self =this;
            var myFeedList = document.querySelectorAll(".myFeedUlist");
            myFeedList.forEach((li) => {
                li.addEventListener("click", (e) => {
                    if (e.target && e.target.matches("li")) {
                        let selectedText = e.target.innerText;
                        // self.getView().byId("newMessageInput").setValue(e.target.innerText);
                        self.onPostMessage("", selectedText)
                    }
                });
            });
        },
        prepareViewModel: function () {
            let mainModelData = {
                EntryCollection: [],
                logopic: this.appModulePath + "/image/Alisha.png",
                userImg: this.appModulePath + "/image/person.png",
                vidClips : this.appModulePath + "/video/VendorInsightsAI.mp4",
            }
            let oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(mainModelData);
            this.getView().setModel(oModel);
            // let data = { Output: "Here are the List", type: "list", data: ["There is a technical error, please try again...", "There is a technical error, please try again...", "There is a technical error, please try again..."] }
            // this.getReplayMessage(data);
        },
        onPostMessage: function (oEvent, selectedText) {
            var that = this;
            // oEvent.getParameter("value")
            var sValue = selectedText ? selectedText : this.getView().byId("newMessageInput").getValue();
            if (sValue.trim()) {
                let listArray = this.getView().getModel().getProperty("/EntryCollection");
                let oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                let oDate = new Date();
                let sDate = oFormat.format(oDate);
                let tdata = {
                    Author: "User",
                    AuthorPicUrl: that.appModulePath + "/image/person.png",
                    Type: "Request",
                    Date: "" + sDate,
                    Text: sValue,
                    messagetype: "Post"
                }
                listArray.push(tdata);
                this.getView().getModel().setProperty("/EntryCollection", listArray);

                var busy = new sap.m.BusyDialog({ text: "Please wait a moment, we're working on it for you!.." });
                busy.open();

                $.ajax({
                    url: this.appModulePath + "/openaichat/test?text=" + sValue,
                    type: "POST",
                    timeout: 30000,
                    success: function (data) {
                        that.getReplayMessage(data);
                        busy.close();
                        that.getView().byId("newMessageInput").setValue("");
                        that.recognition.stop();
                    },
                    error: function (request, status, error) {
                        console.log(request.responseText);
                        let tdata = {
                            Author: "AI Assistant",
                            AuthorPicUrl: that.appModulePath + "/image/chatimage.png",
                            Type: "Reply",
                            Date: "" + sDate,
                            Text: "There is a technical error, please try again...",
                            messagetype: "Error"
                        }
                        listArray[listArray.length - 1].messagetype = "Error";
                        listArray.push(tdata);
                        that.getView().getModel().setProperty("/EntryCollection", listArray);
                        busy.close();
                        that.recognition.stop();
                        that.scrollToBottom();
                    }
                });

            }
            else {
                MessageBox.error("Hey, Ask something");
            }
           
        },
        getReplayMessage: function (data) {
            var that = this;
            let listArray = this.getView().getModel().getProperty("/EntryCollection");
            let oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
            let oDate = new Date();
            let sDate = oFormat.format(oDate);
            var replyContent = "";
            var tdata = {
                Author: "AI Assistant",
                AuthorPicUrl: that.appModulePath + "/image/chatimage.png",
                Type: "Reply",
                Date: "" + sDate
            }
            if (data.type == "message") {
                // tdata.replyContent = data.Output;
                tdata.Text = data.Output,
                    tdata.messagetype = "Post"
            } else {
                let oText = "<H6>Here are the list of Questions you can ask by selecting:</H6>";
              
                oText = oText + '<ul class="myFeedUl">'
                var ListItems = "";
                data.Output.forEach((element, idx) => {
                    ListItems = ListItems + '<li class="myFeedUlist">' + element + '</li>'
                });
                oText = oText + ListItems
                replyContent = oText + "</ul>"
                // replyContent = oText + "</div>"

                tdata.Text = replyContent,
                // listArray[listArray.length - 1].messagetype = "list";
                tdata.messagetype = "list"
                this.isListOfQns = true;
            }
            listArray.push(tdata);
            this.getView().getModel().setProperty("/EntryCollection", listArray);
            this.scrollToBottom();
        },
        scrollToBottom: function () {
            let oPage = this.getView().byId("chatPage");
            if (oPage) {
                oPage.scrollToElement(this.getView().byId("myText"), 0);
            }
           
        },


        onClear: function (oEvent) {
            var self = this;
            MessageBox.warning(
                "Are you sure you want to Clear the Chat?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === 'OK') {
                        self.getView().getModel().setProperty("/EntryCollection", []);
                        self.getView().byId("newMessageInput").setValue("");
                    }
                }
            }
            );

        },
        handleEmailPress: function (evt) {
            let listArray = this.getView().getModel().getProperty("/EntryCollection");
            var sBody = "";
            listArray.forEach(function (element) {
                if (element.messagetype == "Post" && element.Author !== "User") {
                    sBody += '\u2022 ' + element.Text.trim("") + "\n\n";
                }
            }.bind(this));
            URLHelper.triggerEmail(true, "Chat History", sBody, false, false, true);
        },
        handleOpenAboutDialog : function () {
           
			if (!this._oAboutDialog) {
				Fragment.load({
					name: "chatuimodule.view.fragments.About",
					controller: this
				}).then(function (oDialog) {
					this._oAboutDialog = oDialog;
                    this.getView().addDependent(this._oAboutDialog);
                    this.onAboutDialogOpen();
				}.bind(this));
			} else {
				this.onAboutDialogOpen();
			}
		},

		onAboutDialogOpen : function () {
			this._oAboutDialog.open();
			
		},

		onAboutDialogClose : function () {
			this._oAboutDialog.close();
		},
        handleOpenInsightsDialog : function () {
			if (!this._oInsightsDialog) {
				Fragment.load({
					name: "chatuimodule.view.fragments.Insights",
					controller: this
				}).then(function (oDialog) {
					this._oInsightsDialog = oDialog;
                    this.getView().addDependent(this._oInsightsDialog);
                    this.onInsightsDialogOpen();
				}.bind(this));
			} else {
				this.onInsightsDialogOpen();
			}
		},

		onInsightsDialogOpen : function () {
			this._oInsightsDialog.open();
			
		},

		onInsightsDialogClose : function () {
			this._oInsightsDialog.close();
		},
       
       
    });
});
