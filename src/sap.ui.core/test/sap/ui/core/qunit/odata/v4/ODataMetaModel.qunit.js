/*!
 * ${copyright}
 */
sap.ui.require([
	"sap/ui/model/MetaModel",
	"sap/ui/model/odata/v4/_ODataHelper",
	"sap/ui/model/odata/v4/ODataDocumentModel",
	"sap/ui/model/odata/v4/ODataMetaModel",
	"sap/ui/model/odata/v4/ODataModel",
	"sap/ui/test/TestUtils"
], function (MetaModel, Helper, ODataDocumentModel, ODataMetaModel, ODataModel, TestUtils) {
	/*global QUnit, sinon */
	/*eslint max-nested-callbacks: 0, no-warning-comments: 0 */
	"use strict";

	var oEntityContainer = {
			"Name" : "Container",
			"QualifiedName" : "foo.bar.Container",
			"EntitySets" : [{
				"Name" : "Employees",
				"Fullname" : "foo.bar.Container/Employees",
				"EntityType@odata.navigationLink" : "Types(QualifiedName='foo.bar.Worker')"
			}],
			"Singletons" : [{
				"Name" : "Me",
				"Fullname" : "foo.bar.Container/Me",
				"Type@odata.navigationLink" : "Types(QualifiedName='foo.bar.Worker')"
			}]
		},
		oEntityTypeWorker = {
			"Name" : "Worker",
			"QualifiedName" : "foo.bar.Worker",
			"Abstract" : false,
			"Properties" : [{
				"Name" : "ID",
				"Fullname" : "foo.bar.Worker/ID"
			}, {
				"Name" : "ENTRYDATE",
				"Fullname" : "foo.bar.Worker/ENTRYDATE"
			}, {
				"Name" : "LOCATION",
				"Fullname" : "foo.bar.Worker/LOCATION",
				"Type" : {
					"Name" : "ComplexType_Location",
					"QualifiedName" : "foo.bar.ComplexType_Location",
					"Properties" : [{
						"Name" : "City",
						"Fullname" : "foo.bar.ComplexType_Location/City",
						"Type" : {
							"Name" : "ComplexType_City",
							"QualifiedName" : "foo.bar.ComplexType_City",
							"Properties" : [{
								"Name" : "CITYNAME",
								"Fullname" : "foo.bar.ComplexType_City/CITYNAME",
								"Type" : {
									"Name" : "String",
									"QualifiedName" : "Edm.String"
								}
							}]
						}

					}]
				}
			}],
			"NavigationProperties" : [{
				"Name" : "EMPLOYEE_2_TEAM",
				"Fullname" : "foo.bar.Worker/EMPLOYEE_2_TEAM",
				"Type@odata.navigationLink" : "Types(QualifiedName='foo.bar.Team')"
			}]
		},
		oEntityTypeTeam = {
			"Name" : "TEAM",
			"QualifiedName" : "foo.bar.TEAM",
			"Properties" : [{
				"Name" : "Team_Id",
				"Fullname" : "foo.bar.TEAM/Team_Id"
			}],
			"NavigationProperties" : [{
				"Name" : "TEAM_2_EMPLOYEES",
				"Fullname" : "foo.bar.TEAM/TEAM_2_EMPLOYEES",
				"Type@odata.navigationLink" : "Types(QualifiedName='foo.bar.Worker')"
			}]
		},
		mFixture = {
			"/sap/opu/local_v4/IWBEP/TEA_BUSI/$metadata": {source: "metadata.xml"}
		},
		sMetaEmployees = "/EntitySets(Name='Employees')",
		sMetaMe = "/Singletons(Name='Me')",
		sMetaCityname = sMetaEmployees + "/EntityType/Properties(Name='LOCATION')/Type/"
			+ "Properties(Name='City')/Type/Properties(Name='CITYNAME')",
		sMetaTeam = sMetaEmployees + "/EntityType/NavigationProperties(Name='EMPLOYEE_2_TEAM')",
		bRealOData = jQuery.sap.getUriParameters().get("realOData") === "true";

	/**
	 * Returns a clone of the object.
	 *
	 * @param {object} o
	 *   the object
	 * @return {object}
	 *   the clone of the object
	 */
	function clone(o) {
		return o && JSON.parse(JSON.stringify(o));
	}

	/**
	 * Returns a URL within the service that (in case of <code>bRealOData</code>), is passed
	 * through a proxy.
	 *
	 * @param {string} [sPath]
	 *   relative path (with initial /) within service
	 * @returns {string}
	 *   a URL within the service
	 */
	function getServiceUrl(sPath) {
		var sAbsolutePath = "/sap/opu/local_v4/IWBEP/TEA_BUSI/" + (sPath && sPath.slice(1) || "");

		return bRealOData
			? "/" + window.location.pathname.split("/")[1] + "/proxy" + sAbsolutePath
			: sAbsolutePath;
	}

	/**
	 * Returns a resolved promised for the given object. Clones the object.
	 *
	 * @param {object} o
	 *   the object
	 * @return {Promise}
	 *   the promised to be resolved with a clone of the object
	 */
	function promiseFor(o) {
		return Promise.resolve(clone(o));
	}

	//*********************************************************************************************
	QUnit.module("sap.ui.model.odata.v4.ODataMetaModel", {
		beforeEach : function () {
			this.oSandbox = sinon.sandbox.create();
			if (!bRealOData) {
				TestUtils.useFakeServer(this.oSandbox, "sap/ui/core/qunit/odata/v4/data",
					mFixture);
			}
			this.oLogMock = this.oSandbox.mock(jQuery.sap.log);
			this.oLogMock.expects("warning").never();
			this.oLogMock.expects("error").never();

			this.oMetaModel = new ODataModel(getServiceUrl()).getMetaModel();
		},

		afterEach : function () {
			this.oSandbox.verifyAndRestore();
		}
	});

	//*********************************************************************************************
	QUnit.test("basics", function (assert) {
		assert.ok(this.oMetaModel instanceof MetaModel);
		assert.ok(this.oMetaModel.oModel instanceof ODataDocumentModel);

		assert.throws(function () {
			return new ODataMetaModel();
		}, new Error("Missing metadata model"));
	});

	//*********************************************************************************************
	[{
		path: "/Employees",
		expected: sMetaEmployees
	}, {
		path: "/Employees(ID='1')",
		expected: sMetaEmployees
	}, {
		path: "/Employees[5];list=1",
		expected: sMetaEmployees
	}, {
		path: "/Employees(ID='1')/ENTRYDATE",
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}],
		expected: sMetaEmployees + "/EntityType/Properties(Name='ENTRYDATE')"
	}, {
		path: "/Employees(ID='1')/LOCATION/City/CITYNAME",
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}],
		expected: sMetaCityname
	}, {
		path: "/Me",
		expected: sMetaMe
	}, {
		path: "/Me/ENTRYDATE",
		nav: [{
			object: oEntityContainer.Singletons[0],
			property: "Type"
		}],
		expected: sMetaMe + "/Type/Properties(Name='ENTRYDATE')"
	}, {
		path: "/Employees(ID='1')/EMPLOYEE_2_TEAM",
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}],
		expected: sMetaEmployees + "/EntityType/NavigationProperties(Name='EMPLOYEE_2_TEAM')"
	}, {
		path: "/Employees(ID='1')/EMPLOYEE_2_TEAM/Team_Id",
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}, {
			object: oEntityTypeWorker.NavigationProperties[0],
			property: "Type",
			result: oEntityTypeTeam
		}],
		expected: sMetaTeam + "/Type/Properties(Name='Team_Id')"
	}, {
		path: "/Employees[1];list=0/EMPLOYEE_2_TEAM/TEAM_2_EMPLOYEES/0/ID",
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}, {
			object: oEntityTypeWorker.NavigationProperties[0],
			property: "Type",
			result: oEntityTypeTeam
		}, {
			object: oEntityTypeTeam.NavigationProperties[0],
			property: "Type"
		}],
		expected: sMetaTeam + "/Type/NavigationProperties(Name='TEAM_2_EMPLOYEES')/Type/"
			+ "Properties(Name='ID')"
	}].forEach(function (oFixture) {
		QUnit.test("requestMetaContext: " + oFixture.path, function (assert) {
			var oMetaModel = this.oMetaModel,
				oHelperMock = this.oSandbox.mock(Helper);

			oHelperMock.expects("requestEntityContainer").withExactArgs(oMetaModel)
				.returns(promiseFor(oEntityContainer));
			if (oFixture.nav) {
				oFixture.nav.forEach(function (oNav) {
					oHelperMock.expects("requestProperty")
						.withExactArgs(oMetaModel, oNav.object, oNav.property,
							sinon.match.string)
						.returns(promiseFor(oNav.result || oEntityTypeWorker));
				});
			}

			return oMetaModel.requestMetaContext(oFixture.path).then(function (oMetaContext) {
				assert.strictEqual(oMetaContext.getModel(), oMetaModel);
				assert.strictEqual(oMetaContext.getPath(), oFixture.expected);
			});
		});
	});
	// TODO what about type casts?

	//*********************************************************************************************
	QUnit.test("requestMetaContext: /Unknown", function (assert) {
		this.oSandbox.mock(Helper).expects("requestEntityContainer").withExactArgs(this.oMetaModel)
			.returns(promiseFor({"EntitySets" : [], "Singletons" : []}));

		return this.oMetaModel.requestMetaContext("/Unknown").then(function () {
			assert.ok(false, "Unexpected success");
		})["catch"](function (oError) {
			assert.strictEqual(oError.message, "Type Unknown not found");
		});
	});

	//*********************************************************************************************
	[{
		path: "/Employees(ID='1')/Unknown",
		type: "EntitySet",
		error: "Unknown property: foo.bar.Worker/Unknown: /Employees(ID='1')/Unknown"
	}, {
		path: "/Employees(ID='1')/LOCATION/Unknown",
		type: "EntitySet",
		error: "Unknown property: foo.bar.ComplexType_Location/Unknown: /Employees(ID='1')"
			+ "/LOCATION/Unknown"
	}, {
		path: "/Me/Unknown",
		type: "Singleton",
		error: "Unknown property: foo.bar.Worker/Unknown: /Me/Unknown"
	}
	].forEach(function (oFixture) {
		QUnit.test("requestMetaContext: " + oFixture.type + " " + oFixture.path, function (assert) {
			var oHelperMock = this.oSandbox.mock(Helper);

			oHelperMock.expects("requestEntityContainer").withExactArgs(this.oMetaModel)
				.returns(promiseFor(oEntityContainer));
			if (oFixture.type === "EntitySet") {
				oHelperMock.expects("requestProperty")
					.withExactArgs(this.oMetaModel, oEntityContainer.EntitySets[0],
						"EntityType", sinon.match.string)
					.returns(promiseFor(oEntityTypeWorker));
			} else {
				oHelperMock.expects("requestProperty")
					.withExactArgs(this.oMetaModel, oEntityContainer.Singletons[0], "Type",
						sinon.match.string)
					.returns(promiseFor(oEntityTypeWorker));
			}

			return this.oMetaModel.requestMetaContext(oFixture.path).then(function () {
				assert.ok(false, "Unexpected success");
			})["catch"](function (oError) {
				assert.strictEqual(oError.message, oFixture.error);
			});
		});
	});

	//*********************************************************************************************
	[{
		path: "/$Employees",
		error: "Unsupported: /$Employees"
	}, {
		path: "/",
		error: "Unsupported: /"
	}].forEach(function (oFixture) {
		QUnit.test("requestMetaContext: " + oFixture.path, function (assert) {
			assert.throws(function () {
				this.oMetaModel.requestMetaContext(oFixture.path);
			}, new Error(oFixture.error));
		});
	});

	// TODO requestMetaContext: (navigation) property with key predicate
	// TODO requestMetaContext: use @odata.context to get the name of the initial set/singleton

	//*********************************************************************************************
	[{
		path: "/",
		result: oEntityContainer
	}, {
		path: "EntitySets",
		error: "Not an absolute path"
	}, {
		path: "/UnknownPart",
		reject: "Unknown: UnknownPart"
	}, {
		path: "/Name(Foo='Bar')",
		reject: '"Name" is not an array'
	}, {
		path: sMetaEmployees,
		result: oEntityContainer.EntitySets[0]
	}, {
		path: "/EntitySets(Name='Teams')",
		reject: "Unknown: EntitySets(Name='Teams')"
	}, {
		path: sMetaMe,
		result: oEntityContainer.Singletons[0]
	}, {
		path: sMetaEmployees + "/Name",
		result: oEntityContainer.EntitySets[0].Name
	}, {
		path: sMetaMe + "/Type",
		nav: [{
			object: oEntityContainer.Singletons[0],
			property: "Type"
		}],
		result: oEntityTypeWorker
	}, {
		path: sMetaMe + "/Type/Name",
		nav: [{
			object: oEntityContainer.Singletons[0],
			property: "Type"
		}],
		result: oEntityTypeWorker.Name
	}, {
		context: sMetaMe,
		path: "Type/Abstract",
		nav: [{
			object: oEntityContainer.Singletons[0],
			property: "Type"
		}],
		result: oEntityTypeWorker.Abstract
	}, {
		path: sMetaCityname,
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}],
		result: oEntityTypeWorker.Properties[2].Type.Properties[0].Type.Properties[0]
	}, {
		path: sMetaTeam + "/Type/NavigationProperties(Name='TEAM_2_EMPLOYEES')/Type",
		nav: [{
			object: oEntityContainer.EntitySets[0],
			property: "EntityType"
		}, {
			object: oEntityTypeWorker.NavigationProperties[0],
			property: "Type",
			result: oEntityTypeTeam
		}, {
			object: oEntityTypeTeam.NavigationProperties[0],
			property: "Type"
		}],
		result: oEntityTypeWorker
	}].forEach(function (oFixture) {
		var sPath = oFixture.context ? oFixture.context + '/' + oFixture.path : oFixture.path;
		QUnit.test("requestObject: " + sPath, function (assert) {
			var oContext = oFixture.context && this.oMetaModel.getContext(oFixture.context),
				oMetaModel = this.oMetaModel,
				oHelperMock = this.oSandbox.mock(Helper);

			if (oFixture.error) {
				assert.throws(function () {
					this.oMetaModel.requestObject(oFixture.path, oContext);
				}, new Error(oFixture.error + ": " + oFixture.path));
				return undefined;
			}
			oHelperMock.expects("requestEntityContainer")
				.withExactArgs(this.oMetaModel)
				.returns(promiseFor(oEntityContainer));
			if (oFixture.nav) {
				oFixture.nav.forEach(function (oNav) {
					oHelperMock.expects("requestProperty")
						.withExactArgs(oMetaModel, oNav.object, oNav.property,
							sinon.match.string)
						.returns(promiseFor(oNav.result || oEntityTypeWorker));
				});
			}

			return this.oMetaModel.requestObject(oFixture.path, oContext).then(function (oResult) {
				if ("result" in oFixture) {
					assert.deepEqual(oResult, oFixture.result);
				} else {
					assert.ok(false, "unexpected success");
				}
			})["catch"](function (oError) {
				if (oFixture.reject) {
					assert.strictEqual(oError.message,
						oFixture.reject + ": " + oFixture.path);
				} else {
					assert.ok(false, "unexpected error:" + oError);
				}
			});
		});
	});

	//*********************************************************************************************
	[{
		type: "Boolean"
	},{
		type: "Boolean",
		facets: [{Name: "foo", Value: "bar"}]
	}, {
		type: "Byte"
	}, {
		type: "Date"
//	}, {
//		type: "DateTimeOffset"
//	},{
//		type: "DateTimeOffset",
//		facets: [{Name: "Precision", Value: "7"}]
//		constraints: {precision: 7} //TODO implement
	}, {
		type: "Decimal"
	}, {
		type: "Decimal",
		facets: [{Name: "Precision", Value: "20"}, {Name: "Scale", Value: "5"}],
		constraints: {precision: 20, scale: 5}
	}, {
		type: "Double"
	}, {
		type: "Guid"
	}, {
		type: "Int16"
	}, {
		type: "Int32"
	}, {
		type: "Int64"
	}, {
		type: "SByte"
	}, {
		type: "Single"
	}, {
		type: "String"
	}, {
		type: "String",
		facets: [{Name: "MaxLength", Value: "255"}],
		constraints: {maxLength: 255}
	}].forEach(function (oFixture) {
		[false, true].forEach(function (bNullable) {
			var aFacets = oFixture.facets || {},
				sTitle = "requestUI5Type: " + oFixture.type + ",nullable=" + bNullable
					+ ", facets=" + JSON.stringify(aFacets);

			QUnit.test(sTitle, function (assert) {
				var oConstraints = oFixture.constraints,
					oMetaModelMock = this.oSandbox.mock(this.oMetaModel),
					sPath = "/Employees[0];list=1/ENTRYDATE",
					oMetaContext = {metaContextFor: sPath},
					oProperty = {
						"Type" : {
							"QualifiedName" : "Edm." + oFixture.type
						},
						"Facets" : aFacets,
						"Nullable" : bNullable
					};

				if (!bNullable) {
					oConstraints = clone(oConstraints) || {};
					oConstraints.nullable = false;
				}
				oMetaModelMock.expects("requestMetaContext").withExactArgs(sPath)
					.returns(promiseFor(oMetaContext));
				oMetaModelMock.expects("requestObject").withExactArgs("", oMetaContext)
					.returns(promiseFor(oProperty));

				return this.oMetaModel.requestUI5Type(sPath).then(function (oType) {
					assert.strictEqual(oType.getName(), "sap.ui.model.odata.type."
						+ oFixture.type);
					assert.deepEqual(oType.oConstraints, oConstraints);
				});
			});
		});
	});
	//TODO facet DefaultValue

	//*********************************************************************************************
	QUnit.test("requestUI5Types: not a property", function (assert) {
		var oMetaModelMock = this.oSandbox.mock(this.oMetaModel),
			sPath = "/Employees[0];list=1/foo",
			oMetaContext = {metaContextFor: sPath},
			oProperty = {};

		oMetaModelMock.expects("requestMetaContext").withExactArgs(sPath)
			.returns(promiseFor(oMetaContext));
		oMetaModelMock.expects("requestObject").withExactArgs("", oMetaContext)
			.returns(promiseFor(oProperty));

		return this.oMetaModel.requestUI5Type(sPath).then(function(oType) {
			assert.ok(false);
		})["catch"](function (oError) {
			assert.strictEqual(oError.message, "No property found at " + sPath);
		});
	});

	//*********************************************************************************************
	//TODO make these types work with odata v4
	["Edm.DateTimeOffset", "Edm.Duration", "Edm.TimeOfDay"].forEach(function (sQualifiedName) {
		QUnit.test("requestUI5Types: unsupported type " + sQualifiedName, function (assert) {
			var oMetaModelMock = this.oSandbox.mock(this.oMetaModel),
				sPath = "/Employees[0];list=1/foo",
				oMetaContext = {metaContextFor: sPath},
				oProperty =  {
					"Type" : {
						"QualifiedName" : sQualifiedName
					},
					"Facets" : [],
					"Nullable" : true
				};

			oMetaModelMock.expects("requestMetaContext").withExactArgs(sPath)
				.returns(promiseFor(oMetaContext));
			oMetaModelMock.expects("requestObject").withExactArgs("", oMetaContext)
				.returns(promiseFor(oProperty));

			return this.oMetaModel.requestUI5Type(sPath).then(function(oType) {
				assert.ok(false);
			})["catch"](function (oError) {
				assert.strictEqual(oError.message,
					"Unsupported EDM type: " + sQualifiedName + ": " + sPath);
			});
		});
	});

	//*********************************************************************************************
	[{
		sMetaPath : "/EntitySets(Name='EMPLOYEES')",
		sPath : "/EMPLOYEES[0];list=0"
	}, {
		sMetaPath : "/EntitySets(Name='TEAMS')/EntityType"
			+ "/NavigationProperties(Name='TEAM_2_EMPLOYEES')",
		sPath : "/TEAMS[0];list=0/TEAM_2_EMPLOYEES/0"
	}].forEach(function (oFixture) {
		QUnit.test("requestCanonicalUrl: " + oFixture.sPath, function (assert) {
			var oInstance = {};

			function read(sPath, bAllowObjectAccess) {
				assert.strictEqual(sPath, oFixture.sPath);
				assert.strictEqual(bAllowObjectAccess, true);
				return Promise.resolve(oInstance);
			}

			this.oSandbox.stub(Helper, "getKeyPredicate", function (oEntityType, oInstance0) {
				assert.strictEqual(oEntityType.Name, "Worker",
					"looks like entity type meta data");
				assert.strictEqual(oInstance0, oInstance);
				return "(~)";
			});
			this.oSandbox.stub(Helper, "requestEntitySetName", function (oMetaContext) {
				assert.strictEqual(oMetaContext.getPath(), oFixture.sMetaPath);
				return Promise.resolve("€MPLOY€€$"); // strange characters to check encoding
			});

			return this.oMetaModel.requestCanonicalUrl("/~/", oFixture.sPath, read)
				.then(function (sCanonicalUrl) {
					assert.strictEqual(sCanonicalUrl, "/~/%E2%82%ACMPLOY%E2%82%AC%E2%82%AC%24(~)");
				})["catch"](function (oError) {
					assert.ok(false, oError.message + "@" + oError.stack);
				});
		});
	});
	//TODO "4.3.2 Canonical URL for Contained Entities"
	//TODO prefer instance annotation at payload for "odata.editLink"?!
	//TODO target URLs like "com.sap.gateway.iwbep.tea_busi_product.v0001.Container/Products(...)"?

	//*********************************************************************************************
	[{
		sPath : "/TEAMS[0];list=0/TEAM_2_EMPLOYEES/0/ID"
	}].forEach(function (oFixture) {
		QUnit.test("requestCanonicalUrl: error for " + oFixture.sPath, function (assert) {
			function read(sPath, bAllowObjectAccess) {
				assert.strictEqual(sPath, oFixture.sPath);
				assert.strictEqual(bAllowObjectAccess, true);
				return Promise.resolve({});
			}

			this.oSandbox.mock(Helper).expects("getKeyPredicate").never();

			return this.oMetaModel.requestCanonicalUrl("/~/", oFixture.sPath, read)
				.then(function (sCanonicalUrl) {
					assert.ok(false, sCanonicalUrl);
				})["catch"](function (oError) {
					assert.strictEqual(oError.message, "No target entity set found for source"
						+ " entity type 'com.sap.gateway.iwbep.tea_busi.v0001.Worker' and"
						+ " navigation property 'ID'");
				});
		});
	});
});
//TODO what is the idea behind oMetaContext = {metaContextFor: sPath}, why not use a real context?
//     Note: requestMetaContext() does not return clones but singletons, normally!