/*!
 * @copyright@
 */

sap.ui.define([],
	function() {
	"use strict";

	/**
	 * NumericContent renderer.
	 * @namespace
	 */
	var NumericContentRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	NumericContentRenderer.render = function(oRm, oControl) {
		var sSize = oControl.getSize();
		var sValue = oControl.getValue();
		var sIndicator = oControl.getIndicator();
		var sScale = oControl.getScale();
		var sState = oControl.getState();
		var bIndicator = sap.m.DeviationIndicator.None !== sIndicator && sValue !== "";
		var oIcon = oControl._oIcon;
		var bWithMargin = oControl.getWithMargin();
		var sWithoutMargin;
		if (bWithMargin) {
			sWithoutMargin = "";
		} else {
			sWithoutMargin = "WithoutMargin";
		}
		if (oControl.getFormatterValue()) {
			var oFormattedValue = oControl._parseFormattedValue(sValue);
			sScale = oFormattedValue.scale;
			sValue = oFormattedValue.value;
		}
		var bScale = sScale && sValue;
		oRm.write("<div");
		oRm.writeControlData(oControl);
		var sTooltip = oControl.getTooltip_AsString();
		if (typeof sTooltip !== "string") {
			sTooltip = "";
		}
		oRm.writeAttributeEscaped("title", sTooltip);
		oRm.writeAttribute("role", "presentation");
		if (sap.ui.Device.browser.firefox) {
			oRm.writeAttributeEscaped("aria-label", oControl.getAltText().replace(/\s/g, " ") + "" + sTooltip);
		} else {
			oRm.writeAttributeEscaped("aria-label", oControl.getAltText().replace(/\s/g, " ") + " " + sTooltip);
		}
		if (sState == sap.m.LoadState.Failed || sState == sap.m.LoadState.Loading) {
			oRm.writeAttribute("aria-disabled", "true");
		}
		if (oControl.getAnimateTextChange()) {
			oRm.addStyle("opacity", "0.25");
		}
		if (oControl.getWidth()) {
			oRm.addStyle("width", oControl.getWidth());
		}
		oRm.writeStyles();
		oRm.addClass(sSize);
		oRm.addClass("sapMNC");
		oRm.addClass(sWithoutMargin);
		if (oControl.hasListeners("press")) {
			oRm.writeAttribute("tabindex", "0");
			oRm.addClass("sapMPointer");
		}
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("<div");
		oRm.addClass("sapMNCInner");
		oRm.addClass(sWithoutMargin);
		oRm.addClass(sSize);
		oRm.writeClasses();
		oRm.write(">");
		if (bWithMargin) {
			this._renderScaleAndIndicator(oRm, oControl, bIndicator, bScale, sWithoutMargin, sSize, sIndicator, sScale);
			if (oIcon) {
				oRm.renderControl(oIcon);
			}
			this._renderValue(oRm, oControl, sWithoutMargin, sSize, sValue);
		} else {
			if (oIcon) {
				oRm.renderControl(oIcon);
			}
			this._renderValue(oRm, oControl, sWithoutMargin, sSize, sValue);
			this._renderScaleAndIndicator(oRm, oControl, bIndicator, bScale, sWithoutMargin, sSize, sIndicator, sScale);
		}
		oRm.write("</div>");
		oRm.write("</div>");
	};

	/**
	 * Renders the HTML for the ScaleInd of the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control whose title should be rendered
	 * @param {boolean} isIndicator
	 * @param {boolean} isScale
	 * @param {String} withoutMargin
	 * @param {String} size
	 * @param {String} textIndicator
	 * @param {String} textScale
	 */
	NumericContentRenderer._renderScaleAndIndicator = function(oRm, oControl, isIndicator, isScale, withoutMargin, size, textIndicator, textScale) {
		if (isIndicator || isScale) {
			var sState = oControl.getState();
			var sColor = oControl.getValueColor();
			oRm.write("<div");
			oRm.addClass("sapMNCIndScale");
			oRm.addClass(withoutMargin);
			oRm.addClass(size);
			oRm.addClass(sState);
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("<div");
			oRm.writeAttribute("id", oControl.getId() + "-indicator");
			oRm.addClass("sapMNCIndicator");
			oRm.addClass(size);
			oRm.addClass(textIndicator);
			oRm.addClass(sState);
			oRm.addClass(sColor);
			oRm.writeClasses();
			oRm.write("></div>");
			if (isScale) {
				oRm.write("<div");
				oRm.writeAttribute("id", oControl.getId() + "-scale");
				oRm.addClass("sapMNCScale");
				oRm.addClass(size);
				oRm.addClass(sState);
				oRm.addClass(sColor);
				oRm.writeClasses();
				oRm.write(">");
				oRm.writeEscaped(textScale.substring(0, 3));
				oRm.write("</div>");
			}
			oRm.write("</div>");
		}
	};

	/**
	 * Renders the HTML for the ScaleInd of the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control whose title should be rendered
	 * @param {String} withoutMargin
	 * @param {String} size
	 * @param {String} value
	 */
	NumericContentRenderer._renderValue = function(oRm, oControl, withoutMargin, size, value) {
		var sEmptyValue;
		if (oControl.getNullifyValue()) {
			sEmptyValue = "0";
		} else {
			sEmptyValue = "";
		}
		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-value");
		oRm.addClass("sapMNCValue");
		oRm.addClass(withoutMargin);
		oRm.addClass(oControl.getValueColor());
		oRm.addClass(size);
		oRm.addClass(oControl.getState());
		oRm.writeClasses();
		oRm.write(">");
		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-value-scr");
		oRm.addClass("sapMNCValueScr");
		oRm.addClass(withoutMargin);
		oRm.addClass(size);
		oRm.writeClasses();
		oRm.write(">");
		var iChar = oControl.getTruncateValueTo();
		//Control shows only iChar characters. If the last shown character is decimal separator - show only first N-1 characters. So "144.5" is shown like "144" and not like "144.".
		if (value.length >= iChar && (value[iChar - 1] === "." || value[iChar - 1] === ",")) {
			oRm.writeEscaped(value.substring(0, iChar - 1));
		} else {
			if (value) {
				oRm.writeEscaped(value.substring(0, iChar));
			} else {
				oRm.writeEscaped(sEmptyValue);
			}
		}
		oRm.write("</div>");
		oRm.write("</div>");
	};

	return NumericContentRenderer;
}, /* bExport= */true);