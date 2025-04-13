sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass"],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    // @ts-ignore
    function (Controller, JSONModel, MessageBox, Fragment, syncStyleClass) {
        "use strict";
        let allRecords = [];
        let skip = 0;
        let top = 1000;
        return Controller.extend("successorlist.controller.successorview", {
            onInit: function () {
                //    this.setTeamModel();
                var oModel = new JSONModel();
                oModel.setData({
                    positions: [],
                    locations: [],
                    users: [],
                    currentPositionUser: [],
                    Ages: [{ key: "", text: "(Select)" }, { key: "0", text: "26-30" },
                    { key: "1", text: "31-35" },
                    { key: "2", text: "36-40" },
                    { key: "3", text: "41-45" },
                    { key: "4", text: "46-50" },
                    { key: "5", text: "51-55" },
                    { key: "6", text: "56-60" }],
                    Promotions: [{ key: "", text: "(Select)" }, { key: "Yes", text: "Promoted" }, { key: "No", text: "Not Promoted" }],
                    Educations: [{ key: "", text: "(Select)" },
                    { key: "10709", text: "Bachelors" },
                    { key: "10713", text: "Masters" },
                    { key: "10710", text: "Doctorate" },
                    { key: "10708", text: "Associates" },
                    { key: "10714", text: "Other" }

                    ],
                    Ratings: [{ key: "", text: "(Select)" }, { key: "1", text: "1 and above" }, { key: "2", text: "2 and above" }, { key: "3", text: "3 and above" }, { key: "4", text: "4 and above" }, { key: "5", text: "5" }]

                });
                this.getView().setModel(oModel);
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                // @ts-ignore
                this.appModulePath = jQuery.sap.getModulePath(appPath);
                sap.ui.core.BusyIndicator.show(0);
                this.setsuccessorModel();
                this.getPerformanaceData();
                this.setLocationModel();
                this.empData = [];
                this.directReports = [];
                this.ratingsData = [];
                this.promoData = [];
                this.eduData = []
                this.finalUserList = [];
                this.getView().byId("filterPosition").setFilterFunction(function (sTerm, oItem) {
                    return oItem.getText().match(new RegExp(sTerm, "i")) || oItem.getKey().match(new RegExp(sTerm, "i"));
                });
                this.getOwnerComponent().getRouter().getRoute("Routesuccessorview").attachPatternMatched(this._onMatched, this)
            },
            _onMatched: function () {
                sap.ui.core.BusyIndicator.show(0);
                this.getWeightageInfo();
            },
            setsuccessorModel: function () {
                var that = this;
                $.ajax({
                    url: this.appModulePath + "/odata/v2/Position?$select=code,businessUnit,division,department,location,costCenter,jobTitle&$top=" + top + "&$skip=" + skip + "&$format=json",
                    type: 'GET',
                    success: function (data) {
                        allRecords = allRecords.concat(data.d.results);
                        if (data.d.results.length === top) {
                            skip += top;
                            that.setsuccessorModel();
                        } else {
                            that.getView().getModel().setSizeLimit(allRecords.length)
                            that.getView().getModel().setProperty("/positions", allRecords);
                            sap.ui.core.BusyIndicator.hide();
                        }
                    },
                    error: function (error) {
                        console.log(error);
                    },
                });
            },
            setLocationModel: function () {
                var that = this;
                $.ajax({
                    url: this.appModulePath + "/odata/v2/FOLocation?$select=externalCode,name&$format=json",
                    type: 'GET',
                    success: function (data) {
                        that.getView().getModel().setSizeLimit(data.d.results.length)
                        that.getView().getModel().setProperty("/locations", data.d.results);
                    },
                    error: function (error) {

                        that.getView().getModel().setProperty("/locations", []);
                        console.log(error);
                    },
                });
            },

            onSearchPosition: function (oEvent) {
                let selectedItem = this.getView().byId("filterPosition").getSelectedItem();
                this.getView().byId("filterAge").setSelectedKey("");
                this.getView().byId("filterPromotion").setSelectedKey("");
                this.getView().byId("filterEducation").setSelectedKey("");
                this.getView().byId("filterRating").setSelectedKey("");
                this.getView().byId("filterLocation").setSelectedKey("");
                if (selectedItem) {
                    let postionData = selectedItem.getBindingContext().getObject();
                    if (postionData.code) {
                        this.getEmpJobData(postionData);
                    } else {
                        MessageBox.error("Please select any Positions.");
                        sap.ui.core.BusyIndicator.hide();
                    }
                }
                else {
                    MessageBox.error("Please select any Positions.");
                    sap.ui.core.BusyIndicator.hide();
                }

            },
            onSearchSuccessorFilter: function (oEvent) {
                let selectedAge = this.getView().byId("filterAge").getSelectedItem().getBindingContext().getObject();
                let selectedPromo = this.getView().byId("filterPromotion").getSelectedItem().getBindingContext().getObject();
                let selectedEdu = this.getView().byId("filterEducation").getSelectedItem().getBindingContext().getObject();
                let selectedRat = this.getView().byId("filterRating").getSelectedItem().getBindingContext().getObject();
                let selectedLocation = this.getView().byId("filterLocation").getSelectedItem();
                if (selectedLocation) {
                    var locationData = selectedLocation.getBindingContext().getObject();
                }
                let userData = this.finalUserList;
                let weightageData = this.getView().getModel("WeightageModel").getData();
                const [Age, Promo, Edu, Rat, Loc] = [(weightageData.find(obj => obj.weightageType === "Age") || {}).weightage || 0, (weightageData.find(obj => obj.weightageType === "Promotion") || {}).weightage || 0, (weightageData.find(obj => obj.weightageType === "Education") || {}).weightage || 0, (weightageData.find(obj => obj.weightageType === "Rating") || {}).weightage || 0, (weightageData.find(obj => obj.weightageType === "Location") || {}).weightage || 0];
                let [AgeScore, PromoScore, EduScore, RatScore, locScore] = [0, 0, 0, 0, 0];
                let finalData = [];
                let filtered = false;
                if (selectedAge.key !== "") {
                    let age = selectedAge.text.split('-');
                    AgeScore = Age
                    finalData = userData.filter(record => (record.Age ? record.Age.Year : 0) >= age[0] && (record.Age ? record.Age.Year : 0) <= age[1])
                    filtered = true
                }

                if (selectedPromo.key !== "") {
                    let promo = selectedPromo.key;
                    PromoScore = Promo;
                    let looplist = (finalData.length === 0 && filtered === false) ? this.finalUserList : finalData;
                    looplist.forEach(fuObj => {
                        this.promoData.forEach(promoObj => {
                            if (promoObj.userId === fuObj.userId) {
                                fuObj.promoted = "Yes";
                            } else {
                                fuObj.promoted = "No";
                            }
                        })
                    })
                    finalData = looplist.filter(record => record.promoted === promo);
                    filtered = true;
                }

                if (selectedEdu.key !== "") {
                    let edukey = selectedEdu.key;
                    EduScore = Edu;
                    let looplist = (finalData.length === 0 && filtered === false) ? this.finalUserList : finalData;
                    looplist.forEach(fuObj => {
                        this.eduData.forEach(eduObj => {
                            if (eduObj.userId === fuObj.userId) {
                                fuObj.education = eduObj.degree
                                fuObj.degree = eduObj.degreecode
                            }
                        })
                    })
                    finalData = looplist.filter(record => record.degree === edukey);
                    filtered = true
                }
                if (selectedRat.key !== "") {
                    let ratkey = selectedRat.key;
                    RatScore = Rat;
                    let looplist = (finalData.length === 0 && filtered === false) ? this.finalUserList : finalData;
                    for (let i = 0; i < looplist.length; i++) {
                        let user = looplist[i];
                        let userRatings = this.ratingsData.filter(record => record.formSubjectId === user.userId).map(record => parseInt(record.rating));
                        let sum = userRatings.reduce((a, b) => a + b, 0);
                        let avg = sum / userRatings.length;
                        looplist[i].avgRating = isNaN(avg) ? 0 : avg;
                    }
                    finalData = looplist.filter(record => record.avgRating >= parseInt(ratkey));
                    filtered = true;
                }
                if (selectedLocation) {
                    let location = locationData.externalCode;
                    locScore = Loc
                    let looplist = (finalData.length === 0 && filtered === false) ? this.finalUserList : finalData;
                    finalData = looplist.filter(record => record.location.includes(location));
                    filtered = true
                }
                if (selectedAge.key === "" && (!selectedLocation) && selectedRat.key === "" && selectedEdu.key === "" && selectedPromo.key === "") {
                    filtered = false;
                }

                if (finalData.length === 0 && filtered === false) {
                    finalData = this.finalUserList;
                }
                for (var i = 0; i < finalData.length; i++) {
                    finalData[i].promoted = selectedPromo.key === "" ? "" : finalData[i].promoted;
                    finalData[i].education = selectedEdu.key === "" ? "" : finalData[i].education;
                    finalData[i].degree = selectedEdu.key === "" ? "" : finalData[i].degree;
                    finalData[i].avgRating = selectedRat.key === "" ? 0 : finalData[i].avgRating;
                    let totalScore = locScore + AgeScore + PromoScore + EduScore + (RatScore > 0 ? ((RatScore / 5) * finalData[i].avgRating) : 0);
                    finalData[i].score = totalScore
                }
                this.getView().getModel().setProperty("/users", finalData)

            },
            getEmpJobData: function (postionData) {
                let selectedPstn = postionData.jobTitle;
                let selectedCode = postionData.code;
                sap.ui.core.BusyIndicator.show(0);
                var that = this;
                // @ts-ignore
                const success = res => res.ok ? res.json() : Promise.resolve({});
                // @ts-ignore
                const managerPromise = fetch(this.appModulePath + "/odata/v2/EmpJob?$filter=jobTitle eq '" + selectedPstn + "'&$select=managerId,userId,jobTitle,division,position,costCenter,location,businessUnit,event,eventReason&$format=json")
                    .then(success);
                const positionPromise = fetch(this.appModulePath + "/odata/v2/EmpJob?$filter=position eq '" + selectedCode + "'&$expand=locationNav&$format=json")
                    .then(success);
                return Promise.all([managerPromise, positionPromise])
                    .then(([managerData, positionData]) => {
                        const empDatares = managerData.d.results;
                        const positionDatares = positionData.d.results;
                        // @ts-ignore
                        if (empDatares.length == 0) {
                            that.getView().getModel().setProperty("/users", []);
                            that.empData = [];
                        } else {
                            that.getUserContent(empDatares, false);
                        }
                        that.getUserContent(positionDatares, true);
                        if (positionDatares.length > 0) {
                            that.getDirectReportsContent(positionDatares);
                        } else {
                            that.getView().getModel().setProperty("/users", empDatares);
                            that.getPromotionContent(empDatares);
                            that.getEducationContent(empDatares);
                            // sap.ui.core.BusyIndicator.hide();
                        }

                    })
                    .catch(err => {
                        sap.ui.core.BusyIndicator.hide();
                        console.error(err)
                        // @ts-ignore
                        that.getView().getModel().setProperty("/users", []);
                        that.getView().getModel().setProperty("/positionDatares", []);
                        that.directReports = [];
                        that.users = [];
                        that.getView().byId("_IDGenGridListItem3").setVisible(false);


                    });
            },

            getUserContent: function (empDatares, posFlag) {
                var that = this;
                // @ts-ignore
                const success = res => res.ok ? res.json() : Promise.resolve({});
                let requests = empDatares.map(idemp => {
                    // @ts-ignore
                    return fetch(that.appModulePath + "/odata/v2/User('" + idemp.userId + "')?$select=location,userId,firstName,lastName,dateOfBirth,department&$format=json")
                        .then(success);
                });

                // @ts-ignore
                return Promise.all(requests).then((body) => {
                    //this gets called when all the promises have resolved/rejected.
                    body.forEach(res => {
                        empDatares.forEach(function (mdata) {
                            if (mdata.userId === res.d.userId) {
                                mdata.location = res.d.location;
                                mdata.Age = that.calculateAge(res.d.dateOfBirth);
                                mdata.dateOfBirth = res.d.dateOfBirth;
                                mdata.department = res.d.department;
                                mdata.lastName = res.d.lastName;
                                mdata.firstName = res.d.firstName;
                                mdata.ratings = [];
                                mdata.avgRating = 0;
                                mdata.education = "",
                                    mdata.degree = "",
                                    mdata.score = 0,
                                    mdata.promoted = "",
                                    mdata.image = that.appModulePath + "/utils/Images/download.png"
                            }
                        })

                    });
                    if (posFlag) {
                        empDatares[0].location = empDatares[0].locationNav.externalCode;
                        empDatares[0].locationName = empDatares[0].locationNav.name
                        that.getView().getModel().setProperty("/positionDatares", empDatares);
                        if (empDatares.length > 0)
                            that.getView().byId("_IDGenGridListItem3").setVisible(true);
                        else
                            that.getView().byId("_IDGenGridListItem3").setVisible(false);
                    } else {
                        that.empData = empDatares;
                    }


                });
            },

            getDirectReportsContent: function (managerData) {
                var that = this;
                // @ts-ignore
                const success = res => res.ok ? res.json() : Promise.resolve({});
                // @ts-ignore
                const managerRequests = fetch(this.appModulePath + "/odata/v2/User('" + managerData[0].userId + "')/directReports?$select=location,userId,firstName,lastName,dateOfBirth,department,division&$format=json")
                    .then(success);
                const directrRequests = fetch(this.appModulePath + "/odata/v2/User('" + managerData[0].managerId + "')/directReports?$select=location,userId,firstName,lastName,dateOfBirth,department,division&$format=json")
                    .then(success);

                return Promise.all([directrRequests, managerRequests])
                    .then(([directReportsData, managerReportsData]) => {
                        let reportiesArray = [...directReportsData.d.results, ...managerReportsData.d.results];
                        reportiesArray.forEach(res => {
                            that.directReports.push({
                                location: res.location,
                                userId: res.userId,
                                division: res.division,
                                Age: that.calculateAge(res.dateOfBirth),
                                dateOfBirth: res.dateOfBirth,
                                department: res.department,
                                lastName: res.lastName,
                                firstName: res.firstName,
                                ratings: [],
                                avgRating: 0,
                                education: "",
                                degree: "",
                                score: 0,
                                promoted: "",
                                image: that.appModulePath + "/utils/Images/download.png"
                            })
                        })
                        let uniqueArray = [];
                        setTimeout(function () {
                            let mergedArray = [...that.empData, ...that.directReports];
                            uniqueArray = mergedArray.reduce((accumulator, current) => {
                                if (!accumulator.find(item => item.userId === current.userId)) {
                                    accumulator.push(current);
                                }
                                return accumulator;
                            }, []);

                            uniqueArray = uniqueArray.filter(function (item) {
                                return item['userId'] !== that.getView().getModel().getProperty("/positionDatares/0/userId");
                            });
                            that.finalUserList = uniqueArray;
                            that.getView().getModel().setProperty("/users", uniqueArray);
                            that.getPromotionContent(uniqueArray);
                            that.getEducationContent(uniqueArray);
                        }, 500);


                    }).catch(err => {
                        console.error(err)
                        sap.ui.core.BusyIndicator.hide();
                    });

            },
            getPromotionContent: function (finalUsersData) {
                var that = this;
                that.promoData = [];
                // @ts-ignore
                const success = res => res.ok ? res.json() : Promise.resolve({});
                let promotionPromise = finalUsersData.map(usrobj => {
                    // @ts-ignore
                    return fetch(that.appModulePath + "/odata/v2/EmpJob?$filter=userId eq '" + usrobj.userId + "' &$fromDate=2019-01-01&toDate=2023-12-30&$filter=effectiveLatestChange%20eq%20true&$select=userId,event,eventReason&$format=json")
                        .then(success);
                });
                return Promise.all(promotionPromise).then((promotionData) => {
                    promotionData.forEach(promoobj => {
                        let isValueFound = promoobj.d.results.some(record => (record.event === "3675" || record.event === "3673"));
                        promoobj.promoted = isValueFound ? "Yes" : "No";
                        if (promoobj.d.results.length > 0) {
                            promoobj.userId = promoobj.d.results[0].userId;
                        }
                    })
                    that.promoData = promotionData;

                }).catch(err => {
                    console.error(err)
                    sap.ui.core.BusyIndicator.hide();
                });
            },
            getEducationContent: function (finalUsersData) {
                var that = this;
                that.eduData = [];
                // @ts-ignore
                const success = res => res.ok ? res.json() : Promise.resolve({});
                let eduPromise = finalUsersData.map(usrobj => {
                    // @ts-ignore
                    return fetch(that.appModulePath + "/odata/v2/Background_Education?$format=json&$filter=userId eq '" + usrobj.userId + "'")
                        .then(success);
                });
                return Promise.all(eduPromise).then((eduinfonData) => {

                    eduinfonData.forEach(eduobj => {
                        if (eduobj.d.results.length > 0) {
                            let degreeName = that.getDigreeName(eduobj.d.results[0].degree)
                            that.eduData.push({
                                userId: eduobj.d.results[0].userId,
                                degree: degreeName,
                                degreecode: eduobj.d.results[0].degree
                            })
                        }
                    })
                    sap.ui.core.BusyIndicator.hide()
                }).catch(err => {
                    console.error(err)
                    sap.ui.core.BusyIndicator.hide();
                });

            },
            getDigreeName: function (vValue) {
                let Educations = this.getView().getModel().getProperty("/Educations");
                let degree = "";
                Educations.forEach(fuObj => {
                    if (vValue === fuObj.key) {
                        degree = fuObj.text
                    }
                });
                return degree;
            },

            calculateAge: function (dateOfBirth) {
                if (dateOfBirth) {
                    let DOBirth = dateOfBirth.replaceAll("/", "").replaceAll("Date(", "").replaceAll(")", "");
                    var DOB = new Date(parseInt(DOBirth));
                    let D1 = DOB.getDate();
                    let M1 = 1 + DOB.getMonth();
                    let Y1 = DOB.getFullYear();
                    const aDate = new Date();
                    let D2 = aDate.getDate();
                    let M2 = 1 + aDate.getMonth();
                    let Y2 = aDate.getFullYear();
                    let Month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    if (D1 > D2) {
                        D2 = D2 + Month[M2 - 1];
                        M2 = M2 - 1;
                    }
                    if (M1 > M2) {
                        M2 = M2 + 12;
                        Y2 = Y2 - 1;
                    }
                    let M = M2 - M1;
                    let Y = Y2 - Y1;
                    return {
                        Year: "" + Y,
                        Month: "" + M
                    }
                }
            },


            getPerformanaceData: function () {
                this.ratingsData = [];
                var that = this;
                // @ts-ignore
                const success = res => res.ok ? res.json() : Promise.resolve({});
                // @ts-ignore
                const firstPromise = fetch(this.appModulePath + "/odata/v2/FormTemplate(1145L)/associatedForms?$select=formSubjectId,rating,formTemplateId&$format=json")
                    .then(success);
                const secondPromise = fetch(this.appModulePath + "/odata/v2/FormTemplate(1146L)/associatedForms?$select=formSubjectId,rating,formTemplateId&$format=json")
                    .then(success);
                const thirdPromise = fetch(this.appModulePath + "/odata/v2/FormTemplate(1265L)/associatedForms?$select=formSubjectId,rating,formTemplateId&$format=json")
                    .then(success);
                return Promise.all([firstPromise, secondPromise, thirdPromise])
                    .then(([firstPromiseData, secondPromiseData, thirdPromiseData]) => {
                        let mergedArray = [...firstPromiseData.d.results, ...secondPromiseData.d.results, ...thirdPromiseData.d.results];
                        that.ratingsData = mergedArray;

                    })
                    .catch(err => {
                        console.error(err)
                        // @ts-ignore
                    });
            },

            onSubmitRecord: function () {
                // load BusyDialog fragment asynchronously
                if (!this._pBusyDialog) {
                    this._pBusyDialog = Fragment.load({
                        name: "performeval.BusyDialog",
                        controller: this
                    }).then(function (oBusyDialog) {
                        this.getView().addDependent(oBusyDialog);
                        syncStyleClass("sapUiSizeCompact", this.getView(), oBusyDialog);
                        return oBusyDialog;
                    }.bind(this));
                }

                this._pBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.open();
                    this.onSubmit();
                }.bind(this));
            },

            onSubmit: function () {
                var that = this;
                // @ts-ignore
                var Data = that.getView().getModel().getData();
                // sap.ui.core.BusyIndicator.show(0);
                const success = res => res.ok ? res.json() : Promise.resolve({});
                let requests = Data.map(RatingData => {
                    // @ts-ignore
                    var adata = {};
                    adata.__metadata = {
                        uri: "https://apisalesdemo2.successfactors.eu/odata/v2/FormSummarySection(formContentId=" + RatingData.formContentId + ",formDataId=" + RatingData.formDataId + ")",
                        type: "SFOData.FormSummarySection"
                    }
                    adata.formContentId = RatingData.formContentId;
                    adata.formDataId = RatingData.formDataId;
                    adata.overallFormRating = {
                        sectionIndex: RatingData.sectionIndex,
                        itemId: RatingData.itemId,
                        formContentId: RatingData.formDataId,
                        ratingType: "overall",
                        formDataId: RatingData.formDataId,
                        userId: RatingData.userId,
                        rating: RatingData.rating.toString(),
                        comment: null,
                        ratingKey: RatingData.ratingKey
                    };
                    return fetch(that.appModulePath + "/apisalesdemo2Post/odata/v2/upsert", {
                        method: 'POST', // or 'PUT'
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(adata)
                    })
                        .then(success)
                        .catch((error) => {
                            console.error('Error:', error);
                        });
                });
                // @ts-ignore
                return Promise.all(requests).then((body) => {
                    that._pBusyDialog.then(function (oBusyDialog) {
                        oBusyDialog.close();
                    });
                    MessageBox.success("Team-Overall Ratings submitted successfully.");
                    console.log(body);
                });
            },

            onClickOfWeightageList: function () {
                this.getOwnerComponent().getRouter().navTo("RouteWeightagelist");
            },
            getWeightageInfo: function () {
                var that = this;
                var sUrl = this.appModulePath + "/odata/v4/service/alweightageservice";
                $.ajax({
                    url: sUrl,
                    method: "GET",
                    async: false,
                    headers: {
                        'Accept': 'application/json',
                        "Content-Type": "application/json"
                    },
                    success: function (result, xhr, data) {
                        var Data = result.value;
                        var weightageModel = new JSONModel(Data);
                        that.getView().setModel(weightageModel, "WeightageModel");
                        sap.ui.core.BusyIndicator.hide();
                    },
                    error: function (request, status, error) {
                        if (that.getView().getModel("WeightageModel")) {
                            that.getView().getModel("WeightageModel").setData([]);
                        }
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("Technical error please contact system administrator");
                    }
                });
            },
        });
    });